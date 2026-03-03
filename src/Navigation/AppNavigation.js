import React, { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { AuthorizationStack } from "./AuthStack";
import { MainNavigationStack } from "./MainStack";
import { useDispatch, useSelector } from "react-redux";
import {
  setAppLaunchedFromLink,
  setCurrentSessionId,
  setLocation,
  setReceivedPost,
  toggleDarkMode,
} from "../Redux/actions/actions";
import { firebase } from "@react-native-firebase/dynamic-links";
import { AppState, PermissionsAndroid, Platform } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import { apiHandler } from "../Constants/apiHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SharedLinkStack } from "./SharedLinkStack";

const AppNavigation = (props) => {
  const accessToken = useSelector((state) => state.accessToken);
  const dispatch = useDispatch();
  const autoUpdateDarkMode = useSelector((state) => state.autoUpdateDarkMode);
  const appLaunchedFromLink = useSelector((state) => state.appLaunchedFromLink);
  const receivedPost = useSelector((state) => state.receivedPost);
  const navigation = useNavigation();
  const appState = useRef(AppState.currentState);

  const current_session_id = useSelector((state) => state.current_session_id);

  // Location validation function
  const validateLocation = (coordinates) => {
    // Reject invalid coordinates
    if (!coordinates || 
        coordinates.latitude === 0 && coordinates.longitude === 0 ||
        Math.abs(coordinates.latitude) > 90 ||
        Math.abs(coordinates.longitude) > 180 ||
        !coordinates.latitude ||
        !coordinates.longitude) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    // Only log in development mode to reduce console noise
    if (__DEV__) {
      console.log(
        "🔄 AppNavigation: accessToken changed:",
        accessToken ? "✅ Token exists" : "❌ No token"
      );
    }
    getInitialData();
  }, [accessToken]);

  const getLocation = () => {
    const tryGetLocation = async (useHighAccuracy = true) => {
      // 1. Check for cached location first
      const cachedLocation = await helperFunctions.getCachedLocation();
      if (cachedLocation && validateLocation(cachedLocation)) {
        console.log("📍 AppNavigation: Found cached location:", cachedLocation);
        dispatch(setLocation(cachedLocation));
      }

      console.log(`📍 AppNavigation: Attempting location fetch (HighAccuracy: ${useHighAccuracy})`);
      
      const timeoutId = setTimeout(() => {
        console.log("⏰ AppNavigation: Location fetch timed out, trying low accuracy...");
        if (useHighAccuracy) {
          tryGetLocation(false);
        }
      }, 10000);

      Geolocation.getCurrentPosition(
        (info) => {
          clearTimeout(timeoutId);
          const coordinates = {
            latitude: info.coords.latitude,
            longitude: info.coords.longitude,
          };
          
          if (validateLocation(coordinates)) {
            console.log("📍 AppNavigation: Got fresh location:", coordinates);
            dispatch(setLocation(coordinates));
            helperFunctions.saveCachedLocation(coordinates);
          } else {
            console.warn("⚠️ AppNavigation: Invalid location received:", coordinates);
            if (useHighAccuracy) tryGetLocation(false);
          }
        },
        (err) => {
          clearTimeout(timeoutId);
          console.log("⚠️ AppNavigation: Location error:", err);
          if (useHighAccuracy) {
            console.log("🔄 AppNavigation: High accuracy failed, retrying with low accuracy...");
            tryGetLocation(false);
          }
        },
        {
          enableHighAccuracy: useHighAccuracy,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };
    
    tryGetLocation(true);
  };

  const requestLocationPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "MyMapApp needs access to your location",
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getLocation();
      } else {
        console.log("Location permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getInitialData = async () => {
    if (Platform.OS == "android") {
      await requestLocationPermissions();
    } else {
      getLocation();
    }

    //  TEMPORARILY DISABLED FOR DESIGN TESTING
    AppState.addEventListener("change", async (val) => {
      if (accessToken) {
        if (val == "active") {
          try {
            let reqObj = {
              type: "open",
              session_id: current_session_id,
            };
            await apiHandler.userSessionAPI(accessToken, reqObj);
          } catch (error) {
            console.error("❌ Error tracking session (open):", error.message);
          }
        }
        if (val == "background") {
          try {
            let reqObj = {
              type: "close",
            };
            await apiHandler.userSessionAPI(accessToken, reqObj);
          } catch (error) {
            console.error("❌ Error tracking session (close):", error.message);
          }
        }
      }
    });

    let currentTime = new Date().getHours();
    if (autoUpdateDarkMode) {
      if (currentTime < 20 && currentTime > 8) {
        dispatch(toggleDarkMode(false));
      } else {
        dispatch(toggleDarkMode(true));
      }
    }
    if (receivedPost.id == "") {
      await getAppLaunchLink();
      firebase.dynamicLinks().onLink(({ url }) => {
        let receivedLink = url;
        let receivedID;
        let objReceivedPost;
        receivedID = receivedLink.split("?")[1];
        if (url.includes("googlePost")) {
          objReceivedPost = {
            isGoogle: true,
            id: receivedID,
          };
        } else {
          objReceivedPost = {
            isGoogle: false,
            id: receivedID,
          };
        }
        dispatch(setReceivedPost(objReceivedPost));
        dispatch(setAppLaunchedFromLink(true));
      });
    }
  };

  const getAppLaunchLink = async () => {
    try {
      const { url } = await firebase.dynamicLinks().getInitialLink();
      let receivedLink = url;
      let receivedID;
      let objReceivedPost;
      receivedID = receivedLink.split("?")[1];
      if (url.includes("googlePost")) {
        objReceivedPost = {
          isGoogle: true,
          id: receivedID,
        };
      } else {
        objReceivedPost = {
          isGoogle: false,
          id: receivedID,
        };
      }
      dispatch(setReceivedPost(objReceivedPost));
      dispatch(setAppLaunchedFromLink(true));
    } catch {
      //handle errors
    }
  };

  console.log("📱 AppNavigation rendering:", {
    appLaunchedFromLink,
    hasAccessToken: !!accessToken,
    rendering: appLaunchedFromLink
      ? "SharedLinkStack"
      : accessToken
      ? "MainNavigationStack"
      : "AuthorizationStack",
  });

  return appLaunchedFromLink ? (
    <SharedLinkStack />
  ) : accessToken ? (
    <MainNavigationStack />
  ) : (
    <AuthorizationStack />
  );
};

export default AppNavigation;
