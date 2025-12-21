import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
  FlatList,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "../Constants/colors";
import { commonStyles } from "../Constants/commonStyles";
import {
  moderateScale,
  windowWidth,
  windowHeight,
  GOOGLE_API_KEY,
  ratingsData,
  VIBRATION_PATTERN,
} from "../Constants/globalConstants";
import { imagePath } from "../Constants/imagePath";
import Entypo from "react-native-vector-icons/Entypo";
import PressableImage from "./PressableImage";
import { useNavigation } from "@react-navigation/native";
import { navigationStrings } from "../Navigation/NavigationStrings";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  AccessToken,
  LoginManager,
  GraphRequest,
  GraphRequestManager,
} from "react-native-fbsdk-next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiHandler, BASE_URL } from "../Constants/apiHandler";
import {
  setAccessToken,
  setUserData,
  showHideForceLoginModal,
  setPostsWithoutLogin,
  setAdminAdvertisements,
  setFoodCategories,
  setIsNewUser,
  setCurrentSessionId,
  setLikedPosts,
  setFavouritePlaces,
  setFavoriteRestaurants,
  savePostsRadius,
  updateFoodCategories,
  setLoadNewPosts,
} from "../Redux/actions/actions";
import LoadingComponent from "../Components/LoadingComponent";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import CommonButton from "./CommonButton";
import { helperFunctions } from "../Constants/helperFunctions";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { PanGestureHandler } from "react-native-gesture-handler";

export default function PostWithoutLogin() {
  const isDarkModeActive = useSelector((state) => state.isDarkModeActive);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );

  const images =
    Platform.OS == "ios"
      ? [
          {
            id: 0,
            imageSource: imagePath.gmailIcon,
          },
          {
            id: 1,
            imageSource: imagePath.facebookIcon,
          },
          {
            id: 2,
            imageSource: imagePath.appleIcon,
          },
        ]
      : [
          {
            id: 0,
            imageSource: imagePath.gmailIcon,
          },
          {
            id: 1,
            imageSource: imagePath.facebookIcon,
          },
        ];

  const allPosts = useSelector((state) => state.postsWithoutLogin);
  const userLocation = useSelector((state) => state.userLocation);
  const showForceLoginModal = useSelector((state) => state.showForceLoginModal);
  const accessToken = useSelector((state) => state.accessToken);

  const listRef = useRef();

  const [isLoading, setIsLoading] = useState(false);
  const [componentHeight, setComponentHeight] = useState(0);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  async function getPostsWithoutLogin() {
    try {
      console.log("📍 PostWithoutLogin: Loading posts...", {
        hasLocation: !!userLocation,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      });
      setIsLoading(true);
      let reqObj = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
      let postsWithoutLogin = await apiHandler.getPostsWithoutLogin(reqObj);

      if (!postsWithoutLogin) {
        console.log("⚠️ No posts returned from API");
        dispatch(setPostsWithoutLogin([]));
        setIsLoading(false);
        return;
      }

      postsWithoutLogin = postsWithoutLogin.filter((item, index) => {
        if (item) {
          return item;
        }
      });
      console.log(
        "✅ PostWithoutLogin: Loaded",
        postsWithoutLogin.length,
        "posts"
      );
      dispatch(setPostsWithoutLogin(postsWithoutLogin));
      if (postsWithoutLogin && postsWithoutLogin.length > 0) {
        listRef.current?.scrollToIndex({ index: 0 });
      }
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Error loading posts without login:", error);
      dispatch(setPostsWithoutLogin([]));
      setIsLoading(false);
    }
  }

  // Load posts on mount and when userLocation changes
  useEffect(() => {
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      getPostsWithoutLogin();
    }
  }, [userLocation]);

  // Reload posts when user logs out (accessToken becomes empty)
  useEffect(() => {
    if (!accessToken && userLocation) {
      console.log("🔄 User logged out, reloading posts without login");
      getPostsWithoutLogin();
    }
  }, [accessToken]);

  const onRegisterPress = () => {
    dispatch(showHideForceLoginModal(false));
    navigation.navigate(navigationStrings.Registration);
  };

  const onLoginPress = () => {
    dispatch(showHideForceLoginModal(false));
    navigation.navigate(navigationStrings.Login);
  };

  const changeModalState = () => {
    dispatch(showHideForceLoginModal(!showForceLoginModal));
  };

  function onSocialLoginPress(id) {
    switch (id) {
      case 0:
        onGooglePress();
        break;
      case 1:
        loginWithFacebook();
        break;
      case 2:
        onApplePress();
        break;
      default:
        break;
    }
  }

  const onApplePress = async () => {
    try {
      setIsLoading(true);
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user
      );

      if (credentialState !== appleAuth.State.AUTHORIZED) {
        console.log(
          "❌ Apple credential state not authorized:",
          credentialState
        );
        setIsLoading(false);
        return;
      }

      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      let fcmToken = await AsyncStorage.getItem("fcmToken");
      console.log("Apple Login FCM token:", fcmToken);

      const appleUserId = appleAuthRequestResponse.user;
      const appleEmail =
        appleAuthRequestResponse.email || `${appleUserId}@apple.local`; // fallback to avoid null/duplicate email issues

      // Backend expects: provider, social_id, name, email
      var raw = JSON.stringify({
        provider: "apple",
        social_id: appleUserId,
        name: appleAuthRequestResponse?.fullName?.givenName || "User",
        email: appleEmail,
      });

      console.log("🍎 Calling Apple socialLogin with:", JSON.parse(raw));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
        signal: controller.signal,
      };

      await fetch(BASE_URL + "socialLogin", requestOptions)
        .then((response) => {
          clearTimeout(timeoutId);
          console.log("🍎 Apple socialLogin status:", response.status);
          return response.json();
        })
        .then(async (response) => {
          console.log(
            "🍎 Apple socialLogin response:",
            JSON.stringify(response, null, 2)
          );

          if (!response?.success || !response?.token) {
            console.log("❌ Apple login failed:", response?.message);
            setIsLoading(false);
            return;
          }

          const token = response.token;
          await helperFunctions.storeAccessToken(token);
          AsyncStorage.setItem("swipeValue", "0");
          AsyncStorage.setItem("isReviewPosted", "false");

          if (response.user) {
            dispatch(setUserData(response.user));
          } else {
            let userData = await apiHandler.getUserData(token);
            dispatch(setUserData(userData));
          }

          if (response?.isNewUser) {
            console.log("New userrrrrrrrr (Apple)");
            dispatch(setIsNewUser(true));
          } else {
            dispatch(setIsNewUser(false));
          }

          // Load all user data
          let categories = await apiHandler.getAllCategories(token);
          let adminAdvertisements =
            await apiHandler.getAdminPanelAdvertisements(token);
          let session = await apiHandler.userSessionAPI(token, {});
          let likedInAppPosts = await apiHandler.getFavoriteRestaurants(token);
          let googlePosts = await apiHandler.getGoogleLikedPosts(token);
          let favoriteRestaurants = await apiHandler.getLikedRestaurants(token);

          // Get full user data to access user_settings
          let userData = response.user || (await apiHandler.getUserData(token));
          // Handle case where getUserData returns null (user not found)
          if (!userData) {
            console.log("⚠️ User data not found, using defaults");
            userData = {}; // Use empty object to prevent errors
          }

          // Map favorite restaurants
          favoriteRestaurants = (favoriteRestaurants || [])
            .map((item) => {
              let restaurantImage = null;
              if (item.google_photo_reference) {
                restaurantImage = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${item.google_photo_reference}&key=AIzaSyCLb-WobrzT3gvpXDLkNYPWbIpd30bxKLQ`;
              } else if (item.image) {
                restaurantImage = item.image;
              }

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
            .filter((item) => item.restaurant_id && item.google_place_id);

          // ✅ Load user preferences from database
          const userSettings = userData?.user_settings;
          let hasLoadedCategories = false;

          if (userSettings) {
            console.log(
              "📊 Apple Login - Loading user preferences:",
              userSettings
            );

            if (userSettings.search_radius) {
              dispatch(savePostsRadius(userSettings.search_radius));
              console.log("✅ Loaded radius:", userSettings.search_radius);
            }

            if (
              userSettings.favorite_categories &&
              userSettings.favorite_categories.length > 0
            ) {
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
              "📊 Apple Login - No saved categories, loading ALL categories as default"
            );
            dispatch(updateFoodCategories(categories));
          }

          dispatch(setLikedPosts(likedInAppPosts || []));
          dispatch(setFavouritePlaces(googlePosts || []));
          dispatch(setFavoriteRestaurants(favoriteRestaurants || []));
          dispatch(setCurrentSessionId(session?.id || 0));
          dispatch(setAdminAdvertisements(adminAdvertisements));
          dispatch(setFoodCategories(categories));

          // Set token and trigger post loading together
          dispatch(setAccessToken(token));
          dispatch(setLoadNewPosts(true));
          dispatch(showHideForceLoginModal(false));
          setIsLoading(false);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          if (error.name === "AbortError") {
            console.log("❌ Apple socialLogin timeout after 30 seconds");
          } else {
            console.log("❌ Apple socialLogin fetch error:", error);
          }
          setIsLoading(false);
        });
    } catch (error) {
      console.log("❌ Apple login error:", error);
      setIsLoading(false);
    }
  };

  const onGooglePress = () => {
    setIsLoading(true);
    console.log("🚀 Starting Google Sign-in...");
    GoogleSignin.configure({
      iosClientId:
        "887856847210-br194482savpiontotn1d0kucuosbdct.apps.googleusercontent.com",
      androidClientId:
        "887856847210-kn6g0ggbduj48m2qpgntaog0bfmmp0os.apps.googleusercontent.com",
    });
    GoogleSignin.hasPlayServices()
      .then((hasPlayService) => {
        if (hasPlayService) {
          console.log("Google sign in", hasPlayService);
          GoogleSignin.signIn()
            .then((userInfo) => {
              console.log(
                "✅ Google Sign-in successful, calling socialLogin API..."
              );
              socialLogin(userInfo.user, "google");
            })
            .catch((e) => {
              setIsLoading(false);
              console.log("❌ Google Sign-in ERROR: " + JSON.stringify(e));
            });
        }
      })
      .catch((e) => {
        setIsLoading(false);
        console.log("❌ Google Play Services ERROR: " + JSON.stringify(e));
      });
  };

  const loginWithFacebook = () => {
    setIsLoading(true);
    LoginManager.logInWithPermissions([
      "public_profile",
      "email",
      "user_friends",
    ])
      .then((result) => {
        console.log("result for the facebook ", result);
        if (result.isCancelled) {
          setIsLoading(false);
          console.log("is canceleddddd");
        } else {
          AccessToken.getCurrentAccessToken()
            .then((data) => {
              console.log("data is the fov", data);
              if (data && data.accessToken) {
                const accessToken = data.accessToken.toString();
                getUserInfoFromFacebookToken(accessToken);
              } else {
                setIsLoading(false);
                console.log("No access token received");
                Alert.alert("Error", "Failed to get Facebook access token");
              }
            })
            .catch((error) => {
              console.log("Error fetching accessToken:", error);
              setIsLoading(false);
              Alert.alert(
                "Error",
                "Failed to get Facebook access token: " +
                  (error.message || "Unknown error")
              );
            });
        }
      })
      .catch((error) => {
        console.log("Facebook login error:", error);
        setIsLoading(false);
        Alert.alert(
          "Error",
          "Facebook login failed: " + (error.message || "Unknown error")
        );
      });
  };

  const getUserInfoFromFacebookToken = (token) => {
    const PROFILE_REQUEST_PARAMS = {
      fields: {
        string: "id, name, first_name, last_name, birthday, email",
      },
    };

    const profileRequest = new GraphRequest(
      "/me",
      {
        token: token, // Use 'token' not 'accessToken' (old project pattern)
        parameters: PROFILE_REQUEST_PARAMS,
      },
      (error, result) => {
        if (error) {
          console.log("Login Info has an error:", error);
          setIsLoading(false);
          Alert.alert(
            "Error",
            "Failed to get Facebook profile: " +
              (error.message || "Unknown error")
          );
        } else {
          if (!result?.email) {
            setIsLoading(false);
            Alert.alert(
              "Error",
              "To continue Crunchii please allow access to your email",
              [{ text: "OK" }]
            );
          } else {
            socialLogin(result, "facebook");
          }
        }
      }
    );

    new GraphRequestManager().addRequest(profileRequest).start();
  };

  const socialLogin = async (result, type) => {
    console.log("resultresult", result);
    let fcmToken = await AsyncStorage.getItem("fcmToken");
    console.log("FCCCCMMMMM", fcmToken);

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    // Backend expects: provider, social_id, name, email, fcm_token/device_token
    var raw = JSON.stringify({
      provider: type, // 'google', 'facebook', 'apple'
      social_id: result.id, // Social provider's user ID
      name: result.name, // User's full name
      email: result.email, // User's email
      fcm_token: fcmToken, // FCM token for push notifications
      device_token: fcmToken, // Device token (backend might expect either)
    });
    console.log("Calling socialLogin API with:", JSON.parse(raw));
    console.log("API URL:", BASE_URL + "socialLogin");

    // Add timeout to the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
        signal: controller.signal,
      };
      fetch(BASE_URL + "socialLogin", requestOptions)
        .then((response) => {
          clearTimeout(timeoutId);
          console.log("API Response received! Status:", response.status);
          console.log("Response OK:", response.ok);
          if (!response.ok) {
            console.log("❌ Response not OK, status:", response.status);
          }
          return response.json();
        })
        .then(async (response) => {
          console.log(
            "************ API Response: ",
            JSON.stringify(response, null, 2)
          );

          // Check if login was successful
          if (!response?.success || !response?.token) {
            console.log(
              "❌ Login failed:",
              response?.message || "Unknown error"
            );
            setIsLoading(false);
            return;
          }

          AsyncStorage.setItem("swipeValue", "0");
          AsyncStorage.setItem("isReviewPosted", "false");

          const token = response.token;
          await helperFunctions.storeAccessToken(token);

          // Backend returns 'user' not 'userData'
          if (response.user) {
            dispatch(setUserData(response.user));
          } else {
            let userData = await apiHandler.getUserData(token);
            dispatch(setUserData(userData));
          }

          // Backend returns 'isNewUser' not 'isUser'
          if (response?.isNewUser) {
            console.log("New userrrrrrrrr");
            dispatch(setIsNewUser(true));
          } else {
            dispatch(setIsNewUser(false));
          }

          // Load additional data
          let categories = await apiHandler.getAllCategories(token);
          let adminAdvertisements =
            await apiHandler.getAdminPanelAdvertisements(token);
          let session = await apiHandler.userSessionAPI(token, {});
          let likedInAppPosts = await apiHandler.getFavoriteRestaurants(token);
          let googlePosts = await apiHandler.getGoogleLikedPosts(token);
          let favoriteRestaurants = await apiHandler.getLikedRestaurants(token);

          // Get full user data to access user_settings
          let userData = response.user || (await apiHandler.getUserData(token));
          // Handle case where getUserData returns null (user not found)
          if (!userData) {
            console.log("⚠️ User data not found, using defaults");
            userData = {}; // Use empty object to prevent errors
          }

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

          // ✅ Load user preferences from database FIRST (before setting token)
          const userSettings = userData?.user_settings;
          let hasLoadedCategories = false;

          if (userSettings) {
            console.log(
              "📊 Social Login - Loading user preferences from database:",
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
              "📊 Social Login - No saved categories, loading ALL categories as default"
            );
            dispatch(updateFoodCategories(categories));
          }

          dispatch(setLikedPosts(likedInAppPosts));
          dispatch(setFavouritePlaces(googlePosts));
          dispatch(setFavoriteRestaurants(favoriteRestaurants));
          dispatch(setCurrentSessionId(session.id));
          dispatch(setAdminAdvertisements(adminAdvertisements));
          dispatch(setFoodCategories(categories));

          // ⚠️ IMPORTANT: Set token and trigger post loading TOGETHER
          dispatch(setAccessToken(token));
          dispatch(setLoadNewPosts(true)); // ✅ Trigger home screen to load posts
          console.log("✅ Access token set successfully, closing modal");
          dispatch(showHideForceLoginModal(false));
          setIsLoading(false);
        })
        .catch((fetchError) => {
          clearTimeout(timeoutId);
          if (fetchError.name === "AbortError") {
            console.log("❌ API request timeout after 30 seconds");
          } else {
            console.log("❌ API fetch error:", fetchError);
            console.log("❌ Error name:", fetchError.name);
            console.log("❌ Error message:", fetchError.message);
          }
          setIsLoading(false);
        });
    } catch (error) {
      clearTimeout(timeoutId);
      console.log("❌ social login error:", error.message);
      setIsLoading(false);
    }
  };

  const handleGesture = (event) => {
    if (event.nativeEvent.state == 5) {
      if (event.nativeEvent.translationX < -50) {
        dispatch(showHideForceLoginModal(true));
      } else if (event.nativeEvent.translationX > 50) {
        dispatch(showHideForceLoginModal(true));
      }
    }
  };

  const renderPost = ({ item, index }) => {
    return (
      <ImageBackground
        resizeMode="cover"
        source={
          item && {
            uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${700}&photo_reference=${
              item.restaurantImage
            }&key=${GOOGLE_API_KEY}`,
          }
        }
        style={{
          height: componentHeight,
          width: windowWidth,
          padding: moderateScale(4),
          paddingBottom: moderateScale(12),
        }}
      >
        <PanGestureHandler
          failOffsetY={[-5, 5]}
          activeOffsetX={[-5, 5]}
          onHandlerStateChange={(event) => {
            handleGesture(event);
          }}
        >
          <View style={styles.fullInnerContainer}>
            <View style={styles.commentSectionContainer}>
              <TouchableOpacity
                style={styles.restaurantImageContainer}
                onPress={changeModalState}
              >
                <Image
                  source={
                    item && {
                      uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${700}&photo_reference=${
                        item.restaurantImage
                      }&key=${GOOGLE_API_KEY}`,
                    }
                  }
                  style={styles.restaurantImage}
                />
              </TouchableOpacity>
              <PressableImage
                imageSource={imagePath.unlikedPost}
                imageStyle={styles.likePostImage}
                onImagePress={changeModalState}
              />
              <PressableImage
                imageSource={imagePath.commentImage}
                imageStyle={styles.commentImage}
                onImagePress={changeModalState}
              />
              <Entypo
                name="share"
                style={styles.shareIcon}
                onPress={changeModalState}
              />
            </View>
            <View
              style={{
                minHeight: moderateScale(100),
                width: windowWidth * 0.7,
                padding: moderateScale(5),
                position: "absolute",
                left: moderateScale(0),
                bottom: windowHeight * 0.1,
              }}
            >
              <Text
                style={commonStyles.textWhite(20, {
                  fontWeight: "bold",
                  width: "85%",
                  textShadowColor: colors.black,
                  textShadowOffset: { width: 5, height: 5 },
                  textShadowRadius: 10,
                })}
              >
                {item && item.restaurantName}
              </Text>
              {item &&
                item.restaurantRating &&
                helperFunctions.getStarRatings(item.restaurantRating)}
              {item && item.restaurantPrice && (
                <View style={styles.singleTextContainer}>
                  {ratingsData.map((ratingItem, index) => {
                    return (
                      ratingItem <= Math.floor(item.restaurantPrice) && (
                        <FontAwesome
                          name="dollar"
                          style={commonStyles.ratingImageStyle(index)}
                        />
                      )
                    );
                  })}
                </View>
              )}
              <Text
                numberOfLines={4}
                style={commonStyles.textWhite(14, {
                  fontWeight: "400",
                  width: "80%",
                  color: colors.grey,
                  textShadowColor: colors.black,
                  textShadowOffset: { width: 5, height: 5 },
                  textShadowRadius: 10,
                })}
              >
                {item && item.review}
              </Text>
            </View>
          </View>
        </PanGestureHandler>
      </ImageBackground>
    );
  };

  return (
    <View style={commonStyles.flexFull}>
      {isLoading && <LoadingComponent title={"Fetching near by restaurants"} />}
      <FlatList
        ref={listRef}
        data={allPosts}
        renderItem={renderPost}
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        onLayout={(event) => {
          setComponentHeight(event.nativeEvent.layout.height);
        }}
        removeClippedSubviews={true}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={() => {
          // Don't show empty component while loading
          if (isLoading) {
            return null;
          }

          return (
            <View
              style={{
                height: componentHeight,
                width: windowWidth,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: currentThemePrimaryColor,
              }}
            >
              {/* Empty state - only shows when not loading and no posts */}
            </View>
          );
        }}
      />
      <Modal
        transparent={true}
        visible={showForceLoginModal}
        onRequestClose={changeModalState}
      >
        <View style={styles.forceLoginModalFullContainer(isDarkModeActive)}>
          <View
            style={styles.forceLoginModalInnerContainer(
              currentThemePrimaryColor
            )}
          >
            <Ionicons
              name="close"
              style={styles.closeLoginModalIcon(currentThemeSecondaryColor)}
              onPress={() => {
                dispatch(showHideForceLoginModal(false));
              }}
            />
            <Text
              style={commonStyles.textWhite(18, {
                color: currentThemeSecondaryColor,
                alignSelf: "center",
                marginTop: moderateScale(15),
              })}
            >
              Please login or register to continue
            </Text>
            <View style={styles.buttonsContainer}>
              <CommonButton
                buttonStyle={styles.loginButton}
                onButtonPress={onLoginPress}
                buttonTitle="Login"
                textStyle={commonStyles.textWhite(18)}
              />
              <CommonButton
                buttonStyle={styles.registrationButton(
                  currentThemePrimaryColor
                )}
                onButtonPress={onRegisterPress}
                buttonTitle="Registration"
                textStyle={commonStyles.textWhite(18, {
                  color: isDarkModeActive ? colors.white : colors.appPrimary,
                })}
              />
            </View>
            <View style={styles.borderViewContainer}>
              <View style={styles.borderLine} />
              <Text
                style={commonStyles.textWhite(18, {
                  color: colors.grey,
                  marginHorizontal: moderateScale(6),
                })}
              >
                or
              </Text>
              <View style={styles.borderLine} />
            </View>
            <Text
              style={commonStyles.textWhite(18, {
                color: currentThemeSecondaryColor,
                alignSelf: "center",
                marginTop: moderateScale(10),
              })}
            >
              Sign up with
            </Text>
            <View style={styles.socialLoginContainer}>
              {images.map((item, index) => {
                return (
                  <PressableImage
                    key={index}
                    imageSource={item.imageSource}
                    onImagePress={() => onSocialLoginPress(item.id)}
                    imageStyle={styles.socialLoginImage(item.id)}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    height: windowHeight,
    width: windowWidth,
    padding: moderateScale(4),
    paddingBottom: moderateScale(12),
  },
  advertisementImage: {
    flex: 1,
  },
  fullInnerContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  commentSectionContainer: {
    minHeight: moderateScale(100),
    width: moderateScale(40),
    position: "absolute",
    right: moderateScale(0),
    bottom: windowHeight * 0.2,
    alignItems: "center",
  },
  restaurantImageContainer: {
    height: moderateScale(30),
    width: moderateScale(30),
    borderRadius: moderateScale(15),
    borderWidth: moderateScale(1),
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantImage: {
    height: moderateScale(28),
    width: moderateScale(28),
    borderRadius: moderateScale(14),
    overflow: "hidden",
  },
  likePostImage: {
    height: moderateScale(15),
    width: moderateScale(15),
    marginTop: moderateScale(10),
  },
  commentImage: {
    height: moderateScale(14),
    width: moderateScale(14),
    marginTop: moderateScale(10),
  },
  forceLoginModalFullContainer: (isDarkModeActive) => {
    return {
      flex: 1,
      backgroundColor: isDarkModeActive ? "rgba(1,1,1,0.2)" : "rgba(0,0,0,0.5)",
      justifyContent: "center",
    };
  },
  forceLoginModalInnerContainer: (currentThemePrimaryColor) => {
    return {
      backgroundColor: currentThemePrimaryColor,
      borderRadius: moderateScale(12),
      padding: moderateScale(10),
      paddingBottom: moderateScale(20),
    };
  },
  buttonsContainer: {
    flexDirection: "row",
    width: windowWidth * 0.9,
    alignSelf: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(20),
  },
  loginButton: {
    backgroundColor: colors.appPrimary,
    width: windowWidth * 0.4,
    // paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(6),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(14),
  },
  registrationButton: (currentThemePrimaryColor) => {
    return {
      backgroundColor: currentThemePrimaryColor,
      width: windowWidth * 0.4,
      // paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(6),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: moderateScale(14),
      borderWidth: 1,
      borderColor: colors.appPrimary,
    };
  },
  socialLoginImage: (id) => {
    return {
      height: moderateScale(30),
      width: moderateScale(30),
      marginLeft: id != 0 ? moderateScale(10) : 0,
    };
  },
  modalTopContainer: {
    marginTop: moderateScale(8),
    flexDirection: "row",
    // alignSelf: 'center',
    justifyContent: "flex-start",
  },
  singleDetailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: moderateScale(12),
  },
  singleImageStyle: {
    height: moderateScale(10),
    width: moderateScale(10),
    resizeMode: "stretch",
  },
  borderStyle: {
    height: moderateScale(0.7),
    width: windowWidth,
    backgroundColor: colors.lightGrey,
    marginTop: moderateScale(6),
  },
  likeViewContainer: {
    flexDirection: "row",
    width: windowWidth,
    alignSelf: "center",
    borderBottomWidth: moderateScale(0.7),
    borderBottomColor: colors.lightGrey,
    padding: moderateScale(7),
    alignItems: "center",
  },
  likedViewInnerContainer: {},
  singleTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  borderViewContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: moderateScale(10),
  },
  borderLine: {
    height: 2,
    backgroundColor: colors.grey,
    width: windowWidth * 0.3,
  },
  socialLoginContainer: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    marginTop: moderateScale(10),
  },
  shareIcon: {
    fontSize: 35,
    color: colors.white,
    marginTop: moderateScale(10),
  },
  singleRatingImage: { height: 25, width: 25, marginRight: 5 },
  closeLoginModalIcon: (currentThemeSecondaryColor) => {
    return {
      fontSize: moderateScale(14),
      color: currentThemeSecondaryColor,
      alignSelf: "flex-end",
    };
  },
});
