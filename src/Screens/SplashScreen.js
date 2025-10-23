import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "@react-native-community/geolocation";
import { firebase } from "@react-native-firebase/dynamic-links";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { useRef } from "react";
import {
  AppState,
  ImageBackground,
  PermissionsAndroid,
  SafeAreaView,
  StyleSheet,
  Vibration,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import LoadingComponent from "../Components/LoadingComponent";
import { apiHandler } from "../Constants/apiHandler";
import { commonStyles } from "../Constants/commonStyles";
import {
  userSuccessPattern,
  windowHeight,
  windowWidth,
} from "../Constants/globalConstants";
import { helperFunctions } from "../Constants/helperFunctions";
import { imagePath } from "../Constants/imagePath";
import { navigationStrings } from "../Navigation/NavigationStrings";
import {
  enableDarkModeAutoUpdate,
  setAccessToken,
  setAdminAdvertisements,
  setCurrentSessionId,
  setFavoriteRestaurants,
  setFavouritePlaces,
  setFoodCategories,
  setIsNewUser,
  setLikedPosts,
  setLocation,
  setReceivedPost,
  setUserData,
  toggleDarkMode,
  updateVibrationSettings,
} from "../Redux/actions/actions";

export default function SplashScreen(props) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    getInitialData();
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [loaderTitle, setLoaderTitle] = useState("Please wait");

  function generateUsername() {
    let result = "User";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 9) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  const getInitialData = async () => {
    let token = await helperFunctions.getAccessToken();
    if (token) {
      setIsLoading(true);
      setLoaderTitle("Connecting to server...");
      try {
        let userData = await apiHandler.getUserData(token);
        console.log("A");
        let userSavedAppSettings = userData?.app_settings;
        let categories = await apiHandler.getAllCategories(token);
        console.log("B");
        let adminAdvertisements = await apiHandler.getAdminPanelAdvertisements(
          token
        );
        console.log("C");

        // Default to light mode (white background) for new users
        let isDarkMode = userSavedAppSettings?.dark_mode === "true";
        let isToggleDarkMode = userSavedAppSettings?.toggledark_mode === "true";
        let isVibrationEnabled = userSavedAppSettings?.vibrations !== "false";

        console.log("DHDHDH");
        let likedInAppPosts = await apiHandler.getFavoriteRestaurants(token);
        console.log("D");
        let googlePosts = await apiHandler.getGoogleLikedPosts(token);
        console.log("E");
        let favoriteRestaurants = await apiHandler.getLikedRestaurants(token);
        console.log("F");
        favoriteRestaurants = favoriteRestaurants.map((item, index) => {
          return {
            restaurantName: item.restaurant_name,
            restaurantImage: item.image,
            restaurant_id: item.restaurant_id,
          };
        });
        dispatch(setLikedPosts(likedInAppPosts));
        dispatch(setFavouritePlaces(googlePosts));
        dispatch(setFavoriteRestaurants(favoriteRestaurants));
        dispatch(setFoodCategories(categories));
        dispatch(setAdminAdvertisements(adminAdvertisements));
        dispatch(toggleDarkMode(isDarkMode));
        dispatch(enableDarkModeAutoUpdate(isToggleDarkMode));
        dispatch(updateVibrationSettings(isVibrationEnabled));
        dispatch(setUserData(userData));
        dispatch(setAccessToken(token));
        setIsLoading(false);
      } catch (error) {
        console.log("Error loading user data:", error);
        setIsLoading(false);
        navigation.replace(navigationStrings.LandingScreen);
      }
    } else {
      // No saved token - go to landing screen
      navigation.replace(navigationStrings.LandingScreen);
    }
  };

  return (
    <SafeAreaView style={commonStyles.flexFull}>
      {isLoading && <LoadingComponent title={loaderTitle} />}
      <ImageBackground
        source={imagePath.splashBG}
        style={styles.fullContainer}
        resizeMode="stretch"
      ></ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    height: windowHeight * 0.3,
    width: windowWidth * 0.8,
  },
});
