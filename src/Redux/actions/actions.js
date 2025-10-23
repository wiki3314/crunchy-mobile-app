import { actionTypes } from "./actionTypes";

export const setAccessToken = (token) => ({
    type: actionTypes.SET_ACCESS_TOKEN,
    payload: token
})

export const setUserData = (data) => ({
    type: actionTypes.SET_USER_DATA,
    payload: data
})

export const logoutUser = () => ({
    type: actionTypes.LOGOUT_USER,
    payload: ''
})

export const setLocation = (payload) => ({
    type: actionTypes.SET_USER_LOCATION,
    payload: payload
})

export const setAllPosts = (posts) => ({
    type: actionTypes.SET_ALL_POSTS,
    payload: posts
})

export const setFoodCategories = (categories) => ({
    type: actionTypes.SET_FOOD_CATEGORIES,
    payload: categories
})

export const setPostsWithoutLogin = (posts) => ({
    type: actionTypes.SET_POSTS_WITHOUT_LOGIN,
    payload: posts
})

export const showHideForceLoginModal = (payload) => ({
    type: actionTypes.SHOW_HIDE_FORCE_LOGIN_MODAL,
    payload: payload
})

export const setAppLaunchedFromLink = (payload) => ({
    type: actionTypes.SET_APP_LAUNCHED_FROM_LINK,
    payload: payload
})

export const setReceivedPost = (payload) => ({
    type: actionTypes.SET_RECEIVED_POST,
    payload: payload
})

export const setLoadNewPosts = (payload) => ({
    type: actionTypes.SET_LOAD_NEW_POSTS,
    payload: payload
})

export const setLoadRandomPosts = (payload) => ({
    type: actionTypes.LOAD_RANDOM_POSTS,
    payload: payload
})

export const setFavouritePlaces = (payload) => ({
    type: actionTypes.SET_FAVOURITE_PLACES,
    payload: payload
})

export const updateFavouritePlaces = (payload) => ({
    type: actionTypes.UPDATE_FAVOURITE_PLACES,
    payload: payload
})

export const updateFoodCategories = (categories) => ({
    type: actionTypes.UPDATE_SAVED_FOOD_CATEGORIES,
    payload: categories
})

export const savePostsRadius = (radius) => ({
    type: actionTypes.SAVE_POSTS_RADIUS,
    payload: radius
})

export const toggleDarkMode = (payload) => ({
    type: actionTypes.TOGGLE_DARK_MODE,
    payload: payload
})

export const enableDarkModeAutoUpdate = (payload) => ({
    type: actionTypes.AUTO_UPDATE_DARK_MODE,
    payload: payload
})

export const updateVibrationSettings = (payload) => ({
    type: actionTypes.UPDATE_VIBRATION_SETTINGS,
    payload: payload
})

export const setFavoriteRestaurants = (payload) => ({
    type: actionTypes.SET_FAVORITE_RESTAURANTS,
    payload: payload
})

export const updateFavoriteRestaurants = (payload) => ({
    type: actionTypes.UPDATE_FAVORITE_RESTAURANTS,
    payload: payload
})

export const setLikedPosts = (payload) => ({
    type: actionTypes.SET_LIKED_POSTS,
    payload: payload
})

export const updateLikedPosts = (payload) => ({
    type: actionTypes.UPDATE_LIKED_POSTS,
    payload: payload
})

export const setLoadUserData = (payload) => ({
    type: actionTypes.SET_LOAD_USER_DATA,
    payload: payload
})

export const setIsNewUser = (payload) => ({
    type: actionTypes.SET_IS_NEW_USER,
    payload: payload
})

export const updatePost = (payload) => ({
    type: actionTypes.UPDATE_POSTS,
    payload: payload
})

export const setAdminAdvertisements = (payload) => ({
    type: actionTypes.SET_ADMIN_ADVERTISEMENTS,
    payload: payload
})

export const setSearchingForQuickBites = (payload) => ({
    type: actionTypes.SET_SEARCHING_FOR_QUICK_BITES,
    payload: payload
})

export const setCurrentSessionId = (payload) => ({
    type: actionTypes.SET_CURRENT_SESSION_ID,
    payload: payload
})