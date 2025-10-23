import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, PermissionsAndroid, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, TouchableWithoutFeedback, Vibration, View } from 'react-native';
import AuthHeader from '../Components/AuthHeader';
import AuthTextInput from '../Components/AuthTextInput';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
import { errorVibrationPattern, moderateScale, POSTS_IMAGE_BASE_URL, ratingsData, windowHeight, windowWidth } from '../Constants/globalConstants';
import { imagePath } from '../Constants/imagePath';
import CommonButton from '../Components/CommonButton';
import PressableImage from '../Components/PressableImage'
import * as ImagePicker from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiHandler } from '../Constants/apiHandler'
import LoadingComponent from '../Components/LoadingComponent'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import CustomToast from '../Components/CustomToast';
import ErrorComponent from '../Components/ErrorComponent';
import { setLoadNewPosts, setLoadUserData } from '../Redux/actions/actions';
import LinearGradient from 'react-native-linear-gradient';

navigator.geolocation = require('@react-native-community/geolocation');

export default function EditPost(props) {

    const route = useRoute()

    const userData = useSelector((state) => state.userData)
    const accessToken = useSelector((state) => state.accessToken)
    const isDarkModeActive = useSelector((state) => state.isDarkModeActive)
    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)
    const isVibrationEnabled = useSelector((state) => state.isVibrationEnabled)
    const allFoodCategories = useSelector((state) => state.foodCategories)
    const isEditPost = route?.params?.isEditPost || false
    const postToBeUpdated = route?.params?.postDetails || {}
    const [isLoading, setIsLoading] = useState(false)
    const [loaderTitle, setLoaderTitle] = useState("Please wait")
    const [title, setTitle] = useState(postToBeUpdated.name)
    const [review, setReview] = useState(postToBeUpdated.review)
    const restaurantName = postToBeUpdated.restaurant
    const [selectedCategory, setSelectedCategory] = useState(postToBeUpdated.category_id)
    const [uploadedImages, setUploadedImages] = useState([])
    const [uploadedImagesThumbnails, setUploadedImagesThumbnails] = useState([])
    const [ratingCount, setRatingCount] = useState(postToBeUpdated.rating)
    const [showAddImageModal, setShowAddImageModal] = useState(false)
    const [showCustomToast, setShowCustomToast] = useState(false)
    const [showErrorMessage, setShowErrorMessage] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [customToastMessage, setCustomToastMessage] = useState('')
    const textInputRef = useRef()

    const navigation = useNavigation()
    const dispatch = useDispatch()

    const setRatingsCount = (rating) => {
        setRatingCount(rating)
    }

    console.log("This is the post to be updated", postToBeUpdated)

    let options = {
        storageOptions: {
            skipBackup: true,
            // path: 'images',
            mediaType: 'mixed',
        },
    };

    useEffect(() => {
        let arrThumbnails = []
        let arrAPIMedia = []
        arrThumbnails = postToBeUpdated.file.map((item, index) => {
            return {
                path: item.filenames,
                previousMedia: true
            }
        })
        arrAPIMedia = postToBeUpdated.file.map((item, index) => {
            return {
                type: item.type,
                url: item.filenames
            }
        })
        setUploadedImages(arrAPIMedia)
        setUploadedImagesThumbnails(arrThumbnails)
    }, [])

    const onReviewChange = (text) => {
        setReview(text)
    }

    const onCategorySelect = (item) => {
        setSelectedCategory(item)
    }

    const onShareReviewPress = async () => {
        if (title == '') {
            setErrorMessage("Post title can't be empty")
            setShowErrorMessage(true)
            if (isVibrationEnabled) {
                Vibration.vibrate(errorVibrationPattern)
            }
        }
        else if (ratingCount == 0) {
            setErrorMessage("Rating is missing")
            setShowErrorMessage(true)
            if (isVibrationEnabled) {
                Vibration.vibrate(errorVibrationPattern)
            }
        }
        else if (selectedCategory == -1) {
            setErrorMessage("No Category selected")
            setShowErrorMessage(true)
            if (isVibrationEnabled) {
                Vibration.vibrate(errorVibrationPattern)
            }
        }
        else if (review == '') {
            setErrorMessage("Post review is missing")
            setShowErrorMessage(true)
            if (isVibrationEnabled) {
                Vibration.vibrate(errorVibrationPattern)
            }
        }
        else {
            setIsLoading(true)
            setLoaderTitle('Updating post')
            let reqObj = {
                name: title,
                rating: ratingCount,
                review: review,
                user_id: userData.id,
                category_id: selectedCategory,
                images: uploadedImages
            }
            await apiHandler.updatePost(postToBeUpdated.id, reqObj, accessToken)
            setIsLoading(false)
            setCustomToastMessage('Post edited successfully')
            setShowCustomToast(true)
            dispatch(setLoadNewPosts(true))
            setTitle('')
            setRatingCount(0)
            setReview('')
            setSelectedCategory({})
            setUploadedImages([])
            setUploadedImagesThumbnails([])
        }
    }

    const requestCameraPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: "App Camera Permission",
                    message: "App needs access to your camera ",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                onAddImagePress()
            } else {
                setErrorMessage('Permission denied')
                setShowErrorMessage(true)
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const removeImageThumbnail = (selectedIndex) => {
        let arrUploadedImages = [...uploadedImages]
        let arrUploadedImagesThumbnails = [...uploadedImagesThumbnails]
        arrUploadedImages = arrUploadedImages.filter((item, index) => {
            return index != selectedIndex
        })
        arrUploadedImagesThumbnails = arrUploadedImagesThumbnails.filter((item, index) => {
            return index != selectedIndex
        })
        setUploadedImages(arrUploadedImages)
        setUploadedImagesThumbnails(arrUploadedImagesThumbnails)
    }

    const onAddImagePress = () => {
        setShowAddImageModal(true)
    }

    const onCameraPress = () => {
        ImagePicker.launchCamera({
            mediaType: 'photo',
        }, async (response) => {
            setShowAddImageModal(false)
            if (response.didCancel) {
                setErrorMessage('You did not select any image');
                setShowErrorMessage(true)
            } else if (response.error) {
                setErrorMessage('ImagePicker Error: ');
                setShowErrorMessage(true)
            } else if (response.customButton) {
                setErrorMessage('User tapped custom button: ');
                setShowErrorMessage(true)
            } else {
                setIsLoading(true)
                setLoaderTitle("Uploading image")
                let arrUploadedImages = [...uploadedImages]
                let arrUploadedImagesThumbnails = [...uploadedImagesThumbnails]
                let objImage = {
                    image: {
                        uri: response?.assets[0]?.uri,
                        name: response?.assets[0]?.fileName,
                        type: response?.assets[0]?.type
                    }
                }
                objImage = apiHandler.createFormData(objImage)
                let uploadImage = await apiHandler.uploadImage(objImage, accessToken)
                arrUploadedImages.push({
                    type: 'image',
                    url: uploadImage.path
                })
                arrUploadedImagesThumbnails.push(response?.assets[0]?.uri)
                setUploadedImages(arrUploadedImages)
                setUploadedImagesThumbnails(arrUploadedImagesThumbnails)
                setIsLoading(false)
            }
        })
    }

    const recordVideo = () => {
        ImagePicker.launchCamera({
            mediaType: 'video',
            durationLimit: 30,
            videoQuality: 'high'
        }, async (response) => {
            setShowAddImageModal(false)
            if (response.didCancel) {
                setErrorMessage('You did not select any video');
                setShowErrorMessage(true)
            } else if (response.error) {
                setErrorMessage('ImagePicker Error: ');
                setShowErrorMessage(true)
            } else if (response.customButton) {
                setErrorMessage('User tapped custom button: ');
                setShowErrorMessage(true)
            } else {
                setIsLoading(true)
                setLoaderTitle("Uploading video")
                let arrUploadedImages = [...uploadedImages]
                let arrUploadedImagesThumbnails = [...uploadedImagesThumbnails]
                let objImage = {
                    image: {
                        uri: response?.assets[0]?.uri,
                        name: response?.assets[0]?.fileName,
                        type: response?.assets[0]?.type
                    }
                }
                objImage = apiHandler.createFormData(objImage)
                let uploadImage = await apiHandler.uploadImage(objImage, accessToken)
                arrUploadedImages.push({
                    type: 'video',
                    url: uploadImage.path
                })
                arrUploadedImagesThumbnails.push(response?.assets[0]?.uri)
                setUploadedImages(arrUploadedImages)
                setUploadedImagesThumbnails(arrUploadedImagesThumbnails)
                setIsLoading(false)
            }
        })
    }

    const onGalleryPress = () => {
        ImagePicker.launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                setErrorMessage('You did not select any image');
                setShowErrorMessage(true)
            } else if (response.error) {
                setErrorMessage('ImagePicker Error: ');
                setShowErrorMessage(true)
            } else if (response.customButton) {
                setErrorMessage('User tapped custom button: ');
                setShowErrorMessage(true)
            } else {
                setIsLoading(true)
                setLoaderTitle("Uploading image")
                let arrUploadedImages = [...uploadedImages]
                let arrUploadedImagesThumbnails = [...uploadedImagesThumbnails]
                let objImage = {
                    image: {
                        uri: response?.assets[0]?.uri,
                        name: response?.assets[0]?.fileName,
                        type: response?.assets[0]?.type
                    }
                }
                objImage = apiHandler.createFormData(objImage)
                apiHandler.uploadImage(objImage, accessToken).then((uploadImage) => {
                    arrUploadedImages.push({
                        type: 'image',
                        url: uploadImage.path
                    })
                    arrUploadedImagesThumbnails.push(response?.assets[0]?.uri)
                    setUploadedImages(arrUploadedImages)
                    setUploadedImagesThumbnails(arrUploadedImagesThumbnails)
                    setIsLoading(false)
                })
            }
        })
    }

    const onTitleChange = (text) => {
        setTitle(text)
    }

    const onImagePickerOptionSelect = (selectedOption) => {
        switch (selectedOption) {
            case 'camera':
                onCameraPress()
                break;
            case 'photo':
                setShowAddImageModal(false)
                onGalleryPress()
                break;
            case 'file-video-o':
                setShowAddImageModal(false)
                uploadVideoFromGallery()
                break;
            case 'video-camera':
                recordVideo()
                break;
            default:
                break;
        }
    }

    const uploadVideoFromGallery = () => {
        ImagePicker.launchImageLibrary({
            mediaType: 'video',
            videoQuality: 'high',
            durationLimit: 30
        }, async (response) => {
            if (response.didCancel) {
                setErrorMessage('You did not select any video');
                setShowErrorMessage(true)
            } else if (response.error) {
                setErrorMessage('ImagePicker Error: ');
                setShowErrorMessage(true)
            } else if (response.customButton) {
                setErrorMessage('User tapped custom button: ');
                setShowErrorMessage(true)
            } else {
                setIsLoading(true)
                setLoaderTitle("Uploading video")
                let arrUploadedImages = [...uploadedImages]
                let arrUploadedImagesThumbnails = [...uploadedImagesThumbnails]
                let objImage = {
                    image: {
                        uri: response?.assets[0]?.uri,
                        name: response?.assets[0]?.fileName,
                        type: response?.assets[0]?.type
                    }
                }
                objImage = apiHandler.createFormData(objImage)
                let uploadImage = await apiHandler.uploadImage(objImage, accessToken)
                arrUploadedImages.push({
                    type: 'video',
                    url: uploadImage.path
                })
                arrUploadedImagesThumbnails.push(response?.assets[0]?.uri)
                setUploadedImages(arrUploadedImages)
                setUploadedImagesThumbnails(arrUploadedImagesThumbnails)
                setIsLoading(false)
            }
        })
    }

    const renderPickerIcon = (title, iconName) => {
        return <TouchableOpacity style={styles.pickerContainer(iconName)} onPress={() => {
            onImagePickerOptionSelect(iconName)
        }}>
            <FontAwesome name={iconName} style={styles.pickerIcon} />
            <View style={styles.pickerInnerContainer(iconName)}>
                <Text style={commonStyles.textWhite(19, { color: colors.appPrimary, fontWeight: '600', marginLeft: moderateScale(8) })}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    }

    return (
        <SafeAreaView style={[commonStyles.flexFull, { backgroundColor: currentThemePrimaryColor }]}>
            <View style={commonStyles.screenContainer}>
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
                {isLoading && <LoadingComponent title={loaderTitle} />}
                <AuthHeader title={'Edit Post'} showBackButton={true} />
                <View style={styles.screenInnerContainer}>
                    <ScrollView keyboardShouldPersistTaps='always' showsVerticalScrollIndicator={false}>
                        <Text style={commonStyles.textWhite(16, { fontWeight: '700', marginTop: moderateScale(4), color: currentThemeSecondaryColor })}>
                            Posted for restaurant
                        </Text>
                        <AuthTextInput customStyles={styles.titleInputContainer} customTextInputStyles={{ textAlignVertical: 'center' }} isEditable={false} value={restaurantName} />
                        <Text style={commonStyles.textWhite(16, { fontWeight: '700', marginTop: moderateScale(8), color: currentThemeSecondaryColor })}>
                            Upload Media
                        </Text>
                        <View style={styles.postMediaFullContainer}>
                            <PressableImage imageSource={imagePath.addIcon} imageStyle={styles.imageStyle} onImagePress={Platform.OS == 'ios' ? onAddImagePress : requestCameraPermission} />
                            {uploadedImagesThumbnails && uploadedImagesThumbnails.length > 0 &&
                                uploadedImagesThumbnails.map((item, index) => {
                                    let previousMedia = item.previousMedia || false
                                    return <View>
                                        <FontAwesome name='close' style={styles.removeMediaContainer} onPress={() => { removeImageThumbnail(index) }} />
                                        <Image source={{ uri: previousMedia ? POSTS_IMAGE_BASE_URL + item.path : item }} style={styles.singleMediaContainer} />
                                    </View>
                                })
                            }
                        </View>
                        <Text style={commonStyles.textWhite(16, { fontWeight: '700', marginTop: moderateScale(8), color: currentThemeSecondaryColor })}>
                            Post Title
                        </Text>
                        <AuthTextInput customStyles={styles.titleInputContainer} customTextInputStyles={{ textAlignVertical: 'center' }} placeholder={'Enter title'} value={title} onChangeText={(text) => { onTitleChange(text) }} />
                        <Text style={commonStyles.textWhite(16, { fontWeight: '700', marginTop: moderateScale(8), color: currentThemeSecondaryColor })}>
                            Select food category :
                        </Text>
                        <View style={styles.categoriesFullContainer}>
                            {allFoodCategories.map((item, index) => {
                                return <TouchableOpacity onPress={() => {
                                    onCategorySelect(item.id)
                                }} style={styles.singleCategoryContainer(item.id == selectedCategory, currentThemeSecondaryColor, currentThemePrimaryColor)}>
                                    <Text style={commonStyles.textWhite(11, { color: item.id == selectedCategory ? currentThemePrimaryColor : currentThemeSecondaryColor })}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            })}
                        </View>
                        <Text style={commonStyles.textWhite(16, { fontWeight: '700', marginTop: moderateScale(10), color: currentThemeSecondaryColor })}>
                            Write Reviews :
                        </Text>
                        <View style={styles.reviewInputFullContainer}>
                            <View style={styles.reviewInputInnerContainer}>
                                <TextInput
                                    ref={textInputRef}
                                    style={styles.reviewTextInput}
                                    value={review}
                                    placeholder={'Enter review'}
                                    multiline={true}
                                    placeholderTextColor={colors.black}
                                    onSubmitEditing={() => {
                                        textInputRef.current.blur()
                                    }}
                                    onChangeText={(text) => { onReviewChange(text) }}
                                />
                            </View>
                        </View>
                        <View style={styles.ratingsFullContainer}>
                            <Text style={commonStyles.textWhite(24, { fontWeight: '600', color: currentThemeSecondaryColor })}>
                                Crunch Store:
                            </Text>
                            {ratingsData.map((item, index) => {
                                return <PressableImage key={index} imageSource={item <= ratingCount ? imagePath.filledStar : imagePath.unfilledStar} imageStyle={styles.singleRatingStar} onImagePress={() => { setRatingsCount(item) }} />
                            })}
                        </View>
                        <CommonButton onButtonPress={onShareReviewPress} buttonTitle={'Update'} buttonStyle={styles.shareButton} textStyle={commonStyles.textWhite(18, { fontWeight: '400', color: colors.white })} />
                    </ScrollView>
                </View>
                <Modal visible={showAddImageModal} animationType='slide' transparent={true}>
                    <View style={commonStyles.flexFull}>
                        <TouchableWithoutFeedback>
                            <View style={styles.imagePickerModalFullContainer}>
                                <View style={styles.imagePickerModalInnerContainer}>
                                    <View style={styles.imagePickerModalTitleContainer}>
                                        <Text style={commonStyles.textWhite(19, { color: colors.appPrimary, fontWeight: '600', marginLeft: moderateScale(8) })}>
                                            Select an option
                                        </Text>
                                    </View>
                                    {renderPickerIcon('Take a picture', 'camera')}
                                    {renderPickerIcon('Record a video', 'video-camera')}
                                    {renderPickerIcon('Upload an image', 'photo')}
                                    {renderPickerIcon('Upload a video', 'file-video-o')}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </Modal>
                {
                    isDarkModeActive && <LinearGradient
                        style={{ alignItems: 'center', top: 0, zIndex: -1, backgroundColor: colors.black, height: windowHeight, width: windowWidth, borderTopLeftRadius: 12, borderTopRightRadius: 12, bottom: 0, position: 'absolute', }}
                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                        locations={[0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8]}
                        colors={['#ffffff00', '#ffffff04', '#ffffff0b', '#ffffff16', '#ffffff1f', '#ffffff29', '#ffffff32']}
                    />
                }
            </View >
        </SafeAreaView >
    )
}

const styles = StyleSheet.create({
    screenInnerContainer: {
        flex: 1,
        padding: moderateScale(8),
        paddingBottom: moderateScale(24),
        paddingTop: 0
    },
    imageStyle: {
        height: moderateScale(28),
        width: moderateScale(28),
        borderRadius: moderateScale(5),
    },
    shareButton: {
        width: windowWidth - moderateScale(30),
        alignSelf: 'center',
        paddingVertical: moderateScale(8),
        backgroundColor: colors.appPrimary,
        borderRadius: moderateScale(18),
        marginTop: moderateScale(8),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: moderateScale(40)
    },
    pickerContainer: (iconName) => {
        return {
            flex: 1, backgroundColor: colors.white, borderWidth: 1, borderTopWidth: iconName == 'photo' || iconName == 'camera' ? 0 : 0.5, paddingHorizontal: moderateScale(8), borderColor: colors.appPrimary, flexDirection: 'row', alignItems: 'center'
        }
    },
    pickerIcon: { fontSize: 25, color: colors.appPrimary },
    pickerInnerContainer: (iconName) => {
        return { flex: 1, justifyContent: 'center', alignItems: iconName == '' ? 'center' : 'flex-start' }
    },
    googlePlacesTextInput: {
        height: moderateScale(26),
        color: colors.black,
        fontSize: 16,
        borderWidth: moderateScale(1),
        borderRadius: moderateScale(8),
        marginTop: moderateScale(8),
        borderColor: colors.grey,
        backgroundColor: colors.lightGrey
    },
    googlePlacesRow: {
        borderBottomWidth: 1,
        borderColor: colors.darkGrey,
    },
    googleRowContainer: { padding: moderateScale(2) },
    postMediaFullContainer: { flexDirection: 'row', marginTop: moderateScale(6) },
    removeMediaContainer: { color: '#aa0000', fontSize: 20, position: 'absolute', zIndex: 5, right: -7, top: -10 },
    singleMediaContainer: {
        height: moderateScale(28),
        width: moderateScale(28),
        borderRadius: moderateScale(5),
        marginLeft: moderateScale(3),
    },
    titleInputContainer: {
        marginTop: moderateScale(5),
        height: moderateScale(26),
        width: windowWidth - moderateScale(16),
        alignSelf: 'center',
        backgroundColor: colors.lightGrey,
        borderRadius: moderateScale(8),
        opacity: 0.8
    },
    reviewInputFullContainer: {
        flexDirection: 'row',
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(4),
        marginTop: moderateScale(5),
        height: moderateScale(60),
        width: windowWidth - moderateScale(16),
        alignSelf: 'center',
        backgroundColor: colors.lightGrey,
        borderRadius: moderateScale(8),
        opacity: 0.8
    },
    reviewInputInnerContainer: {
        flex: 1,
        marginLeft: moderateScale(6),
    },
    reviewTextInput: {
        flex: 1,
        padding: 0,
        color: colors.black,
        textAlignVertical: 'top'
    },
    ratingsFullContainer: { flexDirection: 'row', marginTop: moderateScale(10), alignItems: 'center' },
    singleRatingStar: { height: moderateScale(12), width: moderateScale(12), marginLeft: moderateScale(4) },
    imagePickerModalFullContainer: { flex: 1, backgroundColor: `${colors.black}aa`, justifyContent: 'center', alignItems: 'center' },
    imagePickerModalInnerContainer: { height: windowHeight * 0.4, width: windowWidth * 0.8, backgroundColor: colors.appPrimary, borderRadius: moderateScale(8) },
    imagePickerModalTitleContainer: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderTopWidth: 0.5, paddingHorizontal: moderateScale(8), borderColor: colors.appPrimary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    singleCategoryContainer: (bool, currentThemeSecondaryColor, currentThemePrimaryColor) => {
        return { marginVertical: moderateScale(3), marginHorizontal: moderateScale(5), justifyContent: 'center', alignItems: 'center', borderRadius: moderateScale(6), borderWidth: moderateScale(0.7), borderColor: bool ? colors.appPrimary : currentThemeSecondaryColor, paddingHorizontal: moderateScale(5), paddingVertical: moderateScale(3), backgroundColor: bool ? colors.appPrimary : currentThemePrimaryColor }
    },
    categoriesFullContainer: { flexDirection: 'row', marginTop: moderateScale(6), flexWrap: 'wrap' },

})