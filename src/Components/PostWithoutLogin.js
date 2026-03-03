import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Linking,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import { setLocation } from "../Redux/actions/actions";
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
import axios from "axios";
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
  setSearchingForQuickBites,
} from "../Redux/actions/actions";
import LoadingComponent from "../Components/LoadingComponent";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import CommonButton from "./CommonButton";
import { helperFunctions } from "../Constants/helperFunctions";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { PanGestureHandler } from "react-native-gesture-handler";
import Share from "react-native-share";

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
  const allPostsRef = useRef(allPosts);
  useEffect(() => {
    allPostsRef.current = allPosts;
  }, [allPosts]);
  const userLocation = useSelector((state) => state.userLocation);
  const showForceLoginModal = useSelector((state) => state.showForceLoginModal);
  const accessToken = useSelector((state) => state.accessToken);
  const searchingForQuickBites = useSelector(
    (state) => state.searchingQuickBites
  );
  const searchedQuickBitesName = useSelector(
    (state) => state.searchedQuickBiteName
  );
  const loadNewPosts = useSelector((state) => state.loadNewPosts);
  const postsRadius = useSelector((state) => state.postsRadius);

  const listRef = useRef();

  const [isLoading, setIsLoading] = useState(false);
  const [currentPostImageIndex, setCurrentPostImageIndex] = useState(0);
  const [componentHeight, setComponentHeight] = useState(windowHeight);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasLoadedCache, setHasLoadedCache] = useState(false);
  const POSTS_CACHE_KEY_GUEST = "cachedPosts_guest";
  const PAGE_SIZE = 9;
  const lastLoadMoreLengthRefGuest = useRef(0);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const requestLocation = () => {
    setIsLoading(true);
    const tryGetLocation = (useHighAccuracy = true) => {
      Geolocation.getCurrentPosition(
        (info) => {
          const coordinates = {
          latitude: info.coords.latitude,
          longitude: info.coords.longitude,
        };
        dispatch(setLocation(coordinates));
        helperFunctions.saveCachedLocation(coordinates);
        setIsLoading(false);
      },
        (err) => {
          if (useHighAccuracy) {
            tryGetLocation(false);
          } else {
            setIsLoading(false);
            if (err.code === 1) {
              Alert.alert(
                "Location Required",
                "Nearby restaurants require location permission. Please enable it in settings to continue.",
                [
                  { text: "Retry", onPress: () => requestLocation() },
                  { text: "Open Settings", onPress: () => Linking.openSettings() },
                ],
                { cancelable: false }
              );
            } else {
              Alert.alert(
                "Location Error",
                "We couldn't fetch your location. Please check your GPS settings and try again.",
                [
                  { text: "Retry", onPress: () => requestLocation() },
                ],
                { cancelable: false }
              );
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
    tryGetLocation(true);
  };

  async function getPostsWithoutLogin(isLoadMore = false) {
    if (
      !userLocation ||
      !userLocation.latitude ||
      !userLocation.longitude
    ) {
      console.error("❌ PostWithoutLogin: User location not available");
      dispatch(setPostsWithoutLogin([]));
      if (!isLoadMore) {
        setIsLoading(false);
      }
      return;
    }

    if (isLoadMore) {
      if (!nextPageToken) {
        console.log("ℹ️ No next page token available for load-more");
        return;
      }
      if (loadingMorePosts) {
        return;
      }
      setLoadingMorePosts(true);
    } else {
      setIsLoading(true);
    }

    try {
      console.log("📍 PostWithoutLogin: Fetching posts", {
        mode: isLoadMore ? "loadMore" : "initial",
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });

      const reqObj = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
      const response = await apiHandler.getPostsWithoutLogin(
        reqObj,
        postsRadius,
        isLoadMore ? nextPageToken : null
      );
      const rawPosts = (response?.posts || []).filter(Boolean);
      
      // Log posts data for debugging image issue
      if (rawPosts.length > 0 && !isLoadMore) {
        console.log(`📊 PostWithoutLogin: Received ${rawPosts.length} posts from API`);
        const firstPost = rawPosts[0];
        const imageUrl = firstPost?.restaurantImage 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=700&photo_reference=${firstPost.restaurantImage}&key=${GOOGLE_API_KEY}`
          : 'NO IMAGE';
        console.log(`📊 First post sample:`, {
          restaurantName: firstPost?.restaurantName,
          restaurantImage: firstPost?.restaurantImage ? firstPost.restaurantImage.substring(0, 50) + '...' : 'MISSING',
          restaurantImageType: typeof firstPost?.restaurantImage,
          restaurantImageLength: firstPost?.restaurantImage?.length,
          restaurant_id: firstPost?.restaurant_id,
          fullImageUrl: imageUrl.substring(0, 120) + '...',
        });
      }
      
      const limitedPosts = rawPosts.slice(0, PAGE_SIZE);

      if (limitedPosts.length === 0 && !isLoadMore && rawPosts.length === 0) {
        console.log("⚠️ PostWithoutLogin: No posts returned from API");
        
        // ✅ Only show blocking alert if we don't have any existing posts visible
        if (allPostsRef.current.length === 0) {
          dispatch(setPostsWithoutLogin([]));
          setIsLoading(false);

          // ✅ Show alert for guest user when no posts found
          const radiusInMiles = postsRadius || 20;
          Alert.alert(
            "No Restaurants Found",
            `We couldn't find any restaurants within your ${Math.round(radiusInMiles)} miles radius. Would you like to increase the search radius?`,
            [
              { text: "No", style: "cancel" },
              {
                text: "Increase Radius",
                onPress: () => navigation.navigate(navigationStrings.SearchScreen),
              },
            ]
          );
        } else {
          // If we already have posts, just show a non-blocking toast
          setIsLoading(false);
          // Toast is handled by SinglePostComponent usually but here we might need one or just silent fail
          console.log("⏸️ PostWithoutLogin: No new posts, but keeping existing ones.");
        }
        return;
      }

      const basePosts = isLoadMore ? allPosts : [];
      const mergedPosts = [...basePosts, ...limitedPosts];
      const uniquePosts = Array.from(
        new Map(
          mergedPosts.map((item, index) => [
            item?.restaurant_id ||
              item?.id ||
              `${item?.restaurantName}-${index}`,
            item,
          ])
        ).values()
      );

      dispatch(setPostsWithoutLogin(uniquePosts));
      const newNextPageToken = response?.nextPageToken || null;
      setNextPageToken(newNextPageToken);
      
      // Save cache with nextPageToken
      await helperFunctions.saveCachedPosts(
        uniquePosts,
        POSTS_CACHE_KEY_GUEST,
        10,
        newNextPageToken
      );
      
      // Set ref appropriately after load completes
      if (isLoadMore) {
        // After load more: if nextPageToken exists, keep ref at old total to allow next load more
        // If no nextPageToken, set to new total (no more pages available)
        if (newNextPageToken) {
          // More pages available - keep ref at old total so next load more can trigger
          // Ref was set to old total in scroll handler, don't change it
          console.log(`✅ Load more completed: new total=${uniquePosts.length}, nextPageToken exists, ref stays at old value for next trigger`);
        } else {
          // No more pages - set ref to new total (matches SinglePostComponent line 810)
          lastLoadMoreLengthRefGuest.current = uniquePosts.length;
          console.log(`✅ Load more completed: new total=${uniquePosts.length}, no more pages, lastLoad=${lastLoadMoreLengthRefGuest.current}`);
        }
      } else {
        // Initial load - keep ref at 0 (will be set when load more triggers)
        lastLoadMoreLengthRefGuest.current = 0;
        console.log(`✅ Initial load completed: total=${uniquePosts.length}, lastLoad reset to 0`);
      }

      if (!isLoadMore && uniquePosts.length > 0) {
        listRef.current?.scrollToIndex({ index: 0 });
      }

      console.log(
        "✅ PostWithoutLogin: Total posts stored after fetch",
        uniquePosts.length
      );
    } catch (error) {
      console.error("❌ Error loading posts without login:", error);
    } finally {
      if (isLoadMore) {
        setLoadingMorePosts(false);
      } else {
        setIsLoading(false);
      }
    }
  }

  const searchQuickBitesPlaces = async () => {
    try {
      setIsLoading(true);
      let response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
          userLocation.latitude
        }%2C${
          userLocation.longitude
        }&radius=20000&type=restaurant&keyword=${encodeURIComponent(
          searchedQuickBitesName
        )}&key=${GOOGLE_API_KEY}`
      );

      let placesData = response?.data?.results
        ?.filter((item) => {
          const types = item.types || [];
          const isHotel = types.includes("lodging");
          const isShoppingMall = types.includes("shopping_mall");
          return !isHotel && !isShoppingMall;
        })
        ?.map((item, index) => {
          if (item.photos && item.photos.length > 0) {
            return {
              restaurantName: item.name,
              restaurantRating: item.rating,
              restaurantPrice: item.price_level,
              restaurantImage:
                item.photos &&
                item.photos.length > 0 &&
                item.photos[0].photo_reference,
              restaurantTiming: item.opening_hours,
              restaurant_id: item.place_id,
              isGoogle: true,
              address: item.vicinity || null,
              latitude: item.geometry?.location?.lat || null,
              longitude: item.geometry?.location?.lng || null,
            };
          }
        })
        .filter(Boolean); // Remove undefined items

      dispatch(setPostsWithoutLogin(placesData));
      dispatch(setSearchingForQuickBites(""));
      if (placesData.length > 0) {
        listRef.current?.scrollToIndex({ index: 0 });
      }
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Error searching quick bites:", error);
      dispatch(setSearchingForQuickBites(""));
      setIsLoading(false);
    }
  };

  // Load cache first on mount (offline-first approach)
  useEffect(() => {
    const hydrateCache = async () => {
      if (allPosts.length === 0 && !hasLoadedCache) {
        console.log("📦 PostWithoutLogin: Loading cache on mount...");
        const cacheResult = await helperFunctions.loadCachedPosts(
          POSTS_CACHE_KEY_GUEST
        );
        if (cacheResult.posts && cacheResult.posts.length > 0) {
          console.log(`✅ PostWithoutLogin: Loaded ${cacheResult.posts.length} cached posts`);
          dispatch(setPostsWithoutLogin(cacheResult.posts));
          if (cacheResult.nextPageToken) {
            setNextPageToken(cacheResult.nextPageToken);
          }
          // Keep ref at 0 when loading from cache (will be set when load more triggers)
          lastLoadMoreLengthRefGuest.current = 0;
          console.log(`✅ Cache loaded: lastLoadMoreLengthRefGuest reset to 0`);
          setHasLoadedCache(true);
          // Set loadNewPosts to false to prevent immediate network request
          dispatch(setLoadNewPosts(false));
        } else {
          console.log("⚠️ PostWithoutLogin: No cached posts found");
          // Only show loader if we have to fetch fresh data and have no cache
          setIsLoading(true);
          lastLoadMoreLengthRefGuest.current = 0;
          setHasLoadedCache(true);
        }
      }
    };
    hydrateCache();
  }, []);

  useEffect(() => {
    if (
      !userLocation ||
      !userLocation.latitude ||
      !userLocation.longitude ||
      searchingForQuickBites ||
      accessToken ||
      !hasLoadedCache
    ) {
      return;
    }

    // If cache was loaded, fetch fresh data in background
    // If no cache, fetch immediately
    if (loadNewPosts || (allPosts.length === 0 && hasLoadedCache)) {
      console.log("🔄 PostWithoutLogin: Fetching fresh posts from API");
      getPostsWithoutLogin(false);
    }
  }, [userLocation, searchingForQuickBites, loadNewPosts, accessToken, hasLoadedCache]);

  useEffect(() => {
    if (!accessToken && userLocation && hasLoadedCache) {
      console.log("🔄 User logged out, checking if posts need reload");
      setNextPageToken(null);
      lastLoadMoreLengthRefGuest.current = 0;
      // If no posts, reload cache or fetch fresh
      if (allPosts.length === 0) {
        const reloadCache = async () => {
          const cacheResult = await helperFunctions.loadCachedPosts(
            POSTS_CACHE_KEY_GUEST
          );
          if (cacheResult.posts && cacheResult.posts.length > 0) {
            console.log(`✅ PostWithoutLogin: Reloaded ${cacheResult.posts.length} cached posts after logout`);
            dispatch(setPostsWithoutLogin(cacheResult.posts));
            if (cacheResult.nextPageToken) {
              setNextPageToken(cacheResult.nextPageToken);
            }
          } else {
            // No cache, fetch fresh data
            console.log("⚠️ No cache found after logout, fetching fresh posts");
            getPostsWithoutLogin(false);
          }
        };
        reloadCache();
      }
    }
  }, [accessToken, userLocation, hasLoadedCache]);

  useEffect(() => {
    if (
      searchingForQuickBites &&
      userLocation &&
      userLocation.latitude &&
      userLocation.longitude
    ) {
      searchQuickBitesPlaces();
    }
  }, [searchingForQuickBites, userLocation]);

  const onPostSideTap = (side, item) => {
    const images = item.restaurantImages || [item.restaurantImage];

    if (images.length <= 1) return;

    if (side === "right") {
      if (currentPostImageIndex < images.length - 1) {
        setCurrentPostImageIndex(currentPostImageIndex + 1);
      } else {
        setCurrentPostImageIndex(0);
      }
    } else {
      if (currentPostImageIndex > 0) {
        setCurrentPostImageIndex(currentPostImageIndex - 1);
      } else {
        setCurrentPostImageIndex(images.length - 1);
      }
    }
  };

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
              const radiusInMiles = Number(userSettings.search_radius) * 0.621371;
              dispatch(savePostsRadius(radiusInMiles));
              console.log("✅ Loaded radius:", radiusInMiles, "miles");
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
              //  console.log("✅ Loaded categories:", savedCategories);
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
              const radiusInMiles = Number(userSettings.search_radius) * 0.621371;
              dispatch(savePostsRadius(radiusInMiles));
              console.log("✅ Loaded radius:", radiusInMiles, "miles");
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
               // console.log("✅ Loaded categories:", savedCategories);
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

          // ⚠️ IMPORTANT: Set token and trigger post loading TOGETHER LAST
          // This ensures SinglePostComponent starts with correct preferences
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

  const handleGesture = (event, item) => {
    if (event.nativeEvent.state == 5) {
      if (event.nativeEvent.translationX < -50) {
        if (item && item.restaurant_id) {
          navigation.navigate(navigationStrings.ViewRestaurant, {
            restaurant_id: item.restaurant_id,
          });
        } else {
          dispatch(showHideForceLoginModal(true));
        }
      } else if (event.nativeEvent.translationX > 50) {
        dispatch(showHideForceLoginModal(true));
      }
    }
  };

  const onLikePress = (item) => {
    // Check if user is logged in
    if (!accessToken) {
      // Not logged in - show login modal
      dispatch(showHideForceLoginModal(true));
      return;
    }
    // If logged in, navigate to restaurant details or handle like
    // For now, just show login modal as likes require backend
    dispatch(showHideForceLoginModal(true));
  };

  const onSharePress = (item) => {
    // Share doesn't require login - use native share
    Share.open({
      message: `Found this on Crunchy — check it out! ${item.restaurantName || "this restaurant"}\nhttps://maps.googleapis.com/maps/api/place/details/json?place_id=${item.restaurant_id}&key=${GOOGLE_API_KEY}`,
    }).catch((err) => {
      console.log("Share error:", err);
    });
  };

  const onCommentPress = (item) => {
    // Allow viewing comments - navigate to restaurant details
    // Login check will happen when trying to write comment
    navigation.navigate(navigationStrings.ViewRestaurant, {
      restaurant_id: item.restaurant_id,
    });
  };

  const onRestaurantImagePress = (item) => {
    // Navigate to restaurant details
    navigation.navigate(navigationStrings.ViewRestaurant, {
      restaurant_id: item.restaurant_id,
    });
  };

  // Memoize getImageSource to prevent unnecessary re-creation
  const getImageSource = useCallback((restaurantImage) => {
    if (!restaurantImage || restaurantImage === "" || typeof restaurantImage !== 'string') {
      return imagePath.americanFoodImage;
    }
    
    // Check if it's already a full URL (including lh3.googleusercontent.com format)
    if (restaurantImage.startsWith("http://") || restaurantImage.startsWith("https://")) {
      // Return as-is for React Native Image component
      return { uri: restaurantImage };
    }
    
    const cleanPhotoRef = restaurantImage.trim();
    
    // Validate photo_reference is not empty and has reasonable length
    if (cleanPhotoRef.length < 10) {
      console.warn("⚠️ Invalid photo_reference (too short):", cleanPhotoRef);
      return imagePath.americanFoodImage;
    }
    
    // Build Google Places photo URL - Use encodeURIComponent for the photo_reference
    const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=700&photo_reference=${encodeURIComponent(cleanPhotoRef)}&key=${GOOGLE_API_KEY}`;
    
    return { uri: imageUrl };
  }, [GOOGLE_API_KEY]);

  // Memoize renderPost to prevent unnecessary re-renders on scroll
  const renderPost = useCallback(
    ({ item, index }) => {
      if (!item) {
        return null;
      }

      const currentImage =
        item.restaurantImages && item.restaurantImages.length > 0
          ? item.restaurantImages[currentPostImageIndex] || item.restaurantImage
          : item.restaurantImage;

      // Compute image source directly - getImageSource is already memoized
      const imageSource = currentImage
        ? getImageSource(currentImage)
        : imagePath.americanFoodImage;

      return (
        <ImageBackground
          resizeMode="cover"
          source={imageSource}
          style={{
            height: componentHeight,
            width: windowWidth,
            padding: moderateScale(4),
            paddingBottom: moderateScale(12),
          }}
          onError={(error) => {
            console.error("❌ ImageBackground error:", error.nativeEvent?.error);
            const fullUrl =
              typeof imageSource === "object" && imageSource.uri
                ? imageSource.uri
                : "no uri";
            console.error("❌ Failed URL (full):", fullUrl);
            console.error(
              "❌ Failed URL (first 200 chars):",
              fullUrl.substring(0, 200)
            );
            console.error("❌ Item data:", {
              restaurantName: item?.restaurantName,
              restaurantImage: item?.restaurantImage?.substring(0, 100),
              restaurantImageLength: item?.restaurantImage?.length,
              imageSourceType: typeof imageSource,
              hasUri: !!(imageSource && imageSource.uri),
              urlLength: fullUrl.length,
            });
          }}
          onLoad={() => {
            if (index === 0) {
              console.log(
                "✅ ImageBackground loaded successfully for first post"
              );
              console.log(
                "✅ Image URL:",
                typeof imageSource === "object" && imageSource.uri
                  ? imageSource.uri.substring(0, 100)
                  : "local image"
              );
            }
          }}
          onLoadStart={() => {
            if (index === 0) {
              console.log("🔄 ImageBackground loading started");
              console.log(
                "🔄 Loading URL:",
                typeof imageSource === "object" && imageSource.uri
                  ? imageSource.uri.substring(0, 150)
                  : "local image"
              );
            }
          }}
        >
          <View style={styles.sideTapContainer}>
            <TouchableOpacity
              style={styles.leftTap}
              activeOpacity={1}
              onPress={() => onPostSideTap("left", item)}
            />
            <TouchableOpacity
              style={styles.rightTap}
              activeOpacity={1}
              onPress={() => onPostSideTap("right", item)}
            />
          </View>
          <PanGestureHandler
            failOffsetY={[-5, 5]}
            activeOffsetX={[-5, 5]}
            onHandlerStateChange={(event) => {
              handleGesture(event, item);
            }}
          >
            <View
              pointerEvents="box-none"
              style={[styles.fullInnerContainer, { zIndex: 20 }]}
            >
              <View
                pointerEvents="box-none"
                style={styles.commentSectionContainer}
              >
                <TouchableOpacity
                  style={styles.restaurantImageContainer}
                  onPress={() => onRestaurantImagePress(item)}
                >
                  <Image
                    source={imageSource}
                    style={styles.restaurantImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error(
                        "❌ Small Image error:",
                        error.nativeEvent?.error
                      );
                      console.error(
                        "❌ Item restaurantImage:",
                        item?.restaurantImage?.substring(0, 100)
                      );
                      console.error(
                        "❌ Full photo_reference length:",
                        item?.restaurantImage?.length
                      );
                    }}
                    onLoad={() => {
                      if (index === 0) {
                        console.log("✅ Small Image loaded successfully");
                      }
                    }}
                    onLoadStart={() => {
                      if (index === 0) {
                        console.log("🔄 Small Image loading started");
                      }
                    }}
                  />
                </TouchableOpacity>
                <PressableImage
                  imageSource={imagePath.unlikedPost}
                  imageStyle={styles.likePostImage}
                  onImagePress={() => onLikePress(item)}
                />
                <PressableImage
                  imageSource={imagePath.commentImage}
                  imageStyle={styles.commentImage}
                  onImagePress={() => onCommentPress(item)}
                />
                <Entypo
                  name="share"
                  style={styles.shareIcon}
                  onPress={() => onSharePress(item)}
                />
              </View>
              <View
                pointerEvents="box-none"
                style={{
                  minHeight: moderateScale(100),
                  width: windowWidth * 0.7,
                  padding: moderateScale(5),
                  position: "absolute",
                  left: moderateScale(0),
                  bottom: windowHeight * 0.1,
                  zIndex: 21,
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
                {item && item.restaurantRating && (
                  <View
                    pointerEvents="none"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.85)",
                      paddingHorizontal: moderateScale(4),
                      paddingVertical: moderateScale(2),
                      borderRadius: moderateScale(4),
                      alignSelf: "flex-start",
                      marginTop: moderateScale(4),
                    }}
                  >
                    {helperFunctions.getStarRatings(item.restaurantRating)}
                    <Text
                      style={commonStyles.textWhite(18, {
                        textShadowColor: colors.black,
                        textShadowOffset: { width: 2, height: 2 },
                        textShadowRadius: 5,
                        fontWeight: "700",
                        color: colors.white,
                      })}
                    >
                      {item.restaurantRating}
                    </Text>
                  </View>
                )}
                {item &&
                item.restaurantPrice !== null &&
                item.restaurantPrice !== undefined &&
                typeof item.restaurantPrice === "number" &&
                item.restaurantPrice > 0 ? (
                  <View
                    pointerEvents="none"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.85)",
                      paddingHorizontal: moderateScale(4),
                      paddingVertical: moderateScale(2),
                      borderRadius: moderateScale(4),
                      alignSelf: "flex-start",
                      marginTop: moderateScale(4),
                    }}
                  >
                    <Text
                      style={commonStyles.textWhite(18, {
                        textShadowColor: colors.black,
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 3,
                        fontWeight: "700",
                        color: colors.white,
                      })}
                    >
                      $ {item.restaurantPrice}
                    </Text>
                  </View>
                ) : null}
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
    },
    [
      componentHeight,
      getImageSource,
      handleGesture,
      onRestaurantImagePress,
      onLikePress,
      onCommentPress,
      onSharePress,
      currentPostImageIndex,
    ]
  );

  return (
    <View style={commonStyles.flexFull}>
      {isLoading && <LoadingComponent title={"Fetching nearby restaurants"} />}
      <FlatList
        ref={listRef}
        data={allPosts}
        renderItem={renderPost}
        keyExtractor={(item, index) =>
          item.restaurant_id
            ? `guest-post-${item.restaurant_id}-${index}`
            : `guest-post-${index}`
        }
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={3}
        onLayout={(event) => {
          setComponentHeight(event.nativeEvent.layout.height);
        }}
        onMomentumScrollEnd={(evt) => {
          if (!componentHeight) {
            return;
          }
          const currentHeight = evt.nativeEvent.contentOffset.y;
          const currentIndex = Math.round(currentHeight / componentHeight);
          setCurrentPostImageIndex(0);
          const totalPosts = allPosts.length;
          const remainingPosts = totalPosts - currentIndex - 1;
          
          console.log(`📍 PostWithoutLogin Scroll: Index ${currentIndex} of ${totalPosts} (${remainingPosts} remaining)`);
          console.log(`📍 Load more check:`, {
            totalPosts,
            remainingPosts,
            loadingMorePosts,
            hasNextPageToken: !!nextPageToken,
            lastLoadLength: lastLoadMoreLengthRefGuest.current,
          });
          
          // Match SinglePostComponent logic: trigger when at the end
          // For pagination with nextPageToken: if nextPageToken exists, allow load more
          // The ref check prevents duplicate calls during same scroll event
          // If ref === totalPosts but nextPageToken exists, it means we just loaded but more is available
          const hasMorePages = nextPageToken !== null && nextPageToken !== undefined;
          const shouldTrigger = totalPosts > 0 &&
            remainingPosts <= 0 &&
            !loadingMorePosts &&
            hasMorePages &&
            lastLoadMoreLengthRefGuest.current !== totalPosts;
          
          if (shouldTrigger) {
            console.log("🚀 PostWithoutLogin: Reached end of list, loading more posts...");
            // Set ref BEFORE calling to prevent duplicate calls (matches SinglePostComponent line 2341)
            lastLoadMoreLengthRefGuest.current = totalPosts;
            getPostsWithoutLogin(true);
          } else {
            console.log("⏸️ PostWithoutLogin: Load more skipped", {
              reason: !totalPosts ? "no posts" :
                      remainingPosts > 0 ? `not at end (${remainingPosts} remaining)` :
                      loadingMorePosts ? "already loading" :
                      !nextPageToken ? "no next page token" :
                      lastLoadMoreLengthRefGuest.current === totalPosts ? "already loaded" : "unknown"
            });
          }
        }}
        keyExtractor={(item, index) => item?.restaurant_id?.toString() || index.toString()}
        ListEmptyComponent={() => {
          // Don't show empty component while loading
          if (isLoading) {
            return null;
          }

          if (!userLocation || !userLocation.latitude) {
            return (
              <View
                style={{
                  height: componentHeight,
                  width: windowWidth,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: currentThemePrimaryColor,
                  paddingHorizontal: moderateScale(20),
                }}
              >
                <Ionicons name="location-outline" size={moderateScale(50)} color={colors.appPrimary} />
                <Text style={commonStyles.textWhite(18, { color: currentThemeSecondaryColor, textAlign: 'center', marginTop: moderateScale(10) })}>
                  Nearby restaurants require your location.
                </Text>
                <CommonButton 
                  buttonTitle="Enable Location" 
                  onButtonPress={requestLocation}
                  buttonStyle={{ marginTop: moderateScale(20), width: windowWidth * 0.6 }}
                />
              </View>
            );
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
  sideTapContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    zIndex: 10,
  },
  leftTap: {
    width: "30%",
    height: "100%",
  },
  rightTap: {
    width: "30%",
    height: "100%",
    position: "absolute",
    right: 0,
  },
});
