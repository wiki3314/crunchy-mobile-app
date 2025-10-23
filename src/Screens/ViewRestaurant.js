import React, { useEffect, useRef, useState } from 'react';
import { Image, ImageBackground, SafeAreaView, StyleSheet, Text, View, Platform, Linking, TouchableOpacity, Modal } from 'react-native';
import { commonStyles } from '../Constants/commonStyles';
import { GOOGLE_API_KEY, moderateScale, POSTS_IMAGE_BASE_URL, ratingsData, windowHeight, windowWidth } from '../Constants/globalConstants';
import { imagePath } from '../Constants/imagePath';
import AuthHeader from '../Components/AuthHeader';
import { colors } from '../Constants/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import LoadingComponent from '../Components/LoadingComponent';
import { ScrollView } from 'react-native-gesture-handler';
import AntDesign from 'react-native-vector-icons/AntDesign'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { useDispatch, useSelector } from 'react-redux';
import { updateFavoriteRestaurants } from '../Redux/actions/actions';
import { apiHandler } from '../Constants/apiHandler';
import CustomToast from '../Components/CustomToast';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import ErrorComponent from '../Components/ErrorComponent';
import Video from 'react-native-video';
import Carousel from 'react-native-snap-carousel';

export default function ViewRestaurant(props) {

    const route = useRoute()
    const navigation = useNavigation()
    const dispatch = useDispatch()

    const restaurant_id = route.params.restaurant_id

    const accessToken = useSelector((state) => state.accessToken)
    const favoriteRestaurants = useSelector((state) => state.favoriteRestaurants)

    const userDetails = useSelector((state) => state.userData)

    const isDarkModeActive = useSelector((state) => state.isDarkModeActive)
    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)
    const isVibrationEnabled = useSelector((state) => state.isVibrationEnabled)

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
    const [index, setIndex] = useState(-1)
    const [customToastMessage, setCustomToastMessage] = useState("")
    const [showCustomToast, setShowCustomToast] = useState(false)
    const [fullReviewIndex, setFullReviewIndex] = useState(-1)
    const [errorMessage, setErrorMessage] = useState("")
    const [showErrorMessage, setShowErrorMessage] = useState(false)
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

    const mediaComponentRef = useRef()

    useEffect(() => {
        getRestaurantDetails()
    }, [])

    useEffect(() => {
        let index = favoriteRestaurants.findIndex((item, index) => {
            return item.restaurant_id == restaurant_id
        })
        setIndex(index)
    }, [favoriteRestaurants])

    const getRestaurantDetails = async () => {
        try {
            setIsLoading(true)
            setLoaderTitle("Fetching place details")
            let restaurantDetails = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${restaurant_id}&key=${GOOGLE_API_KEY}`)
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
            // let restaurantMedia = await apiHandler.getMediaForRestaurant(accessToken, restaurant_id)
            // if (restaurantMedia && restaurantMedia.length > 0) {
            //     restaurantMedia = restaurantMedia.map((item, index) => {
            //         if (item.type == 'image') {
            //             return {
            //                 mediaType: 'image',
            //                 imageSource: item.filenames,
            //                 isInAppPost: true
            //             }
            //         }
            //         else {
            //             return {
            //                 mediaType: 'video',
            //                 videoSource: item.filenames,
            //                 isInAppPost: true
            //             }
            //         }
            //     })
            //     googleMedia = [...restaurantMedia, ...googleMedia]
            // }
            setPhotoRef(googleMedia)
            setIsLoading(false)
        } catch (error) {
            setIsLoading(false)
            setErrorMessage('Error fetching response')
            setShowErrorMessage(true)
            setTimeout(() => {
                navigation.goBack()
            }, 1100)
        }
    }

    const handleGesture = (nativeEvent) => {
        if (nativeEvent.state == 5) {
            if (nativeEvent.translationX > 100) {
                navigation.goBack()
            }
        }
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

    const renderRestaurantImages = ({ item, index }) => {
        if (item.isInAppPost) {
            if (item.mediaType == 'image') {
                return <ImageBackground source={{ uri: POSTS_IMAGE_BASE_URL + item.imageSource }} style={{ flex: 1, overflow: 'hidden' }} resizeMode='cover'>
                    <TouchableOpacity onPress={() => { setShowImagesModal(false) }} style={{ backgroundColor: `${colors.black}aa`, alignSelf: 'flex-end', margin: moderateScale(5), height: moderateScale(15), width: moderateScale(15), borderRadius: moderateScale(7.5), alignItems: 'center', justifyContent: 'center' }}>
                        <AntDesign name='close' style={{ fontSize: 25, color: colors.white }} />
                    </TouchableOpacity>
                </ImageBackground>
            }
            else {
                return <View style={commonStyles.flexFull}>
                    <TouchableOpacity onPress={() => { setShowImagesModal(false) }} style={{ backgroundColor: `${colors.black}aa`, position: 'absolute', top: moderateScale(5), right: moderateScale(5), height: moderateScale(15), width: moderateScale(15), borderRadius: moderateScale(7.5), alignItems: 'center', justifyContent: 'center' }}>
                        <AntDesign name='close' style={{ fontSize: 25, color: colors.white }} />
                    </TouchableOpacity>
                    <Video
                        source={{ uri: POSTS_IMAGE_BASE_URL + item.videoSource }}
                        style={{ flex: 1, overflow: 'hidden' }}
                        resizeMode='cover'
                        repeat={true} />
                </View>
            }
        }
        else {
            return <ImageBackground style={{ flex: 1, overflow: 'hidden' }} resizeMode='cover' source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${item.photo_reference}&key=${GOOGLE_API_KEY}` }}>
                <TouchableOpacity onPress={() => { setShowImagesModal(false) }} style={{ backgroundColor: `${colors.black}aa`, alignSelf: 'flex-end', margin: moderateScale(5), height: moderateScale(15), width: moderateScale(15), borderRadius: moderateScale(7.5), alignItems: 'center', justifyContent: 'center' }}>
                    <AntDesign name='close' style={{ fontSize: 25, color: colors.white }} />
                </TouchableOpacity>
            </ImageBackground>
        }
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

    const onMediaComponentDonePress = () => {
        setShowImagesModal(false)
    }

    const renderDoneButton = () => {
        return <TouchableOpacity onPress={onMediaComponentDonePress} style={{ padding: moderateScale(6), borderRadius: moderateScale(6), backgroundColor: colors.appPrimary, marginLeft: moderateScale(4) }}>
            <Text style={commonStyles.textWhite(14)}>
                Done
            </Text>
        </TouchableOpacity>
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

    const onLikeRestaurantPress = async () => {
        setIsLoading(true)
        index == -1 ? setLoaderTitle('Adding to favorites') : setLoaderTitle('Removing from favorites')
        let restaurantDetails = {
            restaurant_id: restaurant_id,
            restaurant_name: restaurantName,
            image: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${photoRef[0].photo_reference}&key=${GOOGLE_API_KEY}`
        }
        let objRestaurant = {
            restaurant_id: restaurant_id,
            restaurantName: restaurantName,
            restaurantImage: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${photoRef[0].photo_reference}&key=${GOOGLE_API_KEY}`
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

    const rightIcon = () => {
        return <FontAwesome name={index != -1 ? 'heart' : 'heart-o'} style={{
            fontSize: 30,
            marginLeft: moderateScale(5),
            color: colors.appPrimary,
            marginRight: moderateScale(8)
        }} onPress={onLikeRestaurantPress} />
    }

    const onSingleMediaItemPress = (mediaIndex) => {
        // mediaComponentRef?.current?.snapToItem({index:mediaIndex})
        setCurrentSlideIndex(mediaIndex)
        setShowImagesModal(true)
    }

    const renderMediaComponent = (mediaItem, mediaIndex) => {
        if (mediaItem.isInAppPost) {
            if (mediaItem.mediaType == 'image') {
                return <TouchableOpacity onPress={() => {
                    onSingleMediaItemPress(mediaIndex)
                }}>
                    <Image source={{ uri: POSTS_IMAGE_BASE_URL + mediaItem.imageSource }} style={{ height: moderateScale(40), width: moderateScale(40), borderRadius: moderateScale(8), overflow: 'hidden', marginLeft: mediaIndex == 0 ? 0 : moderateScale(4) }} resizeMode='cover' />
                </TouchableOpacity>
            }
            else {
                return <TouchableOpacity onPress={() => {
                    onSingleMediaItemPress(mediaIndex)
                }}>
                    <Video
                        source={{ uri: POSTS_IMAGE_BASE_URL + mediaItem.videoSource }}
                        style={{ height: moderateScale(40), width: moderateScale(40), borderRadius: moderateScale(8), overflow: 'hidden', marginLeft: mediaIndex == 0 ? 0 : moderateScale(4) }}
                        resizeMode='cover'
                        paused={true} />
                </TouchableOpacity>
            }
        }
        else {
            return <TouchableOpacity onPress={() => {
                onSingleMediaItemPress(mediaIndex)
            }}>
                <Image source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${mediaItem.photo_reference}&key=${GOOGLE_API_KEY}` }} style={{ height: moderateScale(40), width: moderateScale(40), borderRadius: moderateScale(8), overflow: 'hidden', marginLeft: mediaIndex == 0 ? 0 : moderateScale(4) }} />
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
                <AuthHeader />
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
                            {helperFunctions.getStarRatings(item.rating)}
                        </View>
                        <View style={{ width: windowWidth - moderateScale(16), flexDirection: 'row', justifyContent: 'space-evenly', marginTop: moderateScale(6) }}>
                            <TouchableOpacity onPress={onMapsPress} style={{ padding: moderateScale(6), paddingHorizontal: moderateScale(4), flexDirection: 'row', alignItems: 'center', backgroundColor: colors.appPrimary, borderRadius: moderateScale(8) }}>
                                <MaterialIcons name='explore' style={{ fontSize: moderateScale(12), color: colors.white }} />
                                <Text style={commonStyles.textWhite(16, { color: colors.white, marginLeft: moderateScale(2) })}>
                                    Directions
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onPhoneButtonPress} style={{ padding: moderateScale(6), paddingHorizontal: moderateScale(4), flexDirection: 'row', alignItems: 'center', backgroundColor: colors.appPrimary, borderRadius: moderateScale(8) }}>
                                <FontAwesome name='phone' style={{ fontSize: moderateScale(12), color: colors.white }} />
                                <Text style={commonStyles.textWhite(16, { color: colors.white, marginLeft: moderateScale(2) })}>
                                    Call
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onWebsitePress} disabled={restaurantWebsite == undefined || restaurantWebsite == ""} style={{ padding: moderateScale(6), paddingHorizontal: moderateScale(4), flexDirection: 'row', alignItems: 'center', backgroundColor: (restaurantWebsite == undefined || restaurantWebsite == "") ? colors.darkGrey : colors.appPrimary, borderRadius: moderateScale(8) }}>
                                <MaterialCommunityIcons name={(restaurantWebsite == undefined || restaurantWebsite == "") ? 'web-off' : 'web'} style={{ fontSize: moderateScale(12), color: colors.white }} />
                                <Text style={commonStyles.textWhite(16, { color: colors.white, marginLeft: moderateScale(2) })}>
                                    Website
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ width: windowWidth - moderateScale(16), alignSelf: 'center', flexDirection: 'row', marginTop: moderateScale(8) }}>
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
                            }} style={{ height: moderateScale(40), width: moderateScale(40), backgroundColor: `#000000cc`, borderRadius: moderateScale(8), position: 'absolute', right: 0, justifyContent: 'center', alignItems: 'center' }}>
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
                                <View style={{ flexDirection: 'row', height: 20, width: windowWidth - moderateScale(16), justifyContent: 'center' }}>
                                    {ratingsData.map((innerItem, innerIndex) => {
                                        return innerItem <= Math.round(item.rating) && <Image source={imagePath.filledStar} style={{ height: 20, width: 20, marginRight: moderateScale(4) }} />
                                    })}
                                </View>
                            </View>
                        })}
                    </ScrollView>
                </View>
            </View>
        </ImageBackground>
        <Modal visible={showImagesModal} transparent={true} >
            <View style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: colors.white, height: windowHeight * 0.8, width: windowWidth - moderateScale(16), borderRadius: moderateScale(8) }}>
                    <Carousel
                        ref={mediaComponentRef}
                        data={photoRef}
                        renderItem={renderRestaurantImages}
                        sliderWidth={windowWidth - moderateScale(16)}
                        itemWidth={windowWidth - moderateScale(16)}
                        firstItem={currentSlideIndex}
                    // renderNextButton={renderNextButton}
                    // renderPrevButton={renderPrevButton}
                    // renderDoneButton={renderDoneButton}
                    // activeDotStyle={{ backgroundColor: colors.appPrimary }}
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
    }
})