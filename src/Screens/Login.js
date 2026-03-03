import React, { useState } from "react";
import {
  ImageBackground,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  Vibration,
  View,
  Alert,
  Linking,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import AuthHeader from "../Components/AuthHeader";
import AuthTextInput from "../Components/AuthTextInput";
import { colors } from "../Constants/colors";
import { commonStyles } from "../Constants/commonStyles";
import {
  errorVibrationPattern,
  moderateScale,
  userSuccessPattern,
  windowHeight,
  windowWidth,
} from "../Constants/globalConstants";
import { imagePath } from "../Constants/imagePath";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "react-native-vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";
import { navigationStrings } from "../Navigation/NavigationStrings";
import CommonButton from "../Components/CommonButton";
import { apiHandler } from "../Constants/apiHandler";
import { helperFunctions } from "../Constants/helperFunctions";
import {
  enableDarkModeAutoUpdate,
  setAccessToken,
  setAdminAdvertisements,
  setCurrentSessionId,
  setFavoriteRestaurants,
  setFavouritePlaces,
  setFoodCategories,
  setLikedPosts,
  setLoadNewPosts,
  setLocation,
  setUserData,
  toggleDarkMode,
  updateVibrationSettings,
  savePostsRadius,
  updateFoodCategories,
} from "../Redux/actions/actions";
import LoadingComponent from "../Components/LoadingComponent";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomToast from "../Components/CustomToast";
import ErrorComponent from "../Components/ErrorComponent";
import { testBackendConnection } from "../Constants/networkTest";
// import { color } from 'react-native-reanimated';

export default function Login(props) {
  const isDarkModeActive = useSelector((state) => state.isDarkModeActive);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const dispatch = useDispatch();

  const navigation = useNavigation();

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = async () => {
    let storedEmail = await AsyncStorage.getItem("savedEmail");
    let storedPassword = await AsyncStorage.getItem("savedPassword");
    if (storedEmail && storedPassword) {
      setRememberMe(true);
      setEmail(storedEmail);
      setPassword(storedPassword);
    }
  };

  const onEmailChange = (text) => {
    setEmail(text);
  };

  const onPasswordChange = (text) => {
    setPassword(text);
  };

  const renderEmailIcon = () => {
    return <AntDesign name="mail" style={styles.inputIcon} />;
  };

  const renderPasswordIcon = () => {
    return <AntDesign name="lock" style={styles.inputIcon} />;
  };

  const onRememberMePress = () => {
    setRememberMe(!rememberMe);
  };

  const renderRememberIcon = () => {
    return (
      <FontAwesome
        name="check-circle"
        onPress={onRememberMePress}
        style={styles.rememberMeIcon(rememberMe, isDarkModeActive)}
      />
    );
  };

  const onForgotPasswordPress = () => {
    navigation.navigate(navigationStrings.ForgotPassword);
  };

  // Location validation function
  const validateLocation = (coordinates) => {
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

  const onLoginPress = async () => {
    if (email.trim() == "") {
      setErrorMessage("Enter email to continue");
      setShowErrorMessage(true);
      Vibration.vibrate(errorVibrationPattern);
    } else if (password.trim() == "") {
      setErrorMessage("Enter password to continue");
      setShowErrorMessage(true);
      Vibration.vibrate(errorVibrationPattern);
    } else {
      try {
        setIsLoading(true);

        let reqObj = {
          email: email,
          password: password,
        };
        
        let response = await apiHandler.loginUser(reqObj);
        console.log("Login Response:", response);
        
        if (response?.success) {
          const token = response?.token;
          await helperFunctions.storeAccessToken(token);
          
          AsyncStorage.setItem("isReviewPosted", "false");
          AsyncStorage.setItem("swipeValue", "0");

          if (rememberMe) {
            await AsyncStorage.setItem("savedEmail", email);
            await AsyncStorage.setItem("savedPassword", password);
          }

          // 1. START BACKGROUND DATA FETCHING (Parallel) - Await to ensure Redux is ready
          await fetchUserDataInBackground(token);
          
          // 2. START INTERACTIVE LOCATION FETCHING
          await getLoginLocation();

          // 3. SET TOKEN LAST to unlock app (Home screen will mount now)
          dispatch(setAccessToken(token));

          setIsLoading(false);
          setShowCustomToast(true);
          Vibration.vibrate(userSuccessPattern);
        } else {
          setIsLoading(false);
          let message = response?.message || response?.error || "Login failed";
          setErrorMessage(message);
          setShowErrorMessage(true);
          Vibration.vibrate(errorVibrationPattern);
        }
      } catch (error) {
        setIsLoading(false);
        setErrorMessage(error.message || "An error occurred");
        setShowErrorMessage(true);
        Vibration.vibrate(errorVibrationPattern);
      }
    }
  };

  const getLoginLocation = () => {
    return new Promise(async (resolve) => {
      // 1. Check for cached location first
      const cachedLocation = await helperFunctions.getCachedLocation();
      if (cachedLocation && validateLocation(cachedLocation)) {
        console.log("✅ Login: Found cached location:", cachedLocation);
        dispatch(setLocation(cachedLocation));
        resolve();
        return; // Already resolved, background fetch will happen in AppNavigation
      }

      const tryGetLocation = (useHighAccuracy = true) => {
        console.log(`📍 Login: Attempting location fetch (HighAccuracy: ${useHighAccuracy})`);
        
        const timeoutId = setTimeout(() => {
          console.log("⏰ Login: Location fetch timed out, trying low accuracy...");
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
            
            if (validateLocation(coordinates)) {
              console.log("✅ Got location:", coordinates);
              dispatch(setLocation(coordinates));
              helperFunctions.saveCachedLocation(coordinates);
              resolve();
            } else {
              showLocationErrorAlert("Invalid location received. Try again?", () => tryGetLocation(true));
            }
          },
          (err) => {
            clearTimeout(timeoutId);
            if (useHighAccuracy) {
              console.log("🔄 Login: High accuracy failed, retrying with low accuracy...");
              tryGetLocation(false);
            } else {
              if (err.code === 1) {
                showPermissionDeniedAlert(() => tryGetLocation(true));
              } else {
                showLocationErrorAlert("Failed to fetch location. Try again?", () => tryGetLocation(true));
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
    });
  };

  const fetchUserDataInBackground = async (token) => {
    console.log("🔄 Starting background data fetch...");
    
    // Fetch all supplemental data in parallel
    const results = await Promise.allSettled([
      apiHandler.getAllCategories(token),
      apiHandler.getAdminPanelAdvertisements(token),
      apiHandler.getUserData(token),
      apiHandler.getFavoriteRestaurants(token),
      apiHandler.getGoogleLikedPosts(token),
      apiHandler.getLikedRestaurants(token),
      // Optional session API
      apiHandler.userSessionAPI(token, { type: "login", device_type: Platform.OS || "unknown" }).catch(e => ({ id: 0 }))
    ]);

    const [
      categoriesRes,
      adsRes,
      userDataRes,
      favRes,
      googlePostsRes,
      likedRestaurantsRes,
      sessionRes
    ] = results;

    // Process Categories
    if (categoriesRes.status === 'fulfilled') {
      const categories = categoriesRes.value || [];
      dispatch(setFoodCategories(categories));
    }

    // Process Ads
    if (adsRes.status === 'fulfilled') {
      dispatch(setAdminAdvertisements(adsRes.value || []));
    }

    // Process User Data & Settings
    if (userDataRes.status === 'fulfilled' && userDataRes.value) {
      const userData = userDataRes.value;
      dispatch(setUserData(userData));
      
      const userSavedAppSettings = userData.app_settings || {};
      dispatch(toggleDarkMode(userSavedAppSettings.dark_mode === "true"));
      dispatch(enableDarkModeAutoUpdate(userSavedAppSettings.toggledark_mode === "true"));
      dispatch(updateVibrationSettings(userSavedAppSettings.vibrations !== "false"));

      // Process User Preferences (Radius/Categories)
      const userSettings = userData?.user_settings;
      let hasLoadedCategories = false;

      if (userSettings) {
        if (userSettings.search_radius) {
          const radiusInMiles = Math.round(Number(userSettings.search_radius) * 0.621371);
          dispatch(savePostsRadius(radiusInMiles));
        }

        if (userSettings.favorite_categories?.length > 0) {
          const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : [];
          const savedCategories = categories.filter((cat) =>
            userSettings.favorite_categories.includes(cat.id)
          );
          if (savedCategories.length > 0) {
            dispatch(updateFoodCategories(savedCategories));
            hasLoadedCategories = true;
          }
        }
      }

      // Default categories if none saved
      if (!hasLoadedCategories) {
        const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : [];
        if (categories.length > 0) dispatch(updateFoodCategories(categories));
      }
    }

    // Process Favorites/Likes
    if (favRes.status === 'fulfilled') dispatch(setLikedPosts(favRes.value || []));
    if (googlePostsRes.status === 'fulfilled') dispatch(setFavouritePlaces(googlePostsRes.value || []));
    
    if (likedRestaurantsRes.status === 'fulfilled') {
      const favoriteRestaurants = (likedRestaurantsRes.value || [])
        .map((item) => {
          let restaurantImage = item.google_photo_reference 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${item.google_photo_reference}&key=AIzaSyCLb-WobrzT3gvpXDLkNYPWbIpd30bxKLQ`
            : item.image || null;

          const restaurantId = item.google_place_id || item.restaurant_id || item.id;

          return {
            restaurantName: item.name || item.restaurant_name || "Unknown Restaurant",
            restaurantImage,
            restaurant_id: restaurantId,
            google_place_id: item.google_place_id,
          };
        })
        .filter((item) => item.restaurant_id && item.google_place_id);
      
      dispatch(setFavoriteRestaurants(favoriteRestaurants));
    }

    // Process Session
    if (sessionRes.status === 'fulfilled') {
      dispatch(setCurrentSessionId(sessionRes.value?.id || 0));
    }

    // Finally trigger post loading
    dispatch(setLoadNewPosts(true));
    console.log("✅ Background data fetch completed");
  };

  return (
    <SafeAreaView
      style={[
        commonStyles.flexFull,
        { backgroundColor: currentThemePrimaryColor },
      ]}
    >
      <CustomToast
        isVisible={showCustomToast}
        onToastShow={() => {
          setTimeout(() => {
            setShowCustomToast(false);
          }, 900);
        }}
        toastMessage={"Logged in successfully"}
      />
      <ErrorComponent
        isVisible={showErrorMessage}
        onToastShow={() => {
          setTimeout(() => {
            setShowErrorMessage(false);
          }, 1100);
        }}
        toastMessage={errorMessage}
      />
      <View style={commonStyles.screenContainer}>
        {isLoading && <LoadingComponent title={"Validating credentials"} />}
        <ImageBackground
          style={commonStyles.flexFull}
          source={
            isDarkModeActive ? imagePath.darkSplashBG : imagePath.splashBG
          }
        >
          <AuthHeader />
          <Text
            style={commonStyles.textWhite(24, {
              color: colors.black,
              alignSelf: "center",
              marginTop: moderateScale(10),
              fontWeight: "bold",
            })}
          >
            Welcome to Crunchii!
          </Text>
          <Text
            style={commonStyles.textWhite(18, {
              color: colors.black,
              alignSelf: "center",
              marginTop: moderateScale(5),
            })}
          >
            The app helping indecisive people find
          </Text>
          <Text
            style={commonStyles.textWhite(18, {
              color: colors.black,
              alignSelf: "center",
            })}
          >
            where to eat
          </Text>
          <AuthTextInput
            customStyles={{
              marginTop: moderateScale(20),
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.23,
              shadowRadius: 2.62,
              elevation: 4,
            }}
            placeholder={"Email"}
            value={email}
            onChangeText={(text) => {
              onEmailChange(text);
            }}
            icon={renderEmailIcon}
          />
          <AuthTextInput
            customStyles={{
              marginTop: moderateScale(1),
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.23,
              shadowRadius: 2.62,
              elevation: 4,
            }}
            placeholder={"Password"}
            value={password}
            isSecureEntry={true}
            onChangeText={(text) => {
              onPasswordChange(text);
            }}
            icon={renderPasswordIcon}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: windowWidth * 0.9,
              justifyContent: "space-between",
              alignSelf: "center",
              marginTop: moderateScale(10),
            }}
          >
            <View style={commonStyles.flexRow_CenterItems}>
              {renderRememberIcon()}
              <Text
                onPress={onRememberMePress}
                style={commonStyles.textWhite(16, {
                  color: colors.grey,
                  marginLeft: moderateScale(5),
                })}
              >
                Remember Me
              </Text>
            </View>
            <Text
              onPress={onForgotPasswordPress}
              style={commonStyles.textWhite(16, {
                color: colors.grey,
                marginLeft: moderateScale(5),
              })}
            >
              Forgot Password?
            </Text>
          </View>
          <CommonButton
            onButtonPress={onLoginPress}
            buttonTitle={"Login"}
            buttonStyle={styles.loginButton}
            textStyle={commonStyles.textWhite(18, { fontWeight: "700" })}
          />
        </ImageBackground>
      </View>
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
  inputIcon: {
    color: colors.black,
    fontSize: 25,
  },
  rememberMeIcon: (bool, isDarkModeActive) => {
    return {
      color: !bool
        ? isDarkModeActive
          ? colors.lightGrey
          : colors.black
        : colors.appPrimary,
      fontSize: 25,
    };
  },
  loginButton: {
    width: windowWidth * 0.9,
    alignSelf: "center",
    paddingVertical: moderateScale(6),
    backgroundColor: colors.appPrimary,
    borderRadius: moderateScale(18),
    marginTop: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
  },
});
