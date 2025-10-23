import React, { useEffect, useState } from 'react';
import { FlatList, Image, ImageBackground, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AuthHeader from '../Components/AuthHeader';
import { commonStyles } from '../Constants/commonStyles';
import { fontScalingFactor, moderateScale, POSTS_IMAGE_BASE_URL, ratingsData, USER_PROFILE_BASE_URL, windowHeight, windowWidth } from '../Constants/globalConstants';
import { imagePath } from '../Constants/imagePath';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../Constants/colors';
import { navigationStrings } from '../Navigation/NavigationStrings';
import CommonButton from '../Components/CommonButton';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, setLoadUserData, setUserData } from '../Redux/actions/actions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import LoadingComponent from '../Components/LoadingComponent'
import { helperFunctions } from '../Constants/helperFunctions'
import { apiHandler } from '../Constants/apiHandler';
import LinearGradient from 'react-native-linear-gradient';
import CustomToast from '../Components/CustomToast';
import ErrorComponent from '../Components/ErrorComponent';
import AppIntroSlider from 'react-native-app-intro-slider';
import AntDesign from 'react-native-vector-icons/AntDesign'
import Video from 'react-native-video';
import PressableImage from '../Components/PressableImage';
import AnimatedFilterBar from '../Components/AnimatedFilterBar';
import Fontisto from 'react-native-vector-icons/Fontisto'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

const buttonData = [
    {
        id: 0,
        title: 'Bio'
    },
    {
        id: 1,
        title: 'Followers'
    },
    {
        id: 2,
        title: 'Following'
    }
]

export default function ProfileScreen(props) {

    const navigation = useNavigation()

    const dispatch = useDispatch()

    const route = useRoute()

    const userID = route.params.userID

    const token = useSelector((state) => state.accessToken)
    const userData = useSelector((state) => state.userData)
    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)
    const favRestaurants = useSelector((state) => state.favoriteRestaurants)

    const [userDetails, setUserDetails] = useState({})
    const [userFollowers, setUserFollowers] = useState([])
    const [userFollowing, setUserFollowing] = useState([])
    const [isFollowing, setIsFollowing] = useState(false)
    const [showCustomToast, setShowCustomToast] = useState(false)
    const [customToastMessage, setCustomToastMessage] = useState('')
    const [showErrorMessage, setShowErrorMessage] = useState(false)
    const [showFollowers, setShowFollowers] = useState(false)
    const [showFollowing, setShowFollowing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [loaderTitle, setLoaderTitle] = useState("")
    const [showPostMedia, setShowPostMedia] = useState(false)
    const [selectedPost, setSelectedPost] = useState([])
    const [isBioExpanded, setIsBioExpanded] = useState(false)

    const isFocused = useIsFocused()

    useEffect(() => {
        apiHandler.getOtherUserData(token, userID).then((user) => {
            let arrFollowers = user.followers
            let arrFollowing = user.following
            if (arrFollowers && arrFollowers.length > 0 && arrFollowers.findIndex((item, index) => {
                return item.follows.id == userData.id
            }) != -1) {
                setIsFollowing(true)
            }
            setUserFollowers(arrFollowers)
            setUserFollowing(arrFollowing)
            setUserDetails(user)
            setIsLoading(false)
        })
    }, [userID])

    const getUserDetails = async () => {
        setIsLoading(true)
        setLoaderTitle("Getting profile details")
        let userDetails = await apiHandler.getOtherUserData(token, userID)
        let arrFollowers = userDetails.followers
        let arrFollowing = userDetails.following
        if (arrFollowers && arrFollowers.length > 0 && arrFollowers.findIndex((item, index) => {
            return item.follows.id == userData.id
        }) != -1) {
            setIsFollowing(true)
        }
        setUserFollowers(arrFollowers)
        setUserFollowing(arrFollowing)
        setUserDetails(userDetails)
        setIsLoading(false)
    }

    function onBackIconPress() {
        navigation.goBack()
    }

    const onSingleOptionPress = (title) => {
        switch (title) {
            case 'Followers':
                setUserFollowers(userDetails.followers)
                setShowFollowers(true)
                break;
            case 'Following':
                setUserFollowing(userDetails.following)
                setShowFollowing(true)
                break;
            default:
                break;
        }
    }

    const onFollowUnfollowPress = async () => {
        try {
            setIsLoading(true)
            isFollowing ? setLoaderTitle("Unfollowing ", userDetails.full_name) : setLoaderTitle("Following ", userDetails.full_name)
            let reqObj = {
                user_id: userID
            }
            let response = await apiHandler.followUnfollowUser(token, reqObj)
            let otherUserData = await apiHandler.getOtherUserData(token, userID)
            let arrFollowers = otherUserData.followers
            let arrFollowing = otherUserData.following
            if (arrFollowers && arrFollowers.length > 0 && arrFollowers.findIndex((item, index) => {
                return item.follows.id == userData.id
            }) != -1) {
                setIsFollowing(true)
            }
            else {
                setIsFollowing(false)
            }
            setUserFollowers(arrFollowers)
            setUserFollowing(arrFollowing)
            setUserDetails(otherUserData)
            if (response.message == "User Follow") {
                setShowCustomToast(true)
                // let arrUserFollowers = [...userFollowers]
                // let otherUser = {
                //     follows: userData
                // }
                // // arrUserFollowers.push(otherUser)
                // setUserFollowers(arrUserFollowers)
                setCustomToastMessage(`${otherUserData.full_name} followed`)
                // setIsFollowing(true)
            }
            else {
                setShowCustomToast(true)
                // let arrPreviousFollowers = [...userFollowers]
                // arrPreviousFollowers = arrPreviousFollowers.filter((item, index) => {
                //     return item.follows.id != userData.id
                // })
                // setUserFollowers(arrPreviousFollowers)
                setCustomToastMessage(`${otherUserData.full_name} unfollowed`)
                // setIsFollowing(false)
            }
            setIsLoading(false)
        }
        catch (error) {
            console.log("Error is", error)
            setIsLoading(false)
            setShowErrorMessage(true)
            setCustomToastMessage('Error connecting to server')
        }
    }

    const onFollowOtherUser = async (user) => {
        setShowFollowers(false)
        setShowFollowing(false)
        try {
            if (user && user.id) {
                setIsLoading(true)
                setLoaderTitle("Please wait")
                let reqObj = {
                    user_id: user.id
                }
                let res = await apiHandler.followUnfollowUser(token, reqObj)
                //Handle this by getting all followers and dispatching action to redux. Or maybe handle at frontend with Redux
                if (res.message == "User Follow") {
                    setShowCustomToast(true)
                    setCustomToastMessage(`${user.full_name} followed`)
                }
                else {
                    setShowCustomToast(true)
                    setCustomToastMessage(`${user.full_name} unfollowed`)
                }
                dispatch(setLoadUserData(true))
                setIsLoading(false)
            }
        }
        catch (error) {
            setIsLoading(false)
            setShowErrorMessage(true)
            setCustomToastMessage('Error connecting to server')
        }
    }

    const renderSingleFollower = ({ item, index }) => {
        return item && item.follows && (
            <View style={{ padding: moderateScale(8), flexDirection: 'row', width: windowWidth - moderateScale(20), alignSelf: 'center' }}>
                <Image style={{ height: moderateScale(24), width: moderateScale(24), borderRadius: moderateScale(12) }} source={item.follows.image ? { uri: USER_PROFILE_BASE_URL + item.follows.image } : imagePath.dummyProfile} />
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: moderateScale(6) }}>
                    <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor })}>
                        {item.follows.full_name}
                        {
                            item.follower_id == userData.id && <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor })}>
                                {" (me)"}
                            </Text>
                        }
                    </Text>
                    {item.follower_id != userData.id && <TouchableOpacity onPress={() => {
                        onFollowOtherUser(item.follows)
                    }} style={{ height: moderateScale(20), width: moderateScale(20), borderRadius: moderateScale(6), backgroundColor: 'transparent', borderWidth: moderateScale(0.7), borderColor: currentThemeSecondaryColor, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name={'person-add'} style={{ fontSize: moderateScale(12), color: currentThemeSecondaryColor }} />
                    </TouchableOpacity>}
                </View>
            </View>
        )
    }

    const onBioPress = () => {
        setIsBioExpanded(!isBioExpanded)
    }

    const renderSingleFollowing = ({ item, index }) => {
        return item && item.following && (
            <View style={{ padding: moderateScale(8), flexDirection: 'row', width: windowWidth - moderateScale(20), alignSelf: 'center' }}>
                <Image style={{ height: moderateScale(24), width: moderateScale(24), borderRadius: moderateScale(12) }} source={item.following.image ? { uri: USER_PROFILE_BASE_URL + item.following.image } : imagePath.dummyProfile} />
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: moderateScale(6) }}>
                    <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor })}>
                        {item.following.full_name}
                        {
                            item.follower_id == userData.id && <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor })}>
                                {" (me)"}
                            </Text>
                        }
                    </Text>
                </View>
            </View>
        )
    }

    const onDonePress = () => {
        setShowPostMedia(false)
    }

    const renderDoneButton = () => {
        return <TouchableOpacity onPress={onDonePress} style={{ padding: moderateScale(6), borderRadius: moderateScale(6), backgroundColor: colors.appPrimary }}>
            <Text style={commonStyles.textWhite(15, { fontWeight: '600' })}>
                Done
            </Text>
        </TouchableOpacity>
    }

    const onRestaurantNamePress = () => {
        setShowPostMedia(false)
        navigation.navigate(navigationStrings.RestaurantDetails, {
            restaurant_id: selectedPost.restaurant_id
        })
    }

    const renderSingleMedia = ({ item, index }) => {
        return <View style={commonStyles.flexFull}>
            <Ionicons name='close' style={{ fontSize: moderateScale(20), color: colors.black, position: 'absolute', top: moderateScale(4), right: moderateScale(6), zIndex: 99 }} onPress={() => {
                setShowPostMedia(false)
            }} />
            <View style={{ position: 'absolute', bottom: moderateScale(80), zIndex: 99, marginLeft: moderateScale(6) }}>
                <Text style={commonStyles.textWhite(24, {
                    fontWeight: 'bold', textShadowColor: colors.black,
                    textShadowOffset: { width: 3, height: 3 },
                    textShadowRadius: 2,
                })}>
                    {selectedPost.name}
                </Text>
                <Text style={commonStyles.textWhite(20, {
                    textShadowColor: colors.black,
                    textShadowOffset: { width: 2, height: 2 },
                    textShadowRadius: 2, marginTop: moderateScale(4)
                })} onPress={onRestaurantNamePress}>
                    {selectedPost.restaurant}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: moderateScale(5) }}>
                    {helperFunctions.getStarRatings(selectedPost.rating)}
                </View>
                <Text style={commonStyles.textWhite(18, {
                    color: colors.grey,
                    textShadowColor: colors.black,
                    textShadowOffset: { width: 2, height: 2 },
                    textShadowRadius: 2, marginTop: moderateScale(5)
                })}>
                    {selectedPost.review}
                </Text>
            </View>
            {item.type == 'image' ? <Image style={{ flex: 1, overflow: 'hidden', padding: moderateScale(6), borderRadius: moderateScale(8) }} resizeMode='cover' source={{ uri: POSTS_IMAGE_BASE_URL + item.filenames }}>
                {/* <View style={commonStyles.flexFull}>
                </View> */}
            </Image>
                :
                <Video
                    source={{ uri: POSTS_IMAGE_BASE_URL + item.filenames }}
                    style={{ flex: 1, borderRadius: moderateScale(8), overflow: 'hidden' }}
                    resizeMode='cover'
                    repeat={true}
                />
            }
        </View>
    }

    const renderNextButton = () => {
        return <View style={{ padding: moderateScale(6), borderRadius: moderateScale(6), backgroundColor: colors.appPrimary }}>
            <AntDesign name='right' style={{ fontSize: 20, color: colors.white }} />
        </View>
    }

    const renderPrevButton = () => {
        return <View style={{ padding: moderateScale(6), borderRadius: moderateScale(6), backgroundColor: colors.appPrimary }}>
            <AntDesign name='left' style={{ fontSize: 20, color: colors.white }} />
        </View>
    }

    const onSinglePostPress = (item) => {
        setShowPostMedia(true)
        setSelectedPost(item)
    }

    const renderPostsIcon = (color) => {
        return <Fontisto name='photograph' style={{ fontSize: moderateScale(9), color: color, marginRight: moderateScale(3) }} />
    }

    const renderRestaurantsIcon = (color) => {
        return <FontAwesome name='heart' style={{ fontSize: moderateScale(9), color: color, marginRight: moderateScale(3) }} />
    }

    const RenderFavorites = (props) => {
        return userDetails.restaurant && userDetails.restaurant.length > 0 ?
            <View style={commonStyles.flexFull}>
                {renderSingleCard()}
            </View>
            :
            <View style={{ height: windowHeight * 0.3, width: windowWidth, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor })}>
                    No favorite restaurants yet.
                </Text>
            </View>
    }

    const renderSingleCard = () => {
        return <View style={{ minHeight: moderateScale(100), width: windowWidth - moderateScale(20), flexDirection: 'row', alignSelf: 'center' }}>
            <View style={{ width: (windowWidth * 0.5) - moderateScale(12), alignItems: 'center' }}>
                {userDetails.restaurant.map((item, index) => {
                    return index % 2 == 0 && renderRestaurent(item, index)
                })}
            </View>
            <View style={{ width: (windowWidth * 0.5) - moderateScale(12), alignItems: 'center', marginLeft: moderateScale(4) }}>
                {userDetails.restaurant.map((item, index) => {
                    return index % 2 != 0 && renderRestaurent(item, index)
                })}
            </View>
            {/* <FlatList
                data={favRestaurants}
                renderItem={renderRestaurent}
                numColumns={2}
                nestedScrollEnabled={false}
            /> */}
        </View>
    }

    const onSingleRestaurantPress = (item) => {
        navigation.navigate(navigationStrings.RestaurantDetails, {
            restaurant_id: item.restaurant_id,
            fromFavourites: true
        })
    }

    function renderRestaurent(item, index) {
        return <ImageBackground style={{ height: moderateScale(70), width: '100%', borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: moderateScale(4) }} source={{ uri: item.image }}>
            <TouchableOpacity onPress={() => {
                onSingleRestaurantPress(item)
            }} key={index}
                style={{ flex: 1, justifyContent: 'center' }}
            >
                <Text numberOfLines={2} style={commonStyles.textWhite(13, {
                    fontWeight: '700', alignSelf: 'center', textShadowColor: colors.black,
                    textShadowOffset: { width: 5, height: 5 },
                    textShadowRadius: 10,
                })}>
                    {item.restaurant_name}
                </Text>
            </TouchableOpacity>
        </ImageBackground >
    }

    const RenderPosts = () => {
        return userDetails.posts && (userDetails.posts.length == 0 ?
            <View style={{ height: windowHeight * 0.3, width: windowWidth, padding: moderateScale(8), justifyContent: 'center', alignItems: 'center' }}>
                <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor })}>
                    No posts added yet
                </Text>
            </View>
            :
            <View style={{ width: windowWidth, paddingHorizontal: moderateScale(5), flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center', }}>
                <View style={{ width: (windowWidth * 0.5) - moderateScale(8), alignItems: 'center', }}>
                    {
                        userDetails.posts.map((item, index) => {
                            console.log("Item is", item)
                            if (index % 2 == 0) {
                                return item.file && item.file.length > 0 && item.file[0].type &&
                                    (item.file[0].type == 'image' ?
                                        <TouchableOpacity onPress={() => {
                                            onSinglePostPress(item)
                                        }} style={{ marginBottom: 10 }}>
                                            <ImageBackground source={{ uri: POSTS_IMAGE_BASE_URL + item.file[0].filenames }} style={{ height: moderateScale(70), width: (windowWidth * 0.5) - moderateScale(10), borderRadius: moderateScale(8), overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }} resizeMode='cover'>
                                                <Text numberOfLines={2} style={commonStyles.textWhite(16, {
                                                    color: colors.white, fontWeight: 'bold', textShadowColor: colors.black,
                                                    textShadowOffset: { width: 2, height: 2 },
                                                    textShadowRadius: 2,
                                                })}>
                                                    {item.name}
                                                </Text>
                                                <View style={{ flexDirection: 'row' }}>
                                                    {helperFunctions.getStarRatings(item.rating, 12)}
                                                </View>
                                                <Text numberOfLines={2} style={commonStyles.textWhite(12, {
                                                    fontWeight: '600', color: colors.grey, textShadowColor: colors.black,
                                                    textShadowOffset: { width: 0.5, height: 0.5 },
                                                    textShadowRadius: 0.5,
                                                })}>
                                                    {item.review}
                                                </Text>

                                            </ImageBackground>
                                        </TouchableOpacity>
                                        :
                                        <TouchableOpacity onPress={() => {
                                            onSinglePostPress(item)
                                        }} style={{ height: moderateScale(70), borderRadius: moderateScale(7), alignItems: 'center', marginBottom: 10, justifyContent: 'center' }}>
                                            <Text numberOfLines={2} style={commonStyles.textWhite(16, {
                                                color: colors.white, fontWeight: 'bold', textShadowColor: colors.black,
                                                textShadowOffset: { width: 2, height: 2 },
                                                textShadowRadius: 2, zIndex: 77
                                            })}>
                                                {item.name}
                                            </Text>
                                            <View style={{ flexDirection: 'row', zIndex: 77 }}>
                                                {helperFunctions.getStarRatings(item.rating, 12)}
                                            </View>
                                            <Text numberOfLines={2} style={commonStyles.textWhite(12, {
                                                fontWeight: '600', color: colors.grey, textShadowColor: colors.black,
                                                textShadowOffset: { width: 0.5, height: 0.5 },
                                                textShadowRadius: 0.5, zIndex: 77
                                            })}>
                                                {item.review}
                                            </Text>
                                            <Video
                                                source={{ uri: POSTS_IMAGE_BASE_URL + item.file[0].filenames }}
                                                paused={true}
                                                resizeMode='cover'
                                                style={{ height: moderateScale(70), width: (windowWidth * 0.5) - moderateScale(10), borderRadius: moderateScale(8), overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'absolute' }}
                                            />
                                        </TouchableOpacity>
                                    )
                            }
                        })
                    }
                </View>
                <View style={{ width: (windowWidth * 0.5) - moderateScale(8), marginLeft: moderateScale(4) }}>
                    {
                        userDetails.posts.map((item, index) => {
                            if (index % 2 != 0) {
                                return item.file && item.file.length > 0 && item.file[0].type &&
                                    (item.file[0].type == 'image' ?
                                        <TouchableOpacity onPress={() => {
                                            onSinglePostPress(item)
                                        }} style={{ height: moderateScale(70), marginBottom: 10 }}>
                                            <ImageBackground source={item && item.file && item.file.length > 0 && item.file[0].type && item.file[0].type == 'image' ? { uri: POSTS_IMAGE_BASE_URL + item.file[0].filenames } : imagePath.americanFoodImage} style={{ height: moderateScale(70), width: (windowWidth / 2) - moderateScale(8), alignItems: 'center', justifyContent: 'center', marginBottom: moderateScale(8), borderRadius: moderateScale(12), overflow: 'hidden' }} resizeMode='cover'>
                                                <Text numberOfLines={2} style={commonStyles.textWhite(16, { fontWeight: '700', color: colors.white })}>
                                                    {item.name}
                                                </Text>
                                                <View style={{ flexDirection: 'row', zIndex: 77 }}>
                                                    {helperFunctions.getStarRatings(item.rating, 12)}
                                                </View>
                                                <Text numberOfLines={2} style={commonStyles.textWhite(12, { fontWeight: '600', color: colors.grey })}>
                                                    {item.review}
                                                </Text>
                                            </ImageBackground>
                                        </TouchableOpacity>
                                        :
                                        <TouchableOpacity onPress={() => {
                                            onSinglePostPress(item)
                                        }} style={{ alignItems: "center", justifyContent: "center", marginBottom: 10, }}>

                                            <Video
                                                source={{ uri: POSTS_IMAGE_BASE_URL + item.file[0].filenames }}
                                                paused={true}
                                                resizeMode='cover'
                                                style={{ height: moderateScale(70), width: (windowWidth * 0.5) - moderateScale(10), borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
                                            // style={{ height: moderateScale(80), width: (windowWidth / 2) - moderateScale(12), zIndex: 99 }}
                                            />
                                            <View style={{ position: "absolute", zIndex: 100, alignItems: "center", justifyContent: "center" }}>
                                                <Text numberOfLines={2} style={commonStyles.textWhite(16, { fontWeight: '700', color: colors.white })}>
                                                    {item.name}
                                                </Text>
                                                <View style={{ flexDirection: 'row', zIndex: 77 }}>
                                                    {helperFunctions.getStarRatings(item.rating, 12)}
                                                </View>
                                                <Text numberOfLines={2} style={commonStyles.textWhite(12, { fontWeight: '600', color: colors.grey })}>
                                                    {item.review}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    )
                            }
                        })
                    }
                </View>
            </View>
        )
    }

    return (
        <SafeAreaView style={[commonStyles.flexFull, { backgroundColor: currentThemePrimaryColor }]}>
            <CustomToast isVisible={showCustomToast} onToastShow={() => {
                setTimeout(() => {
                    setShowCustomToast(false)
                }, 900)
            }} toastMessage={customToastMessage} />
            <ErrorComponent isVisible={showErrorMessage} onToastShow={() => {
                setTimeout(() => {
                    setShowErrorMessage(false)
                }, 1100)
            }} toastMessage={customToastMessage} />
            <View style={commonStyles.flexFull}>
                <ScrollView>
                    {isLoading && <LoadingComponent title={loaderTitle} />}
                    <View style={styles.headerFullContainer}>
                        <Ionicons name='chevron-back-outline' style={styles.iconStyle(currentThemeSecondaryColor)} onPress={onBackIconPress} />
                    </View>
                    <View style={{ height: moderateScale(64), width: moderateScale(64), borderRadius: moderateScale(32), alignSelf: 'center', backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons onPress={onFollowUnfollowPress} name={isFollowing ? 'remove-circle' : 'add-circle'} style={{ fontSize: moderateScale(20), color: isFollowing ? `#aa0000` : '#0aa120', position: 'absolute', right: 0, top: 0, zIndex: 7 }} />
                        <Image style={{ height: moderateScale(62), width: moderateScale(62), borderRadius: moderateScale(31), overflow: 'hidden' }} source={userDetails?.image ? { uri: userDetails?.image } : imagePath.dummyProfile} />
                    </View>
                    <Text style={commonStyles.textWhite(32, { alignSelf: 'center', fontWeight: '600', marginTop: moderateScale(4), color: currentThemeSecondaryColor })}>
                        {userDetails?.full_name}
                    </Text>
                    <Text onPress={onBioPress} numberOfLines={isBioExpanded ? 30 : 2} style={commonStyles.textWhite(16, { fontWeight: '600', marginTop: moderateScale(2), color: currentThemeSecondaryColor, width: windowWidth - moderateScale(20), alignSelf: 'center', textAlign: 'center' })}>
                        {userDetails?.bio}
                    </Text>
                    <View style={styles.buttonsFullContainer}>
                        <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: currentThemePrimaryColor, borderRadius: moderateScale(12), paddingBottom: moderateScale(4) }}>
                            <Text style={commonStyles.textWhite(18, { fontWeight: '600', color: currentThemeSecondaryColor })}>
                                Posts
                            </Text>
                            <Text style={commonStyles.textWhite(18, { fontWeight: '600', marginTop: moderateScale(4), color: currentThemeSecondaryColor })}>
                                {(userDetails && userDetails.posts && userDetails.posts.length > 0) ? userDetails.posts.length : 0}
                            </Text>
                        </View>
                        <View style={{ height: moderateScale(34), width: moderateScale(1), backgroundColor: colors.darkGrey }} />
                        <TouchableOpacity onPress={() => {
                            onSingleOptionPress('Followers')
                        }} style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: currentThemePrimaryColor, borderRadius: moderateScale(12), paddingBottom: moderateScale(4) }}>
                            <Text style={commonStyles.textWhite(18, { fontWeight: '600', color: currentThemeSecondaryColor })}>
                                Followers
                            </Text>
                            <Text style={commonStyles.textWhite(18, { fontWeight: '600', marginTop: moderateScale(4), color: currentThemeSecondaryColor })}>
                                {userFollowers && userFollowers.length > 0 ? userFollowers.length : 0}
                            </Text>
                        </TouchableOpacity>
                        <View style={{ height: moderateScale(34), width: moderateScale(1), backgroundColor: colors.darkGrey }} />
                        <TouchableOpacity onPress={() => {
                            onSingleOptionPress('Following')
                        }} style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: currentThemePrimaryColor, borderRadius: moderateScale(12), paddingBottom: moderateScale(4) }}>
                            <Text style={commonStyles.textWhite(18, { fontWeight: '600', color: currentThemeSecondaryColor })}>
                                Following
                            </Text>
                            <Text style={commonStyles.textWhite(18, { fontWeight: '600', marginTop: moderateScale(4), color: currentThemeSecondaryColor })}>
                                {userFollowing && userFollowing.length > 0 ? userFollowing.length : 0}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginTop: moderateScale(10) }}>
                        <AnimatedFilterBar filterTabs={['Saved Restaurants', 'Posts']} innerComponents={[RenderFavorites, RenderPosts]} icons={[renderRestaurantsIcon, renderPostsIcon]} />
                    </View>
                    <Modal transparent={true} visible={showFollowers || showFollowing} onRequestClose={() => {
                        setShowFollowers(false)
                        setShowFollowing(false)
                    }}>
                        <View style={{ flex: 1, backgroundColor: `#00000077`, justifyContent: 'flex-end' }}>
                            <View style={{ flex: 0.8, backgroundColor: currentThemePrimaryColor, padding: moderateScale(10), borderTopLeftRadius: moderateScale(16), borderTopRightRadius: moderateScale(16) }}>
                                <Ionicons name='close' style={{ fontSize: moderateScale(14), color: currentThemeSecondaryColor, alignSelf: 'flex-end' }} onPress={() => {
                                    setShowFollowers(false)
                                    setShowFollowing(false)
                                }} />
                                <Text style={commonStyles.textWhite(22, { color: currentThemeSecondaryColor, fontWeight: '700', alignSelf: 'center' })}>
                                    {showFollowers ? `${userDetails.full_name} followers` : `${userDetails.full_name} follows`}
                                </Text>
                                <View style={commonStyles.flexFull}>
                                    {showFollowers ?
                                        <FlatList
                                            data={userFollowers}
                                            renderItem={renderSingleFollower}
                                            ListEmptyComponent={() => {
                                                return <View style={{ height: windowHeight * 0.4, width: windowWidth, justifyContent: 'center', alignItems: 'center' }}>
                                                    <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor })}>
                                                        No followers yet
                                                    </Text>
                                                </View>
                                            }} />
                                        : <FlatList
                                            data={userFollowing}
                                            renderItem={renderSingleFollowing}
                                            ListEmptyComponent={() => {
                                                return <View style={{ height: windowHeight * 0.4, width: windowWidth, justifyContent: 'center', alignItems: 'center' }}>
                                                    <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor })}>
                                                        Following no one yet..!!!
                                                    </Text>
                                                </View>
                                            }} />}
                                </View>
                            </View>
                        </View>
                    </Modal>
                    <Modal visible={showPostMedia} transparent={true} >
                        <View style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ backgroundColor: colors.white, height: windowHeight * 0.9, width: windowWidth - moderateScale(10), borderRadius: moderateScale(8) }}>
                                <AppIntroSlider
                                    data={selectedPost.file}
                                    renderItem={renderSingleMedia}
                                    renderNextButton={renderNextButton}
                                    renderPrevButton={renderPrevButton}
                                    renderDoneButton={renderDoneButton}
                                    activeDotStyle={{ backgroundColor: colors.appPrimary }} />
                            </View>
                        </View>
                    </Modal>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    headerFullContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: moderateScale(6),
        height: moderateScale(25),
        width: windowWidth,
        justifyContent: 'space-between'
    },
    iconStyle: (currentThemePrimaryColor) => {
        return {
            fontSize: 35,
            marginLeft: moderateScale(8),
            color: currentThemePrimaryColor
        }
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    buttonsFullContainer: {
        width: windowWidth,
        justifyContent: 'space-evenly',
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: 'transparent',
        marginTop: moderateScale(12)
    },
    singleButtonStyle: {
        width: windowWidth - moderateScale(1),
        // padding: moderateScale(6),
        borderRadius: moderateScale(12),
        borderWidth: moderateScale(1),
        borderColor: colors.white
    }
})