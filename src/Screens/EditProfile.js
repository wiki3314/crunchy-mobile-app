import React, { useEffect, useState } from 'react';
import { Image, Modal, PermissionsAndroid, Platform, SafeAreaView, TouchableOpacity, StyleSheet, Text, View, Vibration } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import AuthHeader from '../Components/AuthHeader';
import CommonButton from '../Components/CommonButton';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
import { moderateScale, USER_PROFILE_BASE_URL, windowHeight, windowWidth } from '../Constants/globalConstants';
import Entypo from 'react-native-vector-icons/Entypo'
import AuthTextInput from '../Components/AuthTextInput';
import { apiHandler } from '../Constants/apiHandler';
import { logoutUser, setUserData } from '../Redux/actions/actions';
import LoadingComponent from '../Components/LoadingComponent';
import * as ImagePicker from 'react-native-image-picker';
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import CustomToast from '../Components/CustomToast';
import { navigationStrings } from '../Navigation/NavigationStrings';
import { useNavigation } from '@react-navigation/native';
import { imagePath } from '../Constants/imagePath';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { helperFunctions } from '../Constants/helperFunctions';
import ErrorComponent from '../Components/ErrorComponent';
import Ionicons from 'react-native-vector-icons/Ionicons'

export default function EditProfile(props) {

    const dispatch = useDispatch()
    const userData = useSelector((state) => state.userData)
    const accessToken = useSelector((state) => state.accessToken)
    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)
    const isVibrationEnabled = useSelector((state) => state.isVibrationEnabled)
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState("*************")
    const [confirmPassword, setConfirmPassword] = useState("*************")
    const [isLoading, setIsLoading] = useState(false)
    const [loaderTitle, setLoaderTitle] = useState("Please wait")
    const [uploadedImageUri, setUploadedImageUri] = useState('')
    const [imageName, setImageName] = useState('')
    const [userImage, setUserImage] = useState(userData.image)
    const [imageType, setImageType] = useState('')
    const [showAddImageModal, setShowAddImageModal] = useState(false)
    const [showCustomToast, setShowCustomToast] = useState(false)
    const [showErrorMessage, setShowErrorMessage] = useState(false)
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const current_session_id = useSelector((state) => state.current_session_id)
    const navigation = useNavigation()

    let options = {
        storageOptions: {
            skipBackup: true,
            path: 'images',
            mediaType: 'photo',
            includeBase64: true
        },
    };

    useEffect(() => {
        setFullName(userData.full_name)
        setEmail(userData.email)
    }, [userData])

    const onSavePress = async () => {
        if (fullName.trim() == '') {
            setErrorMessage("Name field is required")
            setShowErrorMessage(true)
        }
        else if (email.trim() == '' || !validateEmail(email.trim())) {
            setErrorMessage('Please enter a valid email')
            setShowErrorMessage(true)
        }
        else if (newPassword.trim() == '') {
            setErrorMessage('Password is required')
            setShowErrorMessage(true)
        }
        else if (newPassword.trim().length < 7) {
            setErrorMessage('Password should be greater than 7 digits')
            setShowErrorMessage(true)
        }
        else if (newPassword.trim() !== confirmPassword.trim()) {
            setErrorMessage('Both passwords do not match')
            setShowErrorMessage(true)
        }
        else {
            setIsLoading(true)
            setLoaderTitle('Updating your profile')
            let reqObj;
            uploadedImageUri ? reqObj = {
                full_name: fullName,
                email: email,
                password: newPassword.trim(),
                password_confirmation: confirmPassword.trim(),
                image: { uri: uploadedImageUri, name: imageName, type: imageType }
            }
                :
                reqObj = {
                    full_name: fullName,
                    email: email,
                    password: newPassword.trim(),
                    password_confirmation: confirmPassword.trim()
                }
            reqObj = apiHandler.createFormData(reqObj)
            let response = await apiHandler.updateUserProfile(reqObj, accessToken)
            let updatedUserDetails = response.user
            updatedUserDetails.full_name = fullName
            dispatch(setUserData(updatedUserDetails))
            setIsLoading(false)
            if (isVibrationEnabled) {
                Vibration.vibrate([0, 100, 60, 150])
            }
            setShowCustomToast(true)
        }
    }

    async function deleteUser() {
        setShowDeleteUserModal(false)
        setLoaderTitle('Deleting')
        setIsLoading(true)
        const response = await apiHandler.deleteUserAccount(accessToken, userData.id)
        setIsLoading(false)
        console.log('Delete API response is', response)
        if (response.success) {
            setShowDeleteConfirmation(true)
        }
    }

    async function onSignOutPress() {
        setIsLoading(true)
        setLoaderTitle('Logging you out')
        let isGoogleLogin = await GoogleSignin.isSignedIn();
        if (isGoogleLogin) {
            GoogleSignin.configure({
                androidClientId: '887856847210-qevj4lnpjt84q0sqppgted93lp1f1suf.apps.googleusercontent.com',
                iosClientId: '887856847210-br194482savpiontotn1d0kucuosbdct.apps.googleusercontent.com',
            });
            await GoogleSignin.revokeAccess()
        }
        let reqObj = {
            type: 'close',
            session_id: current_session_id
        }
        apiHandler.userSessionAPI(accessToken, reqObj)
        await helperFunctions.clearAccessToken()
        setIsLoading(false)
        dispatch(logoutUser())
    }

    const validateEmail = (mail) => {
        return String(mail)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
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
                onChangeImage()
            } else {
                setErrorMessage('Permission denied')
                setShowErrorMessage(true)
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const onCameraPress = async () => {
        ImagePicker.launchCamera(options, (response) => {
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
                setUploadedImageUri(response.assets[0].uri)
                setImageName(response.assets[0].fileName)
                setImageType(response.assets[0].type)
                setUserImage(response.assets[0].uri)
            }
        })
    }

    const onChangeImagePress = () => {
        Platform.OS == 'ios' ? onChangeImage() : requestCameraPermission()
    }

    const onGalleryPress = () => {
        ImagePicker.launchImageLibrary(options, (response) => {
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
                setImageName(response.assets[0].fileName)
                setImageType(response.assets[0].type)
                setUploadedImageUri(response.assets[0].uri)
                setUserImage(response.assets[0].uri)
            }
        })
    }

    const onImagePickerOptionSelect = (selectedOption) => {
        switch (selectedOption) {
            case 'camera':
                onCameraPress()
                break;
            case 'photo':
                onGalleryPress()
                break;
        }
    }

    const logoutAfterDelete = () => {
        helperFunctions.clearAccessToken().then((res) => {
            dispatch(logoutUser())
        })
    }

    const renderPickerIcon = (title, iconName) => {
        return iconName == '' ?
            <View style={styles.pickerContainer(currentThemePrimaryColor, iconName)}>
                <FontAwesome name={iconName} style={styles.pickerIcon} />
                <View style={styles.pickerInnerContainer(iconName)}>
                    <Text style={commonStyles.textWhite(19, { color: colors.appPrimary, fontWeight: '600', marginLeft: moderateScale(8) })}>
                        {title}
                    </Text>
                </View>
            </View>
            :
            <TouchableOpacity style={styles.pickerContainer(currentThemePrimaryColor, iconName)} onPress={() => {
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

    const onChangeImage = () => {
        setShowAddImageModal(true)
    }

    const onUpdateSettingsPress = () => {
        navigation.navigate(navigationStrings.UpdateSettings)
    }

    const showHideDeleteUserModal = () => {
        setShowDeleteUserModal(!showDeleteUserModal)
    }

    const onBackIconPress = () => {
        navigation.goBack()
    }

    return (
        <SafeAreaView style={[commonStyles.flexFull, { backgroundColor: currentThemePrimaryColor }]}>
            <CustomToast isVisible={showCustomToast} onToastShow={() => {
                setTimeout(() => {
                    setShowCustomToast(false)
                    navigation.goBack()
                }, 500)
            }} toastMessage={'Profile updated successfully'} />
            <CustomToast isVisible={showDeleteConfirmation} onToastShow={() => {
                setTimeout(() => {
                    setShowDeleteConfirmation(false)
                    logoutAfterDelete()
                }, 700)
            }} toastMessage={'Account deleted successfully'} />
            <ErrorComponent isVisible={showErrorMessage} onToastShow={() => {
                setTimeout(() => {
                    setShowErrorMessage(false)
                }, 1100)
            }} toastMessage={errorMessage} />
            <View style={commonStyles.screenContainer}>
                {isLoading && <LoadingComponent title={loaderTitle} />}
                <View style={styles.fullHeaderContainer}>
                    <Ionicons name='chevron-back-outline' style={styles.iconStyle(currentThemeSecondaryColor)} onPress={onBackIconPress} />
                    <Text style={commonStyles.textWhite(20, { color: currentThemeSecondaryColor, fontWeight: 'bold', alignSelf: 'center' })}>
                        Edit Profile
                    </Text>
                    <Text onPress={onSavePress} style={commonStyles.textWhite(16, { color: currentThemeSecondaryColor, fontWeight: '600', })}>
                        Save
                    </Text>
                </View>
                <ScrollView style={commonStyles.flexFull} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={styles.profileImageContainer(currentThemePrimaryColor)} onPress={onChangeImagePress}>
                        {/* <Image style={styles.profileImage} source={userData.image ? { uri: USER_PROFILE_BASE_URL + userData.image } : uploadedImageUri ? { uri: uploadedImageUri } : imagePath.dummyProfile} /> */}
                        <Image style={styles.profileImage} source={userData.image ? { uri: userImage } : uploadedImageUri ? { uri: uploadedImageUri } : imagePath.dummyProfile} />
                        <Entypo name='camera' color='#f1f1f1' size={18} style={styles.profileImageInnerIcon} />
                    </TouchableOpacity>
                    <Text style={commonStyles.textWhite(18, { alignSelf: 'center', color: currentThemeSecondaryColor, marginTop: moderateScale(4) })}>
                        {"Hi Foodie (" + userData?.full_name + ')'}
                    </Text>
                    <View style={styles.nameUnderline}></View>
                    <AuthTextInput customStyles={styles.nameInputContainer} placeholder={'Full Name'} value={fullName} onChangeText={(text) => { setFullName(text) }} />
                    <AuthTextInput customStyles={styles.emailInputContainer} isEditable={false} placeholder={'Email'} value={email} onChangeText={(text) => { setEmail(text) }} />
                    <AuthTextInput customStyles={styles.passwordInputContainer} placeholder={'New Password'} value={newPassword} onChangeText={(text) => {
                        if (text != " ") {
                            let updatedVal = text.trim()
                            setNewPassword(updatedVal)
                        }
                    }} />
                    <AuthTextInput customStyles={styles.confirmPasswordInputContainer} placeholder={'Confirm Password'} value={confirmPassword} onChangeText={(text) => {
                        if (text != " ") {
                            let updatedVal = text.trim()
                            setConfirmPassword(updatedVal)
                        }
                    }
                    } />
                    <TouchableOpacity style={styles.updateButton(currentThemeSecondaryColor)} onPress={onUpdateSettingsPress}>
                        <MaterialIcons name='app-settings-alt' style={styles.appSettingsIcon(currentThemePrimaryColor)} />
                        <View style={styles.updateSettingsInnerContainer}>
                            <Text style={commonStyles.textWhite(18, { fontWeight: '600', color: currentThemePrimaryColor })}>
                                Update app settings
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutButton(currentThemeSecondaryColor)} onPress={onSignOutPress}>
                        <Octicons name='sign-out' style={styles.logoutIcon(currentThemePrimaryColor)} />
                        <View style={styles.updateSettingsInnerContainer}>
                            <Text style={commonStyles.textWhite(18, { fontWeight: '600', color: currentThemePrimaryColor })}>
                                Logout
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton(currentThemeSecondaryColor)} onPress={showHideDeleteUserModal}>
                        <MaterialIcons name='delete-forever' style={styles.deleteIcon} />
                        <View style={styles.updateSettingsInnerContainer}>
                            <Text style={commonStyles.textWhite(18, { fontWeight: '600', color: currentThemePrimaryColor })}>
                                Delete your account
                            </Text>
                        </View>
                    </TouchableOpacity>
                    {/* <CommonButton onButtonPress={onSavePress} buttonTitle={'Save'} buttonStyle={styles.registerButton} textStyle={commonStyles.textWhite(18, { fontWeight: '700' })} /> */}
                </ScrollView>
            </View>
            <Modal visible={showAddImageModal} animationType='slide' transparent={true}>
                <View style={commonStyles.flexFull}>
                    <View style={styles.imageModalFullContainer(currentThemeSecondaryColor)}>
                        <View style={styles.imageModalInnerContainer}>
                            {renderPickerIcon('Select an option', '')}
                            {renderPickerIcon('Take a picture', 'camera')}
                            {renderPickerIcon('Choose from gallery', 'photo')}
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal transparent={true} visible={showDeleteUserModal} onRequestClose={showHideDeleteUserModal}>
                <View style={styles.likeModalContainer}>
                    <View style={styles.deleteModalInnerContainer}>
                        <Text style={commonStyles.textWhite(24, { color: colors.appPrimary, alignSelf: 'center', marginTop: 10 })}>
                            Are you sure you want to delete account?
                        </Text>
                        <View style={styles.deleteButtonsContainer}>
                            <TouchableOpacity onPress={deleteUser} style={styles.confirmButton}>
                                <Text style={commonStyles.textWhite(18)}>
                                    Delete
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={showHideDeleteUserModal} style={styles.cancelButton}>
                                <Text style={commonStyles.textWhite(18, { color: colors.appPrimary })}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    nameUnderline: {
        width: windowWidth * 0.6,
        height: moderateScale(0.7),
        backgroundColor: "lightgray",
        alignSelf: "center",
        marginTop: moderateScale(3),
        marginBottom: moderateScale(5)
    },
    registerButton: {
        width: windowWidth - moderateScale(20),
        alignSelf: 'center',
        paddingVertical: moderateScale(8),
        backgroundColor: colors.appPrimary,
        borderRadius: moderateScale(18),
        marginVertical: moderateScale(10),
        alignItems: 'center',
        justifyContent: 'center'
    },
    updateButton: (currentThemeSecondaryColor) => {
        return {
            width: windowWidth - moderateScale(20),
            alignSelf: 'center',
            flexDirection: 'row',
            paddingVertical: moderateScale(8),
            backgroundColor: currentThemeSecondaryColor,
            borderRadius: moderateScale(12),
            marginTop: moderateScale(16),
            alignItems: 'center',
        }
    },
    deleteButton: (currentThemeSecondaryColor) => {
        return {
            width: windowWidth - moderateScale(20),
            alignSelf: 'center',
            flexDirection: 'row',
            paddingVertical: moderateScale(8),
            backgroundColor: currentThemeSecondaryColor,
            borderRadius: moderateScale(12),
            marginTop: moderateScale(10),
            alignItems: 'center',
        }
    },
    logoutButton: (currentThemeSecondaryColor) => {
        return {
            width: windowWidth - moderateScale(20),
            alignSelf: 'center',
            flexDirection: 'row',
            paddingVertical: moderateScale(8),
            backgroundColor: currentThemeSecondaryColor,
            // backgroundColor: `${colors.appPrimary}aa`,
            borderRadius: moderateScale(12),
            marginTop: moderateScale(10),
            alignItems: 'center',
        }
    }
    ,
    profileImageContainer: (currentThemePrimaryColor) => {
        return { height: moderateScale(64), width: moderateScale(64), borderRadius: moderateScale(32), alignSelf: 'center', backgroundColor: currentThemePrimaryColor, justifyContent: 'center', alignItems: 'center' }
    },
    profileImage: { height: moderateScale(62), position: "absolute", width: moderateScale(62), borderRadius: moderateScale(31), overflow: 'hidden' },
    profileImageInnerIcon: {
        position: 'absolute',
        alignSelf: "center",
        bottom: 5,
        opacity: 0.6,
    },
    nameInputContainer: {
        marginTop: moderateScale(5),
        height: moderateScale(30),
        width: windowWidth - moderateScale(16),
        alignSelf: 'center',
        backgroundColor: colors.lightGrey,
        borderRadius: moderateScale(12),
        opacity: 0.8,
    },
    emailInputContainer: {
        marginTop: moderateScale(8),
        height: moderateScale(30),
        width: windowWidth - moderateScale(16),
        alignSelf: 'center',
        backgroundColor: colors.lightGrey,
        borderRadius: moderateScale(12),
        opacity: 0.8,
    },
    passwordInputContainer: {
        marginTop: moderateScale(8),
        height: moderateScale(30),
        width: windowWidth - moderateScale(16),
        alignSelf: 'center',
        backgroundColor: colors.lightGrey,
        borderRadius: moderateScale(12),
        opacity: 0.8,
    },
    confirmPasswordInputContainer: {
        marginTop: moderateScale(8),
        height: moderateScale(30),
        width: windowWidth - moderateScale(16),
        alignSelf: 'center',
        backgroundColor: colors.lightGrey,
        borderRadius: moderateScale(12),
        opacity: 0.8,
    },
    deleteIcon: {
        fontSize: moderateScale(12), color: '#aa0000', marginLeft: moderateScale(8)
    },
    appSettingsIcon: (currentThemePrimaryColor) => {
        return { fontSize: moderateScale(12), color: currentThemePrimaryColor, marginLeft: moderateScale(8) }
    },
    logoutIcon: (currentThemePrimaryColor) => {
        return { fontSize: moderateScale(12), color: currentThemePrimaryColor, marginLeft: moderateScale(8) }
    },
    updateSettingsInnerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginRight: moderateScale(8) },
    imageModalFullContainer: (currentThemeSecondaryColor) => {
        return { flex: 1, backgroundColor: `${currentThemeSecondaryColor}aa`, justifyContent: 'center', alignItems: 'center' }
    },
    imageModalInnerContainer: { height: windowHeight * 0.24, width: windowWidth * 0.8, backgroundColor: colors.appPrimary, borderRadius: moderateScale(8) },
    pickerContainer: (currentThemePrimaryColor, iconName) => {
        return { flex: 1, backgroundColor: currentThemePrimaryColor, borderWidth: 1, borderTopWidth: iconName == 'photo' || iconName == 'camera' ? 0 : 0.5, paddingHorizontal: moderateScale(8), borderColor: colors.appPrimary, flexDirection: 'row', alignItems: 'center' }
    },
    pickerIcon: { fontSize: 25, color: colors.appPrimary },
    pickerInnerContainer: (iconName) => {
        return { flex: 1, justifyContent: 'center', alignItems: iconName == '' ? 'center' : 'flex-start' }
    },
    likeModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0)' },
    deleteModalInnerContainer: { height: windowHeight * 0.25, width: windowWidth * 0.9, borderRadius: moderateScale(16), backgroundColor: colors.white, padding: moderateScale(12), borderWidth: moderateScale(0.7), borderColor: colors.appPrimary },
    deleteButtonsContainer: { flexDirection: 'row', marginTop: 30, width: '100%', justifyContent: 'space-between' },
    confirmButton: { width: '40%', justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: colors.appPrimary },
    cancelButton: { width: '40%', justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: colors.white, borderColor: colors.appPrimary, borderWidth: 1 },
    fullHeaderContainer: {
        width: windowWidth - moderateScale(16),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'center',
        alignItems: 'center',
        marginTop: moderateScale(2),
        height: moderateScale(25),
    },
    iconStyle: (currentThemeSecondaryColor) => {
        return {
            fontSize: moderateScale(18),
            color: currentThemeSecondaryColor
        }
    },

})