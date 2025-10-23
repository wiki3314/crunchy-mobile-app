import React, { useState } from 'react';
import { ImageBackground, StyleSheet, Text, SafeAreaView, View, ScrollView } from 'react-native';
import AuthHeader from '../Components/AuthHeader';
import AuthTextInput from '../Components/AuthTextInput';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
import { moderateScale, windowHeight, windowWidth } from '../Constants/globalConstants';
import { imagePath } from '../Constants/imagePath';
import AntDesign from 'react-native-vector-icons/AntDesign'
import { useNavigation } from '@react-navigation/native';
import CommonButton from '../Components/CommonButton';
import { apiHandler } from '../Constants/apiHandler';
import { useSelector } from 'react-redux';
import CustomToast from '../Components/CustomToast';
import ErrorComponent from '../Components/ErrorComponent';
import LoadingComponent from '../Components/LoadingComponent';

export default function ForgotPassword(props) {

    const [email, setEmail] = useState('')
    const isDarkModeActive = useSelector((state) => state.isDarkModeActive)
    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)
    const navigation = useNavigation()

    const [isLoading, setIsLoading] = useState(false)
    const [showErrorMessage, setShowErrorMessage] = useState(false)
    const [showCustomToast, setShowCustomToast] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const onEmailChange = (text) => {
        setEmail(text)
    }

    const renderEmailIcon = () => {
        return <AntDesign name='mail' style={styles.inputIcon} />
    }

    const validateEmail = (mail) => {
        return String(mail)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    }

    const onSendPress = async () => {
        if (validateEmail(email)) {
            setIsLoading(true)
            let reqObj = {
                email: email
            }
            await apiHandler.forgotPassword(reqObj)
            setIsLoading(false)
            setShowCustomToast(true)
        }
        else {
            setErrorMessage('Please enter a valid email address')
            setShowErrorMessage(true)
        }
    }

    return (
        <SafeAreaView style={[commonStyles.flexFull, { backgroundColor: currentThemePrimaryColor }]}>
            <View style={commonStyles.screenContainer}>
                <CustomToast isVisible={showCustomToast} onToastShow={() => {
                    setTimeout(() => {
                        setShowCustomToast(false)
                    }, 500)
                }} toastMessage={'Link sent successfully'} />
                <ErrorComponent isVisible={showErrorMessage} onToastShow={() => {
                    setTimeout(() => {
                        setShowErrorMessage(false)
                    }, 1100)
                }} toastMessage={errorMessage} />
                <LoadingComponent title={'Sending email'} />
                <ImageBackground style={commonStyles.flexFull} source={isDarkModeActive ? imagePath.darkSplashBG : imagePath.splashBG}>
                    <ScrollView>
                        <AuthHeader />
                        <Text style={commonStyles.textWhite(24, { color: currentThemeSecondaryColor, alignSelf: 'center', marginTop: moderateScale(10), fontWeight: 'bold' })}>
                            Forgot Password?
                        </Text>
                        <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor, alignSelf: 'center', paddingHorizontal: 20, textAlign: "center", marginTop: moderateScale(5) })}>
                            Please enter your email to receive a link to create
                            a new password via email
                        </Text>
                        <AuthTextInput customStyles={{
                            marginTop: moderateScale(20),
                            shadowColor: "#000",
                            shadowOffset: {
                                width: 0,
                                height: 2,
                            },
                            shadowOpacity: 0.23,
                            shadowRadius: 2.62,
                            elevation: 4,
                        }} placeholder={'Email'} value={email} onChangeText={(text) => { onEmailChange(text) }} icon={renderEmailIcon} />
                        <CommonButton onButtonPress={onSendPress} buttonTitle={'Send'} buttonStyle={styles.sendButton} textStyle={commonStyles.textWhite(18, { fontWeight: '700' })} />
                    </ScrollView>
                </ImageBackground>
            </View>
        </SafeAreaView >
    )
}

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',

    },
    logoImage: {
        height: windowHeight * 0.3,
        width: windowWidth * 0.8
    },
    inputIcon: {
        color: colors.black,
        fontSize: 25
    },
    rememberMeIcon: (bool) => {
        return {
            color: bool ? colors.appPrimary : colors.black,
            fontSize: 25
        }
    },
    sendButton: {
        width: windowWidth * 0.9,
        alignSelf: 'center',
        paddingVertical: moderateScale(8),
        backgroundColor: colors.appPrimary,
        borderRadius: 24,
        marginTop: moderateScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    }
})