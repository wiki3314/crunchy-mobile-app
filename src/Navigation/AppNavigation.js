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

  useEffect(() => {
    console.log(
      "🔄 AppNavigation: accessToken changed:",
      accessToken ? "✅ Token exists" : "❌ No token"
    );
    getInitialData();
  }, [accessToken]);

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      (info) => {
        var coordinates = {
          latitude: info.coords.latitude,
          longitude: info.coords.longitude,
        };
        dispatch(setLocation(coordinates));
      },
      (err) => {
        getLocation();
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 3600000,
      }
    );
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

    // TEMPORARILY DISABLED FOR DESIGN TESTING
    // AppState.addEventListener('change', (val) => {
    //     if (accessToken) {
    //         if (val == 'active') {
    //             let reqObj = {
    //                 type: 'open',
    //                 session_id: current_session_id
    //             }
    //             let data = apiHandler.userSessionAPI(accessToken, reqObj)
    //         }
    //         if (val == 'background') {
    //             let reqObj = {
    //                 type: 'close',
    //             }
    //             apiHandler.userSessionAPI(accessToken, reqObj)
    //         }
    //     }
    // })

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
