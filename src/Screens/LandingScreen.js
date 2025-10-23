import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Image, StyleSheet, SafeAreaView, Text, View, Vibration, PermissionsAndroid } from 'react-native';
import { useSelector } from 'react-redux';
import CommonButton from '../Components/CommonButton';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
import { moderateScale, VIBRATION_PATTERN, windowHeight, windowWidth } from '../Constants/globalConstants';
import { imagePath } from '../Constants/imagePath';
import { navigationStrings } from '../Navigation/NavigationStrings';
import Carousel from 'react-native-snap-carousel';
import Geolocation from '@react-native-community/geolocation';
import { setLocation } from '../Redux/actions/actions';

export default function LandingScreen(props) {

    const isDarkModeActive = useSelector((state) => state.isDarkModeActive)
    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)

    const slideData = [
        {
            id: 0,
            imageSource: imagePath.landingPageImage,
            text: 'Explore the best rated places',
        },
        {
            id: 1,
            imageSource: imagePath.landingPage2,
            text: 'Using proprietary tech to deliver you the best experience',
        },
        {
            id: 2,
            imageSource: imagePath.landingPage1,
            text: "Let's search now",
        }
    ]

    const getLocation = () => {
        Geolocation.getCurrentPosition(info => {
            var coordinates = {
                latitude: info.coords.latitude,
                longitude: info.coords.longitude
            }
            dispatch(setLocation(coordinates))
        }, err => { console.log('Error is', err) }, {
            enableHighAccuracy: false,
            timeout: 2000,
            maximumAge: 3600000
        });
    }

    const requestLocationPermissions = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    'title': 'Location Permission',
                    'message': 'MyMapApp needs access to your location'
                }
            )
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                getLocation()
            } else {
                console.log("Location permission denied")
            }
        } catch (err) {
            console.warn(err)
        }
    }

    const navigation = useNavigation()

    function renderSlides({ item, index }) {
        return <View style={commonStyles.flexFull}>
            <Image source={item.imageSource} style={styles.slideImage} resizeMode='stretch' />
            <Text style={commonStyles.textWhite(28, { marginTop: moderateScale(10), color: currentThemeSecondaryColor, alignSelf: 'center', textAlign: 'center' })}>
                {item.text}
            </Text>
        </View>
    }

    function onNextPress() {
        navigation.replace(navigationStrings.AuthBottomNavigation)
    }


    return (
        <SafeAreaView style={[commonStyles.flexFull, { backgroundColor: currentThemePrimaryColor }]}>
            <View style={styles.sliderContainer}>
                <Carousel
                    data={slideData}
                    renderItem={renderSlides}
                    sliderWidth={windowWidth}
                    itemWidth={windowWidth}
                    autoplay={true}
                    loop={true}
                    autoplayInterval={3000}
                    scrollEnabled={false}
                />
            </View>
            <CommonButton buttonTitle={'Next'} onButtonPress={onNextPress} buttonStyle={styles.nextButton} textStyle={commonStyles.textWhite(18, { fontWeight: '600' })} />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    slideImage: {
        height: windowHeight * 0.5,
        width: windowWidth * 0.7,
        alignSelf: 'center'
    },
    sliderContainer: { paddingTop: moderateScale(20), flex: 1 },
    nextButton: {
        width: windowWidth - moderateScale(20),
        alignSelf: 'center',
        paddingVertical: moderateScale(8),
        backgroundColor: colors.appPrimary,
        borderRadius: moderateScale(12),
        marginTop: moderateScale(10),
        marginBottom: moderateScale(10),
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99
    }
})