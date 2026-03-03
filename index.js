/**
 * @format
 */

// Must be imported first to fix crypto.getRandomValues() error
import "react-native-get-random-values";

// Fix ViewPropTypes deprecation warning for older libraries
// Note: react-native-snap-carousel uses ViewPropTypes, which is handled by the patch file
// We don't need to set View.propTypes here as it causes warnings
import { LogBox } from "react-native";

// Ignore LogBox warnings - must be called before any other imports
// These warnings come from React Native's internal LogBox component
if (typeof LogBox !== "undefined" && LogBox) {
  try {
    // Ignore specific warning patterns
    LogBox.ignoreLogs([
      "ViewPropTypes will be removed",
      "ViewPropTypes",
      "Invalid props.style key `fontWeight` supplied to `View`",
      "Failed prop type: Invalid props.style key `fontWeight`",
      "Each child in a list should have a unique",
      "deprecated-react-native-prop-types",
    ]);
  } catch (e) {
    // LogBox might not be available in all environments
  }
}

// Override console.error to filter out LogBox internal errors
// These errors come from React Native's internal LogBox component, not our code
const originalError = console.error;
console.error = (...args) => {
  const message = args.join(" ").toString();
  if (
    message.includes("ViewPropTypes will be removed") ||
    message.includes("ViewPropTypes") ||
    message.includes("Invalid props.style key `fontWeight`") ||
    message.includes(
      "Failed prop type: Invalid props.style key `fontWeight`"
    ) ||
    message.includes("CountBadge") ||
    (message.includes("fontWeight") && message.includes("View")) ||
    message.includes("deprecated-react-native-prop-types") ||
    message.includes("PropTypes") && message.includes("deprecated")
  ) {
    // Suppress these specific errors from React Native's LogBox
    return;
  }
  originalError.apply(console, args);
};

// Also override console.warn to suppress ViewPropTypes warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(" ").toString();
  if (
    message.includes("ViewPropTypes will be removed") ||
    message.includes("ViewPropTypes") ||
    message.includes("deprecated-react-native-prop-types")
  ) {
    // Suppress ViewPropTypes warnings
    return;
  }
  originalWarn.apply(console, args);
};

import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

import PushNotificationIOS from "@react-native-community/push-notification-ios";
import PushNotification from "react-native-push-notification";
import { handleNotificationClick } from "./src/Constants/notificationNavigation";

// Must be outside of any component LifeCycle (such as `componentDidMount`).
PushNotification.configure({
  // (optional) Called when Token is generated (iOS and Android)
  onRegister: function (token) {
    console.log("TOKEN:", token);
  },

  // (required) Called when a remote is received or opened, or local notification is opened
  onNotification: function (notification) {
    console.log("📱 PushNotification onNotification:", notification);

    // Handle notification click (Android - when local notification is clicked)
    if (
      notification.userInteraction ||
      (notification.data && Object.keys(notification.data).length > 0)
    ) {
      const notificationData = notification.data || notification.userInfo || {};
      console.log(
        "📱 Android notification clicked with data:",
        notificationData
      );

      // Trigger navigation handler
      if (notificationData && Object.keys(notificationData).length > 0) {
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          handleNotificationClick(notificationData);
        }, 500);
      }
    }

    // (required) Called when a remote is received or opened, or local notification is opened
    notification.finish(PushNotificationIOS.FetchResult.NoData);
  },

  // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
  onAction: function (notification) {
    console.log("ACTION:", notification.action);
    console.log("NOTIFICATION:", notification);

    // process the action
  },

  // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
  onRegistrationError: function (err) {
    console.error(err.message, err);
  },

  // IOS ONLY (optional): default: all - Permissions to register.
  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },

  // Should the initial notification be popped automatically
  // default: true
  popInitialNotification: true,

  /**
   * (optional) default: true
   * - Specified if permissions (ios) and token (android and ios) will requested or not,
   * - if not, you must call PushNotificationsHandler.requestPermissions() later
   * - if you are not using remote notification or do not have Firebase installed, use this:
   *     requestPermissions: Platform.OS === 'ios'
   */
  requestPermissions: true,
});

AppRegistry.registerComponent(appName, () => App);
