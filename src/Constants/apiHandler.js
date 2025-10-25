import axios from "axios";
import { GOOGLE_API_KEY, USE_MOCK_DATA } from "./globalConstants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  mockRestaurants,
  getMockRestaurantsByCategory,
} from "./mockRestaurantData";
// For Android Emulator, use 10.0.2.2 instead of localhost
// For iOS Simulator, use localhost or your machine's IP
// For Real Android Device, use your computer's actual IP address
export const BASE_URL = "http://192.168.100.14:3000/api/"; // Real device IP
// export const BASE_URL = "http://10.0.2.2:3000/api/"; // For Android Emulator

export const apiHandler = {
  createFormData: (reqObj) => {
    let formData = new FormData();
    for (const property in reqObj) {
      formData.append(property, reqObj[property]);
    }
    return formData;
  },
  registerUser: async (reqObj) => {
    try {
      let res = await axios.post(BASE_URL + "register", reqObj, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return res.data;
    } catch (error) {
      console.log("Registration Error:", error);
      console.log("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Network error - please check backend is running",
      };
    }
  },
  loginUser: async (reqObj) => {
    try {
      let res = await axios.post(BASE_URL + "login", reqObj, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return res.data;
    } catch (error) {
      console.log("Login Error:", error);
      console.log("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Network error - please check backend is running",
      };
    }
  },
  socialLogin: async (reqObj) => {
    try {
      let res = await axios.post(BASE_URL + "socialLogin", reqObj);
      return res.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  forgotPassword: async (reqObj) => {
    try {
      let res = await axios.post(BASE_URL + "forgot", reqObj);
      return res.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  getUserData: async (token) => {
    try {
      let res = await axios.get(BASE_URL + "profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Profile API Response:", res.data);
      return res.data.user;
    } catch (error) {
      console.log("Profile API Error:", error);
      console.log(
        "Profile API Error details:",
        error.response?.data || error.message
      );
      throw error; // Re-throw to be caught by caller
    }
  },
  updateUserProfile: async (reqObj, token) => {
    try {
      let res = await axios.post(BASE_URL + "update_profile", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  getAllCategories: async (token) => {
    try {
      let res = await axios.get(BASE_URL + "category-list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.Category || [];
    } catch (error) {
      console.log("Categories API Error:", error);
      return []; // Return empty array on error
    }
  },
  getPostsWithoutLogin: async (reqObj) => {
    try {
      let res = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${reqObj.latitude}%2C${reqObj.longitude}&radius=40000&type=restaurant&key=${GOOGLE_API_KEY}`
      );
      let placesData = res?.data?.results?.map((item, index) => {
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
      placesData = placesData.sort((a, b) => {
        return 0.5 - Math.random();
      });
      let arrPostsWithoutLogin = [...placesData];
      return arrPostsWithoutLogin;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  getPosts: async (reqOBj, radius, token, categoryNames) => {
    try {
      let arrResponses = [];
      let placesData = [];

      // ⚠️ USE MOCK DATA if flag is enabled (for development without Google API billing)
      if (USE_MOCK_DATA) {
        console.log(
          "🔧 Using MOCK restaurant data (Google API billing not enabled)"
        );
        console.log("Categories:", categoryNames);

        if (categoryNames && categoryNames.length > 0) {
          // Get mock restaurants for each category
          categoryNames.forEach((categoryName) => {
            const mockByCategory = getMockRestaurantsByCategory(categoryName);
            placesData.push(...mockByCategory);
          });

          // Remove duplicates
          placesData = Array.from(
            new Map(
              placesData.map((item) => [item.restaurant_id, item])
            ).values()
          );
        } else {
          // Return all mock restaurants if no categories
          placesData = [...mockRestaurants];
        }

        console.log(`✅ Loaded ${placesData.length} mock restaurants`);
      } else {
        // REAL GOOGLE API CALLS (when billing is enabled)
        console.log("🌐 Using REAL Google Places API");

        if (categoryNames && categoryNames.length > 0) {
          arrResponses = categoryNames.map(async (item, index) => {
            return await axios.get(
              `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
                reqOBj.latitude
              }%2C${reqOBj.longitude}&radius=${
                radius * 1000
              }&type=restaurant&name=${item}&key=${GOOGLE_API_KEY}`
            );
          });
          await Promise.all(arrResponses);
          console.log("Response is", arrResponses);
          arrResponses = arrResponses.map((item, index) => {
            console.log("Item is", item._j.data);
            return item._j.data.results;
          });
          arrResponses = arrResponses.flat(1);
          placesData = arrResponses.map((item, index) => {
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
        }
      }

      // Shuffle the data
      placesData = placesData.sort((a, b) => {
        return 0.5 - Math.random();
      });

      // Get backend posts
      let response = await axios.post(BASE_URL + "index-distance", reqOBj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let arrPosts = [];
      if (response.data.post && response.data.post.length > 0) {
        let arrInAppPosts = [...response.data.post];

        // Transform backend response to match frontend expectations
        arrInAppPosts = arrInAppPosts.map((post) => ({
          ...post,
          comment: post.comments || [], // Backend returns 'comments', frontend expects 'comment'
          like: post.likes || [], // Backend returns 'likes', frontend expects 'like'
        }));

        arrInAppPosts = arrInAppPosts.sort((a, b) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
        arrPosts = [...arrInAppPosts, ...placesData];
      } else {
        arrPosts = [...placesData];
      }
      return arrPosts;
    } catch (error) {
      console.log("Error fetching posts:", error);
      // Return empty array on error
      return [];
    }
  },
  getPostsWithoutCategories: async (reqOBj, radius, token) => {
    try {
      if (USE_MOCK_DATA) {
        console.log("🔧 Using ALL mock restaurants (no categories)");
        return [...mockRestaurants].sort((a, b) => 0.5 - Math.random());
      } else {
        console.log("else" + JSON.stringify(reqOBj) + "radius" + radius);
        let res = await axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
            reqOBj.latitude
          }%2C${reqOBj.longitude}&radius=${
            radius * 1000
          }&type=restaurant&key=${GOOGLE_API_KEY}`
        );
        console.log("Places data is", placesData);
        let placesData = res?.data?.results?.map((item, index) => {
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
        placesData = placesData.sort((a, b) => {
          return 0.5 - Math.random();
        });
        let response = await axios.post(BASE_URL + "index-distance", reqOBj, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        let arrPosts = [];
        if (response.data.post && response.data.post.length > 0) {
          // Transform backend response to match frontend expectations
          let transformedPosts = response.data.post.map((post) => ({
            ...post,
            comment: post.comments || [],
            like: post.likes || [],
          }));
          arrPosts = [...transformedPosts, ...placesData];
        } else {
          arrPosts = [...placesData];
        }
        return arrPosts;
      }
    } catch (error) {
      console.log("Error is", error);
    }
  },
  uploadImage: async (reqObj, token) => {
    try {
      let res = await axios.post(BASE_URL + "imageupload", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progress) => {
          console.log("Progress is", progress);
        },
      });
      console.log("Response is", res.data);
      return res.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  addPost: async (reqObj, token) => {
    try {
      console.log("Add Post API Request:", {
        url: BASE_URL + "post-save",
        payload: reqObj,
      });
      let res = await axios.post(BASE_URL + "post-save", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Add Post API Response:", res.data);
      return res.data;
    } catch (error) {
      console.error("Add Post API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create post",
      };
    }
  },
  removeImage: async (reqObj, token) => {
    try {
      let res = await axios.post(BASE_URL + "removeImage", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  saveUserPreference: async (reqObj, token) => {
    try {
      await axios.post(BASE_URL + "user-setting", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log("Error is", error);
    }
  },
  deletePost: async (postId, token) => {
    try {
      await axios.delete(BASE_URL + "post-delete/" + postId, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log("Error is", error);
    }
  },
  updatePost: async (postId, reqObj, token) => {
    try {
      console.log("Update Post API Request:", {
        url: BASE_URL + "post-update/" + postId,
        payload: reqObj,
      });
      const res = await axios.post(BASE_URL + "post-update/" + postId, reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Update Post API Response:", res.data);
      return res.data;
    } catch (error) {
      console.error("Update Post API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update post",
      };
    }
  },
  likePost: async (reqObj, token) => {
    try {
      console.log("Like Post API Request:", {
        url: BASE_URL + "post_like",
        payload: reqObj,
      });
      const res = await axios.post(BASE_URL + "post_like", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Like Post API Response:", res.data);
      return res.data;
    } catch (error) {
      console.error("Like Post API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to like post",
      };
    }
  },
  commentOnPost: async (reqObj, token) => {
    try {
      const response = await axios.post(BASE_URL + "comment-post", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Comment on Post API");
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  getFavoriteRestaurants: async (token) => {
    try {
      let response = await axios.get(BASE_URL + "favorite-post", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.message || [];
    } catch (error) {
      console.log("Favorite Restaurants API Error:", error);
      return []; // Return empty array on error
    }
  },
  getNotifications: async (token) => {
    try {
      let response = await axios.get(BASE_URL + "getUserNotification", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.log("Notifications API Error:", error);
      console.log("Error details:", error.response?.data || error.message);
      return []; // Return empty array on error
    }
  },
  likeGooglePost: async (reqObj, token) => {
    try {
      let response = await axios.post(BASE_URL + "googlelike", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  getGoogleLikedPosts: async (token) => {
    try {
      let response = await axios.get(BASE_URL + "userlikedgooglepost", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.log("Google Liked Posts API Error:", error);
      return []; // Return empty array on error
    }
  },
  getUserInAppSettings: async (token) => {
    try {
      let response = await axios.get(BASE_URL + "get-app-settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  saveUserInAppSettings: async (token, reqObj) => {
    try {
      let response = await axios.post(BASE_URL + "app-setting", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  getOtherUserData: async (token, userID) => {
    try {
      let response = await axios.get(BASE_URL + "other_get_user/" + userID, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.user;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  followUnfollowUser: async (token, reqObj) => {
    try {
      let response = await axios.post(BASE_URL + "user-follows", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  likeRestaurant: async (reqObj, token) => {
    try {
      let response = await axios.post(BASE_URL + "favoriteplace", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  getLikedRestaurants: async (token) => {
    try {
      let response = await axios.get(BASE_URL + "userfavoriteplace", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.log("Liked Restaurants API Error:", error);
      return []; // Return empty array on error
    }
  },
  getMediaForRestaurant: async (token, restaurant_id) => {
    try {
      let response = await axios.get(BASE_URL + "get_media/" + restaurant_id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  searchUser: async (token, searchQuery) => {
    try {
      let response = await axios.get(BASE_URL + "search/" + searchQuery, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  deleteUserAccount: async (token, userId) => {
    try {
      let response = await axios.get(BASE_URL + "user_status/" + userId, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  getPostById: async (postId) => {
    try {
      let response = await axios.get(BASE_URL + "get_post/" + postId);
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  postGoogleData: async (reqObj, token) => {
    try {
      let response = await axios.post(BASE_URL + "googlemedia", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  getGoogleData: async (restaurant_id, token) => {
    try {
      let response = await axios.get(
        BASE_URL + "get_google_post/" + restaurant_id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  getAdminPanelAdvertisements: async (token) => {
    try {
      let response = await axios.get(BASE_URL + "get-advertisements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.log("Advertisements API Error:", error);
      return []; // Return empty array on error
    }
  },
  getUserFavoriteRestaurants: async (token, userId) => {
    try {
      let response = await axios.get(
        BASE_URL + "getFavoriteRestaurantsByUserId/" + userId,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.log("Error is", error);
    }
  },
  userSessionAPI: async (token, reqObj) => {
    try {
      let response = await axios.post(BASE_URL + "session", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Session API Response:", response.data);
      return response.data.data;
    } catch (error) {
      console.log("Session API Error:", error);
      console.log(
        "Session API Error details:",
        error.response?.data || error.message
      );
      throw error; // Re-throw to be caught by caller
    }
  },
  viewAdvertisement: async (reqObj, token) => {
    try {
      let response = await axios.post(BASE_URL + "advertisement-view", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log("Error is", error);
    }
  },
};
