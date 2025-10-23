import { colors } from "../../Constants/colors";
import { imageAdsType, videoAdsType } from "../../Constants/globalConstants";
import { actionTypes } from "../actions/actionTypes";

export const initialState = {
  accessToken: "",
  userData: [],
  userLocation: {
    latitude: 55.9429035,
    longitude: 12.2943663,
  },
  foodCategories: [],
  allPosts: [],
  postsWithoutLogin: [],
  showForceLoginModal: false,
  appLaunchedFromLink: false,
  appLaunched: false,
  receivedPost: {
    isGoogle: false,
    id: "",
  },
  loadNewPosts: true,
  loadRandomPosts: false,
  savedFoodCategories: [],
  postsRadius: 20,
  isDarkModeActive: false,
  currentThemePrimaryColor: colors.white,
  currentThemeSecondaryColor: colors.black,
  autoUpdateDarkMode: false,
  isVibrationEnabled: false,
  favoriteRestaurants: [],
  likedPosts: [],
  likedGooglePlaces: [],
  loadUserData: true,
  isNewUser: false,
  adminAdvertisements: [],
  searchingQuickBites: false,
  searchedQuickBiteName: "",
  current_session_id: 0,
};

const reducer = (state = initialState, action) => {
  let objState = { ...state };
  switch (action.type) {
    case actionTypes.SET_ACCESS_TOKEN:
      objState.accessToken = action.payload;
      return objState;
    case actionTypes.SET_USER_DATA:
      objState.userData = action.payload;
      return objState;
    case actionTypes.SET_USER_LOCATION:
      objState.userLocation = action.payload;
      return objState;
    case actionTypes.SET_ALL_POSTS:
      let postsInPayload = action.payload;
      // postsInPayload = postsInPayload.map((item) => {
      //     return {
      //         ...item,
      //         isPlaying: false
      //     }
      // })
      objState.allPosts = postsInPayload;
      return objState;
    case actionTypes.SET_FOOD_CATEGORIES:
      objState.foodCategories = action.payload;
      return objState;
    case actionTypes.SET_POSTS_WITHOUT_LOGIN:
      objState.postsWithoutLogin = action.payload;
      return objState;
    case actionTypes.SHOW_HIDE_FORCE_LOGIN_MODAL:
      objState.showForceLoginModal = action.payload;
      return objState;
    case actionTypes.LOGOUT_USER:
      objState.accessToken = "";
      objState.userData = {};
      objState.showForceLoginModal = false;
      objState.loadNewPosts = true;
      // Don't reset dark mode settings on logout - user preference should persist
      // objState.isDarkModeActive = false;
      // objState.autoUpdateDarkMode = true;
      objState.likedGooglePlaces = [];
      objState.savedFoodCategories = [];
      objState.likedPosts = [];
      objState.favoriteRestaurants = [];
      objState.postsRadius = 20;
      return objState;
    case actionTypes.SET_APP_LAUNCHED_FROM_LINK:
      objState.appLaunchedFromLink = action.payload;
      objState.appLaunched = !action.payload;
      return objState;
    case actionTypes.SET_RECEIVED_POST:
      objState.receivedPost = action.payload;
      return objState;
    case actionTypes.SET_LOAD_NEW_POSTS:
      objState.loadNewPosts = action.payload;
      return objState;
    case actionTypes.LOAD_RANDOM_POSTS:
      objState.loadRandomPosts = action.payload;
      return objState;
    case actionTypes.SET_FAVOURITE_PLACES:
      let payloadPlaces = action.payload;
      objState.likedGooglePlaces = payloadPlaces;
      return objState;
    case actionTypes.UPDATE_FAVOURITE_PLACES:
      let objPlace = action.payload;
      let arrFavouritePlaces = [...objState.likedGooglePlaces];
      if (
        arrFavouritePlaces &&
        arrFavouritePlaces.length > 0 &&
        arrFavouritePlaces.findIndex((item, index) => {
          return item.restaurant_id == objPlace.restaurant_id;
        }) != -1
      ) {
        arrFavouritePlaces = arrFavouritePlaces.filter((item, index) => {
          return item.restaurant_id != objPlace.restaurant_id;
        });
      } else {
        arrFavouritePlaces.push(objPlace);
      }
      objState.likedGooglePlaces = arrFavouritePlaces;
      return objState;
    case actionTypes.UPDATE_SAVED_FOOD_CATEGORIES:
      objState.savedFoodCategories = action.payload;
      return objState;
    case actionTypes.SAVE_POSTS_RADIUS:
      objState.postsRadius = action.payload;
      return objState;
    case actionTypes.TOGGLE_DARK_MODE:
      objState.isDarkModeActive = action.payload;
      if (action.payload == true) {
        objState.currentThemePrimaryColor = colors.black;
        objState.currentThemeSecondaryColor = colors.white;
      } else {
        objState.currentThemePrimaryColor = colors.white;
        objState.currentThemeSecondaryColor = colors.black;
      }
      return objState;
    case actionTypes.AUTO_UPDATE_DARK_MODE:
      objState.autoUpdateDarkMode = action.payload;
      let currentTime = new Date().getHours();
      if (action.payload) {
        if (currentTime < 20 && currentTime > 8) {
          objState.isDarkModeActive = false;
          objState.currentThemePrimaryColor = colors.white;
          objState.currentThemeSecondaryColor = colors.black;
        } else {
          objState.isDarkModeActive = true;
          objState.currentThemePrimaryColor = colors.black;
          objState.currentThemeSecondaryColor = colors.white;
        }
      }
      return objState;
    case actionTypes.UPDATE_VIBRATION_SETTINGS:
      objState.isVibrationEnabled = action.payload;
      return objState;
    case actionTypes.SET_FAVORITE_RESTAURANTS:
      objState.favoriteRestaurants = action.payload;
      return objState;
    case actionTypes.UPDATE_FAVORITE_RESTAURANTS:
      let arrRestaurantsInState = [...objState.favoriteRestaurants];
      let objRestaurant = action.payload;
      if (
        arrRestaurantsInState &&
        arrRestaurantsInState.length > 0 &&
        arrRestaurantsInState.findIndex((innerItem, innerIndex) => {
          return innerItem.restaurant_id == objRestaurant.restaurant_id;
        }) != -1
      ) {
        arrRestaurantsInState = arrRestaurantsInState.filter(
          (iRestaurant, iRestaurantIndex) => {
            return iRestaurant.restaurant_id != objRestaurant.restaurant_id;
          }
        );
      } else {
        arrRestaurantsInState.push(objRestaurant);
      }
      objState.favoriteRestaurants = arrRestaurantsInState;
      return objState;
    case actionTypes.SET_LIKED_POSTS:
      objState.likedPosts = action.payload;
      return objState;
    case actionTypes.UPDATE_LIKED_POSTS:
      let arrLikedPosts = [...objState.likedPosts];
      let objPost = action.payload;
      if (
        arrLikedPosts &&
        arrLikedPosts.length > 0 &&
        arrLikedPosts.findIndex((innerItem, innerIndex) => {
          return innerItem.id == objPost.id;
        }) != -1
      ) {
        arrLikedPosts = arrLikedPosts.filter((item, index) => {
          item.id != objPost.id;
        });
      } else {
        arrLikedPosts.push(objPost);
      }
      objState.likedPosts = arrLikedPosts;
      return objState;
    case actionTypes.SET_LOAD_USER_DATA:
      objState.loadUserData = action.payload;
      return objState;
    case actionTypes.SET_IS_NEW_USER:
      console.log("Calliinnnnngggg");
      objState.isNewUser = action.payload;
      return objState;
    case actionTypes.UPDATE_POSTS:
      let postsInState = objState.allPosts;
      let updatedPosts = [];
      let payloadData = action.payload;
      if (payloadData.type == "comment") {
        updatedPosts = postsInState.map((item, index) => {
          let isInAppPost = item && (item.isGoogle ? item.isGoogle : false);
          if (!isInAppPost && item.id == payloadData.post_id) {
            let arrComments = item.comment;
            arrComments.push(payloadData.data);
            item.comment = arrComments;
            return item;
          } else {
            return item;
          }
        });
        objState.allPosts = updatedPosts;
        return objState;
      } else if (payloadData.type == "like") {
        updatedPosts = postsInState.map((item, index) => {
          if (item && item.id && item.id == payloadData.post_id) {
            let arrLikes = item.like || [];
            if (Array.isArray(arrLikes)) {
              if (
                !arrLikes.some((iLike) => {
                  return iLike.user.id == payloadData.data.user.id;
                })
              ) {
                console.log("In if");
                arrLikes.push(payloadData.data);
              }
            } else {
              arrLikes = [item.like];
              arrLikes.push(payloadData.data);
            }
            console.log("Arr likes are", arrLikes);
            item.like = arrLikes;
            return item;
          } else {
            return item;
          }
        });
        objState.allPosts = updatedPosts;
        return objState;
      } else if (payloadData.type == "unlike") {
        updatedPosts = postsInState.map((item, index) => {
          let isInAppPost = item && (item.isGoogle ? item.isGoogle : false);
          if (
            item &&
            item.id &&
            !isInAppPost &&
            item.id == payloadData.post_id
          ) {
            let arrLikes = item.like;
            if (arrLikes && arrLikes.length > 0) {
              arrLikes = arrLikes.filter((iLike) => {
                return iLike.user.id != payloadData.data.user.id;
              });
            }
            item.like = arrLikes;
            return item;
          } else {
            return item;
          }
        });
        objState.allPosts = updatedPosts;
        return objState;
      } else {
        let userDataInState = objState.userData;
        let arrUserPosts = [...objState.userData.posts];
        arrUserPosts = arrUserPosts.filter((item, index) => {
          return item.id !== payloadData.post_id;
        });
        userDataInState.posts = arrUserPosts;
        objState.userData = userDataInState;
        updatedPosts = postsInState.filter((item, innerIndex) => {
          if (innerIndex != payloadData.post_id) {
            return item;
          }
        });
        objState.allPosts = updatedPosts;
        return objState;
      }
    case actionTypes.SET_ADMIN_ADVERTISEMENTS:
      let adsInPayload = [...action.payload];
      let filteredAds = [];
      filteredAds = adsInPayload.map((adItem, adindex) => {
        if (imageAdsType.includes(adItem.type)) {
          let objAd = {
            id: adItem.id,
            title: adItem.title,
            description: adItem.description,
            mediaType: "image",
            mediaSource: adItem.file_name,
          };
          return objAd;
        } else if (videoAdsType.includes(adItem.type)) {
          let objAd = {
            id: adItem.id,
            title: adItem.title,
            description: adItem.description,
            mediaType: "video",
            mediaSource: adItem.file_name,
          };
          return objAd;
        }
      });
      filteredAds = filteredAds.filter((item, index) => {
        if (item) {
          return item;
        }
      });
      objState.adminAdvertisements = filteredAds;
      return objState;
    case actionTypes.SET_SEARCHING_FOR_QUICK_BITES:
      let currentVal = objState.searchingQuickBites;
      objState.searchingQuickBites = !currentVal;
      objState.searchedQuickBiteName = action.payload;
      return objState;
    case actionTypes.SET_CURRENT_SESSION_ID:
      objState.current_session_id = action.payload;
      return objState;
    default:
      return objState;
  }
};

export default reducer;
