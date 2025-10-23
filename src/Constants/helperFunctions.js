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
};
