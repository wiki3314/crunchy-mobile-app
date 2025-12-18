import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "@react-native-community/geolocation";
import { firebase } from "@react-native-firebase/dynamic-links";
import { useNavigation, CommonActions } from "@react-navigation/native";
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
  setLoadNewPosts,
  setLocation,
  setReceivedPost,
  setUserData,
  toggleDarkMode,
  updateVibrationSettings,
  savePostsRadius,
  updateFoodCategories,
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

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (info) => {
          const coordinates = {
            latitude: info.coords.latitude,
            longitude: info.coords.longitude,
          };
          console.log("📍 Got user location:", coordinates);
          dispatch(setLocation(coordinates));
          resolve(coordinates);
        },
        (err) => {
          console.log("⚠️ Location error:", err);
          // Use default location if permission denied
          const defaultLocation = {
            latitude: 37.7749,
            longitude: -122.4194,
          };
          dispatch(setLocation(defaultLocation));
          resolve(defaultLocation);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 3600000,
        }
      );
    });
  };

  const getInitialData = async () => {
    let token = await helperFunctions.getAccessToken();
    if (token) {
      setIsLoading(true);
      setLoaderTitle("Connecting to server...");
      try {
        // Get location first
        await getLocation();

        let userData = await apiHandler.getUserData(token);
        console.log("A");
        // Handle case where getUserData returns null (user not found)
        if (!userData) {
          console.log("⚠️ User data not found - invalid token, clearing and navigating to login");
          setIsLoading(false);
          // Clear invalid token
          await helperFunctions.clearAccessToken();
          // Navigate to landing screen
          setTimeout(() => {
            try {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: navigationStrings.LandingScreen }],
                })
              );
            } catch (navError) {
              console.log("Navigation error:", navError);
              navigation.navigate(navigationStrings.LandingScreen);
            }
          }, 100);
          return; // Exit early
        }
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
        // Backend returns { id, name, google_photo_reference, ... }
        favoriteRestaurants = favoriteRestaurants
          .map((item, index) => {
            // Construct Google image URL if photo reference exists
            let restaurantImage = null;
            if (item.google_photo_reference) {
              restaurantImage = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${item.google_photo_reference}&key=AIzaSyCLb-WobrzT3gvpXDLkNYPWbIpd30bxKLQ`;
            } else if (item.image) {
              restaurantImage = item.image;
            }

            // Use google_place_id as restaurant_id for proper navigation
            const restaurantId =
              item.google_place_id || item.restaurant_id || item.id;

            return {
              restaurantName:
                item.name || item.restaurant_name || "Unknown Restaurant",
              restaurantImage: restaurantImage,
              restaurant_id: restaurantId,
              google_place_id: item.google_place_id,
            };
          })
          .filter((item) => {
            // Filter out entries with incomplete/invalid data
            const hasValidId = item.restaurant_id && item.google_place_id;
            const hasValidName =
              item.restaurantName &&
              item.restaurantName !== "Unknown Restaurant";

            if (!hasValidId || !hasValidName) {
              console.log("⚠️ Skipping invalid restaurant:", {
                name: item.restaurantName,
                id: item.restaurant_id,
                google_place_id: item.google_place_id,
              });
              return false;
            }
            return true;
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

        // ✅ Load user preferences from database (if they exist)
        const userSettings = userData?.user_settings;
        if (userSettings) {
          console.log(
            "📊 Loading user preferences from database:",
            userSettings
          );

          // Load saved radius
          if (userSettings.search_radius) {
            dispatch(savePostsRadius(userSettings.search_radius));
            console.log("✅ Loaded radius:", userSettings.search_radius);
          }

          // Load saved categories
          if (
            userSettings.favorite_categories &&
            userSettings.favorite_categories.length > 0
          ) {
            // Map category IDs to full category objects
            const savedCategories = categories.filter((cat) =>
              userSettings.favorite_categories.includes(cat.id)
            );
            if (savedCategories.length > 0) {
              dispatch(updateFoodCategories(savedCategories));
              console.log("✅ Loaded categories:", savedCategories);
            }
          }
        }

        dispatch(setLoadNewPosts(true)); // ✅ Load posts on home screen
        setIsLoading(false);
      } catch (error) {
        console.log("Error loading user data:", error);
        setIsLoading(false);
        // Use reset to properly navigate to LandingScreen
        setTimeout(() => {
          try {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: navigationStrings.LandingScreen }],
              })
            );
          } catch (navError) {
            console.log("Navigation error:", navError);
            // Fallback to navigate if reset fails
            navigation.navigate(navigationStrings.LandingScreen);
          }
        }, 100);
      }
    } else {
      // No saved token - go to landing screen
      // Use reset to properly navigate to LandingScreen
      setTimeout(() => {
        try {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: navigationStrings.LandingScreen }],
            })
          );
        } catch (navError) {
          console.log("Navigation error:", navError);
          // Fallback to navigate if reset fails
          navigation.navigate(navigationStrings.LandingScreen);
        }
      }, 100);
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
