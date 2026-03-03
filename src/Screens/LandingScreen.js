import React, { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  Image,
  StyleSheet,
  SafeAreaView,
  Text,
  View,
  Vibration,
  PermissionsAndroid,
  Alert,
  Linking,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import CommonButton from "../Components/CommonButton";
import { colors } from "../Constants/colors";
import { commonStyles } from "../Constants/commonStyles";
import {
  moderateScale,
  VIBRATION_PATTERN,
  windowHeight,
  windowWidth,
} from "../Constants/globalConstants";
import { imagePath } from "../Constants/imagePath";
import { navigationStrings } from "../Navigation/NavigationStrings";
import Carousel from "react-native-snap-carousel";
import Geolocation from "@react-native-community/geolocation";
import { setLocation } from "../Redux/actions/actions";

export default function LandingScreen(props) {
  const isDarkModeActive = useSelector((state) => state.isDarkModeActive);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );
  const dispatch = useDispatch();

  const slideData = [
    {
      id: 0,
      imageSource: imagePath.landingPageImage,
      text: "Explore the best rated places",
    },
    {
      id: 1,
      imageSource: imagePath.landingPage2,
      text: "Using proprietary tech to deliver you the best experience",
    },
    {
      id: 2,
      imageSource: imagePath.landingPage1,
      text: "Let's search now",
    },
  ];

  const getLocation = () => {
    const tryGetLocation = async (useHighAccuracy = true) => {
      // 1. Check for cached location first
      const cachedLocation = await helperFunctions.getCachedLocation();
      if (cachedLocation) {
        console.log("📍 LandingScreen: Found cached location:", cachedLocation);
        dispatch(setLocation(cachedLocation));
        // Still try to get fresh location but maybe non-blocking? 
        // For now, if cache exists, we consider it a success for initial view.
      }

      console.log(`📍 LandingScreen: Attempting location fetch (HighAccuracy: ${useHighAccuracy})`);
      
      const timeoutId = setTimeout(() => {
        console.log("⏰ LandingScreen: Location fetch timed out, trying low accuracy...");
        if (useHighAccuracy) {
          tryGetLocation(false);
        } else {
          showLocationErrorAlert("We couldn't fetch your location. Please check your GPS settings and try again.", () => tryGetLocation(true));
        }
      }, 10000);

      Geolocation.getCurrentPosition(
        (info) => {
          clearTimeout(timeoutId);
          const coordinates = {
            latitude: info.coords.latitude,
            longitude: info.coords.longitude,
          };
          console.log("📍 LandingScreen: Got fresh location:", coordinates);
          dispatch(setLocation(coordinates));
          helperFunctions.saveCachedLocation(coordinates);
        },
        (err) => {
          clearTimeout(timeoutId);
          console.log("⚠️ LandingScreen: Location error:", err);
          if (useHighAccuracy) {
            console.log("🔄 LandingScreen: High accuracy failed, retrying with low accuracy...");
            tryGetLocation(false);
          } else {
            // Only show error if no cached location exists
            if (!cachedLocation) {
              if (err.code === 1) {
                showPermissionDeniedAlert(() => tryGetLocation(true));
              } else {
                showLocationErrorAlert("We couldn't fetch your location. Try again?", () => tryGetLocation(true));
              }
            } else {
              console.log("⏸️ LandingScreen: GPS failed but using cached location.");
            }
          }
        },
        {
          enableHighAccuracy: useHighAccuracy,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    const showPermissionDeniedAlert = (retryFn) => {
      Alert.alert(
        "Location Required",
        "Nearby restaurants require location permission. Please enable it in settings to continue.",
        [
          { text: "Retry", onPress: () => retryFn() },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
        { cancelable: false }
      );
    };

    const showLocationErrorAlert = (message, retryFn) => {
      Alert.alert(
        "Location Error",
        message,
        [
          { text: "Retry", onPress: () => retryFn() },
        ],
        { cancelable: false }
      );
    };
    
    tryGetLocation(true);
  };

  const requestLocationPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "MyMapApp needs access to your location",
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getLocation();
      } else {
        console.log("Location permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const navigation = useNavigation();

  function renderSlides({ item, index }) {
    return (
      <View style={commonStyles.flexFull}>
        <Image
          source={item.imageSource}
          style={styles.slideImage}
          resizeMode="stretch"
        />
        <Text
          style={commonStyles.textWhite(28, {
            marginTop: moderateScale(10),
            color: currentThemeSecondaryColor,
            alignSelf: "center",
            textAlign: "center",
          })}
        >
          {item.text}
        </Text>
      </View>
    );
  }

  function onNextPress() {
    navigation.replace(navigationStrings.AuthBottomNavigation);
  }

  return (
    <SafeAreaView
      style={[
        commonStyles.flexFull,
        { backgroundColor: currentThemePrimaryColor },
      ]}
    >
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
          keyExtractor={(item, index) => `slide-${item.id}-${index}`}
        />
      </View>
      <CommonButton
        buttonTitle={"Next"}
        onButtonPress={onNextPress}
        buttonStyle={styles.nextButton}
        textStyle={commonStyles.textWhite(18, { fontWeight: "600" })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  slideImage: {
    height: windowHeight * 0.5,
    width: windowWidth * 0.7,
    alignSelf: "center",
  },
  sliderContainer: { paddingTop: moderateScale(20), flex: 1 },
  nextButton: {
    width: windowWidth - moderateScale(20),
    alignSelf: "center",
    paddingVertical: moderateScale(8),
    backgroundColor: colors.appPrimary,
    borderRadius: moderateScale(12),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
});
