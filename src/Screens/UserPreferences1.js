import React, { useState } from 'react';
import { FlatList, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
import { CATEGORY_IMAGES_BASE_URL, errorVibrationPattern, moderateScale, searchVibrationPattern, windowHeight, windowWidth } from '../Constants/globalConstants';
import { useDispatch, useSelector } from 'react-redux';
import { apiHandler } from '../Constants/apiHandler';
import LoadingComponent from '../Components/LoadingComponent';
import { useNavigation } from '@react-navigation/native';
import { savePostsRadius, setIsNewUser, setLoadNewPosts, updateFoodCategories } from '../Redux/actions/actions';
import { navigationStrings } from '../Navigation/NavigationStrings';
import { useEffect } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { helperFunctions } from '../Constants/helperFunctions';
import CustomToast from '../Components/CustomToast';
import AppIntroSlider from 'react-native-app-intro-slider';
import ErrorComponent from '../Components/ErrorComponent';

export default function UserPreferences1(props) {

    const dispatch = useDispatch()
    const navigation = useNavigation()

    const accessToken = useSelector((state) => state.accessToken)
    const foodCategories = useSelector((state) => state.foodCategories)
    const isVibrationEnabled = useSelector((state) => state.isVibrationEnabled)
    const [selectedCategories, setSelectedCategories] = useState([])
    const [displayedFoodCategories, setDisplayedFoodCategories] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showCustomToast, setShowCustomToast] = useState(false)
    const [showErrorMessage, setShowErrorMessage] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const isDarkModeActive = useSelector((state) => state.isDarkModeActive)

    useEffect(() => {
        getSavedCategories()
    }, [])

    const getSavedCategories = async () => {
        setIsLoading(true)
        let displayedData = helperFunctions.transformArray(foodCategories)
        setDisplayedFoodCategories(displayedData)
        dispatch(savePostsRadius(20))
        setIsLoading(false)
    }

    async function onSavePress() {
        if (selectedCategories.length == 0) {
            setShowErrorMessage(true)
            setErrorMessage('No category selected..!!!')
            if (isVibrationEnabled) {
                Vibration.vibrate(errorVibrationPattern)
            }
        }
        else {
            let arrSelectedCategories = [...selectedCategories]
            arrSelectedCategories = arrSelectedCategories.map((item, index) => {
                return item.id
            })
            setIsLoading(true)
            let reqObj = {
                "category_id": arrSelectedCategories,
                "radius": 20
            }
            try {
                await apiHandler.saveUserPreference(reqObj, accessToken)
                dispatch(savePostsRadius(20))
                dispatch(updateFoodCategories(selectedCategories))
                setIsLoading(false)
                setShowCustomToast(true)
                dispatch(setLoadNewPosts(true))
                if (isVibrationEnabled) {
                    Vibration.vibrate(searchVibrationPattern)
                }
                dispatch(setIsNewUser(false))
                navigation.replace(navigationStrings.BottomTabNavigation)
            }
            catch (error) {
                setIsLoading(false)
                alert(error.message)
            }
        }
    }

    function onSingleCategoryPress(category) {
        if (isVibrationEnabled) {
            Vibration.vibrate([0, 50, 70, 100])
        }
        let arrSelectedCategories = [...selectedCategories]
        if (arrSelectedCategories && arrSelectedCategories.length > 0 && helperFunctions.findElement(arrSelectedCategories, category)) {
            arrSelectedCategories = arrSelectedCategories.filter((item, index) => {
                return item.id !== category.id
            })
        }
        else {
            arrSelectedCategories.push(category)
        }
        setSelectedCategories(arrSelectedCategories)
    }

    function renderFoodCategory({ item, index }) {
        return <ImageBackground key={index} resizeMode='stretch' source={{ uri: CATEGORY_IMAGES_BASE_URL + item.image }} style={{ height: windowHeight * 0.15, width: windowWidth * 0.5 - moderateScale(16), overflow: 'hidden', marginLeft: index % 2 != 0 ? moderateScale(8) : 0, marginTop: moderateScale(8), borderRadius: 12, borderWidth: selectedCategories && selectedCategories.length > 0 && helperFunctions.findElement(selectedCategories, item) ? 1.5 : 0, borderWidth: selectedCategories && selectedCategories.length > 0 && helperFunctions.findElement(selectedCategories, item) ? 1.5 : 0, borderColor: '#2AB13C', opacity: selectedCategories && selectedCategories.length > 0 && helperFunctions.findElement(selectedCategories, item) ? 0.5 : 1 }}>
            <TouchableOpacity onPress={() => { onSingleCategoryPress(item) }} style={{ flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={commonStyles.textWhite(16, { fontWeight: 'bold' })}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        </ImageBackground >
    }

    const renderSingleCard = () => {
        return <View style={styles.foodItemsContainer}>
            <FlatList
                data={foodCategories}
                renderItem={renderFoodCategory}
                showsVerticalScrollIndicator={false}
                numColumns={2} />
        </View>
    }

    const onSlideChange = () => {
        if (isVibrationEnabled) {
            Vibration.vibrate()
        }
    }

    const onSkipNowPress = () => {
        dispatch(setIsNewUser(false))
        navigation.replace(navigationStrings.BottomTabNavigation)
    }

    return (
        <SafeAreaView style={[commonStyles.flexFull, { backgroundColor: colors.appPrimary }]}>
            <CustomToast isVisible={showCustomToast} onToastShow={() => {
                setTimeout(() => {
                    setShowCustomToast(false)
                    navigation.navigate(navigationStrings.BottomTabNavigation)
                }, 900)
            }} toastMessage={'Categories saved successfully'} />
            <ErrorComponent isVisible={showErrorMessage} onToastShow={() => {
                setTimeout(() => {
                    setShowErrorMessage(false)
                }, 1100)
            }} toastMessage={errorMessage} />
            <View style={commonStyles.fullScreenContainer}>
                {isLoading && <LoadingComponent title={'Getting saved preferences'} />}
                <TouchableOpacity onPress={onSkipNowPress} style={{ alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row' }}>
                    <Text style={commonStyles.textWhite(24, { color: colors.white, alignSelf: 'center', marginRight: moderateScale(4) })}>
                        Skip
                    </Text>
                    <FontAwesome name='arrow-right' style={{ fontSize: moderateScale(10), color: colors.white }} />
                </TouchableOpacity>
                <Text style={commonStyles.textWhite(24, { color: colors.white, alignSelf: 'center', marginTop: moderateScale(20) })}>
                    Let's choose
                </Text>
                <Text style={commonStyles.textWhite(18, { color: colors.white, alignSelf: 'center', marginTop: moderateScale(2) })}>
                    your favorite food genres
                </Text>
                <View style={[commonStyles.flexFull, { marginVertical: moderateScale(10) }]}>
                    {renderSingleCard()}
                    {/* <AppIntroSlider
                            data={displayedFoodCategories}
                            renderItem={renderSingleCard}
                            activeDotStyle={{ backgroundColor: colors.black, height: moderateScale(8), width: moderateScale(8), borderRadius: moderateScale(4), marginTop: moderateScale(55) }}
                            dotStyle={{ backgroundColor: colors.white, height: moderateScale(8), width: moderateScale(8), borderRadius: moderateScale(4), marginTop: moderateScale(55) }}
                            onSlideChange={onSlideChange}
                            renderDoneButton={() => {
                                return <View />
                            }}
                            renderNextButton={() => {
                                return <View />
                            }}
                        /> */}
                </View>
                <TouchableOpacity style={styles.saveButtonContainer} onPress={onSavePress}>
                    <Text style={commonStyles.textWhite(18, { fontWeight: '600', marginLeft: moderateScale(8), color: colors.appPrimary })}>
                        Begin
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView >
    )
}

const styles = StyleSheet.create({
    randomButton: (isLoadRandomPosts) => {
        return {
            flexDirection: 'row',
            alignSelf: 'center',
            paddingVertical: moderateScale(8),
            paddingHorizontal: moderateScale(12),
            backgroundColor: isLoadRandomPosts ? "#7a7a7a" : colors.appPrimary,
            borderRadius: moderateScale(20),
            marginTop: moderateScale(10),
            alignItems: 'center'
        }
    },
    distanceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: windowWidth - moderateScale(20),
        alignSelf: 'center',
        marginTop: moderateScale(8)
    },
    singleContainer: {
        alignItems: 'center'
    },
    singlePinContainer: (currentColor) => {
        return {
            fontSize: 20,
            color: currentColor
        }
    },
    sliderContainer: {
        marginTop: -moderateScale(5),
        width: windowWidth - moderateScale(25),
        alignSelf: 'center'
    },
    foodItemsContainer: {
        minHeight: moderateScale(100),
        width: windowWidth - moderateScale(20)
    },
    searchModalFullContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: `${colors.black}22` },
    searchModalInnerContainer: (currentThemePrimaryColor) => {
        return { height: 0.6 * windowHeight, width: windowWidth, backgroundColor: currentThemePrimaryColor, borderTopLeftRadius: moderateScale(12), borderTopRightRadius: moderateScale(12), padding: moderateScale(10) }
    },
    closeIcon: { fontSize: 30, color: colors.appPrimary, alignSelf: 'flex-end' },
    visitNowButton: {
        alignSelf: 'center',
        paddingVertical: moderateScale(8),
        paddingHorizontal: moderateScale(24),
        backgroundColor: colors.appPrimary,
        borderRadius: 12,
        marginVertical: moderateScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleFullContainer: { flexDirection: 'row', width: windowWidth - moderateScale(20), alignItems: 'center' },
    titleInnerContainer: { flex: 1, alignItems: 'center' },
    searchIcon: { color: colors.appPrimary, fontSize: 30 },
    randomButtonIcon: { fontSize: moderateScale(10), color: colors.white, marginLeft: moderateScale(12) },
    saveButtonContainer: {
        width: windowWidth - moderateScale(20),
        alignSelf: 'center',
        paddingVertical: moderateScale(8),
        backgroundColor: colors.white,
        borderRadius: moderateScale(8),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: moderateScale(10),
        flexDirection: 'row'
    }
})