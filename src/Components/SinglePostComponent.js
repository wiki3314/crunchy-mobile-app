import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
  updateFavoriteRestaurants,
  updateFavouritePlaces,
  updateLikedPosts,
  updatePost,
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
// import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import InAppReview from "react-native-in-app-review";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DoubleClick from "./DoubleClick";
// import Share from 'react-native-share';
// const bannerAdId = Platform.OS == 'android' ? 'ca-app-pub-8426298054726789/4881281307' : 'ca-app-pub-8426298054726789/5152744042'

// var RNFS = require('react-native-fs');

// const bannerAdId = Platform.OS == 'android' ? "ca-app-pub-3940256099942544/6300978111" : 'ca-app-pub-3940256099942544/2934735716'

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
  const [componentHeight, setComponentHeight] = useState(0);
  const [likingPost, setLikingPost] = useState(false);
  const [opacity] = useState(new Animated.Value(0));
  const [playOpacity] = useState(new Animated.Value(0));
  const [likeOpacity, setLikeOpacity] = useState(0);
  const [playPauseOpacity, setPlayPauseOpacity] = useState(0);
  const [showLoadingMorePosts, setShowLoadingMorePosts] = useState(false);
  const [currentIncrementValue, setCurrentIncrementValue] = useState(1);
  const [isPausingVideo, setIsPausingVideo] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  opacity.addListener(({ value }) => {
    setLikeOpacity(value);
  });

  playOpacity.addListener(({ value }) => {
    setPlayPauseOpacity(value);
  });

  const videoRef = useRef();

  const carouselRef = useRef();

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (loadNewPosts) {
      setCurrentIncrementValue(1);
      getServerPosts();
    }
    allPosts.map((item, index) => {
      item.isPaused = true;
    });
    if (searchingForQuickBites) {
      searchQuickBitesPlaces();
    }
  }, [isFocused]);

  const searchQuickBitesPlaces = async () => {
    try {
      setIsLoading(true);
      setLoaderTitle(`Fetching ${searchedQuickBitesName} restaurants`);
      let arrPostsWithAdminAds = [];
      let arrPostsWithAllAds = [];
      let response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
          userLocation.latitude
        }%2C${userLocation.longitude}&radius=${
          savedPostsRadius * 1000
        }&type=restaurant&name=${searchedQuickBitesName}&key=${GOOGLE_API_KEY}`
      );
      let placesData = [];
      placesData = response?.data?.results?.map((item, index) => {
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
            });
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
      dispatch(setSearchingForQuickBites(""));
      if (placesData.length > 0) {
        carouselRef.current.scrollToIndex({ index: 0 });
      }
      setIsLoading(false);
    } catch (err) {
      console.log("Error searching quick bites:", err);
      dispatch(setSearchingForQuickBites(""));
      setIsLoading(false);
    }
  };

  const getServerPosts = async () => {
    try {
      setIsLoading(true);
      setLoaderTitle("Searching for yummy restaurants");
      let radiusInMiles = savedPostsRadius * 1.609;
      let response;
      let arrPostsWithAdminAds = [];
      let arrPostsWithAllAds = [];
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
          radiusInMiles,
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
          radiusInMiles,
          accessToken
        );
      }
      response = response.map((item, index) => {
        if (item) {
          console.log("Item is", item);
          return {
            ...item,
            isPaused: true,
          };
        }
      });
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
            });
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
      setPostDetails(arrPostsWithAllAds[0]);
      dispatch(setAllPosts(arrPostsWithAllAds));
      if (arrPostsWithAllAds.length > 0) {
        carouselRef.current.scrollToIndex({ index: 0 });
      }
      dispatch(setLoadNewPosts(false));
      setIsLoading(false);
    } catch (err) {
      console.log("Error is", err);
      dispatch(setLoadNewPosts(false));
      setIsLoading(false);
    }
  };

  async function getNewPosts() {
    try {
      setShowLoadingMorePosts(true);
      let updatedRadius =
        (savedPostsRadius + 2 * currentIncrementValue) * 1.609;
      let arrPostsWithAdminAds = [];
      let arrPostsWithAllAds = [];
      let arrPostsInState = [...allPosts];
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
          updatedRadius,
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
          updatedRadius,
          accessToken
        );
      }
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
            return iPlace;
          }
        }
      });
      7;
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
            });
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
      let increment = currentIncrementValue;
      arrPostsWithAllAds = [...arrPostsInState, ...arrPostsWithAllAds];
      setCurrentIncrementValue(increment + 1);
      setPostDetails(arrPostsWithAllAds[currentPostIndex]);
      dispatch(setAllPosts(arrPostsWithAllAds));
      setShowLoadingMorePosts(false);
    } catch (err) {
      console.log("Error loading new posts:", err);
      setShowLoadingMorePosts(false);
    }
  }

  const onRestaurantImagePress = (item) => {
    navigation.navigate(navigationStrings.RestaurantDetails, {
      restaurant_id: item.restaurant_id,
    });
  };

  const onCommentPress = () => {
    setShowCommentModal(true);
  };

  const onLikeUnlikePostPress = async (post, isLiked) => {
    // setIsLoading(true)
    if (!isLiked) {
      setLikingPost(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => {
          setLikingPost(false);
        });
      });
    }
    let objRestaurant = {
      restaurant_id: post.restaurant_id,
      restaurantName: post.restaurantName,
      restaurantImage: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${post.restaurantImage}&key=${GOOGLE_API_KEY}`,
    };
    dispatch(updateFavoriteRestaurants(objRestaurant));
    dispatch(updateFavouritePlaces(objRestaurant));
    let objPost = {
      restaurant_id: post.restaurant_id,
      restaurant_name: post.restaurantName,
      image: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${windowWidth}&photo_reference=${post.restaurantImage}&key=${GOOGLE_API_KEY}`,
    };
    await apiHandler.likeGooglePost(objPost, accessToken);
    await apiHandler.likeRestaurant(objPost, accessToken);
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
      if (post.restaurant_id && !post.restaurant_id.startsWith("MOCK_")) {
        // Real restaurant - use data from the post
        try {
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

          let requestObject = {
            restaurant_id: post.restaurant_id,
            restaurant_name: restaurantName,
            image: restaurantImage,
          };

          let objRestaurant = {
            restaurant_id: post.restaurant_id,
            restaurantName: restaurantName,
            restaurantImage: restaurantImage,
          };

          dispatch(updateFavoriteRestaurants(objRestaurant));
          await apiHandler.likeRestaurant(requestObject, accessToken);
          console.log("✅ Restaurant favorited successfully");
        } catch (restaurantError) {
          console.log(
            "Restaurant favorite error (non-critical):",
            restaurantError.message
          );
        }
      } else if (post.restaurant_id && post.restaurant_id.startsWith("MOCK_")) {
        // Mock restaurant ID - use restaurant data from post
        console.log("Using mock restaurant data for like");
        let objRestaurant = {
          restaurant_id: post.restaurant_id,
          restaurantName:
            post.restaurant && typeof post.restaurant === "object"
              ? post.restaurant.name
              : post.restaurant || "Unknown",
          restaurantImage: "",
        };
        dispatch(updateFavoriteRestaurants(objRestaurant));
      }

      dispatch(updateLikedPosts(post));
      console.log("✅ Like operation completed successfully");
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
      sharedLink = `googlePost/?${item.restaurant_id}`;
    } else {
      sharedLink = `applicationPost/?${item.restaurant_id}`;
    }
    setIsLoading(true);
    setLoaderTitle("Generating share link");
    let link = await firebase.dynamicLinks().buildShortLink(
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
    let base64Image;
    if (item.isGoogle) {
      await RNFS.downloadFile({
        fromUrl: `https://maps.googleapis.com/maps/api/place/photo?photo_reference=${item.restaurantImage}&key=${GOOGLE_API_KEY}`,
        toFile: `file://${path}`,
      }).promise;
      base64Image = await RNFS.readFile(`file://${path}`, "base64");
    }
    const shareOptions = {
      title: "Found this on Crunchii",
      message:
        "Hey! I found this restaurant on Crunchii, check it out. \n" + link,
      url: `data:image/jpeg;base64,${base64Image}`,
    };
    setIsLoading(false);
    Share.open(shareOptions);
    // if (Platform.OS == 'ios') {

    //     await Share.share({
    //         message: 'Hey! I found this restaurant on Crunchii, check it out. \n',
    //         url: link,
    //         title: 'Found this on Crunchii'
    //     })
    // }
    // else {
    //     await Share.share({
    //         message: 'Hey! I found this restaurant on Crunchii, check it out. \n' + link,
    //         title: 'Found this on Crunchii'
    //     })
    // }
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

  const handleGesture = (event, item) => {
    if (event.nativeEvent.state == 5) {
      if (event.nativeEvent.translationX < -50) {
        navigation.navigate(navigationStrings.RestaurantDetails, {
          restaurant_id: item.restaurant_id,
        });
      } else if (event.nativeEvent.translationX > 50) {
        navigation.navigate(navigationStrings.SearchScreen);
      }
    }
  };

  const renderPost = (item) => {
    let isLiked =
      likedGooglePlaces &&
      likedGooglePlaces.length > 0 &&
      likedGooglePlaces.findIndex((innerItem, innerIndex) => {
        return innerItem.restaurant_id == item.restaurant_id;
      }) != -1;
    return (
      item && (
        <ImageBackground
          resizeMode="cover"
          source={
            item && item.restaurantImage && item.restaurantImage != ""
              ? {
                  uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${700}&photo_reference=${
                    item.restaurantImage
                  }&key=${GOOGLE_API_KEY}`,
                }
              : imagePath.americanFoodImage
          }
          style={{ height: componentHeight, width: windowWidth }}
        >
          {/* <TouchableOpacity style={{ flex: 1, backgroundColor: 'transparent' }} activeOpacity={1} onPress={() => {
                onPostLeftSidePress(item, isLiked)
            }} > */}
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
            <PanGestureHandler
              failOffsetY={[-5, 5]}
              activeOffsetX={[-5, 5]}
              onHandlerStateChange={(event) => {
                handleGesture(event, item);
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    minHeight: moderateScale(100),
                    width: windowWidth * 0.7,
                    padding: moderateScale(5),
                    position: "absolute",
                    left: moderateScale(0),
                    bottom: windowHeight * 0.2,
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
                  {item && item.restaurantRating
                    ? helperFunctions.getStarRatings(item.restaurantRating)
                    : null}
                  {item && item.restaurantRating ? (
                    <Text
                      style={commonStyles.textWhite(28, {
                        textShadowColor: colors.black,
                        textShadowOffset: { width: 5, height: 5 },
                        textShadowRadius: 10,
                        zIndex: 99,
                      })}
                    >
                      {item.restaurantRating}
                    </Text>
                  ) : null}
                  {item &&
                  item.restaurantPrice &&
                  item.restaurantPrice != "" ? (
                    <View style={styles.singleRatingContainer}>
                      {ratingsData.map((innerItem, innerIndex) => {
                        return (
                          innerItem <=
                            Math.floor(
                              item && item.restaurantPrice
                                ? item.restaurantPrice
                                : 0
                            ) && (
                            <FontAwesome
                              key={`dollar-${innerIndex}`}
                              name="dollar"
                              style={{
                                fontSize: 25,
                                color: "#007700",
                                marginLeft:
                                  innerIndex !== 0 ? moderateScale(3) : 0,
                              }}
                            />
                          )
                        );
                      })}
                    </View>
                  ) : null}
                </View>
                <View
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
                            isLiked
                              ? imagePath.likedPost
                              : imagePath.unlikedPost
                          }
                          style={styles.likePostImage}
                        >
                          {/* <Ionicons name={isLiked ? 'checkmark' : 'add-circle'} style={{ fontSize: moderateScale(10), color: isLiked ? colors.green : colors.black, position: 'absolute', top: -moderateScale(4), right: -moderateScale(4) }} /> */}
                        </ImageBackground>
                      </TouchableOpacity>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
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
      )
    );
  };

  const commentOnPost = async () => {
    if (comment.trim() == "") {
      setShowCommentModal(false);
      setErrorMessage("Review can not be empty");
      setShowErrorMessage(true);
    } else {
      setShowCommentModal(false);
      setIsLoading(true);
      setLoaderTitle("Posting your review");

      let reqObj = {
        post_id: postDetails.id,
        comment: comment,
        created_id: postDetails.user_id,
      };

      try {
        const response = await apiHandler.commentOnPost(reqObj, accessToken);

        if (response && response.success) {
          let objData = comment;
          objData = {
            comment: comment,
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
          setShowCustomToast(true);
        } else {
          setErrorMessage(response?.message || "Failed to post comment");
          setShowErrorMessage(true);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Comment Error:", error);
        setErrorMessage("Failed to post comment. Please try again.");
        setShowErrorMessage(true);
        setIsLoading(false);
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
    const isLiked =
      likedPosts &&
      likedPosts.length > 0 &&
      likedPosts.findIndex((innerItem, innerIndex) => {
        return item.id == innerItem.id;
      }) != -1;
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
                {item &&
                  item.rating &&
                  helperFunctions.getStarRatings(item.rating)}
                {item && item.rating && (
                  <Text
                    style={commonStyles.textWhite(28, {
                      fontWeight: "400",
                      color: colors.white,
                      textShadowColor: colors.black,
                      textShadowOffset: { width: 5, height: 5 },
                      textShadowRadius: 10,
                    })}
                  >
                    {item && item.rating}
                  </Text>
                )}
                <Text
                  style={commonStyles.textWhite(14, {
                    fontWeight: "400",
                    color: colors.white,
                    textShadowColor: colors.black,
                    textShadowOffset: { width: 5, height: 5 },
                    textShadowRadius: 10,
                  })}
                >
                  {item && item.name}
                </Text>
                <Text
                  numberOfLines={showExpandedReview ? 20 : 2}
                  onPress={expandContractReview}
                  style={commonStyles.textWhite(14, {
                    fontWeight: "400",
                    color: colors.white,
                    marginBottom: moderateScale(100),
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
              item.file[0] &&
              item.file[0].type == "video" ? (
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
                      uri: POSTS_IMAGE_BASE_URL + item.file[0].filenames,
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
                    item.file && item.file.length > 0 && item.file[0].filenames
                      ? { uri: POSTS_IMAGE_BASE_URL + item.file[0].filenames }
                      : imagePath.americanFoodImage
                  }
                  style={{ height: componentHeight, width: windowWidth }}
                ></Image>
              )}
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
        }}
      >
        {/* <BannerAd
                unitId={bannerAdId}
                size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
                requestOptions={{
                    // requestNonPersonalizedAdsOnly: false,
                    // keywords: ['Restaurant', 'Food', 'Diet', 'Social food']
                }}
                onAdFailedToLoad={(error) => {
                    console.log('Ad loading error is', error)
                }}
                onAdLoaded={({ height, width }) => {
                    console.log('Ad is loaded with height', height, ' and width ', width)
                }}
            /> */}
        <Text
          style={commonStyles.textWhite(18, {
            color: currentThemeSecondaryColor,
          })}
        >
          Advertisement Space
        </Text>
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
            paused={item.isPaused || !isFocused}
            repeat={true}
            ref={(ref) => {
              videoRef.current = ref;
            }}
          />
        )}
      </View>
    );
  };

  const listKeyExtractor = useCallback((item, index) => index.toString(), []);

  console.log("All posts are", allPosts);

  return (
    <View
      style={[
        commonStyles.flexFull,
        { backgroundColor: currentThemePrimaryColor },
      ]}
    >
      {likingPost && (
        <View style={{ flex: 1, zIndex: 99 }}>
          <Animated.View style={{ opacity: likeOpacity }}>
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
          <Animated.View style={{ opacity: playPauseOpacity }}>
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
          <Animated.View style={{ opacity: playPauseOpacity }}>
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
              {/* <Text style={commonStyles.textWhite(28, { color: currentThemeSecondaryColor })}>
                            Oops..!!!
                        </Text>
                        <Text style={commonStyles.textWhite(22, { color: currentThemeSecondaryColor })}>
                            No restaurants found
                        </Text> */}
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
          let currentIndex = currentHeight / componentHeight;
          setCurrentPostIndex(currentIndex);
          if (allPosts && allPosts.length > 0 && allPosts[currentIndex]) {
            setPostDetails(allPosts[currentIndex]);
          }
          if (
            allPosts &&
            allPosts[currentIndex] &&
            allPosts[currentIndex].isAdvertisement
          ) {
            let objAd = {
              advertisement_id: allPosts[currentIndex].id,
              user_id: userDetails.id,
            };
            apiHandler.viewAdvertisement(objAd, accessToken);
          }
        }}
        onEndReached={() => {
          getNewPosts();
        }}
        initialNumToRender={25}
        windowSize={25}
        updateCellsBatchingPeriod={50}
        maxToRenderPerBatch={25}
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
});
