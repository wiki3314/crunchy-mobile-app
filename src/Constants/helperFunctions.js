import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image, PixelRatio, View } from "react-native";
import CommonButton from "../Components/CommonButton";
import { commonStyles } from "./commonStyles";
import { appRatingData, moderateScale, ratingsData } from "./globalConstants";
import { imagePath } from "./imagePath";

export const helperFunctions = {
  storeAccessToken: async (token) => {
    await AsyncStorage.setItem("token", token);
  },
  getAccessToken: async () => {
    return await AsyncStorage.getItem("token");
  },
  clearAccessToken: async () => {
    await AsyncStorage.removeItem("token");
  },
  saveCachedPosts: async (posts, cacheKey = "cachedPosts", maxItems = 10, nextPageToken = null) => {
    try {
      if (!Array.isArray(posts)) {
        console.warn("⚠️ Invalid posts data for caching");
        return;
      }

      const cleanedPosts = posts.filter((item) => item && !item.isAdvertisement && !item.isGoogleAd);
      const toCache = maxItems ? cleanedPosts.slice(0, maxItems) : cleanedPosts;

      const cacheData = {
        posts: toCache,
        nextPageToken: nextPageToken,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`✅ Cached posts saved: key=${cacheKey}, count=${toCache.length}, hasNextPage=${!!nextPageToken}`);
    } catch (error) {
      console.error("❌ Error saving cached posts:", error);
    }
  },
  loadCachedPosts: async (cacheKey = "cachedPosts") => {
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (!cachedData) {
        return { posts: [], nextPageToken: null };
      }

      const parsed = JSON.parse(cachedData);
      const posts = Array.isArray(parsed) ? parsed : parsed.posts || [];
      const timestamp = Array.isArray(parsed) ? null : parsed.timestamp;
      const nextPageToken = parsed.nextPageToken || null;

      const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
      if (timestamp && Date.now() - timestamp > CACHE_MAX_AGE) {
        console.log(`⚠️ Cache stale, clearing key=${cacheKey}`);
        await helperFunctions.clearCachedPosts(cacheKey);
        return { posts: [], nextPageToken: null };
      }

      console.log(`✅ Loaded cached posts: key=${cacheKey}, count=${posts.length}, hasNextPage=${!!nextPageToken}`);
      return { posts: Array.isArray(posts) ? posts : [], nextPageToken: nextPageToken };
    } catch (error) {
      console.error("❌ Error loading cached posts:", error);
      return { posts: [], nextPageToken: null };
    }
  },
  clearCachedPosts: async (cacheKey = "cachedPosts") => {
    try {
      await AsyncStorage.removeItem(cacheKey);
      console.log(`✅ Cached posts cleared: key=${cacheKey}`);
    } catch (error) {
      console.error("❌ Error clearing cached posts:", error);
    }
  },
  saveCachedLocation: async (location) => {
    try {
      if (location && location.latitude && location.longitude) {
        await AsyncStorage.setItem("cachedLocation", JSON.stringify(location));
        console.log("✅ Location cached:", location);
      }
    } catch (error) {
      console.error("❌ Error caching location:", error);
    }
  },
  getCachedLocation: async () => {
    try {
      const location = await AsyncStorage.getItem("cachedLocation");
      return location ? JSON.parse(location) : null;
    } catch (error) {
      console.error("❌ Error getting cached location:", error);
      return null;
    }
  },
  getModerateScale: (number) => {
    return PixelRatio.getPixelSizeForLayoutSize(number);
  },
  getElapsedTime: (timeStamp) => {
    let currentTime = new Date().getTime();
    let argTime = new Date(timeStamp).getTime();
    let secondsElapsed = (currentTime - argTime) / 1000;
    if (secondsElapsed < 60) {
      return Math.floor(secondsElapsed) + " seconds ago";
    } else if (secondsElapsed < 3600) {
      return Math.floor(Math.round(secondsElapsed / 60)) + " minutes ago";
    } else if (secondsElapsed < 86400) {
      return Math.floor(Math.round(secondsElapsed / 3600)) + " hours ago";
    } else {
      return Math.floor(Math.round(secondsElapsed / 86400)) + " days ago";
    }
  },
  transformArray: (originalArray) => {
    // Validate input
    if (
      !originalArray ||
      !Array.isArray(originalArray) ||
      originalArray.length === 0
    ) {
      return [];
    }

    let arrTransformedData = [];
    let x = 0;
    let limit = Math.floor(originalArray.length / 6);
    for (var i = 0; i <= limit; i++) {
      let innerCategoryArray = [];
      for (var j = x; j < x + 6; j++) {
        if (originalArray[j]) {
          innerCategoryArray.push(originalArray[j]);
        }
      }
      x = x + 6;
      if (innerCategoryArray.length > 0) {
        arrTransformedData.push(innerCategoryArray);
      }
    }
    arrTransformedData = arrTransformedData.filter((item, index) => {
      return item && item.length > 0;
    });
    return arrTransformedData;
  },
  renderRatings: (ratingCount) => {
    return ratingsData.map((item, index) => {
      return (
        ratingCount <= Math.floor(item.restaurantPrice) && (
          <FontAwesome
            name="dollar"
            style={commonStyles.ratingImageStyle(index)}
          />
        )
      );
    });
  },
  findElement: (array, item) => {
    if (array && array.length > 0 && item) {
      if (
        array.findIndex((arrItem, arrIndex) => {
          return item.id == arrItem.id;
        }) != -1
      ) {
        return true;
      }
      return false;
    }
  },
  getStarRatings: (rating, size = 16) => {
    let arrRatings = [...appRatingData];
    if (rating > 0) {
      let wholeStars = Math.floor(rating);
      let partialStar = rating - wholeStars;
      if (partialStar < 0.1) {
        partialStar = 0;
      } else if (0.1 <= partialStar <= 0.35) {
        partialStar = 0.25;
      } else if (0.35 < partialStar <= 0.65) {
        partialStar = 0.5;
      } else if (0.65 < partialStar <= 0.9) {
        partialStar = 0.75;
      } else {
        partialStar = 0.75;
      }
      if (rating <= 5) {
        for (var i = 0; i < wholeStars; i++) {
          let objStar = {
            imageSource: imagePath.fullStar,
          };
          arrRatings[i] = objStar;
        }
        switch (partialStar) {
          case 0.25:
            arrRatings[wholeStars] = {
              imageSource: imagePath.quarterStar,
            };
            break;
          case 0.5:
            arrRatings[wholeStars] = {
              imageSource: imagePath.halfStar,
            };
            break;
          case 0.75:
            arrRatings[wholeStars] = {
              imageSource: imagePath.threeQuarterStar,
            };
            break;
          default:
            break;
        }
      }
    }
    return (
      <View style={commonStyles.flexRow_CenterItems}>
        {arrRatings.map((item, index) => {
          return (
            <Image
              source={item.imageSource}
              style={{
                height: moderateScale(size),
                width: moderateScale(size),
                resizeMode: "contain",
                marginLeft: index == 0 ? moderateScale(0) : moderateScale(3),
              }}
            />
          );
        })}
      </View>
    );
  },
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    // Haversine formula to calculate distance in miles
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return Infinity; // Return large distance if coordinates are missing
    }
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};
