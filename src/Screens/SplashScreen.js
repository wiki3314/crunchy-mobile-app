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
  Alert,
  Linking,
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

  // Location validation function
  const validateLocation = (coordinates) => {
    console.log("validateLocation", coordinates);
    // Reject invalid coordinates
    if (!coordinates || 
        coordinates.latitude === 0 && coordinates.longitude === 0 ||
        Math.abs(coordinates.latitude) > 90 ||
        Math.abs(coordinates.longitude) > 180 ||
        !coordinates.latitude ||
        !coordinates.longitude) {
      return false;
    }
    return true;
  };

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

  const getLocation = (isBackgroundRefresh = false) => {
    return new Promise((resolve) => {
      console.log(`Getting user location on splash screen (BackgroundRefresh: ${isBackgroundRefresh})..............`);
      if (!isBackgroundRefresh) {
        setLoaderTitle("Fetching location...");
      }

      const tryGetLocation = (useHighAccuracy = true) => {
        console.log(`📍 Attempting location fetch (HighAccuracy: ${useHighAccuracy})`);
        
        const timeoutId = setTimeout(() => {
          console.log("⏰ Location fetch timed out, trying low accuracy...");
          if (useHighAccuracy) {
            tryGetLocation(false);
          } else {
            if (!isBackgroundRefresh) {
              showLocationErrorAlert("We couldn't fetch your location. Please check your GPS settings and try again.", () => tryGetLocation(true), resolve);
            } else {
              resolve(null);
            }
          }
        }, 10000);

        Geolocation.getCurrentPosition(
          (info) => {
            clearTimeout(timeoutId);
            console.log("Got user location on splash screen..............");
            const coordinates = {
              latitude: info.coords.latitude,
              longitude: info.coords.longitude,
            };
            
            if (validateLocation(coordinates)) {
              console.log("📍 Got user location:", coordinates);
              dispatch(setLocation(coordinates));
              helperFunctions.saveCachedLocation(coordinates);
              resolve(coordinates);
            } else {
              console.warn("⚠️ Invalid location received:", coordinates);
              if (!isBackgroundRefresh) {
                showLocationErrorAlert("We received an invalid location. Would you like to try again?", () => tryGetLocation(true), resolve);
              } else {
                resolve(null);
              }
            }
          },
          (err) => {
            clearTimeout(timeoutId);
            console.log("⚠️ Location error:", err);
            if (useHighAccuracy) {
              console.log("🔄 High accuracy failed, retrying with low accuracy...");
              tryGetLocation(false);
            } else {
              if (err.code === 1) {
                // Permission denied
                if (!isBackgroundRefresh) {
                  showPermissionDeniedAlert(() => tryGetLocation(true), resolve);
                } else {
                  resolve(null);
                }
              } else {
                // Timeout or other error
                if (!isBackgroundRefresh) {
                  showLocationErrorAlert("We couldn't fetch your location. Please check your GPS settings and try again.", () => tryGetLocation(true), resolve);
                } else {
                  resolve(null);
                }
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

      const showPermissionDeniedAlert = (retryFn, resolveFn) => {
        Alert.alert(
          "Location Permission Required",
          "Nearby restaurants require your location. Please enable it in settings to continue.",
          [
            { text: "Retry", onPress: () => retryFn() },
            { text: "Open Settings", onPress: () => {
              Linking.openSettings();
              // We don't resolve here because we need a valid location to proceed
            }},
          ],
          { cancelable: false }
        );
      };

      const showLocationErrorAlert = (message, retryFn, resolveFn) => {
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
    });
  };

  const getInitialData = async () => {
    // 1. Check for cached location first
    const cachedLocation = await helperFunctions.getCachedLocation();
    if (cachedLocation && validateLocation(cachedLocation)) {
      console.log("📍 SplashScreen: Found cached location:", cachedLocation);
      dispatch(setLocation(cachedLocation));
    }

    let token = await helperFunctions.getAccessToken();
    if (token) {
      setIsLoading(true);
      setLoaderTitle("Connecting to server...");
      try {
        console.log("Getting user current location..............");
        // Get location first (background refresh if cache exists)
        await getLocation(!!cachedLocation);
        console.log("after  user current location..............");
        // ✅ Fetch essential data first, supplemental data in parallel
        console.log("🔄 SplashScreen: Starting parallel data fetch...");
        
        // Essential for Home screen: User profile (for settings) and Categories (for filtering)
        const essentialResults = await Promise.allSettled([
          apiHandler.getUserData(token),
          apiHandler.getAllCategories(token),
        ]);

        const [userDataRes, categoriesRes] = essentialResults;

        // Process User Data & Settings (Required for session check)
        if (userDataRes.status === 'rejected') {
          const error = userDataRes.reason;
          console.log("❌ SplashScreen: User data fetch rejected:", error.message);
          
          if (error.status === 401) {
            console.log("⚠️ SplashScreen: Session expired (401), logging out...");
            setIsLoading(false);
            await helperFunctions.clearAccessToken();
            setTimeout(() => {
              navigation.dispatch(CommonActions.reset({
                index: 0,
                routes: [{ name: navigationStrings.AuthBottomNavigation }],
              }));
            }, 100);
            return;
          } else {
            console.log("📡 SplashScreen: Network or server error, proceeding with offline mode");
          }
        }

        const userData = userDataRes.status === 'fulfilled' ? userDataRes.value : null;
        const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value || [] : [];

        if (userData) {
          const userSavedAppSettings = userData?.app_settings;
          let isDarkMode = userSavedAppSettings?.dark_mode === "true";
          let isToggleDarkMode = userSavedAppSettings?.toggledark_mode === "true";
          let isVibrationEnabled = userSavedAppSettings?.vibrations !== "false";

          dispatch(toggleDarkMode(isDarkMode));
          dispatch(enableDarkModeAutoUpdate(isToggleDarkMode));
          dispatch(updateVibrationSettings(isVibrationEnabled));
          dispatch(setUserData(userData));
          dispatch(setFoodCategories(categories));

          // ✅ Load user preferences (Radius/Categories)
          const userSettings = userData?.user_settings;
          if (userSettings) {
            if (userSettings.search_radius) {
              const radiusInMiles = Math.round(userSettings.search_radius * 0.621371);
              dispatch(savePostsRadius(radiusInMiles));
            }
            if (userSettings.favorite_categories?.length > 0) {
              const savedCategories = categories.filter((cat) =>
                userSettings.favorite_categories.includes(cat.id)
              );
              if (savedCategories.length > 0) {
                dispatch(updateFoodCategories(savedCategories));
              }
            }
          }

          // ✅ Fallbacks
          if (!userData.user_settings) {
            dispatch(savePostsRadius(20));
            if (categories.length > 0) dispatch(updateFoodCategories(categories));
          } else if (userSettings) {
            if (!userSettings.search_radius) dispatch(savePostsRadius(20));
            if (!userSettings.favorite_categories || userSettings.favorite_categories.length === 0) {
              if (categories.length > 0) dispatch(updateFoodCategories(categories));
            }
          }
        } else {
          // No user data (likely network error) - use default settings
          dispatch(savePostsRadius(20));
          dispatch(setFoodCategories(categories));
          if (categories.length > 0) dispatch(updateFoodCategories(categories));
        }

        // ✅ SET ACCESS TOKEN - Home screen can mount now
        dispatch(setAccessToken(token));
        console.log("✅ SplashScreen: Essential initialization complete, navigating to Home");
        
        setIsLoading(false);
        // Start supplemental data fetching in background without awaiting
        Promise.allSettled([
          apiHandler.getAdminPanelAdvertisements(token),
          apiHandler.getFavoriteRestaurants(token),
          apiHandler.getGoogleLikedPosts(token),
          apiHandler.getLikedRestaurants(token),
          apiHandler.userSessionAPI(token, { type: "login", device_type: Platform.OS || "unknown" }).catch(e => ({ id: 0 }))
        ]).then(supplementalResults => {
          console.log("🔄 SplashScreen: Supplemental background data fetch complete");
          const [adsRes, favRes, googlePostsRes, likedRestaurantsRes, sessionRes] = supplementalResults;
          
          if (adsRes.status === 'fulfilled') dispatch(setAdminAdvertisements(adsRes.value || []));
          if (favRes.status === 'fulfilled') dispatch(setLikedPosts(favRes.value || []));
          if (googlePostsRes.status === 'fulfilled') dispatch(setFavouritePlaces(googlePostsRes.value || []));
          if (sessionRes.status === 'fulfilled') dispatch(setCurrentSessionId(sessionRes.value?.id || 0));
          
          if (likedRestaurantsRes.status === 'fulfilled') {
            const rawFavoriteRestaurants = likedRestaurantsRes.value || [];
            const favoriteRestaurants = rawFavoriteRestaurants
              .map((item) => {
                let restaurantImage = null;
                if (item.google_photo_reference) {
                  restaurantImage = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${item.google_photo_reference}&key=${GOOGLE_API_KEY}`;
                } else if (item.image) {
                  restaurantImage = item.image;
                }
                const restaurantId = item.google_place_id || item.restaurant_id || item.id;
                return {
                  restaurantName: item.name || item.restaurant_name || "Unknown Restaurant",
                  restaurantImage: restaurantImage,
                  restaurant_id: restaurantId,
                  google_place_id: item.google_place_id,
                };
              })
              .filter((item) => item.restaurant_id && item.google_place_id);
            dispatch(setFavoriteRestaurants(favoriteRestaurants));
          }
        });

        // Navigate immediately
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: navigationStrings.MainStack }],
            })
          );
        }, 100);
      } catch (error) {
        console.log("❌ SplashScreen: Error during initialization:", error);
        setIsLoading(false);
        await helperFunctions.clearAccessToken();
        navigation.navigate(navigationStrings.AuthBottomNavigation);
      }
    } else {
      // ✅ For guest users: load radius from AsyncStorage (default 20)
      try {
        const guestRadius = await AsyncStorage.getItem("guestRadius");
        if (guestRadius) {
          dispatch(savePostsRadius(Number(guestRadius)));
        } else {
          dispatch(savePostsRadius(20));
        }
      } catch (e) {
        dispatch(savePostsRadius(20));
      }

      // Guest user: fetch location in background, no loader
      getLocation(true);

      // No saved token - go directly to AuthBottomNavigation (skip LandingScreen carousel)
      setTimeout(() => {
        try {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: navigationStrings.AuthBottomNavigation }],
            })
          );
        } catch (navError) {
          console.log("Navigation error:", navError);
          // Fallback to navigate if reset fails
          navigation.navigate(navigationStrings.AuthBottomNavigation);
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
