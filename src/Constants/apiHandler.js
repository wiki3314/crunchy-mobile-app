import axios from "axios";
import { GOOGLE_API_KEY, USE_MOCK_DATA } from "./globalConstants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  mockRestaurants,
  getMockRestaurantsByCategory,
} from "./mockRestaurantData";
// ==================== BASE URL CONFIGURATION ====================
// Production / local backend URL
export const BASE_URL = "http://54.193.173.26:3000/api/"; // Old production
// export const BASE_URL = "http://192.168.100.14:3000/api/"; // Old real device IP (port 3000)
// export const BASE_URL = "http://localhost:3000/api/"; // iOS Simulator (local backend on 3000)
// Current backend (NGROK):
//export const BASE_URL = "https://allison-avulsed-unneatly.ngrok-free.dev/api/";

// ================================================================

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
      console.log("🔐 LOGIN API - Starting request...");
      console.log("📍 API Endpoint:", BASE_URL + "login");
      console.log("📤 Request payload:", reqObj);

      let res = await axios.post(BASE_URL + "login", reqObj, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      });

      console.log("✅ LOGIN API - Success:", res.data);
      return res.data;
    } catch (error) {
      console.error("❌ LOGIN API ERROR - Full error:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error code:", error.code);
      console.error("❌ Response data:", error.response?.data);
      console.error("❌ Response status:", error.response?.status);
      console.error("❌ API URL:", BASE_URL + "login");

      // Specific error messages based on error type
      let errorMessage = "Network error - please check backend is running";

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout - Backend is not responding";
      } else if (error.code === "ECONNREFUSED") {
        errorMessage =
          "Connection refused - Backend is not running on " + BASE_URL;
      } else if (
        error.code === "ENETUNREACH" ||
        error.code === "EHOSTUNREACH"
      ) {
        errorMessage =
          "Network unreachable - Check your WiFi/network settings and BASE_URL";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  },
  socialLogin: async (reqObj) => {
    try {
      let res = await axios.post(BASE_URL + "socialLogin", reqObj);
      return res.data;
    } catch (error) {
      console.error("Social Login API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Social login failed - please check backend is running",
      };
    }
  },
  forgotPassword: async (reqObj) => {
    try {
      let res = await axios.post(BASE_URL + "forgot", reqObj);
      return res.data;
    } catch (error) {
      console.error("Forgot Password API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to send password reset email - please check backend is running",
      };
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
      // Check if response indicates failure
      if (res.data && res.data.success === false) {
        console.log("⚠️ Profile API returned error:", res.data.message);
        return null; // Return null instead of undefined
      }
      return res.data.user || null;
    } catch (error) {
      console.log("Profile API Error:", error);
      console.log(
        "Profile API Error details:",
        error.response?.data || error.message
      );
      return null; // Return null instead of throwing
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
      console.error("Update User Profile API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update profile",
      };
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
  uploadCategoryIcon: async (categoryId, formData, token) => {
    try {
      const res = await axios.post(
        BASE_URL + `category/${categoryId}/icon`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data;
    } catch (error) {
      console.log("Upload Category Icon API Error:", error);
      console.log("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to upload category icon",
      };
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
      console.error("❌ Error fetching posts without login:", error);
      return []; // Return empty array on error
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
      console.error("Remove Image API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to remove image",
      };
    }
  },
  saveUserPreference: async (reqObj, token) => {
    try {
      console.log("💾 Saving user preferences:", {
        url: BASE_URL + "user-setting",
        payload: reqObj,
      });

      const response = await axios.post(BASE_URL + "user-setting", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ User preferences saved successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error saving user preferences:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save preferences"
      );
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
      return {
        success: false,
        message: error.response?.data?.message || "Failed to post comment",
      };
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
      console.log("🔵 LIKE GOOGLE POST API - Starting...");
      console.log("📍 Endpoint:", BASE_URL + "googlelike");
      console.log("📤 Data:", JSON.stringify(reqObj, null, 2));

      let response = await axios.post(BASE_URL + "googlelike", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000, // 15 second timeout
      });

      console.log("✅ LIKE GOOGLE POST API - Success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ LIKE GOOGLE POST API ERROR:", error.message);
      console.error("❌ Error code:", error.code);
      console.error("❌ Response:", error.response?.data);
      console.error("❌ Status:", error.response?.status);

      if (error.code === "ECONNABORTED") {
        console.error("⏱️ Request timeout - Backend not responding");
      } else if (error.code === "ECONNREFUSED") {
        console.error("🚫 Connection refused - Backend not running");
      } else if (error.code === "ENETUNREACH") {
        console.error("📡 Network unreachable - Check WiFi/network");
      }

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to like Google post",
      };
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
      console.error("Get User In App Settings API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to get app settings",
        data: null,
      };
    }
  },
  saveUserInAppSettings: async (token, reqObj) => {
    try {
      console.log("💾 Saving app settings:", {
        url: BASE_URL + "app-setting",
        payload: reqObj,
      });

      let response = await axios.post(BASE_URL + "app-setting", reqObj, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ App settings saved successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error saving app settings:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save app settings"
      );
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
      console.error("Get Other User Data API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to get user data",
      };
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
      console.error("Follow/Unfollow User API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to follow/unfollow user",
      };
    }
  },
  likeRestaurant: async (reqObj, token) => {
    try {
      console.log("🚀 LIKE RESTAURANT API - Starting...");
      console.log("📍 Endpoint:", BASE_URL + "favoriteplace");
      console.log("📤 Raw Data:", JSON.stringify(reqObj, null, 2));

      const sanitizeNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      };

      const sanitizeInteger = (value) => {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : undefined;
      };

      const payload = {};
      const {
        restaurant_id,
        google_place_id,
        name,
        restaurant_name,
        photo_reference,
        address,
        latitude,
        longitude,
        rating,
      } = reqObj || {};

      const sanitizedRestaurantId = sanitizeInteger(restaurant_id);
      if (sanitizedRestaurantId !== undefined) {
        payload.restaurant_id = sanitizedRestaurantId;
      }

      if (google_place_id) {
        payload.google_place_id = String(google_place_id);
      }

      if (name) {
        payload.name = String(name);
      }

      if (restaurant_name) {
        payload.restaurant_name = String(restaurant_name);
      }

      if (photo_reference) {
        payload.photo_reference = String(photo_reference);
      }

      if (address) {
        payload.address = String(address);
      }

      const sanitizedLatitude = sanitizeNumber(latitude);
      if (sanitizedLatitude !== undefined) {
        payload.latitude = sanitizedLatitude;
      }

      const sanitizedLongitude = sanitizeNumber(longitude);
      if (sanitizedLongitude !== undefined) {
        payload.longitude = sanitizedLongitude;
      }

      const sanitizedRating = sanitizeNumber(rating);
      if (sanitizedRating !== undefined) {
        payload.rating = sanitizedRating;
      }

      console.log("📤 Sanitized Payload:", JSON.stringify(payload, null, 2));

      let response = await axios.post(BASE_URL + "favoriteplace", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000, // 15 second timeout
      });

      console.log("✅ LIKE RESTAURANT API - Success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ LIKE RESTAURANT API ERROR:", error.message);
      console.error("❌ Error code:", error.code);
      console.error("❌ Response:", error.response?.data);
      console.error("❌ Status:", error.response?.status);

      if (error.code === "ECONNABORTED") {
        console.error("⏱️ Request timeout - Backend not responding");
      } else if (error.code === "ECONNREFUSED") {
        console.error("🚫 Connection refused - Backend not running");
      } else if (error.code === "ENETUNREACH") {
        console.error("📡 Network unreachable - Check WiFi/network");
      }

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to like restaurant",
      };
    }
  },
  getLikedRestaurants: async (token) => {
    try {
      console.log("🍽️ FAVORITE RESTAURANTS API - Starting request...");
      console.log("📍 API Endpoint:", BASE_URL + "userfavoriteplace");
      console.log("🔑 Token:", token ? "Present" : "Missing");

      let response = await axios.get(BASE_URL + "userfavoriteplace", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log("✅ FAVORITE RESTAURANTS API - Success");
      console.log("📦 Response data:", JSON.stringify(response.data, null, 2));
      console.log("📊 Favorite count:", response.data.data?.length || 0);

      return response.data.data || [];
    } catch (error) {
      console.error("❌ FAVORITE RESTAURANTS API ERROR");
      console.error("❌ Error message:", error.message);
      console.error("❌ Error code:", error.code);
      console.error("❌ Response data:", error.response?.data);
      console.error("❌ Response status:", error.response?.status);
      console.error("❌ API URL:", BASE_URL + "userfavoriteplace");
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
      console.error("Get Media For Restaurant API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return [];
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
      console.error("Search User API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to search users",
        users: [],
      };
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
      console.error("Delete User Account API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete user account",
      };
    }
  },
  getPostById: async (postId) => {
    try {
      let response = await axios.get(BASE_URL + "get_post/" + postId);
      return response.data;
    } catch (error) {
      console.error("Get Post By ID API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to get post",
      };
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
      console.error("Post Google Data API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to save Google Places data",
      };
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
      console.error("Get Google Data API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to get Google Places data",
      };
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
      console.error("Get User Favorite Restaurants API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to get favorite restaurants",
        data: [],
      };
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
      return response.data;
    } catch (error) {
      console.error("View Advertisement API Error:", error);
      console.error("Error details:", error.response?.data || error.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to track advertisement view",
      };
    }
  },
};
