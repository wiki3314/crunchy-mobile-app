import React, { useEffect, useRef, useState } from 'react';
import { Image, ImageBackground, SafeAreaView, StyleSheet, Text, View, Platform, Linking, TouchableOpacity, Dimensions, Modal, ToastAndroid, FlatList } from 'react-native';
import { commonStyles } from '../Constants/commonStyles';
import { GOOGLE_API_KEY, moderateScale, POSTS_IMAGE_BASE_URL, ratingsData, windowHeight, windowWidth } from '../Constants/globalConstants';
import { imagePath } from '../Constants/imagePath';
import AuthHeader from '../Components/AuthHeader';
import { colors } from '../Constants/colors';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import LoadingComponent from '../Components/LoadingComponent';
import { ScrollView } from 'react-native-gesture-handler';
import AntDesign from 'react-native-vector-icons/AntDesign'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { useDispatch, useSelector } from 'react-redux';
import { setAppLaunchedFromLink, setLoadNewPosts, setReceivedPost, updateFavoriteRestaurants, updateFavouritePlaces } from '../Redux/actions/actions';
import { apiHandler } from '../Constants/apiHandler';
import CustomToast from '../Components/CustomToast';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import ErrorComponent from '../Components/ErrorComponent';
import Video from 'react-native-video';
import Carousel from 'react-native-snap-carousel';
import { navigationStrings } from '../Navigation/NavigationStrings';
import { helperFunctions } from '../Constants/helperFunctions';
import SliderDots from '../Components/SliderDots';

export default function AppLaunchedFromLink(props) {

    const route = useRoute()
    const navigation = useNavigation()
    const dispatch = useDispatch()

    const receivedPost = useSelector((state) => state.receivedPost)

    const accessToken = useSelector((state) => state.accessToken)

    const userDetails = useSelector((state) => state.userData)

    const isDarkModeActive = useSelector((state) => state.isDarkModeActive)
    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)
    const isVibrationEnabled = useSelector((state) => state.isVibrationEnabled)

    const [restaurant_id, setRestaurant_id] = useState('')
    const [ratings, setRatings] = useState(0)
    const [restaurantName, setRestaurantName] = useState('')
    const [photoRef, setPhotoRef] = useState([])
    const [restaurantImage, setRestaurantImage] = useState('')
    const [reviews, setReviews] = useState([])
    const [location, setLocation] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [loaderTitle, setLoaderTitle] = useState("")
    const [address, setAddress] = useState('')
    const [showImagesModal, setShowImagesModal] = useState(false)
    const [restaurantPhoneNumber, setRestaurantPhoneNumber] = useState("")
    const [restaurantWebsite, setRestaurantWebsite] = useState("")
    const [todayTiming, setTodayTiming] = useState("")
    const [customToastMessage, setCustomToastMessage] = useState("")
    const [showCustomToast, setShowCustomToast] = useState(false)
    const [fullReviewIndex, setFullReviewIndex] = useState(-1)
    const [errorMessage, setErrorMessage] = useState("")
    const [showErrorMessage, setShowErrorMessage] = useState(false)
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
    const [index, setIndex] = useState(-1)

    const favoriteRestaurants = useSelector((state) => state.favoriteRestaurants)

    const mediaComponentRef = useRef()

    const isFocused = useIsFocused()

    useEffect(() => {
        let index = favoriteRestaurants.findIndex((item, index) => {
            return item.restaurant_id == restaurant_id
        })
        setIndex(index)
    }, [favoriteRestaurants])

    useEffect(() => {
        // dispatch(setAppLaunchedFromLink(false))
        if (Object.keys(receivedPost).length > 0) {
            getRestaurantDetails()
        }
    }, [receivedPost])

    const getRestaurantDetails = async () => {
        try {
            setIsLoading(true)
            setLoaderTitle("Fetching place details")
            let placeID = receivedPost.id
            setRestaurant_id(placeID)
            let restaurantDetails = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeID}&key=${GOOGLE_API_KEY}`)
            restaurantDetails = restaurantDetails.data.result
            setRestaurantName(restaurantDetails?.name)
            setAddress(restaurantDetails?.formatted_address)
            if (restaurantDetails?.photos && restaurantDetails.photos.length > 0) {
                setRestaurantImage(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${restaurantDetails.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`)
                let arrGoogleImages = []
                arrGoogleImages = restaurantDetails.photos.map((imageItem, imageIndex) => {
                    return {
                        uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${imageItem.photo_reference}&key=${GOOGLE_API_KEY}`,
                        isGoogleMedia: true
                    }
                })
            }
            setRatings(restaurantDetails?.rating)
            setReviews(restaurantDetails.reviews)
            setRestaurantPhoneNumber(restaurantDetails?.international_phone_number)
            setLocation(restaurantDetails?.geometry?.location)
            setRestaurantWebsite(restaurantDetails?.website)
            let todayDay = new Date().getDay()
            if (todayDay == 0) {
                todayDay = 6
            }
            else {
                todayDay--
            }
            let todayTiming = restaurantDetails.opening_hours?.weekday_text ? restaurantDetails.opening_hours.weekday_text[todayDay] : ''
            setTodayTiming(todayTiming)
            let googleMedia = []
            if (restaurantDetails?.photos && restaurantDetails.photos.length > 0) {
                googleMedia = restaurantDetails.photos
            }
            let restaurantMedia = await apiHandler.getMediaForRestaurant(accessToken, placeID)
            if (restaurantMedia && restaurantMedia.length > 0) {
                restaurantMedia = restaurantMedia.map((item, index) => {
                    if (item.type == 'image') {
                        return {
                            mediaType: 'image',
                            imageSource: item.filenames,
                            isInAppPost: true
                        }
                    }
                    else {
                        return {
                            mediaType: 'video',
                            videoSource: item.filenames,
                            isInAppPost: true
                        }
                    }
                })
                googleMedia = [...restaurantMedia, ...googleMedia]
            }
            setPhotoRef(googleMedia)
            // }
            setIsLoading(false)
        } catch (error) {
            setIsLoading(false)
            setErrorMessage('Error fetching response')
            setShowErrorMessage(true)
            setTimeout(() => {
                // navigation.replace(navigationStrings.SplashScreen)
            }, 1100)
        }
    }

    const onContinueToApplicationPress = () => {
        dispatch(setAppLaunchedFromLink(false))
    }

    const onMapsPress = () => {
        const url = Platform.select({
            ios: "maps:0,0?q=" + address + '&ll=' + location.lat + "," + location.lng,
            android: "geo:" + location.lat + "," + location.lng + "?q=" + address
        });
        Linking.openURL(url);
    }

    const onWebsitePress = () => {
        Linking.openURL(restaurantWebsite)
    }

    const onCloseModalIconPress = () => {
        setShowImagesModal(false)
    }

    const rightIcon = () => {
        return <FontAwesome name={index != -1 ? 'heart' : 'heart-o'} style={{
            fontSize: 30,
            marginLeft: moderateScale(5),
            color: colors.appPrimary,
            marginRight: moderateScale(8)
        }} onPress={onLikeRestaurantPress} />
    }

    const renderRestaurantImages = ({ item, index }) => {
        if (item.isInAppPost) {
            if (item.mediaType == 'image') {
                return <ImageBackground source={{ uri: POSTS_IMAGE_BASE_URL + item.imageSource }} style={styles.inAppPostImage} resizeMode='cover'>
                    <TouchableOpacity onPress={onCloseModalIconPress} style={styles.inAppPostImageCloseIcon}>
                        <AntDesign name='close' style={styles.closeIcon} />
                    </TouchableOpacity>
                    <SliderDots number={photoRef.length} activeIndex={index} customStyle={{ position: 'absolute', bottom: moderateScale(10), zIndex: 99 }} />
                </ImageBackground>
            }
            else {
                return <View style={commonStyles.flexFull}>
                    <TouchableOpacity onPress={onCloseModalIconPress} style={styles.inAppPostVideoCloseIcon}>
                        <AntDesign name='close' style={styles.closeIcon} />
                    </TouchableOpacity>
                    <Video
                        source={{ uri: POSTS_IMAGE_BASE_URL + item.videoSource }}
                        style={styles.inAppPostImage}
                        resizeMode='cover'
                        repeat={true} />
                    <SliderDots number={photoRef.length} activeIndex={index} customStyle={{ position: 'absolute', bottom: moderateScale(10), zIndex: 99 }} />
                </View>
            }
        }
        else {
            return <ImageBackground style={styles.inAppPostImage} resizeMode='cover' source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${item.photo_reference}&key=${GOOGLE_API_KEY}` }}>
                <TouchableOpacity onPress={() => { setShowImagesModal(false) }} style={styles.googleMediaCloseIcon}>
                    <AntDesign name='close' style={styles.closeIcon} />
                </TouchableOpacity>
                <SliderDots number={photoRef.length} activeIndex={index} customStyle={{ position: 'absolute', bottom: moderateScale(10), zIndex: 99 }} />
            </ImageBackground>
        }
    }

    const onLikeRestaurantPress = async () => {
        setIsLoading(true)
        index == -1 ? setLoaderTitle('Adding to favorites') : setLoaderTitle('Removing from favorites')
        let restaurantDetails = {
            restaurant_id: restaurant_id,
            restaurant_name: restaurantName,
            image: `${photoRef[0].photo_reference}`
        }
        let objRestaurant = {
            restaurant_id: restaurant_id,
            restaurantName: restaurantName,
            restaurantImage: `${photoRef[0].photo_reference}`
        }
        await apiHandler.likeRestaurant(restaurantDetails, accessToken)
        dispatch(updateFavoriteRestaurants(objRestaurant))
        setIsLoading(false)
        if (index == -1) {
            setCustomToastMessage('Added to liked places')
        }
        else {
            setCustomToastMessage('Removed from liked places')
        }
        setShowCustomToast(true)
    }

    const onPhoneButtonPress = () => {
        if (restaurantPhoneNumber) {
            let phoneNumber = '';
            if (Platform.OS === 'android') { phoneNumber = `tel:${restaurantPhoneNumber}`; }
            else { phoneNumber = `telprompt:${restaurantPhoneNumber}`; }
            Linking.openURL(phoneNumber);
        }
        else {
            setErrorMessage('Phone number not available')
            setShowErrorMessage(true)
        }
    }

    const onSingleMediaItemPress = (mediaIndex) => {
        setCurrentSlideIndex(mediaIndex)
        setShowImagesModal(true)
    }

    const renderMediaComponent = (mediaItem, mediaIndex) => {
        if (mediaItem.isInAppPost) {
            if (mediaItem.mediaType == 'image') {
                return <TouchableOpacity onPress={() => {
                    onSingleMediaItemPress(mediaIndex)
                }}>
                    <Image source={{ uri: POSTS_IMAGE_BASE_URL + mediaItem.imageSource }} style={styles.singleMediaComponent(mediaIndex == 0)} resizeMode='cover' />
                </TouchableOpacity>
            }
            else {
                return <TouchableOpacity onPress={() => {
                    onSingleMediaItemPress(mediaIndex)
                }}>
                    <Video
                        source={{ uri: POSTS_IMAGE_BASE_URL + mediaItem.videoSource }}
                        style={styles.singleMediaComponent(mediaIndex == 0)}
                        resizeMode='cover'
                        paused={index != currentSlideIndex}
                        repeat={true} />
                </TouchableOpacity>
            }
        }
        else {
            return <TouchableOpacity onPress={() => {
                onSingleMediaItemPress(mediaIndex)
            }}>
                <Image source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${mediaItem.photo_reference}&key=${GOOGLE_API_KEY}` }} style={styles.singleMediaComponent(mediaIndex == 0)} />
            </TouchableOpacity>
        }
    }

    return (<SafeAreaView style={[commonStyles.flexFull, { backgroundColor: currentThemePrimaryColor }]}>
        {isLoading && <LoadingComponent title={loaderTitle} />}
        <CustomToast isVisible={showCustomToast} toastMessage={customToastMessage} onToastShow={() => {
            setTimeout(() => {
                setShowCustomToast(false)
            }, 900)
        }} />
        <ErrorComponent isVisible={showErrorMessage} onToastShow={() => {
            setTimeout(() => {
                setShowErrorMessage(false)
            }, 1100)
        }} toastMessage={errorMessage} />
        <ImageBackground resizeMode='stretch' source={isDarkModeActive ? imagePath.darkRestaurantBG : imagePath.restaurantBG} style={styles.backgroundImage}>
            <View style={commonStyles.flexFull}>
                <AuthHeader showBackButton={false} rightIcon={rightIcon} />
                <View style={styles.screenInnerContainer}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <ImageBackground style={styles.profileImage} source={photoRef && photoRef.length > 0 ? { uri: restaurantImage } : imagePath.americanFoodImage} >
                        </ImageBackground>
                        <Text style={commonStyles.textWhite(20, { color: currentThemeSecondaryColor, fontWeight: '700', alignSelf: 'center', marginTop: moderateScale(3), borderBottomWidth: moderateScale(0.5), borderColor: colors.grey, paddingHorizontal: moderateScale(5) })}>
                            {restaurantName}
                        </Text>
                        {todayTiming ? <Text style={commonStyles.textWhite(16, { color: currentThemeSecondaryColor, alignSelf: 'center', marginTop: moderateScale(3), borderBottomWidth: moderateScale(0.5), borderColor: colors.grey, paddingHorizontal: moderateScale(5) })}>
                            {'Today timings - ' + todayTiming}
                        </Text> : null}
                        <View style={styles.ratingsContainer}>
                            <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor, fontWeight: '600' })}>
                                Average Rating:
                            </Text>
                            {helperFunctions.getStarRatings(ratings)}
                        </View>
                        <View style={styles.buttonsFullContainer}>
                            <TouchableOpacity onPress={onMapsPress} style={styles.singleButtonContainer}>
                                <MaterialIcons name='explore' style={styles.buttonIcon} />
                                <Text style={commonStyles.textWhite(16, { color: colors.white, marginLeft: moderateScale(2) })}>
                                    Directions
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onPhoneButtonPress} style={styles.singleButtonContainer}>
                                <FontAwesome name='phone' style={styles.buttonIcon} />
                                <Text style={commonStyles.textWhite(16, { color: colors.white, marginLeft: moderateScale(2) })}>
                                    Call
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onWebsitePress} disabled={restaurantWebsite == undefined || restaurantWebsite == ""} style={styles.websiteButtonContainer((restaurantWebsite == undefined || restaurantWebsite == ""))}>
                                <MaterialCommunityIcons name={(restaurantWebsite == undefined || restaurantWebsite == "") ? 'web-off' : 'web'} style={styles.buttonIcon} />
                                <Text style={commonStyles.textWhite(16, { color: colors.white, marginLeft: moderateScale(2) })}>
                                    Website
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.mediaFullContainer}>
                            <ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
                                {
                                    photoRef && photoRef.length > 0 && photoRef.map((mediaItem, mediaIndex) => {
                                        return renderMediaComponent(mediaItem, mediaIndex)
                                    })
                                }
                            </ScrollView>
                            <TouchableOpacity onPress={() => {
                                setShowImagesModal(true)
                                setCurrentSlideIndex(0)
                            }} style={styles.viewAllButtonContainer}>
                                <Text style={commonStyles.textWhite(16, { fontWeight: '600' })}>
                                    View
                                </Text>
                                <Text style={commonStyles.textWhite(16, { fontWeight: '600' })}>
                                    all
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={commonStyles.textWhite(16, { color: currentThemeSecondaryColor, fontWeight: '700', marginTop: moderateScale(10) })}>
                            Reviews:
                        </Text>
                        <View style={styles.reviewBorder} />
                        {reviews && reviews.length > 0 && reviews.map((item, index) => {
                            return <View>
                                <View style={styles.singleReviewContainer}>
                                    <View style={styles.singleReviewInnerContainer}>
                                        <Image style={styles.reviewImage} source={{ uri: item.profile_photo_url }} />
                                        <Text onPress={() => {
                                            if (index != fullReviewIndex) {
                                                setFullReviewIndex(index)
                                            }
                                            else {
                                                setFullReviewIndex(-1)
                                            }
                                        }} numberOfLines={index == fullReviewIndex ? 20 : 2} style={commonStyles.textWhite(13, { color: currentThemeSecondaryColor, textAlignVertical: 'center', textAlign: 'left', fontWeight: '500', width: '85%', marginLeft: moderateScale(4) })}>
                                            {item.text}
                                        </Text>
                                    </View>
                                    <Text style={commonStyles.textWhite(11, { color: colors.grey, fontWeight: '400', })}>
                                        {item.relative_time_description}
                                    </Text>
                                </View>
                                <View style={styles.reviewRatingsFullContainer}>
                                    {ratingsData.map((innerItem, innerIndex) => {
                                        return innerItem <= Math.round(item.rating) && <Image source={imagePath.filledStar} style={styles.singleRatingImage} />
                                    })}
                                </View>
                            </View>
                        })}
                    </ScrollView>
                </View>
                <TouchableOpacity onPress={onContinueToApplicationPress} style={styles.continueButtonFullContainer} >
                    <FontAwesome name='binoculars' style={styles.continueButtonIcon} />
                    <View style={styles.continueButtonInnerContainer}>
                        <Text style={commonStyles.textWhite(18, {
                            marginLeft: moderateScale(4)
                        })}>
                            {accessToken == "" ? 'Explore Crunchii' : 'Continue to application'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </ImageBackground>
        <Modal visible={showImagesModal} transparent={true} >
            <View style={styles.mediaModalFullContainer}>
                <View style={styles.mediaModalInnerContainer}>
                    <Carousel
                        ref={mediaComponentRef}
                        data={photoRef}
                        renderItem={renderRestaurantImages}
                        sliderWidth={windowWidth - moderateScale(16)}
                        itemWidth={windowWidth - moderateScale(16)}
                        firstItem={currentSlideIndex}
                        onSnapToItem={(index) => {
                            setCurrentSlideIndex(index)
                        }}
                    />
                </View>
            </View>
        </Modal>
    </SafeAreaView >)
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1
    },
    screenInnerContainer: {
        flex: 1,
        padding: moderateScale(8),
        paddingTop: 0
    },
    profileImage: {
        height: moderateScale(80),
        width: moderateScale(80),
        borderRadius: moderateScale(40),
        alignSelf: 'center',
        overflow: 'hidden',
        justifyContent: 'flex-end'
    },
    ratingsContainer: {
        marginTop: moderateScale(4),
        alignSelf: 'center',
        flexDirection: 'row'
    },
    ratingStar: {
        height: moderateScale(10),
        width: moderateScale(10),
        marginLeft: moderateScale(2)
    },
    reviewBorder: {
        height: moderateScale(0.5),
        width: windowWidth - moderateScale(16),
        marginTop: moderateScale(2),
        backgroundColor: colors.grey
    },
    singleReviewContainer: {
        width: windowWidth - moderateScale(16),
        marginTop: moderateScale(5),
        flexDirection: 'row',
        alignItems: 'center',
    },
    singleReviewInnerContainer: {
        width: windowWidth * 0.7,
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(3)
    },
    reviewImage: {
        height: moderateScale(20),
        width: moderateScale(20),
        borderRadius: moderateScale(10)
    },
    buttonsFullContainer: { width: windowWidth - moderateScale(16), flexDirection: 'row', justifyContent: 'space-evenly', marginTop: moderateScale(6) },
    singleButtonContainer: { padding: moderateScale(6), paddingHorizontal: moderateScale(4), flexDirection: 'row', alignItems: 'center', backgroundColor: colors.appPrimary, borderRadius: moderateScale(8) },
    buttonIcon: { fontSize: moderateScale(12), color: colors.white },
    websiteButtonContainer: (bool) => {
        return { padding: moderateScale(6), paddingHorizontal: moderateScale(4), flexDirection: 'row', alignItems: 'center', backgroundColor: bool ? colors.darkGrey : colors.appPrimary, borderRadius: moderateScale(8) }
    },
    mediaFullContainer: { width: windowWidth - moderateScale(16), alignSelf: 'center', flexDirection: 'row', marginTop: moderateScale(8) },
    singleMediaComponent: (bool) => {
        return { height: moderateScale(40), width: moderateScale(40), borderRadius: moderateScale(8), overflow: 'hidden', marginLeft: bool ? 0 : moderateScale(4) }
    },
    viewAllButtonContainer: { height: moderateScale(40), width: moderateScale(40), backgroundColor: `#000000cc`, borderRadius: moderateScale(8), position: 'absolute', right: 0, justifyContent: 'center', alignItems: 'center' },
    reviewRatingsFullContainer: { flexDirection: 'row', height: 20, width: windowWidth - moderateScale(16), justifyContent: 'center' },
    singleRatingImage: { height: 20, width: 20, marginRight: moderateScale(4) },
    continueButtonFullContainer: { alignItems: 'center', flexDirection: 'row', backgroundColor: colors.appPrimary, padding: moderateScale(8), borderRadius: moderateScale(8), width: windowWidth - moderateScale(10), marginVertical: moderateScale(4), alignSelf: 'center' },
    continueButtonIcon: { fontSize: moderateScale(16), color: colors.white },
    continueButtonInnerContainer: { flex: 1, alignItems: 'center' },
    mediaModalFullContainer: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', alignItems: 'center' },
    mediaModalInnerContainer: { backgroundColor: colors.white, height: windowHeight * 0.8, width: windowWidth - moderateScale(16), borderRadius: moderateScale(8) },
    inAppPostImage: { flex: 1, overflow: 'hidden' },
    inAppPostImageCloseIcon: { backgroundColor: `${colors.black}aa`, alignSelf: 'flex-end', margin: moderateScale(5), height: moderateScale(15), width: moderateScale(15), borderRadius: moderateScale(7.5), alignItems: 'center', justifyContent: 'center' },
    inAppPostVideoCloseIcon: { backgroundColor: `${colors.black}aa`, position: 'absolute', top: moderateScale(5), right: moderateScale(5), height: moderateScale(15), width: moderateScale(15), borderRadius: moderateScale(7.5), alignItems: 'center', justifyContent: 'center' },
    closeIcon: { fontSize: 25, color: colors.white },
    googleMediaCloseIcon: { backgroundColor: `${colors.black}aa`, alignSelf: 'flex-end', margin: moderateScale(5), height: moderateScale(15), width: moderateScale(15), borderRadius: moderateScale(7.5), alignItems: 'center', justifyContent: 'center' },

})