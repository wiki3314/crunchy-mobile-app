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

// Token validation helper
const validateToken = (token) => {
  if (!token || token === "" || token === null || token === undefined) {
    console.warn("⚠️ Token validation failed: Token is missing or invalid");
    return false;
  }
  return true;
};

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
      if (!validateToken(token)) {
        console.error("❌ getUserData: Token validation failed");
        return null;
      }
      let res = await axios.get(BASE_URL + "profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });
      console.log("Profile API Response:", res.data);
      if (res.data && res.data.success === false) {
        console.log("⚠️ Profile API returned error:", res.data.message);
        return null;
      }
      return res.data.user || null;
    } catch (error) {
      console.error("❌ Profile API Error:", error.message);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("❌ Profile API Error status:", error.response.status);
        console.error("❌ Profile API Error data:", error.response.data);
        
        // Throw a specific error object so caller can differentiate
        const customError = new Error(error.response.data?.message || error.message);
        customError.status = error.response.status;
        throw customError;
      } else if (error.request) {
        // The request was made but no response was received
        console.error("❌ Profile API No response received (Network Error)");
        const networkError = new Error("Network Error");
        networkError.isNetworkError = true;
        throw networkError;
      } else {
        throw error;
      }
    }
  },
  updateUserProfile: async (reqObj, token) => {
    try {
      console.log("🔄 UPDATE PROFILE API - Starting request...");
      console.log("📍 API Endpoint:", BASE_URL + "update_profile");
      console.log("🔑 Token:", token ? "Present" : "Missing");
      console.log(
        "📤 Request payload type:",
        reqObj instanceof FormData ? "FormData" : typeof reqObj
      );

      // For FormData in React Native, explicitly set Content-Type (like AddPost.js does)
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (reqObj instanceof FormData) {
        headers["Content-Type"] = "multipart/form-data";
      } else {
        headers["Content-Type"] = "application/json";
      }

      let res = await axios.post(BASE_URL + "update_profile", reqObj, {
        headers: headers,
        timeout: 30000, // 30 second timeout for file uploads
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log("✅ UPDATE PROFILE API - Success:", res.data);
      return res.data;
    } catch (error) {
      console.error("❌ UPDATE PROFILE API ERROR - Full error:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error code:", error.code);
      console.error("❌ Response data:", error.response?.data);
      console.error("❌ Response status:", error.response?.status);
      console.error("❌ API URL:", BASE_URL + "update_profile");

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
      } else if (error.code === "ERR_NETWORK") {
        errorMessage =
          "Network Error - Cannot reach backend server. Please check:\n" +
          "1. Backend server is running on " +
          BASE_URL +
          "\n" +
          "2. Network connectivity\n" +
          "3. Try restarting backend server";
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
  getAllCategories: async (token) => {
    try {
      // Token is optional - categories can be fetched without login
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};
      let res = await axios.get(BASE_URL + "category-list", {
        headers,
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
  getPostsWithoutLogin: async (reqObj, radius, pageToken = null) => {
    try {
      if (pageToken) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      const url = pageToken
        ? `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${pageToken}&key=${GOOGLE_API_KEY}`
        : `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
            reqObj.latitude
          }%2C${reqObj.longitude}&radius=${
            (radius || 20) * 1609
          }&type=restaurant&key=${GOOGLE_API_KEY}`;
      let res = await axios.get(url);
      let placesData = res?.data?.results
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
              restaurantImages:
                item.photos && item.photos.length > 0
                  ? item.photos.map((p) => p.photo_reference)
                  : [],
              restaurantImage:
                item.photos &&
                item.photos.length > 0 &&
                item.photos[0].photo_reference,
              restaurantTiming: item.opening_hours,
              restaurant_id: item.place_id,
              isGoogle: true,
            };
          }
          return null; // Explicitly return null for items without photos
        })
        .filter(Boolean); // Remove null/undefined items
      placesData = placesData.sort((a, b) => {
        return 0.5 - Math.random();
      });
      let arrPostsWithoutLogin = [...placesData];
      return {
        posts: arrPostsWithoutLogin,
        nextPageToken: res?.data?.next_page_token || null,
      };
    } catch (error) {
      console.error("❌ Error fetching posts without login:", error);
      return { posts: [], nextPageToken: null };
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
          // Use Promise.allSettled instead of Promise.all to handle individual failures
          arrResponses = categoryNames.map(async (item, index) => {
            try {
              const response = await axios.get(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
                  reqOBj.latitude
                }%2C${reqOBj.longitude}&radius=${
                  radius * 1000
                }&type=restaurant&name=${encodeURIComponent(item)}&key=${GOOGLE_API_KEY}`
              );
              
              // Check if Google API returned an error status
              if (response.data.status && response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
                console.warn(`⚠️ Google Places API error for category "${item}":`, response.data.status, response.data.error_message || "");
                return { status: "error", data: response.data, category: item };
              }
              
              return { status: "success", data: response.data, category: item };
            } catch (error) {
              console.error(`❌ Google Places API call failed for category "${item}":`, error.message);
              return { status: "error", error: error.message, category: item };
            }
          });
          
          const settledResponses = await Promise.allSettled(arrResponses);
          
          // Process successful responses
          const successfulResponses = settledResponses
            .filter((result) => result.status === "fulfilled" && result.value.status === "success")
            .map((result) => result.value.data);
          
          console.log(`✅ Google API: ${successfulResponses.length}/${categoryNames.length} categories succeeded`);
          
          // Extract results from successful responses
          arrResponses = successfulResponses
            .map((response) => {
              if (response && response.results) {
                return response.results;
              }
              return [];
            })
            .flat(1);
          
          // Filter and map places data
          placesData = arrResponses
            .filter((item) => {
              if (!item) return false;
              // Exclude hotels and shopping centers - only food-related places
              const types = item.types || [];
              const isHotel = types.includes("lodging");
              const isShoppingMall = types.includes("shopping_mall");
              return !isHotel && !isShoppingMall;
            })
            .map((item, index) => {
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
                  latitude: item.geometry?.location?.lat,
                  longitude: item.geometry?.location?.lng,
                  isGoogle: true,
                };
              }
              return null;
            })
            .filter((item) => item !== null); // Remove null entries
          
          console.log(`📍 Found ${placesData.length} Google Places restaurants`);
        }
      }

      // Shuffle the data
      placesData = placesData.sort((a, b) => {
        return 0.5 - Math.random();
      });

      // Get backend posts - include radius in request body
      // Note: Continue with backend API call even if Google Places API failed
      let backendReqObj = {
        ...reqOBj,
        radius: radius, // Add radius in kilometers (already converted from miles)
      };
      
      console.log("📤 Backend API Request:", {
        endpoint: BASE_URL + "index-distance",
        payload: backendReqObj,
        hasToken: !!token,
        googlePlacesCount: placesData.length,
      });
      
      let response;
      try {
        response = await axios.post(BASE_URL + "index-distance", backendReqObj, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (backendError) {
        // If backend fails, still return Google Places data if available
        console.error("❌ Backend API failed, but continuing with Google Places data:", backendError.message);
        if (placesData.length > 0) {
          console.log("✅ Returning Google Places data only");
          return placesData;
        }
        // Re-throw if no Google Places data available
        throw backendError;
      }

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
      console.log("❌ Error fetching posts:", error);
      console.log("📊 Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        endpoint: BASE_URL + "index-distance",
        requestPayload: reqOBj,
        radius: radius,
      });
      
      // If it's a 500 error, log more details
      if (error.response?.status === 500) {
        console.error("🔥 Server Error (500):", {
          message: error.response?.data?.message || "Internal server error",
          error: error.response?.data?.error,
          stack: error.response?.data?.stack,
        });
        
        // Check if error response contains Google Places API error
        if (error.response?.data?.status === "UNKNOWN_ERROR" || 
            error.response?.data?.html_attributions !== undefined) {
          console.warn("⚠️ This appears to be a Google Places API error, not a backend error");
          console.warn("💡 Suggestion: Check Google API key, quota, or use USE_MOCK_DATA flag");
        }
      }
      
      // If we have Google Places data (initialized at top of try block), return it even if backend failed
      // placesData is declared at the top of try block, so it should be accessible here
      if (typeof placesData !== 'undefined' && Array.isArray(placesData) && placesData.length > 0) {
        console.log("✅ Returning Google Places data despite error");
        return placesData;
      }
      
      // Return empty array on error if no Google Places data available
      console.warn("⚠️ No data available, returning empty array");
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
        let placesData = res?.data?.results
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
              };
            }
          });
        placesData = placesData.sort((a, b) => {
          return 0.5 - Math.random();
        });
        // Include radius in request body for backend API
        let backendReqObj = {
          ...reqOBj,
          radius: radius, // Add radius in kilometers (already converted from miles)
        };
        let response = await axios.post(BASE_URL + "index-distance", backendReqObj, {
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
      if (!validateToken(token)) {
        console.error("❌ saveUserPreference: Token validation failed");
        throw new Error("No token provided - cannot save preferences");
      }
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
      if (!validateToken(token)) {
        console.error("❌ getFavoriteRestaurants: Token validation failed");
        return [];
      }
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
      if (!validateToken(token)) {
        console.error("❌ getGoogleLikedPosts: Token validation failed");
        return [];
      }
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
      if (!validateToken(token)) {
        console.error("❌ getLikedRestaurants: Token validation failed");
        return [];
      }
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
      if (!validateToken(token)) {
        console.error("❌ getAdminPanelAdvertisements: Token validation failed");
        return [];
      }
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
      if (!validateToken(token)) {
        console.error("❌ userSessionAPI: Token validation failed");
        throw new Error("No token provided - cannot track session");
      }
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
