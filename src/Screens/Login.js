import React, { useState } from "react";
import {
  ImageBackground,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  Vibration,
  View,
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

  const [email, setEmail] = useState("bbc@yopmail.com");
  const [password, setPassword] = useState("12345678");
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

        // Optional: Test network connectivity first (only in development)
        // Uncomment the lines below if you want to test connectivity before every login
        // console.log("🔍 Testing backend connection first...");
        // const networkTest = await testBackendConnection();
        // if (!networkTest.summary.allPassed) {
        //   setErrorMessage("Cannot reach backend. Check network settings.");
        //   setShowErrorMessage(true);
        //   setIsLoading(false);
        //   Vibration.vibrate(errorVibrationPattern);
        //   return;
        // }

        let reqObj = {
          email: email,
          password: password,
        };
        // Send as JSON, not FormData
        let response = await apiHandler.loginUser(reqObj);
        console.log("Login Response:", response);
        setIsLoading(false);
        if (response?.success) {
          AsyncStorage.setItem("isReviewPosted", "false");
          AsyncStorage.setItem("swipeValue", "0");

          if (rememberMe) {
            await AsyncStorage.setItem("savedEmail", email);
            await AsyncStorage.setItem("savedPassword", password);
          }

          try {
            // Get location first
            console.log("📍 Getting user location...");
            await new Promise((resolve) => {
              Geolocation.getCurrentPosition(
                (info) => {
                  const coordinates = {
                    latitude: info.coords.latitude,
                    longitude: info.coords.longitude,
                  };
                  console.log("✅ Got location:", coordinates);
                  dispatch(setLocation(coordinates));
                  resolve();
                },
                (err) => {
                  console.log("⚠️ Location error, using default:", err);
                  // Use default location if permission denied
                  const defaultLocation = {
                    latitude: 37.7749,
                    longitude: -122.4194,
                  };
                  dispatch(setLocation(defaultLocation));
                  resolve();
                },
                {
                  enableHighAccuracy: false,
                  timeout: 5000,
                  maximumAge: 3600000,
                }
              );
            });

            // Load all user data first
            let token = response?.token;
            await helperFunctions.storeAccessToken(token);

            let categories = await apiHandler.getAllCategories(token);
            let adminAdvertisements =
              await apiHandler.getAdminPanelAdvertisements(token);

            // Session API is optional - if it fails, use default session
            let session = null;
            try {
              const sessionData = {
                type: "login",
                device_type: Platform.OS || "unknown",
              };
              session = await apiHandler.userSessionAPI(token, sessionData);
            } catch (sessionError) {
              console.log("Session API failed, using default:", sessionError);
              session = { id: 0 }; // Default session
            }

            let userData = await apiHandler.getUserData(token);
            let userSavedAppSettings = userData.app_settings || {};
            // Default to light mode (white background) for new users
            let isDarkMode = userSavedAppSettings.dark_mode === "true";
            let isToggleDarkMode =
              userSavedAppSettings.toggledark_mode === "true";
            let isVibrationEnabled =
              userSavedAppSettings.vibrations !== "false";
            let likedInAppPosts = await apiHandler.getFavoriteRestaurants(
              token
            );
            let googlePosts = await apiHandler.getGoogleLikedPosts(token);
            let favoriteRestaurants = await apiHandler.getLikedRestaurants(
              token
            );

            console.log(
              "🍽️ Raw favorite restaurants from API:",
              favoriteRestaurants
            );

            // Map with safety check - Backend returns { id, name, google_photo_reference, ... }
            favoriteRestaurants = (favoriteRestaurants || [])
              .map((item, index) => {
                console.log(`🔍 Processing restaurant #${index}:`, {
                  name: item.name,
                  google_photo_reference: item.google_photo_reference,
                  google_place_id: item.google_place_id,
                  id: item.id,
                });

                // Construct Google image URL if photo reference exists
                let restaurantImage = null;
                if (item.google_photo_reference) {
                  restaurantImage = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${item.google_photo_reference}&key=AIzaSyCLb-WobrzT3gvpXDLkNYPWbIpd30bxKLQ`;
                  console.log(
                    `✅ Image URL created:`,
                    restaurantImage.substring(0, 80) + "..."
                  );
                } else if (item.image) {
                  restaurantImage = item.image;
                  console.log(`✅ Using item.image:`, restaurantImage);
                } else {
                  console.log(
                    `❌ No photo_reference or image found for:`,
                    item.name
                  );
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

            console.log("🍽️ Mapped favorite restaurants:", favoriteRestaurants);

            // ✅ Load user preferences from database FIRST (before setting token)
            const userSettings = userData.user_settings;
            let hasLoadedCategories = false;

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
                  hasLoadedCategories = true;
                }
              }
            }

            // ✅ If user has no saved categories, use ALL categories as default
            if (!hasLoadedCategories && categories && categories.length > 0) {
              console.log(
                "📊 No saved categories, loading ALL categories as default"
              );
              dispatch(updateFoodCategories(categories));
            }

            // Dispatch all data to Redux
            dispatch(setCurrentSessionId(session?.id || 0));
            dispatch(setAdminAdvertisements(adminAdvertisements || []));
            dispatch(setFoodCategories(categories || []));
            dispatch(setLikedPosts(likedInAppPosts || []));
            dispatch(setFavouritePlaces(googlePosts || []));
            dispatch(setFavoriteRestaurants(favoriteRestaurants || []));
            dispatch(toggleDarkMode(isDarkMode));
            dispatch(enableDarkModeAutoUpdate(isToggleDarkMode));
            dispatch(updateVibrationSettings(isVibrationEnabled));
            dispatch(setUserData(userData));

            // ⚠️ IMPORTANT: Set token and trigger post loading TOGETHER at the end
            dispatch(setAccessToken(token));
            dispatch(setLoadNewPosts(true)); // ✅ This will trigger home screen to load posts

            // Show success ONLY after all data loaded successfully
            setShowCustomToast(true);
            Vibration.vibrate(userSuccessPattern);
          } catch (dataError) {
            console.log("Error loading user data after login:", dataError);
            setErrorMessage(
              "Login successful but failed to load user data. Please try again."
            );
            setShowErrorMessage(true);
            Vibration.vibrate(errorVibrationPattern);
          }
        } else {
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
