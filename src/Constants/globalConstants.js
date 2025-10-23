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
// If 10.0.2.2 doesn't work, use your computer's IP (e.g., 192.168.1.5)
const BACKEND_BASE_URL = "http://10.0.2.2:3000";
// const BACKEND_BASE_URL = "http://YOUR_COMPUTER_IP:3000"; // Alternative

export const POSTS_IMAGE_BASE_URL = `${BACKEND_BASE_URL}/storage/`;

export const CATEGORY_IMAGES_BASE_URL = `${BACKEND_BASE_URL}/storage/User/`;

export const USER_PROFILE_BASE_URL = `${BACKEND_BASE_URL}/storage/uploads/`;

export const ADVERTISEMENTS_BASE_URL = `${BACKEND_BASE_URL}/storage/video/`;

export const GOOGLE_API_KEY = "AIzaSyC67cbOCHYz64VdKTn2oOnzxM9sVKm-lQY";

// ⚠️ TEMPORARY: Set to true to use mock data when Google API billing is not enabled
// Set to false once you enable billing on Google Cloud Console
export const USE_MOCK_DATA = true;

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
