import { Dimensions, PixelRatio, Platform } from "react-native";
import { imagePath } from "./imagePath";

export const windowHeight = Dimensions.get("window").height;

export const windowWidth = Dimensions.get("window").width;

export const fontScalingFactor = PixelRatio.getFontScale();

// export const moderateScale = (number) => {
//     return Platform.OS == 'ios' ? 2 * PixelRatio.roundToNearestPixel(number / PixelRatio.getFontScale()) : PixelRatio.roundToNearestPixel(PixelRatio.getPixelSizeForLayoutSize(number / PixelRatio.get()))
// }

export const moderateScale = (number) => {
  return 1.9 * number;
};

export const VIBRATION_PATTERN = [0, 100];

export const ratingsData = [1, 2, 3, 4, 5];

// For Android Emulator, use 10.0.2.2 instead of localhost
// For iOS Simulator, use localhost or your machine's IP
// For Real Android Device, use your computer's actual IP address
const BACKEND_BASE_URL = "http://192.168.100.14:3000"; // Real device IP
// const BACKEND_BASE_URL = "http://10.0.2.2:3000"; // For Android Emulator

export const POSTS_IMAGE_BASE_URL = `${BACKEND_BASE_URL}/storage/`;

export const CATEGORY_IMAGES_BASE_URL = `${BACKEND_BASE_URL}/storage/User/`;

export const USER_PROFILE_BASE_URL = `${BACKEND_BASE_URL}/storage/uploads/`;

export const ADVERTISEMENTS_BASE_URL = `${BACKEND_BASE_URL}/storage/video/`;

export const GOOGLE_API_KEY = "AIzaSyCLb-WobrzT3gvpXDLkNYPWbIpd30bxKLQ";

// ⚠️ TEMPORARY: Set to true to use mock data when Google API billing is not enabled
// Set to false once you enable billing on Google Cloud Console
export const USE_MOCK_DATA = false;

export const errorVibrationPattern =
  Platform.OS == "ios" ? [0, 200] : [0, 200, 100, 70];

export const userSuccessPattern =
  Platform.OS == "ios" ? [0, 60] : [0, 100, 60, 150];

export const searchVibrationPattern =
  Platform.OS == "ios" ? [0, 100] : [0, 100, 120, 250];

export const imageAdsType = ["jpg", "jpeg", "png"];

export const videoAdsType = ["mp4"];

export const appRatingData = [
  { imageSource: imagePath.emptyStar },
  { imageSource: imagePath.emptyStar },
  { imageSource: imagePath.emptyStar },
  { imageSource: imagePath.emptyStar },
  { imageSource: imagePath.emptyStar },
];

export var quickFoodsSearch = [
  " Pizza",
  "Breakfast",
  "Burgers",
  "Chinese",
  "Mexican",
  "Korean",
  "Steakhouses",
  "Thai",
  "Seafood",
  "Japanese",
  "Italian",
  "Vietnamese",
  "Sandwiches",
  "Vegetarian",
  "Sushi Bars",
  "American",
  "Butter Chicken",
  "Garlic Naan",
  "South Indian",
  "Dumplings",
  "Noodles",
  "Burger",
  "Pizza",
  "Pasta",
  "Beef",
  "Pork",
  "Afghani",
  "Chowmein",
  "Ramen",
  "Salad",
  "Sandwich",
  "Steak",
  "Shrimp",
  "Seafood",
  "Tuna",
  "Fish",
  "Spaghetti",
  "Pie",
  "Cakes",
  "Desserts",
  "Coffee",
  "Tea",
];

// var quickFoodsSearch = quickBiteNames.sort((a, b) => {
//     return a.localeCompare(b)
// })
