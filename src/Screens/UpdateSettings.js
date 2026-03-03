import React, { useEffect, useState } from "react";
import { FlatList, Image, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import AuthHeader from "../Components/AuthHeader";
import LoadingComponent from "../Components/LoadingComponent";
import { commonStyles } from "../Constants/commonStyles";
import { moderateScale, windowWidth } from "../Constants/globalConstants";
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { colors } from "../Constants/colors";
import { enableDarkModeAutoUpdate, toggleDarkMode, updateVibrationSettings } from "../Redux/actions/actions";
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useNavigation } from "@react-navigation/native";
import { helperFunctions } from "../Constants/helperFunctions";
import { apiHandler } from "../Constants/apiHandler";
import CustomToast from "../Components/CustomToast";
import ErrorComponent from "../Components/ErrorComponent";

export default function UpdateSettings(props) {

    const appSettings = [{
        id: 0,
        name: 'Dark Mode',
        description: 'Select if you want the application to work in Dark Mode.'
    },
    {
        id: 1,
        name: 'Auto-toggle dark mode',
        description: 'If selected, the application automatically goes to Dark Mode from (20:00-8:00)'
    },
    {
        id: 2,
        name: 'Enable Vibrations',
        description: 'If selected, haptic feedbacks on various events.'
    }]

    const accessToken = useSelector((state) => state.accessToken)
    const isDarkModeActive = useSelector((state) => state.isDarkModeActive)
    const autoUpdateDarkMode = useSelector((state) => state.autoUpdateDarkMode)
    const isVibrationEnabled = useSelector((state) => state.isVibrationEnabled)
    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)

    const dispatch = useDispatch()

    useEffect(() => {
        let arrSelectedOptions = []
        if (isDarkModeActive) {
            arrSelectedOptions.push(appSettings[0])
        }
        if (autoUpdateDarkMode) {
            arrSelectedOptions.push(appSettings[1])
        }
        if (isVibrationEnabled) {
            arrSelectedOptions.push(appSettings[2])
        }
        setSelectedOptions(arrSelectedOptions)
        // Update local state when Redux state changes
        setDarkModeState(isDarkModeActive)
        setAutoToggleDarkMode(autoUpdateDarkMode)
        setVibrationsEnabled(isVibrationEnabled)
    }, [isDarkModeActive, autoUpdateDarkMode, isVibrationEnabled])

    const [isLoading, setIsLoading] = useState(false)
    const [loaderTitle, setLoaderTitle] = useState("")
    const [selectedOptions, setSelectedOptions] = useState([])
    const [showErrorMessage, setShowErrorMessage] = useState(false)
    const [showCustomToast, setShowCustomToast] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [darkModeState, setDarkModeState] = useState(isDarkModeActive)
    const [autoToggleDarkMode, setAutoToggleDarkMode] = useState(autoUpdateDarkMode)
    const [vibrationsEnabled, setVibrationsEnabled] = useState(isVibrationEnabled)

    const navigation = useNavigation()

    const onSingleOptionPress = (item) => {
        let arrSelectedOptions = [...selectedOptions]
        if (arrSelectedOptions && arrSelectedOptions.length > 0 && arrSelectedOptions.findIndex((innerItem, innerIndex) => {
            return innerItem.id == item.id
        }) != -1) {
            arrSelectedOptions = arrSelectedOptions.filter((optionItem, optionIndex) => {
                return item.id != optionItem.id
            })
        }
        else {
            arrSelectedOptions.push(item)
        }
        switch (item.id) {
            case 0:
                setDarkModeState(!darkModeState)
                break;
            case 1:
                setAutoToggleDarkMode(!autoToggleDarkMode)
                break;
            case 2:
                setVibrationsEnabled(!vibrationsEnabled)
                break;
        }
        setSelectedOptions(arrSelectedOptions)
    }

    const renderSingleSetting = ({ item, index }) => {
        let isOptionSelected = false;
        switch (item.id) {
            case 0:
                isOptionSelected = darkModeState;
                break;
            case 1:
                isOptionSelected = autoToggleDarkMode;
                break;
            case 2:
                isOptionSelected = vibrationsEnabled;
                break;
        }
        return (
            <TouchableOpacity 
                style={styles.singleSettingContainer} 
                onPress={() => onSingleOptionPress(item)}
            >
                <View style={styles.singleSettingInnerContainer}>
                    <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor, fontWeight: '700' })}>
                        {item.name}
                    </Text>
                    <Text style={commonStyles.textWhite(14, { color: currentThemeSecondaryColor, fontWeight: '600', opacity: 0.8 })}>
                        {item.description}
                    </Text>
                </View>
                <FontAwesome 
                    name={isOptionSelected ? 'toggle-on' : 'toggle-off'} 
                    color={isOptionSelected ? colors.appPrimary : colors.grey} 
                    style={{ fontSize: 35 }} 
                />
            </TouchableOpacity>
        );
    }

    const onSaveSettingsPress = async () => {
        setIsLoading(true)
        setLoaderTitle("Updating app settings")
        try {
            let reqObj = {
                dark: darkModeState ? 'true' : 'false',
                toggle: autoToggleDarkMode ? 'true' : 'false',
                vibrations: vibrationsEnabled ? 'true' : 'false'
            }
            await apiHandler.saveUserInAppSettings(accessToken, reqObj)
            dispatch(toggleDarkMode(darkModeState))
            dispatch(enableDarkModeAutoUpdate(autoToggleDarkMode))
            dispatch(updateVibrationSettings(vibrationsEnabled))
            setIsLoading(false)
            setShowCustomToast(true)
        } catch (error) {
            console.log('Error is', error)
            setIsLoading(false)
            setErrorMessage('Error updating settings')
            setShowErrorMessage(true)
        }
    }

    const onBackIconPress = () => {
        navigation.goBack()
    }

    return (
        <SafeAreaView style={styles.fullScreenContainer(currentThemePrimaryColor)}>
            {isLoading && <LoadingComponent title={loaderTitle} />}
            <CustomToast isVisible={showCustomToast} onToastShow={() => {
                setTimeout(() => {
                    setShowCustomToast(false)
                    navigation.goBack()
                }, 900)
            }} toastMessage={'Settings updated successfully'} />
            <ErrorComponent isVisible={showErrorMessage} onToastShow={() => {
                setTimeout(() => {
                    setShowErrorMessage(false)
                }, 1100)
            }} toastMessage={errorMessage} />
            <View style={[commonStyles.screenContainer, { backgroundColor: currentThemePrimaryColor }]}>
                <View style={styles.fullHeaderContainer}>
                    <Ionicons name='chevron-back-outline' style={styles.iconStyle(currentThemeSecondaryColor)} onPress={onBackIconPress} />
                    <Text style={commonStyles.textWhite(20, { color: currentThemeSecondaryColor, fontWeight: 'bold', alignSelf: 'center' })}>
                        App settings
                    </Text>
                    <TouchableOpacity onPress={onSaveSettingsPress}>
                        <Text style={commonStyles.textWhite(16, { color: colors.appPrimary, fontWeight: '700', })}>
                            Save changes
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={[commonStyles.fullScreenContainer, { backgroundColor: currentThemePrimaryColor, paddingHorizontal: moderateScale(10) }]}>
                    <FlatList
                        data={appSettings}
                        renderItem={renderSingleSetting}
                        keyExtractor={(item) => {
                            return item.id.toString()
                        }} 
                        ListFooterComponent={() => (
                            <TouchableOpacity 
                                style={styles.saveButton} 
                                onPress={onSaveSettingsPress}
                            >
                                <Text style={commonStyles.textWhite(18, { fontWeight: '700' })}>
                                    Save changes
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    fullScreenContainer: (currentThemePrimaryColor) => {
        return {
            flex: 1,
            backgroundColor: currentThemePrimaryColor
        }
    },
    singleSettingContainer: {
        paddingVertical: moderateScale(10),
        width: '100%',
        flexDirection: 'row'
    },
    singleSettingInnerContainer: {
        flex: 1
    },
    fullHeaderContainer: {
        width: windowWidth - moderateScale(20),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'center',
        alignItems: 'center',
        marginTop: moderateScale(6),
        height: moderateScale(25),
    },
    iconStyle: (currentThemeSecondaryColor) => {
        return {
            fontSize: moderateScale(18),
            color: currentThemeSecondaryColor
        }
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    saveButton: {
        backgroundColor: colors.appPrimary,
        paddingVertical: moderateScale(12),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        marginTop: moderateScale(20),
        marginBottom: moderateScale(40),
    }
})