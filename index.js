/**
 * @format
 */

// Must be imported first to fix crypto.getRandomValues() error
import "react-native-get-random-values";

// Fix ViewPropTypes deprecation warning for older libraries
import { View } from "react-native";
import DeprecatedViewPropTypes from "deprecated-react-native-prop-types";
View.propTypes = DeprecatedViewPropTypes.ViewPropTypes;

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
    if (notification.userInteraction || (notification.data && Object.keys(notification.data).length > 0)) {
      const notificationData = notification.data || notification.userInfo || {};
      console.log("📱 Android notification clicked with data:", notificationData);
      
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
