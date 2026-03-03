import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  Vibration,
  View,
  ActivityIndicator,
  Linking,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
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
  fontScalingFactor,
  POSTS_IMAGE_BASE_URL,
  USER_PROFILE_BASE_URL,
  ADVERTISEMENTS_BASE_URL,
} from "../Constants/globalConstants";
import { imagePath } from "../Constants/imagePath";
import Entypo from "react-native-vector-icons/Entypo";
import PressableImage from "./PressableImage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { navigationStrings } from "../Navigation/NavigationStrings";
import {
  FlatList,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandler,
  ScrollView,
} from "react-native-gesture-handler";
import {
  setAllPosts,
  setLoadNewPosts,
  setLoadRandomPosts,
  setSearchingForQuickBites,
  setUserData,
  setFavoriteRestaurants,
  setFavouritePlaces,
  updateFavoriteRestaurants,
  updateFavouritePlaces,
  updateLikedPosts,
  updatePost,
  setLocation,
} from "../Redux/actions/actions";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import DeletePostModal from "./DeletePostModal";
import { apiHandler } from "../Constants/apiHandler";
import LoadingComponent from "./LoadingComponent";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import dynamicLinks, {
  firebase,
  FirebaseDynamicLinksTypes,
} from "@react-native-firebase/dynamic-links";
import { helperFunctions } from "../Constants/helperFunctions";
import Video from "react-native-video";
import axios from "axios";
import CustomToast from "./CustomToast";
import ErrorComponent from "./ErrorComponent";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import InAppReview from "react-native-in-app-review";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DoubleClick from "./DoubleClick";
import CommonButton from "./CommonButton";

// Google AdMob Banner Ad IDs (test IDs from old project)
const bannerAdId =
  Platform.OS == "android"
    ? "ca-app-pub-3940256099942544/6300978111"
    : "ca-app-pub-3940256099942544/2934735716";
import Share from "react-native-share";
const RNFS = require("react-native-fs");

export default function SinglePostComponent({}) {
  const tabBarData = [
    {
      id: 0,
      type: "Comment",
    },
    {
      id: 1,
      type: "Like",
    },
  ];

  const accessToken = useSelector((state) => state.accessToken);
  const allPosts = useSelector((state) => state.allPosts);
  const allPostsRef = useRef(allPosts);
  useEffect(() => {
    allPostsRef.current = allPosts;
  }, [allPosts]);
  const userDetails = useSelector((state) => state.userData);
  const userLocation = useSelector((state) => state.userLocation);
  const loadNewPosts = useSelector((state) => state.loadNewPosts);
  const likedGooglePlaces = useSelector((state) => state.likedGooglePlaces);
  const savedFoodCategories = useSelector((state) => state.savedFoodCategories);
  const savedPostsRadius = useSelector((state) => state.postsRadius);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );
  const likedPosts = useSelector((state) => state.likedPosts);
  const adminAdvertisements = useSelector((state) => state.adminAdvertisements);
  const searchingForQuickBites = useSelector(
    (state) => state.searchingQuickBites
  );
  const searchedQuickBitesName = useSelector(
    (state) => state.searchedQuickBiteName
  );
  const [postDetails, setPostDetails] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState(tabBarData[0]);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loaderTitle, setLoaderTitle] = useState("");
  const [comment, setComment] = useState("");
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [showExpandedReview, setShowExpandedReview] = useState(false);
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [customToastMessage, setCustomToastMessage] = useState("");
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletedPostIndex, setDeletedPostIndex] = useState(0);
  const [componentHeight, setComponentHeight] = useState(windowHeight);
  const [likingPost, setLikingPost] = useState(false);
  const [opacity] = useState(new Animated.Value(0));
  const [playOpacity] = useState(new Animated.Value(0));
  const [showLoadingMorePosts, setShowLoadingMorePosts] = useState(false);
  const [currentIncrementValue, setCurrentIncrementValue] = useState(1);
  const [isPausingVideo, setIsPausingVideo] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [currentPostImageIndex, setCurrentPostImageIndex] = useState(0);
  const [hasLoadedCache, setHasLoadedCache] = useState(false);

  const videoRef = useRef();

  const carouselRef = useRef();
  
  // Track loading state to prevent multiple simultaneous loading indicators
  const isLoadingRef = useRef(false);
  const loadingOperationsRef = useRef(new Set());

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const isFocused = useIsFocused();
  const POSTS_CACHE_KEY = "cachedPosts_loggedIn";
  const PAGE_SIZE = 9;
  const lastLoadMoreLengthRef = useRef(0);

  // Helper function to safely set loading state
  const setLoadingState = (loading, title = "", operationId = "") => {
    if (loading) {
      // If already loading, just add this operation to the set
      if (operationId) {
        loadingOperationsRef.current.add(operationId);
      }
      if (!isLoadingRef.current) {
        isLoadingRef.current = true;
        setIsLoading(true);
        if (title) {
          setLoaderTitle(title);
        }
      } else if (title) {
        // Update title if different operation is loading
        setLoaderTitle(title);
      }
    } else {
      // Remove operation from set
      if (operationId) {
        loadingOperationsRef.current.delete(operationId);
      }
      // Only set loading to false if no other operations are in progress
      if (loadingOperationsRef.current.size === 0 && isLoadingRef.current) {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  };

  // Load cached posts on mount (offline-first approach)
  useEffect(() => {
      const loadCachedPosts = async () => {
      // Only load cache if:
      // 1. User is logged in (has accessToken)
      // 2. Redux state has no posts (fresh app start)
      // 3. Not explicitly requesting new posts
      if (accessToken && allPosts.length === 0) {
        const operationId = "hydrateCache";
        try {
          // Check cache without blocking UI if possible
          console.log("📦 Loading cached posts from AsyncStorage...");
          const cachedPosts = await helperFunctions.loadCachedPosts(
            POSTS_CACHE_KEY
          );
          
          if (cachedPosts && cachedPosts.posts && cachedPosts.posts.length > 0) {
            console.log(`✅ Loaded ${cachedPosts.posts.length} cached posts`);
            cachedPosts.posts.forEach((item) => {
              if (item) item.isPaused = true;
            });
            dispatch(setAllPosts(cachedPosts.posts));
            if (cachedPosts.posts.length > 0) {
              setPostDetails(cachedPosts.posts[0]);
            }
            dispatch(setLoadNewPosts(false));
          } else {
            console.log("⚠️ No cached posts found - Will fetch from server");
            // Only show loader if we HAVE to fetch from server and have no cache
            setLoadingState(true, "Loading your feed...", operationId);
          }
        } catch (error) {
          console.error("❌ Error loading cached posts:", error);
        } finally {
          setHasLoadedCache(true);
          setLoadingState(false, "", operationId);
        }
      } else {
        setHasLoadedCache(true);
      }
    };

    loadCachedPosts();
  }, []); // Only run once on mount

  useEffect(() => {
    if (allPosts.length === 0) {
      lastLoadMoreLengthRef.current = 0;
    }
  }, [allPosts.length]);

  useEffect(() => {
    console.log("🔄 SinglePostComponent useEffect triggered", {
      isFocused,
      loadNewPosts,
      hasAccessToken: !!accessToken,
      hasUserLocation: !!userLocation,
      categoriesCount: savedFoodCategories?.length,
      existingPostsCount: allPosts.length,
    });

    // Offline-first approach: Only fetch from server if:
    // 1. loadNewPosts is true (explicit request to load/reload), OR
    // 2. No cache exists (allPosts.length === 0) AND user is logged in AND location available
    // This ensures we prioritize cache over server calls
    const shouldFetchFromServer =
      loadNewPosts || // Explicit refresh requested
      (allPosts.length === 0 && accessToken && userLocation && hasLoadedCache); // No cache, need initial load

    if (
      shouldFetchFromServer &&
      accessToken &&
      userLocation &&
      !isLoadingRef.current
    ) {
      // If loadNewPosts is true, clear cache before fetching
      if (loadNewPosts) {
      console.log("🔄 Explicit refresh requested - clearing cache before fetch");
      helperFunctions.clearCachedPosts(POSTS_CACHE_KEY);
      }
      
      console.log("✅ Calling getServerPosts with:", {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        categories: savedFoodCategories?.length,
        radius: savedPostsRadius,
        isInitialLoad: allPosts.length === 0,
        willReplaceCache: true,
        reason: loadNewPosts ? "explicit_refresh" : "no_cache",
      });
      setCurrentIncrementValue(1);
      getServerPosts();
    } else {
      console.log("⚠️ Not loading posts because:", {
        loadNewPosts,
        hasAccessToken: !!accessToken,
        hasUserLocation: !!userLocation,
        alreadyLoading: isLoadingRef.current,
        existingPostsCount: allPosts.length,
        shouldFetch: shouldFetchFromServer,
      });
    }

    allPosts.map((item, index) => {
      item.isPaused = true;
    });

    // Prevent concurrent calls - if getServerPosts is running, don't start searchQuickBitesPlaces
    if (searchingForQuickBites && !isLoadingRef.current) {
      searchQuickBitesPlaces();
    }
  }, [isFocused, loadNewPosts, accessToken, userLocation, hasLoadedCache]);

  const searchQuickBitesPlaces = async () => {
    const operationId = "searchQuickBites";
    // Prevent concurrent calls
    if (isLoadingRef.current && loadingOperationsRef.current.has(operationId)) {
      return;
    }
    try {
      setLoadingState(true, `Fetching ${searchedQuickBitesName} restaurants`, operationId);
      let arrPostsWithAdminAds = [];
      let arrPostsWithAllAds = [];
      let response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
          userLocation.latitude
        }%2C${userLocation.longitude}&radius=${
          savedPostsRadius * 1000
        }&type=restaurant&keyword=${encodeURIComponent(
          searchedQuickBitesName
        )}&key=${GOOGLE_API_KEY}`
      );
      let placesData = [];
      placesData = response?.data?.results
        ?.filter((item) => {
          // Exclude hotels and shopping centers - only food-related places
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
        });

      let totalPostsCount = placesData.length;
      for (var i = 0; i < totalPostsCount; i++) {
        if (i % 4 == 0 && i != 0) {
          let randomAdIndex = Math.floor(
            Math.random() * adminAdvertisements.length
          );
          if (adminAdvertisements && adminAdvertisements.length > 0) {
            let randomAdvertisment = adminAdvertisements[randomAdIndex];
            arrPostsWithAdminAds.push({
              id: randomAdvertisment.id,
              isAdvertisement: true,
              adTitle: randomAdvertisment.title,
              adDescription: randomAdvertisment.description,
              adType: randomAdvertisment.mediaType,
              adMediaSource: randomAdvertisment.mediaSource,
              isPaused: false, // Video ads will auto-play when in view
            });
          } else {
            // If no ads available, still push the post
            arrPostsWithAdminAds.push(placesData[i]);
          }
        } else {
          arrPostsWithAdminAds.push(placesData[i]);
        }
      }
      for (var j = 0; j < arrPostsWithAdminAds.length; j++) {
        if (j % 7 == 0 && j != 0) {
          let objGoogleAd = {
            isGoogleAd: true,
          };
          arrPostsWithAllAds.push(objGoogleAd);
        } else {
          arrPostsWithAllAds.push(arrPostsWithAdminAds[j]);
        }
      }
      arrPostsWithAllAds = arrPostsWithAllAds.filter((item, index, self) => {
        if (item) {
          return item;
        }
      });
      setPostDetails(arrPostsWithAllAds[0]);
      dispatch(setAllPosts(arrPostsWithAllAds));
      lastLoadMoreLengthRef.current = arrPostsWithAllAds.length;
      // Save to AsyncStorage cache
      await helperFunctions.saveCachedPosts(arrPostsWithAllAds, POSTS_CACHE_KEY, 10);
      dispatch(setSearchingForQuickBites(""));
      if (placesData.length > 0) {
        carouselRef.current.scrollToIndex({ index: 0 });
      }
      setLoadingState(false, "", operationId);
    } catch (err) {
      console.log("Error searching quick bites:", err);
      dispatch(setSearchingForQuickBites(""));
      setLoadingState(false, "", operationId);
    }
  };

  const requestLocation = () => {
    setLoadingState(true, "Fetching location...", "requestLocation");
    const tryGetLocation = (useHighAccuracy = true) => {
      Geolocation.getCurrentPosition(
        (info) => {
          const coordinates = {
          latitude: info.coords.latitude,
          longitude: info.coords.longitude,
        };
        dispatch(setLocation(coordinates));
        helperFunctions.saveCachedLocation(coordinates);
        setLoadingState(false, "", "requestLocation");
      },
        (err) => {
          if (useHighAccuracy) {
            tryGetLocation(false);
          } else {
            setLoadingState(false, "", "requestLocation");
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

  const getServerPosts = async () => {
    const operationId = "getServerPosts";
    // Prevent concurrent calls
    if (isLoadingRef.current && loadingOperationsRef.current.has(operationId)) {
      console.log("⚠️ getServerPosts: Already loading, skipping");
      return;
    }
    
    // ✅ Set loading ref synchronously before any awaits to prevent race conditions
    isLoadingRef.current = true;
    loadingOperationsRef.current.add(operationId);
    
    // Ensure we have required data
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.error("❌ getServerPosts: User location not available");
      dispatch(setLoadNewPosts(false));
      return;
    }
    
    if (!accessToken) {
      console.error("❌ getServerPosts: Access token not available");
      dispatch(setLoadNewPosts(false));
      return;
    }
    
    try {
      setLoadingState(true, "Searching for yummy restaurants", operationId);
      
      // Always use user's location and saved radius
      const radiusInMiles = savedPostsRadius || 20; // Default to 20 miles if not set
      const radiusInKm = radiusInMiles * 1.609; // Convert miles to kilometers
      const MIN_RESTAURANTS_THRESHOLD = 5; // Minimum restaurants to show notification
      let response;
      let arrPostsWithAdminAds = [];
      let arrPostsWithAllAds = [];
      
      console.log("📍 getServerPosts: Fetching posts with:", {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: radiusInKm,
        radiusMiles: radiusInMiles,
        savedRadiusFromPreferences: savedPostsRadius,
        categoriesCount: savedFoodCategories?.length || 0,
      });
      
      if (savedFoodCategories && savedFoodCategories.length > 0) {
        let arrCategoryNames = [];
        let arrCategoryIds = [];
        arrCategoryNames = savedFoodCategories.map((item, index) => {
          return item.name;
        });
        arrCategoryIds = savedFoodCategories.map((item, index) => {
          return item.id;
        });
        let reqObj = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          category_id: arrCategoryIds,
        };
        response = await apiHandler.getPosts(
          reqObj,
          radiusInKm, // Pass radius in kilometers
          accessToken,
          arrCategoryNames
        );
      } else {
        let reqObj = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          category_id: [],
        };
        response = await apiHandler.getPosts(
          reqObj,
          radiusInKm, // Pass radius in kilometers
          accessToken
        );
      }
      response = response.map((item, index) => {
        if (item) {
          return {
            ...item,
            isPaused: true,
          };
        }
      });
      
      // ✅ Frontend radius filtering - validate posts are within selected radius
      const filteredResponse = response.filter((item) => {
        if (!item) return false;
        
        // Skip ads and special items
        if (item.isAdvertisement || item.isGoogleAd) return true;
        
        // If post has latitude/longitude, calculate distance
        if (item.latitude && item.longitude && userLocation) {
          const distance = helperFunctions.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            item.latitude,
            item.longitude
          );
          return distance <= radiusInMiles;
        }
        
        // If no coordinates, include it (backend should have filtered, but include for safety)
        return true;
      });
      
      console.log(`📍 getServerPosts: Radius filtering - ${response.length} posts before, ${filteredResponse.length} posts after (radius: ${radiusInMiles} miles)`);
      
      // Check if insufficient restaurants found (notification will be shown after ads are added)
      if (filteredResponse.length < MIN_RESTAURANTS_THRESHOLD) {
        console.warn(`⚠️ getServerPosts: Only ${filteredResponse.length} restaurants found within ${radiusInMiles} miles radius`);
        // Show notification - will be handled after posts are set
      }
      
      response = filteredResponse;
      let totalPostsCount = response.length;
      for (var i = 0; i < totalPostsCount; i++) {
        if (i % 4 == 0 && i != 0) {
          let randomAdIndex = Math.floor(
            Math.random() * adminAdvertisements.length
          );
          if (adminAdvertisements && adminAdvertisements.length > 0) {
            let randomAdvertisment = adminAdvertisements[randomAdIndex];
            arrPostsWithAdminAds.push({
              id: randomAdvertisment.id,
              isAdvertisement: true,
              adTitle: randomAdvertisment.title,
              adDescription: randomAdvertisment.description,
              adType: randomAdvertisment.mediaType,
              adMediaSource: randomAdvertisment.mediaSource,
              isPaused: false, // Video ads will auto-play when in view
            });
          } else {
            // If no ads available, still push the post
            arrPostsWithAdminAds.push(response[i]);
          }
        } else {
          arrPostsWithAdminAds.push(response[i]);
        }
      }
      for (var j = 0; j < arrPostsWithAdminAds.length; j++) {
        if (j % 7 == 0 && j != 0) {
          let objGoogleAd = {
            isGoogleAd: true,
          };
          arrPostsWithAllAds.push(objGoogleAd);
        } else {
          arrPostsWithAllAds.push(arrPostsWithAdminAds[j]);
        }
      }
      arrPostsWithAllAds = arrPostsWithAllAds.filter((item, index, self) => {
        if (item) {
          return item;
        }
      });
      
      // ✅ REPLACE cache with new posts (initial load or explicit reload)
      console.log(`✅ getServerPosts: Fetched ${response.length} posts from API`);
      console.log(`✅ getServerPosts: After adding ads, total posts: ${arrPostsWithAllAds.length}`);
      console.log(`📊 getServerPosts: Initial load - Showing ${arrPostsWithAllAds.length} posts`);
      
      // Check if insufficient restaurants found (after adding ads, count actual restaurant posts)
      const restaurantPostsCount = arrPostsWithAllAds.filter(
        (item) => item && !item.isAdvertisement && !item.isGoogleAd
      ).length;
      
      if (restaurantPostsCount < MIN_RESTAURANTS_THRESHOLD && restaurantPostsCount > 0) {
        console.warn(
          `⚠️ getServerPosts: Only ${restaurantPostsCount} restaurants found within ${radiusInMiles} miles radius`
        );
        // Only show toast if we actually have fewer than threshold but NOT 0
        setCustomToastMessage(
          `Only ${restaurantPostsCount} restaurant${
            restaurantPostsCount === 1 ? "" : "s"
          } found within ${radiusInMiles} miles. Try increasing the radius in Search settings.`
        );
        setShowCustomToast(true);
      } else if (restaurantPostsCount === 0 && (!arrPostsWithAllAds || arrPostsWithAllAds.length === 0)) {
        console.warn(
          `⚠️ getServerPosts: No restaurants found within ${radiusInMiles} miles radius`
        );
        
        // ✅ Only show blocking alert if we don't have any existing posts visible
        console.log(`📊 getServerPosts diagnostics: restaurantPostsCount=${restaurantPostsCount}, totalPostsVisible=${allPostsRef.current.length}`);
        
        if (allPostsRef.current.length === 0) {
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
          setCustomToastMessage("No new restaurants found in this area.");
          setShowCustomToast(true);
        }
      }
      
      setPostDetails(arrPostsWithAllAds[0]);
      dispatch(setAllPosts(arrPostsWithAllAds)); // This REPLACES all existing posts
      // Save to AsyncStorage cache
      await helperFunctions.saveCachedPosts(arrPostsWithAllAds, POSTS_CACHE_KEY, 10);
      if (arrPostsWithAllAds.length > 0) {
        carouselRef.current.scrollToIndex({ index: 0 });
      }
      dispatch(setLoadNewPosts(false)); // Reset flag after loading
      setLoadingState(false, "", operationId);
    } catch (err) {
      console.log("Error is", err);
      dispatch(setLoadNewPosts(false));
      setLoadingState(false, "", operationId);
    }
  };

  async function getNewPosts() {
    // Add guard to prevent multiple simultaneous calls
    console.log("🔵 getNewPosts() called");
    console.log("🔵 showLoadingMorePosts =", showLoadingMorePosts);
    console.log("🔵 allPosts.length =", allPosts.length);
    
    if (showLoadingMorePosts) {
      console.log("⚠️ getNewPosts: Already loading, skipping...");
      return;
    }

    // Validate required data
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.error("❌ getNewPosts: User location not available");
      setShowLoadingMorePosts(false);
      return;
    }
    
    if (!accessToken) {
      console.error("❌ getNewPosts: Access token not available");
      setShowLoadingMorePosts(false);
      return;
    }
    
    try {
      setShowLoadingMorePosts(true);
      
      // Increase radius for load more (user's location + increased radius)
      const baseRadiusMiles = savedPostsRadius || 20;
      const updatedRadiusMiles = baseRadiusMiles + 2 * currentIncrementValue;
      const updatedRadiusKm = updatedRadiusMiles * 1.609;
      
      console.log("📍 getNewPosts: Loading more posts with:", {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        originalRadiusKm: baseRadiusMiles * 1.609,
        originalRadiusMiles: baseRadiusMiles,
        updatedRadiusKm: updatedRadiusKm,
        updatedRadiusMiles: updatedRadiusMiles,
        savedRadiusFromPreferences: savedPostsRadius,
        increment: currentIncrementValue,
        existingPostsCount: allPosts.length,
      });
      
      let arrPostsWithAdminAds = [];
      let arrPostsWithAllAds = [];
      let arrPostsInState = [...allPosts]; // Keep existing posts for appending
      let response;
      
      if (savedFoodCategories && savedFoodCategories.length > 0) {
        let arrCategoryNames = [];
        let arrCategoryIds = [];
        arrCategoryNames = savedFoodCategories.map((item, index) => {
          return item.name;
        });
        arrCategoryIds = savedFoodCategories.map((item, index) => {
          return item.id;
        });
        let reqObj = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          category_id: arrCategoryIds,
        };
        response = await apiHandler.getPosts(
          reqObj,
          updatedRadiusKm, // Pass radius in kilometers
          accessToken,
          arrCategoryNames
        );
      } else {
        let reqObj = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          category_id: [],
        };
        response = await apiHandler.getPosts(
          reqObj,
          updatedRadiusKm, // Pass radius in kilometers
          accessToken
        );
      }
      
      // Validate response
      if (!response || !Array.isArray(response)) {
        console.error("❌ getNewPosts: Invalid response from API");
        setShowLoadingMorePosts(false);
        setCustomToastMessage("Failed to load more posts. Invalid response.");
        setShowCustomToast(true);
        return;
      }
      
      // Set isPaused for all new posts
      response = response.map((item, index) => {
        if (item) {
          return {
            ...item,
            isPaused: true,
          };
        }
        return item;
      }).filter((item) => item !== undefined && item !== null);
      
      // Filter out duplicates by restaurant_id
      console.log(`📊 getNewPosts: Fetched ${response.length} posts from API before filtering duplicates`);
      const responseBeforeFilter = response.length;
      response = response.filter((iPlace, index, self) => {
        if (iPlace) {
          if (iPlace.restaurant_id) {
            return (
              !arrPostsInState.some((iItem, iIndex) => {
                if (iItem && iItem.restaurant_id) {
                  return iItem.restaurant_id == iPlace.restaurant_id;
                }
              }) && iPlace
            );
          } else {
            // For posts without restaurant_id, check by id
            if (iPlace.id) {
              return (
                !arrPostsInState.some((iItem, iIndex) => {
                  if (iItem && iItem.id) {
                    return iItem.id == iPlace.id;
                  }
                }) && iPlace
              );
            }
            return iPlace;
          }
        }
      });
      const newPostsCount = response.length;
      const duplicatesRemoved = responseBeforeFilter - newPostsCount;
      console.log(`📊 getNewPosts: After filtering duplicates - ${newPostsCount} new posts, ${duplicatesRemoved} duplicates removed`);
      
      // Check if there are no new posts after filtering duplicates
      if (newPostsCount === 0) {
        console.log("⚠️ getNewPosts: No new posts found after filtering duplicates");
        console.log(`📍 Current radius: ${updatedRadiusMiles} miles (${updatedRadiusKm} km)`);
        console.log(`📍 Try increasing radius or no more posts available in this area`);
        setShowLoadingMorePosts(false);
        // Show message to user that no more posts available
        setCustomToastMessage("No more restaurants found. Try increasing the radius in Search settings.");
        setShowCustomToast(true);
        return;
      }
      
      const limitedResponse = response.slice(0, PAGE_SIZE);
      if (limitedResponse.length === 0) {
        console.log("⚠️ getNewPosts: No additional posts after pagination limit");
        setShowLoadingMorePosts(false);
        return;
      }

      for (var i = 0; i < limitedResponse.length; i++) {
        if (i % 4 == 0 && i != 0) {
          let randomAdIndex = Math.floor(
            Math.random() * adminAdvertisements.length
          );
          if (adminAdvertisements && adminAdvertisements.length > 0) {
            let randomAdvertisment = adminAdvertisements[randomAdIndex];
            arrPostsWithAdminAds.push({
              id: randomAdvertisment.id,
              isAdvertisement: true,
              adTitle: randomAdvertisment.title,
              adDescription: randomAdvertisment.description,
              adType: randomAdvertisment.mediaType,
              adMediaSource: randomAdvertisment.mediaSource,
              isPaused: false, // Video ads will auto-play when in view
            });
          } else {
            arrPostsWithAdminAds.push(limitedResponse[i]);
          }
        } else {
          arrPostsWithAdminAds.push(limitedResponse[i]);
        }
      }
      for (var j = 0; j < arrPostsWithAdminAds.length; j++) {
        if (j % 7 == 0 && j != 0) {
          let objGoogleAd = {
            isGoogleAd: true,
          };
          arrPostsWithAllAds.push(objGoogleAd);
        } else {
          arrPostsWithAllAds.push(arrPostsWithAdminAds[j]);
        }
      }
      arrPostsWithAllAds = arrPostsWithAllAds.filter((item) => !!item);

      const mergedPosts = [...arrPostsInState, ...arrPostsWithAllAds];
      const maxCacheSize = 100;
      const finalCache = mergedPosts.slice(-maxCacheSize);

      console.log(`✅ getNewPosts: Appended ${arrPostsWithAllAds.length} posts`);
      console.log(`📊 getNewPosts: Before: ${arrPostsInState.length}, After: ${finalCache.length} (max ${maxCacheSize})`);

      setCurrentIncrementValue(currentIncrementValue + 1);

      const currentPostStillExists = finalCache.some((item) => {
        if (postDetails && postDetails.restaurant_id && item && item.restaurant_id) {
          return item.restaurant_id === postDetails.restaurant_id;
        }
        return false;
      });
      if (!currentPostStillExists && finalCache.length > 0) {
        setPostDetails(finalCache[0]);
      }

      dispatch(setAllPosts(finalCache));
      await helperFunctions.saveCachedPosts(finalCache, POSTS_CACHE_KEY, 10);
      lastLoadMoreLengthRef.current = finalCache.length;
      setShowLoadingMorePosts(false);
    } catch (err) {
      console.error("❌ Error loading new posts:", err);
      setShowLoadingMorePosts(false);
      // Show error message to user
      setCustomToastMessage("Failed to load more posts. Please try again.");
      setShowCustomToast(true);
    }
  }

  const onRestaurantImagePress = (item) => {
    navigation.navigate(navigationStrings.RestaurantDetails, {
      restaurant_id: item.restaurant_id,
    });
  };

  const onCommentPress = async () => {
    // Allow viewing comments without login
    // Login check will happen when trying to write a comment

    // Fetch fresh post data to get latest comments from database
    if (postDetails && postDetails.id && !postDetails.isGoogle) {
      const operationId = "loadComments";
      try {
        setLoadingState(true, "Loading comments...", operationId);
        const response = await apiHandler.getPostById(postDetails.id);
        if (response && response.success && response.post) {
          // Transform comments to match frontend format
          const formattedComments = (response.post.comments || []).map(
            (comment) => ({
              ...comment,
              user: {
                ...comment.user,
                image: comment.user?.profile_picture || comment.user?.image,
              },
            })
          );

          // Update postDetails with fresh data including latest comments
          const updatedPost = {
            ...postDetails,
            comment: formattedComments,
            like: response.post.likes || [],
          };
          setPostDetails(updatedPost);

          // Also update Redux state to keep it in sync
          const updatedPosts = allPosts.map((item) => {
            if (item.id === postDetails.id && !item.isGoogle) {
              return {
                ...item,
                comment: formattedComments,
                like: response.post.likes || [],
              };
            }
            return item;
          });
          dispatch(setAllPosts(updatedPosts));
        }
        setLoadingState(false, "", operationId);
      } catch (error) {
        console.error("Error fetching fresh post data:", error);
        setLoadingState(false, "", operationId);
        // Still open modal even if fetch fails
      }
    }

    setShowCommentModal(true);
  };

  const onLikeUnlikePostPress = async (post, isLiked) => {
    console.log("❤️ Heart button clicked!");
    console.log("  - Restaurant:", post.restaurantName);
    console.log("  - Is already liked:", isLiked);

    // setIsLoading(true)
    if (!isLiked) {
      setLikingPost(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => {
          setLikingPost(false);
        });
      });
    }

    // Redux state update with full image URL
    let objRestaurant = {
      restaurant_id: post.restaurant_id,
      restaurantName: post.restaurantName,
      restaurantImage: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${post.restaurantImage}&key=${GOOGLE_API_KEY}`,
    };
    dispatch(updateFavoriteRestaurants(objRestaurant));
    dispatch(updateFavouritePlaces(objRestaurant));

    // Backend API call with proper Google data
    let objPost = {
      google_place_id: post.restaurant_id, // Google place ID
      name: post.restaurantName || "Unknown Restaurant",
      photo_reference: post.restaurantImage, // Just the photo reference, not full URL
      rating: post.restaurantRating || null,
      restaurant_name: post.restaurantName,
      address: post.address || null,
      latitude: post.latitude || null,
      longitude: post.longitude || null,
    };

    console.log("🍽️ Saving Google restaurant from home screen:");
    console.log("  - Name:", objPost.name);
    console.log("  - Google Place ID:", objPost.google_place_id);
    console.log("  - Photo Reference:", objPost.photo_reference);
    console.log("  - Address:", objPost.address);
    console.log("  - Rating:", objPost.rating);

    console.log("📞 Calling API now...");
    await apiHandler.likeGooglePost(objPost, accessToken);
    await apiHandler.likeRestaurant(objPost, accessToken);
    console.log("📞 API calls completed");

    // Fetch fresh data from backend
    console.log("🔄 Fetching fresh favorites from backend...");
    let freshFavorites = await apiHandler.getLikedRestaurants(accessToken);
    console.log("📦 Fresh favorites received:", freshFavorites.length);

    // Map the data properly
    let mappedFavorites = (freshFavorites || [])
      .map((item) => {
        let restaurantImage = null;
        if (item.google_photo_reference) {
          restaurantImage = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${item.google_photo_reference}&key=${GOOGLE_API_KEY}`;
        } else if (item.image) {
          restaurantImage = item.image;
        }

        return {
          restaurantName:
            item.name || item.restaurant_name || "Unknown Restaurant",
          restaurantImage: restaurantImage,
          restaurant_id: item.google_place_id || item.restaurant_id || item.id,
          google_place_id: item.google_place_id,
        };
      })
      .filter((item) => {
        return (
          item.restaurant_id &&
          item.google_place_id &&
          item.restaurantName !== "Unknown Restaurant"
        );
      });

    // Update Redux with fresh data
    dispatch(setFavoriteRestaurants(mappedFavorites));
    // Also update likedGooglePlaces to keep UI in sync
    dispatch(setFavouritePlaces(mappedFavorites));
    console.log(
      "✅ Redux updated with fresh favorites:",
      mappedFavorites.length
    );

    console.log("✅ Restaurant saved successfully");
  };

  const likeUnlikeInAppPosts = async (post, isLiked) => {
    console.log("Liking post:", post.id, "isLiked:", isLiked);

    if (!isLiked) {
      setLikingPost(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => {
          setLikingPost(false);
        });
      });
    }

    // Update Redux state first
    let objPayload;
    let dataForPayload = { created_at: new Date(), user: userDetails };
    if (!isLiked) {
      objPayload = {
        type: "like",
        post_id: post.id,
        data: dataForPayload,
      };
    } else {
      objPayload = {
        type: "unlike",
        post_id: post.id,
        data: dataForPayload,
      };
    }
    dispatch(updatePost(objPayload));

    // Call like API
    let reqObj = {
      user_id: userDetails.id,
      post_id: post.id,
      created_id: post.user_id,
    };

    try {
      const likeResponse = await apiHandler.likePost(reqObj, accessToken);
      console.log("Like API Response:", likeResponse);

      if (!likeResponse || !likeResponse.success) {
        console.error("Failed to like post:", likeResponse?.message);
        // Rollback Redux state on failure
        let rollbackPayload = {
          type: isLiked ? "like" : "unlike",
          post_id: post.id,
          data: dataForPayload,
        };
        dispatch(updatePost(rollbackPayload));
        return;
      }

      // Handle restaurant favorite - use existing post data instead of fetching
      // This is optional - if it fails, the like operation should still succeed
      try {
        // Convert restaurant_id to string if it exists, or set to null if undefined/null
        const restaurantId = post.restaurant_id
          ? String(post.restaurant_id)
          : null;

        if (restaurantId && !restaurantId.startsWith("MOCK_")) {
          // Real restaurant - use data from the post
          // Build restaurant object from post data
          let restaurantName =
            post.restaurant && typeof post.restaurant === "object"
              ? post.restaurant.name
              : post.restaurant || "Unknown Restaurant";

          // Use the photo reference from the post's first file if available
          let restaurantImage = "";
          if (post.file && post.file.length > 0 && post.file[0].filenames) {
            restaurantImage = POSTS_IMAGE_BASE_URL + post.file[0].filenames;
          }

          // Send proper data to backend for in-app posts
          let requestObject = {
            restaurant_id: restaurantId,
            name: restaurantName, // Backend expects 'name', not 'restaurant_name'
            restaurant_name: restaurantName,
            // If this is from Google Places, include that data
            google_place_id: post.google_place_id || undefined,
            photo_reference: post.google_photo_reference || undefined,
            address: post.address || undefined,
            latitude:
              post.latitude !== undefined && post.latitude !== null
                ? parseFloat(post.latitude)
                : undefined,
            longitude:
              post.longitude !== undefined && post.longitude !== null
                ? parseFloat(post.longitude)
                : undefined,
            rating:
              post.rating !== undefined && post.rating !== null
                ? parseFloat(post.rating)
                : undefined,
          };

          let objRestaurant = {
            restaurant_id: restaurantId,
            restaurantName: restaurantName,
            restaurantImage: restaurantImage,
            google_place_id: post.google_place_id || null,
            google_photo_reference: post.google_photo_reference || null,
          };

          console.log("🍽️ Saving in-app restaurant:", requestObject);
          dispatch(updateFavoriteRestaurants(objRestaurant));
          await apiHandler.likeRestaurant(requestObject, accessToken);
          console.log("✅ Restaurant favorited successfully");
        } else if (restaurantId && restaurantId.startsWith("MOCK_")) {
          // Mock restaurant ID - use restaurant data from post
          console.log("Using mock restaurant data for like");
          let objRestaurant = {
            restaurant_id: restaurantId,
            restaurantName:
              post.restaurant && typeof post.restaurant === "object"
                ? post.restaurant.name
                : post.restaurant || "Unknown",
            restaurantImage: "",
          };
          dispatch(updateFavoriteRestaurants(objRestaurant));
        }
      } catch (restaurantError) {
        // Restaurant favorite is optional - don't break the like operation
        console.log(
          "Restaurant favorite error (non-critical):",
          restaurantError.message
        );
      }

      // Update likedPosts - ensure we pass the post with correct id structure
      // The post object must have an 'id' field that matches what's in the render function
      const postToUpdate = {
        id: post.id,
        ...post,
      };
      dispatch(updateLikedPosts(postToUpdate));
      console.log("✅ Like operation completed successfully");
      console.log(
        "✅ Updated likedPosts with post id:",
        post.id,
        "post object:",
        postToUpdate
      );
    } catch (error) {
      console.error("❌ Error in like/unlike operation:", error);
      console.error("Error details:", error.response?.data || error.message);
      // Rollback Redux state on error
      let rollbackPayload = {
        type: isLiked ? "like" : "unlike",
        post_id: post.id,
        data: dataForPayload,
      };
      dispatch(updatePost(rollbackPayload));
    }
  };

  const showHideCommentModal = () => {
    setShowCommentModal(!showCommentModal);
  };

  const onSingleCommentPress = (userID) => {
    setShowCommentModal(false);
    navigation.navigate(navigationStrings.ShowUser, {
      userID: userID,
    });
  };

  const renderCommentView = (item, index) => {
    return (
      <TouchableOpacity
        onPress={() => {
          onSingleCommentPress(item.user.id);
        }}
        style={styles.likeViewContainer}
      >
        <Image
          style={styles.userProfileImage}
          source={
            item && item.user && item.user.image && item.user.image != null
              ? { uri: item.user.image }
              : imagePath.dummyProfile
          }
        />
        <View style={styles.commentInnerContainer}>
          <Text
            style={commonStyles.textWhite(14, {
              color: currentThemeSecondaryColor,
              fontWeight: "600",
            })}
          >
            {item.comment}
          </Text>
          <Text
            style={commonStyles.textWhite(10, {
              color: currentThemeSecondaryColor,
              fontWeight: "400",
            })}
          >
            {item.user?.full_name}
          </Text>
        </View>
        <Text
          style={commonStyles.textWhite(10, {
            color: colors.grey,
            fontWeight: "400",
          })}
        >
          {helperFunctions.getElapsedTime(item.created_at)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderReview = (item, index) => {
    return (
      <TouchableOpacity
        onPress={onSingleCommentPress}
        style={styles.likeViewContainer}
      >
        <ImageBackground
          style={styles.reviewImage}
          source={
            postDetails.isGoogle
              ? { uri: item.profile_photo_url }
              : item.imageSource
          }
        />
        <View style={styles.reviewInnerContainer}>
          <Text
            style={commonStyles.textWhite(14, {
              color: currentThemeSecondaryColor,
              fontWeight: "600",
            })}
          >
            {item.author_name}
          </Text>
          <Text
            style={commonStyles.textWhite(10, {
              color: currentThemeSecondaryColor,
              fontWeight: "400",
            })}
          >
            {item.text}
          </Text>
        </View>
        <Text
          style={commonStyles.textWhite(10, {
            color: colors.grey,
            fontWeight: "400",
          })}
        >
          {item.relative_time_description}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderLikedView = (item, index) => {
    return (
      <View style={styles.singleLikeContainer}>
        <View style={styles.singleLikeInnerContainer}>
          <Image
            style={styles.likeImage}
            source={
              item && item.user && item.user.image
                ? { uri: USER_PROFILE_BASE_URL + item.user.image }
                : imagePath.dummyProfile
            }
          />
          <Text
            style={commonStyles.textWhite(14, {
              color: currentThemeSecondaryColor,
              fontWeight: "600",
              marginLeft: moderateScale(6),
            })}
          >
            {item &&
              item.user &&
              item.user.full_name &&
              item.user.full_name + " "}
            <Text
              style={commonStyles.textWhite(10, {
                color: currentThemeSecondaryColor,
                fontWeight: "400",
              })}
            >
              - Liked your Post
            </Text>
          </Text>
        </View>
        <Text
          style={commonStyles.textWhite(10, {
            color: colors.grey,
            fontWeight: "400",
          })}
        >
          {item &&
            item.created_at &&
            helperFunctions.getElapsedTime(new Date(item.created_at).getTime())}
        </Text>
      </View>
    );
  };

  const onShowLikePress = () => {
    setSelectedTab(tabBarData[1]);
  };

  const onShowCommentPress = () => {
    setSelectedTab(tabBarData[0]);
  };

  const showHideDeletePostModal = (index) => {
    setDeletedPostIndex(index);
    setShowDeletePostModal(true);
  };

  const deletePost = async () => {
    setShowDeletePostModal(false);
    apiHandler.deletePost(postDetails.id, accessToken).then((res) => {
      setCustomToastMessage("Post deleted successfully");
      setShowCustomToast(true);
      let objPayload = {
        type: "delete",
        post_id: deletedPostIndex,
      };
      dispatch(updatePost(objPayload));
    });
  };

  const onShare = async (item) => {
    const path = `${RNFS.DocumentDirectoryPath}/${item.restaurant_id}.jpg`;
    let sharedLink = "";

    if (item.isGoogle) {
      // Dynamic link for Google Place post
      const placeId = item.restaurant_id || item.place_id || "";
      sharedLink = `googlePost/?${placeId}`;
    } else {
      // Dynamic link for in-app (Crunchy) post
      sharedLink = `applicationPost/?${item.restaurant_id}`;
    }

    const operationId = "sharePost";
    try {
      setLoadingState(true, "Generating share link", operationId);

      // Fallback link in case Dynamic Links API is not available
      let link = `https://crunchyapp.page.link/${sharedLink}`;

      try {
        // Try to build a Firebase Dynamic Link (may fail on some devices/emulators)
        link = await firebase.dynamicLinks().buildShortLink(
          {
            link: `http://invertase.io/` + sharedLink,
            android: {
              packageName: "com.crunchy",
            },
            ios: {
              bundleId: "com.crunchy",
              appStoreId: "F8CM492S3P",
            },
            domainUriPrefix: "https://crunchyapp.page.link",
          },
          firebase.dynamicLinks.ShortLinkType.UNGUESSABLE
        );
      } catch (e) {
        console.warn(
          "Dynamic Links not available, using fallback URL instead:",
          e?.message || e
        );
        // Continue with fallback link
      }

      let base64Image;

      // Only try to download an image for Google Places posts,
      // and don't block sharing if the download fails.
      if (item.isGoogle && item?.restaurantImage) {
        try {
          const filePath = `${RNFS.DocumentDirectoryPath}/${item.restaurant_id}.jpg`;
          await RNFS.downloadFile({
            // item.restaurantImage is already a full Google photo URL
            fromUrl: item.restaurantImage,
            toFile: filePath,
          }).promise;
          base64Image = await RNFS.readFile(filePath, "base64");
        } catch (e) {
          console.warn(
            "Failed to load Google image for share, will share text only:",
            e?.message || e
          );
          // Keep base64Image undefined so we still share the link text
          base64Image = null;
        }
      }

      const shareOptions = {
        title: "Found this on Crunchy",
        message: `Found this on Crunchy — check it out! ${item.restaurantName}\n${link}`,
        ...(base64Image && {
          url: `data:image/jpeg;base64,${base64Image}`,
        }),
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error("Share Error:", error);
    } finally {
      setLoadingState(false, "", operationId);
    }
  };

  const onVideoPress = (val) => {
    console.log("On video press");
    if (val) {
      setIsPlayingVideo(true);
    } else {
      setIsPausingVideo(true);
    }
    Animated.timing(playOpacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: false,
    }).start(() => {
      Animated.timing(playOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setIsPlayingVideo(false);
        setIsPausingVideo(false);
      });
    });
    let newUp = allPosts.map((item, index) => {
      currentPostIndex == index
        ? (item.isPaused = !item.isPaused)
        : (item.isPaused = true);
      return { ...item };
    });
    dispatch(setAllPosts(newUp));
  };

  const expandContractReview = () => {
    setShowExpandedReview(!showExpandedReview);
  };

  const onPostSideTap = (side, item) => {
    const images = item.isGoogle
      ? item.restaurantImages || [item.restaurantImage]
      : item.file || [];

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

  const handleGesture = (event, item) => {
    if (event.nativeEvent.state == 5) {
      if (event.nativeEvent.translationX < -50) {
        // Use the same navigation logic as onRestaurantImagePress
        // This works for both Google posts and in-app posts
        if (item && (item.restaurant_id || (item.restaurant && typeof item.restaurant === "object" && item.restaurant.id))) {
          const restaurantId = item.restaurant_id || (item.restaurant && typeof item.restaurant === "object" && item.restaurant.id);
          if (restaurantId) {
            navigation.navigate(navigationStrings.RestaurantDetails, {
              restaurant_id: restaurantId,
            });
          }
        }
      } else if (event.nativeEvent.translationX > 50) {
        navigation.navigate(navigationStrings.SearchScreen);
      }
    }
  };

  const getImageSource = (restaurantImage) => {
    if (!restaurantImage || restaurantImage === "" || typeof restaurantImage !== 'string') {
      console.log("⚠️ SinglePostComponent getImageSource: No valid restaurantImage provided");
      return imagePath.americanFoodImage;
    }
    
    // Check if it's already a full URL
    if (restaurantImage.startsWith("http://") || restaurantImage.startsWith("https://")) {
      console.log("✅ SinglePostComponent getImageSource: Already a full URL");
      return { uri: restaurantImage };
    }
    
    // Build Google Places photo URL - Use encodeURIComponent
    const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=700&photo_reference=${encodeURIComponent(restaurantImage.trim())}&key=${GOOGLE_API_KEY}`;
    return { uri: imageUrl };
  };

  const renderPost = (item) => {
    let isLiked =
      likedGooglePlaces &&
      likedGooglePlaces.length > 0 &&
      likedGooglePlaces.findIndex((innerItem, innerIndex) => {
        return innerItem.restaurant_id == item.restaurant_id;
      }) != -1;
    if (!item) {
      return null;
    }

    const currentImage =
      item.isGoogle && item.restaurantImages && item.restaurantImages.length > 0
        ? item.restaurantImages[currentPostImageIndex] || item.restaurantImage
        : item.restaurantImage;

    const imageSource = currentImage
      ? getImageSource(currentImage)
      : imagePath.americanFoodImage;

    return (
      <ImageBackground
        resizeMode="cover"
        source={imageSource}
        style={{ height: componentHeight, width: windowWidth }}
        onError={(error) => {
          console.error(
            "❌ SinglePostComponent ImageBackground load error:",
            error.nativeEvent.error
          );
          console.error(
            "❌ Failed URL:",
            typeof imageSource === "object" && imageSource.uri
              ? imageSource.uri.substring(0, 100)
              : "invalid source"
          );
        }}
        onLoad={() => {
          console.log(
            "✅ SinglePostComponent ImageBackground loaded successfully"
          );
        }}
      >
        <DoubleClick
          customStyle={commonStyles.flexFull}
          singleTap={() => {
            console.log("single tap");
          }}
          doubleTap={() => {
            onLikeUnlikePostPress(item, isLiked);
          }}
          delay={200}
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
              style={{
                flex: 1,
                backgroundColor: "transparent",
                flexDirection: "row",
                zIndex: 20,
              }}
            >
              <View
                pointerEvents="box-none"
                style={{
                  minHeight: moderateScale(100),
                  width: windowWidth * 0.7,
                  padding: moderateScale(5),
                  position: "absolute",
                  left: moderateScale(0),
                  bottom: windowHeight * 0.2,
                  zIndex: 21,
                }}
              >
                <Text
                  onPress={() => {
                    onRestaurantImagePress(item);
                  }}
                  style={commonStyles.textWhite(32, {
                    textShadowColor: colors.black,
                    textShadowOffset: { width: 5, height: 5 },
                    textShadowRadius: 10,
                    zIndex: 99,
                  })}
                >
                  {item.restaurantName}
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
                      zIndex: 99,
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
                      zIndex: 99,
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
                    zIndex: 99,
                  })}
                >
                  {item && item.review}
                </Text>
              </View>
              <View
                pointerEvents="box-none"
                style={{
                  minHeight: moderateScale(100),
                  minWidth: moderateScale(40),
                  // padding: moderateScale(5),
                  marginBottom: moderateScale(5),
                  position: "absolute",
                  // left: windowWidth * 0.6,
                  right: moderateScale(0),
                  bottom: windowHeight * 0.2,
                  alignItems: "center",
                  zIndex: 21,
                }}
              >
                <TouchableOpacity
                  style={{ alignItems: "center" }}
                  onPress={() => {
                    onRestaurantImagePress(item);
                  }}
                >
                  <FontAwesome
                    name="binoculars"
                    style={{
                      fontSize: moderateScale(20),
                      color: colors.white,
                    }}
                  />
                  <Text
                    style={commonStyles.textWhite(14, {
                      textShadowColor: colors.black,
                      textShadowOffset: { width: 5, height: 5 },
                      textShadowRadius: 10,
                      zIndex: 99,
                    })}
                  >
                    Explore
                  </Text>
                </TouchableOpacity>
                {item && (
                  <View style={{ alignItems: "center" }}>
                    {/* <PressableImage onImagePress={() => {
                                onLikeUnlikePostPress(item)
                            }} /> */}
                    <TouchableOpacity
                      onPress={() => {
                        onLikeUnlikePostPress(item, isLiked);
                      }}
                    >
                      <ImageBackground
                        resizeMode="stretch"
                        source={
                          isLiked ? imagePath.likedPost : imagePath.unlikedPost
                        }
                        style={styles.likePostImage}
                      >
                        {/* <Ionicons name={isLiked ? 'checkmark' : 'add-circle'} style={{ fontSize: moderateScale(10), color: isLiked ? colors.green : colors.black, position: 'absolute', top: -moderateScale(4), right: -moderateScale(4) }} /> */}
                      </ImageBackground>
                    </TouchableOpacity>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text
                        style={commonStyles.textWhite(14, {
                          textShadowColor: colors.black,
                          textShadowOffset: { width: 5, height: 5 },
                          textShadowRadius: 10,
                          zIndex: 99,
                        })}
                      >
                        {isLiked ? "Favorited" : "Favorite"}
                      </Text>
                    </View>
                  </View>
                )}
                <View style={{ alignItems: "center" }}>
                  <Entypo
                    name="share"
                    style={styles.shareIcon}
                    onPress={() => {
                      onShare(item);
                    }}
                  />
                  <Text
                    style={commonStyles.textWhite(14, {
                      textShadowColor: colors.black,
                      textShadowOffset: { width: 5, height: 5 },
                      textShadowRadius: 10,
                      zIndex: 99,
                    })}
                  >
                    Share
                  </Text>
                </View>
              </View>
            </View>
          </PanGestureHandler>
        </DoubleClick>
      </ImageBackground>
    );
  };

  const commentOnPost = async () => {
    if (!accessToken || !userDetails) {
      setShowCommentModal(false);
      setErrorMessage("Please login to comment");
      setShowErrorMessage(true);
      return;
    }
    if (comment.trim() == "") {
      setShowCommentModal(false);
      setErrorMessage("Review can not be empty");
      setShowErrorMessage(true);
    } else {
      // Save comment value before clearing it (bug fix from old project)
      const commentText = comment;

      setShowCommentModal(false);
      const operationId = "postComment";
      setLoadingState(true, "Posting your review", operationId);

      // Optimistic update - update Redux immediately (old project pattern)
      let objData = {
        comment: commentText,
        created_at: new Date(),
        user: userDetails,
      };
      let objPayload = {
        type: "comment",
        post_id: postDetails.id,
        data: objData,
      };
      dispatch(updatePost(objPayload));
      setComment("");
      setCustomToastMessage("Review posted successfully");
      setLoadingState(false, "", operationId);
      setShowCustomToast(true);

      // Make API call in background (old project pattern)
      let reqObj = {
        post_id: postDetails.id,
        comment: commentText,
        created_id: postDetails.user_id,
      };

      try {
        const response = await apiHandler.commentOnPost(reqObj, accessToken);
        // If API succeeds, fetch fresh post data to get the actual comment from DB
        if (response && response.success) {
          // Fetch fresh post data to ensure we have the latest comments from DB
          const freshPostResponse = await apiHandler.getPostById(
            postDetails.id
          );
          if (
            freshPostResponse &&
            freshPostResponse.success &&
            freshPostResponse.post
          ) {
            const formattedComments = (
              freshPostResponse.post.comments || []
            ).map((comment) => ({
              ...comment,
              user: {
                ...comment.user,
                image: comment.user?.profile_picture || comment.user?.image,
              },
            }));

            // Update postDetails with fresh data
            const updatedPost = {
              ...postDetails,
              comment: formattedComments,
            };
            setPostDetails(updatedPost);

            // Update Redux state
            const updatedPosts = allPosts.map((item) => {
              if (item.id === postDetails.id && !item.isGoogle) {
                return {
                  ...item,
                  comment: formattedComments,
                };
              }
              return item;
            });
            dispatch(setAllPosts(updatedPosts));
          }
        } else {
          console.log(
            "Comment API failed but UI already updated:",
            response?.message
          );
        }
      } catch (error) {
        console.error("Comment API Error:", error);
        // Don't show error to user, just log it
        // The comment is already visible in UI (optimistic update pattern)
      }
    }
  };

  const onSinglePostUserPress = (userID) => {
    if (userID == userDetails.id) {
      navigation.navigate(navigationStrings.ProfileScreen);
    } else {
      navigation.navigate(navigationStrings.ShowUser, {
        userID: userID,
      });
    }
  };

  const renderInAppPost = (item, index) => {
    // Check if post is liked - ensure proper comparison
    const isLiked =
      likedPosts &&
      likedPosts.length > 0 &&
      likedPosts.some((likedPost) => {
        // Use loose equality to handle string/number mismatch
        return (
          item.id == likedPost.id || String(item.id) === String(likedPost.id)
        );
      });
    return (
      <View
        style={{
          height: componentHeight,
          width: windowWidth,
          backgroundColor: "transparent",
        }}
      >
        <DoubleClick
          customStyle={commonStyles.flexFull}
          singleTap={() => {
            item &&
              item.file &&
              item.file.length > 0 &&
              item.file[0] &&
              item.file[0].type == "video" &&
              onVideoPress(item.isPaused);
          }}
          doubleTap={() => {
            likeUnlikeInAppPosts(item, isLiked);
          }}
          delay={200}
        >
          <PanGestureHandler
            failOffsetY={[-5, 5]}
            activeOffsetX={[-5, 5]}
            onHandlerStateChange={(event) => {
              handleGesture(event, item);
            }}
          >
            <View style={commonStyles.flexFull}>
              <View style={styles.videoPostDetailsContainer}>
                <Text
                  onPress={() => {
                    onRestaurantImagePress(item);
                  }}
                  style={commonStyles.textWhite(32, {
                    fontWeight: "bold",
                    textShadowColor: colors.black,
                    textShadowOffset: { width: 5, height: 5 },
                    textShadowRadius: 10,
                    zIndex: 20,
                  })}
                >
                  {item &&
                  item.restaurant &&
                  typeof item.restaurant === "object"
                    ? item.restaurant.name
                    : item.restaurant || "Unknown Restaurant"}
                </Text>
                {item && item.user && (
                  <Text
                    style={commonStyles.textWhite(28, {
                      fontWeight: "400",
                      color: colors.white,
                      textShadowColor: colors.black,
                      textShadowOffset: { width: 5, height: 5 },
                      textShadowRadius: 10,
                    })}
                    onPress={() => {
                      onSinglePostUserPress(item.user_id);
                    }}
                  >
                    {item && item.user && item.user.full_name}
                  </Text>
                )}
                {item && item.rating && (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      marginVertical: moderateScale(8),
                    }}
                  >
                    <View
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={commonStyles.textWhite(40, {
                          fontWeight: "700",
                          color: colors.white,
                          textShadowColor: colors.black,
                          textShadowOffset: { width: 5, height: 5 },
                          textShadowRadius: 10,
                        })}
                      >
                        {item && item.rating}
                      </Text>
                      {helperFunctions.getStarRatings(item.rating, 24)}
                    </View>
                  </View>
                )}
                <Text
                  numberOfLines={showExpandedReview ? 20 : 2}
                  onPress={expandContractReview}
                  style={commonStyles.textWhite(14, {
                    fontWeight: "400",
                    color: colors.white,
                    textShadowColor: colors.black,
                    textShadowOffset: { width: 5, height: 5 },
                    textShadowRadius: 10,
                    marginBottom: windowHeight * 0.15,
                  })}
                >
                  {item && item.review}
                </Text>
              </View>
              <View style={styles.commentSectionContainer}>
                <TouchableOpacity
                  style={{ alignItems: "center" }}
                  onPress={() => {
                    onRestaurantImagePress(item);
                  }}
                >
                  <FontAwesome
                    name="binoculars"
                    style={{ fontSize: moderateScale(20), color: colors.white }}
                  />
                  <Text
                    style={commonStyles.textWhite(14, {
                      textShadowColor: colors.black,
                      textShadowOffset: { width: 5, height: 5 },
                      textShadowRadius: 10,
                      zIndex: 99,
                    })}
                  >
                    Explore
                  </Text>
                </TouchableOpacity>
                <View style={styles.align_Center}>
                  <PressableImage
                    imageSource={
                      isLiked ? imagePath.likedPost : imagePath.unlikedPost
                    }
                    imageStyle={styles.likePostImage}
                    onImagePress={() => {
                      likeUnlikeInAppPosts(item, isLiked);
                    }}
                  />
                  <Text
                    style={commonStyles.textWhite(16, {
                      color: "#c7c7c7",
                      fontWeight: "600",
                      marginTop: moderateScale(2),
                    })}
                  >
                    {(item && item.like && item.like.length > 0
                      ? item.like.length
                      : 0) + ""}
                  </Text>
                </View>
                <View style={styles.align_Center}>
                  <PressableImage
                    imageSource={imagePath.commentImage}
                    imageStyle={styles.commentImage}
                    onImagePress={onCommentPress}
                  />
                  <Text
                    style={commonStyles.textWhite(16, {
                      color: "#c7c7c7",
                      fontWeight: "600",
                      marginTop: moderateScale(2),
                    })}
                  >
                    {item && item.comment && item.comment.length > 0
                      ? item.comment.length
                      : 0}
                  </Text>
                </View>
                <View style={styles.align_Center}>
                  <Entypo
                    name="share"
                    style={{
                      fontSize: 35,
                      color: colors.white,
                      marginTop: moderateScale(10),
                    }}
                    onPress={() => {
                      onShare(item);
                    }}
                  />
                  <Text
                    style={commonStyles.textWhite(16, {
                      color: "#c7c7c7",
                      fontWeight: "600",
                      marginTop: moderateScale(2),
                    })}
                  >
                    Share
                  </Text>
                </View>
              </View>
              {item &&
              item.file &&
              item.file.length > 0 &&
              item.file[currentPostImageIndex] &&
              item.file[currentPostImageIndex].type == "video" ? (
                <View
                  style={{
                    position: "absolute",
                    height: componentHeight,
                    width: windowWidth,
                    top: 0,
                    backgroundColor: "transparent",
                    zIndex: 9,
                  }}
                >
                  <Video
                    source={{
                      uri:
                        POSTS_IMAGE_BASE_URL +
                        item.file[currentPostImageIndex].filenames,
                    }}
                    style={commonStyles.flexFull}
                    paused={!(currentPostIndex == index && isFocused)}
                    repeat={true}
                    resizeMode="stretch"
                    ref={(ref) => (videoRef[index] = ref)}
                  />
                </View>
              ) : (
                <Image
                  resizeMode="cover"
                  source={
                    item.file &&
                    item.file.length > 0 &&
                    item.file[currentPostImageIndex] &&
                    item.file[currentPostImageIndex].filenames
                      ? {
                          uri:
                            POSTS_IMAGE_BASE_URL +
                            item.file[currentPostImageIndex].filenames,
                        }
                      : imagePath.americanFoodImage
                  }
                  style={{ height: componentHeight, width: windowWidth }}
                ></Image>
              )}
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
            </View>
          </PanGestureHandler>
        </DoubleClick>
      </View>
    );
  };

  const renderCarouselPost = ({ item, index }) => {
    return (
      item &&
      (item.isGoogleAd
        ? renderGoogleAd()
        : item.isGoogle
        ? renderPost(item)
        : item.isAdvertisement
        ? renderAdvertisement(item)
        : renderInAppPost(item, index))
    );
  };

  function renderGoogleAd() {
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
        <BannerAd
          unitId={bannerAdId}
          size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
          requestOptions={
            {
              // requestNonPersonalizedAdsOnly: false,
              // keywords: ['Restaurant', 'Food', 'Diet', 'Social food']
            }
          }
          onAdFailedToLoad={(error) => {
            console.log("Ad loading error is", error);
          }}
          onAdLoaded={({ height, width }) => {
            console.log(
              "Ad is loaded with height",
              height,
              " and width ",
              width
            );
          }}
        />
      </View>
    );
  }

  const renderAdvertisement = (item) => {
    return (
      <View
        style={{
          height: componentHeight,
          width: windowWidth,
          backgroundColor: "transparent",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: windowHeight * 0.4,
            zIndex: 99,
            alignSelf: "center",
          }}
        >
          <Text
            style={commonStyles.textWhite(28, {
              color: colors.white,
              fontWeight: "bold",
            })}
          >
            {item.adTitle}
          </Text>
          <Text
            style={commonStyles.textWhite(22, {
              color: colors.white,
              marginTop: moderateScale(4),
            })}
          >
            {item.adDescription}
          </Text>
        </View>
        {item.adType == "image" ? (
          <ImageBackground
            source={{ uri: ADVERTISEMENTS_BASE_URL + item.adMediaSource }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        ) : (
          <Video
            source={{ uri: ADVERTISEMENTS_BASE_URL + item.adMediaSource }}
            style={{
              height: windowHeight,
              width: windowWidth,
              position: "absolute",
              top: 0,
              zIndex: 9,
            }}
            resizeMode="stretch"
            paused={
              item.isPaused !== undefined
                ? item.isPaused || !isFocused
                : !isFocused
            }
            repeat={true}
            ref={(ref) => {
              videoRef.current = ref;
            }}
          />
        )}
      </View>
    );
  };

  const listKeyExtractor = useCallback((item, index) => {
    // Use unique identifiers when available, fallback to index
    if (item && item.restaurant_id) {
      return `restaurant-${item.restaurant_id}-${index}`;
    }
    if (item && item.id) {
      return `post-${item.id}-${index}`;
    }
    if (item && item.isGoogleAd) {
      return `google-ad-${index}`;
    }
    if (item && item.isAdvertisement && item.id) {
      return `ad-${item.id}-${index}`;
    }
    return `item-${index}`;
  }, []);

  return (
    <View
      style={[
        commonStyles.flexFull,
        { backgroundColor: currentThemePrimaryColor },
      ]}
    >
      {likingPost && (
        <View style={{ flex: 1, zIndex: 99 }}>
          <Animated.View style={{ opacity: opacity }}>
            <FontAwesome
              name="heart"
              style={{
                fontSize: moderateScale(40),
                color: colors.appPrimary,
                top: componentHeight * 0.4,
                left: 0.4 * windowWidth,
                position: "absolute",
                zIndex: 99,
              }}
            />
          </Animated.View>
        </View>
      )}
      {isPausingVideo && (
        <View style={{ flex: 1, zIndex: 99 }}>
          <Animated.View style={{ opacity: playOpacity }}>
            <Ionicons
              name="pause-outline"
              style={{
                fontSize: moderateScale(40),
                color: colors.lightGrey,
                top: componentHeight * 0.4,
                left: 0.4 * windowWidth,
                position: "absolute",
                zIndex: 99,
              }}
            />
          </Animated.View>
        </View>
      )}
      {isPlayingVideo && (
        <View style={{ flex: 1, zIndex: 99 }}>
          <Animated.View style={{ opacity: playOpacity }}>
            <Ionicons
              name="play"
              style={{
                fontSize: moderateScale(40),
                color: colors.lightGrey,
                top: componentHeight * 0.4,
                left: 0.4 * windowWidth,
                position: "absolute",
                zIndex: 99,
              }}
            />
          </Animated.View>
        </View>
      )}
      {isLoading && <LoadingComponent title={loaderTitle} />}
      <CustomToast
        isVisible={showCustomToast}
        toastMessage={customToastMessage}
        onToastShow={() => {
          setTimeout(() => {
            setShowCustomToast(false);
          }, 900);
        }}
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
      <FlatList
        ref={carouselRef}
        data={allPosts}
        renderItem={renderCarouselPost}
        pagingEnabled={true}
        keyExtractor={listKeyExtractor}
        showsVerticalScrollIndicator={false}
        onLayout={(event) => {
          setComponentHeight(event.nativeEvent.layout.height);
        }}
        getItemLayout={(data, index) => ({
          length: componentHeight,
          offset: componentHeight * index,
          index,
        })}
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
        onScroll={(e) => {
          videoRef?.current?.seek(0);
          AsyncStorage.getItem("swipeValue").then((val) => {
            AsyncStorage.getItem("isReviewPosted").then((isPosted) => {
              if (isPosted == "false") {
                let value = parseInt(val);
                if (value == 25 || value == 100 || value == 400) {
                  InAppReview.isAvailable();
                  InAppReview.RequestInAppReview()
                    .then((hasFlowFinishedSuccessfully) => {
                      console.log(
                        "InAppReview in android",
                        hasFlowFinishedSuccessfully
                      );
                      console.log(
                        "InAppReview in ios has launched successfully",
                        hasFlowFinishedSuccessfully
                      );
                      if (hasFlowFinishedSuccessfully) {
                        AsyncStorage.setItem("isReviewPosted", "true");
                        // do something for ios
                        // do something for android
                      }
                    })
                    .catch((error) => {
                      console.log(error);
                    });
                }
                value = value + 1;
                AsyncStorage.setItem("swipeValue", value.toString());
              }
            });
          });
        }}
        removeClippedSubviews={true}
        onMomentumScrollEnd={(evt) => {
          let currentHeight = evt.nativeEvent.contentOffset.y;
          let currentIndex = Math.round(currentHeight / componentHeight);
          setCurrentPostIndex(currentIndex);
          setCurrentPostImageIndex(0);
          if (allPosts && allPosts.length > 0 && allPosts[currentIndex]) {
            setPostDetails(allPosts[currentIndex]);
          }

          const totalPosts = allPosts.length;
          const remainingPosts = totalPosts - currentIndex - 1;
          console.log(`📍 Scroll position: Index ${currentIndex} of ${totalPosts} (${remainingPosts} remaining)`);
          
          if (
            totalPosts > 0 &&
            remainingPosts <= 0 &&
            !showLoadingMorePosts &&
            lastLoadMoreLengthRef.current !== totalPosts
          ) {
            console.log("🚀 Reached end of list, loading more posts...");
            lastLoadMoreLengthRef.current = totalPosts;
            getNewPosts();
          } else {
            console.log("⏸️ Load more skipped - not at the end or already loading");
          }

          // Handle video playback state for all items (posts + ads)
          let newUp = allPosts.map((item, index) => {
            if (item && item.isAdvertisement && item.adType === "video") {
              // For video ads: play current, pause others
              return {
                ...item,
                isPaused: index !== currentIndex,
              };
            } else if (item && !item.isAdvertisement) {
              // For regular posts: existing logic
              return {
                ...item,
                isPaused:
                  index !== currentIndex
                    ? true
                    : item.isPaused !== undefined
                    ? item.isPaused
                    : true,
              };
            }
            return item;
          });
          dispatch(setAllPosts(newUp));

          // Track ad view
          if (
            allPosts &&
            allPosts[currentIndex] &&
            allPosts[currentIndex].isAdvertisement
          ) {
            let objAd = {
              advertisement_id: allPosts[currentIndex].id,
              user_id: userDetails.id,
            };
            // Fire and forget - track ad view, don't show errors to user
            apiHandler.viewAdvertisement(objAd, accessToken).catch((error) => {
              console.warn("Failed to track advertisement view:", error);
            });
          }
        }}
        initialNumToRender={3}
        windowSize={5}
        updateCellsBatchingPeriod={100}
        maxToRenderPerBatch={3}
      />
      {showLoadingMorePosts && (
        <View
          style={{
            height: moderateScale(40),
            width: windowWidth,
            position: "absolute",
            bottom: moderateScale(50),
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size={"large"} color={colors.appPrimary} />
          <Text
            style={commonStyles.textWhite(16, { color: colors.appPrimary })}
          >
            Loading more
          </Text>
        </View>
      )}
      {/* <CommonButton buttonTitle={'Load More'} /> */}
      <Modal
        visible={showCommentModal}
        transparent={true}
        onRequestClose={showHideCommentModal}
        animationType="slide"
      >
        <View style={styles.commentModalFullContainer}>
          <Pressable
            style={styles.commentModalTopContainer}
            onPress={showHideCommentModal}
          />
          <View
            style={styles.commentModalInnerContainer(currentThemePrimaryColor)}
          >
            <View style={styles.modalTopContainer}>
              {postDetails && !postDetails.isGoogle && (
                <TouchableOpacity
                  onPress={onShowLikePress}
                  style={styles.singleDetailContainer}
                >
                  <Image
                    source={imagePath.likedPost}
                    style={styles.singleImageStyle}
                  />
                  <Text
                    style={commonStyles.textWhite(15, {
                      color: currentThemeSecondaryColor,
                      fontWeight: "700",
                      alignSelf: "center",
                      marginLeft: moderateScale(3),
                    })}
                  >
                    {postDetails &&
                      postDetails.like &&
                      postDetails.like.length + " likes"}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onShowCommentPress}
                style={styles.singleDetailContainer}
              >
                <MaterialCommunityIcons
                  name="message"
                  style={styles.messageIcon(currentThemeSecondaryColor)}
                />
                <Text
                  style={commonStyles.textWhite(15, {
                    color: currentThemeSecondaryColor,
                    fontWeight: "700",
                    alignSelf: "center",
                    marginLeft: moderateScale(2),
                  })}
                >
                  {postDetails &&
                    (postDetails.isGoogle
                      ? postDetails.allReviews &&
                        postDetails.allReviews.length > 0
                        ? postDetails.allReviews.length + " reviews"
                        : 0
                      : postDetails.comment && postDetails.comment.length > 0
                      ? postDetails.comment.length + " reviews"
                      : 0)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.borderStyle} />
            <View style={commonStyles.flexFull}>
              {postDetails &&
                (postDetails.isGoogle ? (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {postDetails.allReviews &&
                      postDetails.allReviews.length > 0 &&
                      postDetails.allReviews.map((item, index) => {
                        return (
                          <View key={`review-${index}`}>
                            {renderReview(item, index)}
                          </View>
                        );
                      })}
                  </ScrollView>
                ) : selectedTab.id == 0 ? (
                  <KeyboardAvoidingView
                    behavior="padding"
                    style={commonStyles.flexFull}
                    keyboardVerticalOffset={0.4 * windowHeight}
                  >
                    <View style={commonStyles.flexFull}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {postDetails &&
                          postDetails.comment &&
                          postDetails.comment.map((item, index) => {
                            return (
                              <View key={`comment-${index}`}>
                                {renderCommentView(item, index)}
                              </View>
                            );
                          })}
                      </ScrollView>
                      <View style={styles.commentBoxContainer}>
                        <TextInput
                          value={comment}
                          placeholder="Enter comment"
                          onChangeText={(text) => {
                            setComment(text);
                          }}
                          style={styles.commentTextInput(
                            currentThemeSecondaryColor
                          )}
                        />
                        <TouchableOpacity
                          style={styles.commentUpdateButton}
                          onPress={commentOnPost}
                        >
                          <FontAwesome
                            name="send"
                            style={styles.sendCommentIcon}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </KeyboardAvoidingView>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {postDetails &&
                      postDetails.like &&
                      postDetails.like.length > 0 &&
                      postDetails.like.map((item, index) => {
                        return (
                          <View key={`like-${index}`}>
                            {renderLikedView(item, index)}
                          </View>
                        );
                      })}
                  </ScrollView>
                ))}
            </View>
          </View>
        </View>
      </Modal>
      {showDeletePostModal && (
        <DeletePostModal
          onCancelPress={() => {
            setShowDeletePostModal(false);
          }}
          onDeletePress={deletePost}
        />
      )}
      {/* </View > */}
      {/* } */}
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    height: 763,
    width: windowWidth,
    // padding: moderateScale(8),
    justifyContent: "center",
  },
  advertisementImage: {
    height: 763,
    width: windowWidth,
  },
  fullInnerContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  headerComponentContainer: {
    width: windowWidth - moderateScale(16),
    height: moderateScale(28),
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  headerInnerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    height: moderateScale(26),
    width: moderateScale(26),
    borderRadius: moderateScale(13),
    borderWidth: moderateScale(1),
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    height: moderateScale(24),
    width: moderateScale(24),
    borderRadius: moderateScale(12),
    overflow: "hidden",
  },
  threeDotsIconStyle: (currentThemePrimaryColor) => {
    return {
      fontSize: 25,
      color: currentThemePrimaryColor,
    };
  },
  commentSectionContainer: {
    minHeight: moderateScale(100),
    minWidth: moderateScale(40),
    padding: moderateScale(5),
    position: "absolute",
    right: moderateScale(0),
    bottom: windowHeight * 0.15,
    alignItems: "center",
    zIndex: 99,
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
  commentModalFullContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  commentModalInnerContainer: (currentThemePrimaryColor) => {
    return {
      backgroundColor: currentThemePrimaryColor,
      borderTopLeftRadius: moderateScale(18),
      borderTopRightRadius: moderateScale(18),
      flex: 0.7,
    };
  },
  commentModalTopContainer: {
    flex: 0.3,
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
  commentBoxContainer: {
    flexDirection: "row",
    height: moderateScale(30),
    margin: moderateScale(5),
    borderWidth: moderateScale(0.7),
    borderRadius: moderateScale(15),
    alignItems: "center",
    borderColor: colors.grey,
  },
  commentTextInput: (currentThemeSecondaryColor) => {
    return {
      flex: 1,
      fontFamily: "Montserrat-Regular",
      fontSize: fontScalingFactor * 18,
      color: currentThemeSecondaryColor,
      paddingHorizontal: moderateScale(4),
    };
  },
  commentUpdateButton: {
    height: moderateScale(28),
    width: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  sendCommentIcon: {
    fontSize: 30,
    color: colors.appPrimary,
  },
  messageIcon: (currentThemeSecondaryColor) => {
    return {
      fontSize: 25,
      color: currentThemeSecondaryColor,
    };
  },
  changeImageContainer: {
    position: "absolute",
    height: windowHeight,
    width: windowWidth,
    backgroundColor: `${colors.white}00`,
    flexDirection: "row",
    zIndex: 2,
  },
  changeImageInnerContainer: {
    flex: 1,
    flexDirection: "row",
  },
  shareIcon: {
    fontSize: 35,
    color: colors.white,
    marginTop: moderateScale(10),
  },
  singleRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  singleLikeContainer: {
    flexDirection: "row",
    width: windowWidth,
    alignSelf: "center",
    borderBottomWidth: moderateScale(0.7),
    borderBottomColor: colors.lightGrey,
    padding: moderateScale(7),
    alignItems: "center",
  },
  singleLikeInnerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  likeImage: {
    height: moderateScale(16),
    width: moderateScale(16),
    resizeMode: "stretch",
    borderRadius: moderateScale(8),
    overflow: "hidden",
  },
  reviewImage: {
    height: moderateScale(16),
    width: moderateScale(16),
    resizeMode: "stretch",
    borderRadius: moderateScale(8),
    overflow: "hidden",
  },
  reviewInnerContainer: {
    flex: 1,
    marginLeft: moderateScale(8),
  },
  userProfileImage: {
    height: moderateScale(16),
    width: moderateScale(16),
    resizeMode: "stretch",
    borderRadius: moderateScale(8),
    overflow: "hidden",
  },
  commentInnerContainer: { flex: 1, marginLeft: moderateScale(8) },
  videoPostFullContainer: {
    height: windowHeight,
    width: windowWidth,
    backgroundColor: "transparent",
  },
  videoContainer: {
    position: "absolute",
    height: windowHeight,
    width: windowWidth,
    top: 0,
    backgroundColor: "transparent",
    zIndex: 9,
  },
  postHeaderFullContainer: {
    width: windowWidth - moderateScale(16),
    height: moderateScale(28),
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    position: "absolute",
    top: moderateScale(5),
    zIndex: 11,
  },
  managePostOptionContainer: (currentThemePrimaryColor) => {
    return {
      position: "absolute",
      right: moderateScale(10),
      backgroundColor: currentThemePrimaryColor,
      top: moderateScale(3),
      borderTopLeftRadius: moderateScale(8),
      borderBottomLeftRadius: moderateScale(8),
    };
  },
  singleManageOptionContainer: { padding: moderateScale(8) },
  videoPostOptionsContainer: {
    minHeight: moderateScale(100),
    minWidth: moderateScale(40),
    padding: moderateScale(5),
    position: "absolute",
    right: moderateScale(0),
    bottom: windowHeight * 0.22,
    alignItems: "center",
    zIndex: 99,
  },
  align_Center: { alignItems: "center" },
  videoPostDetailsContainer: {
    position: "absolute",
    left: moderateScale(10),
    bottom: windowHeight * 0.1,
    maxWidth: windowWidth * 0.8,
    zIndex: 99,
  },
  imagePostManageContainer: {
    width: windowWidth - moderateScale(16),
    height: moderateScale(28),
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    position: "absolute",
    top: moderateScale(5),
    zIndex: 11,
  },
  imagePostManageInnerContainer: {
    position: "absolute",
    right: moderateScale(10),
    backgroundColor: colors.white,
    top: moderateScale(3),
    borderTopLeftRadius: moderateScale(8),
    borderBottomLeftRadius: moderateScale(8),
    padding: moderateScale(6),
    paddingRight: moderateScale(12),
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
