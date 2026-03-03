import "react-native-gesture-handler";
import React, { useEffect, useRef } from "react";
import AppNavigation from "./src/Navigation/AppNavigation";
import { Provider } from "react-redux";
import store from "./src/Redux/store/store";
import { Provider as PaperProvider } from "react-native-paper";
import { Alert, Linking, AppState, Platform, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
// import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PushNotification from "react-native-push-notification";
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { navigationStrings } from "./src/Navigation/NavigationStrings";
import { setNotificationNavigationHandler } from "./src/Constants/notificationNavigation";

const App = () => {
  const navigationRef = useRef(null);

  useEffect(() => {
    initializeApp();
    // Set global notification navigation handler
    setNotificationNavigationHandler(handleNotificationNavigation);
  }, []);

  useEffect(() => {
    const type = "notification";
    PushNotificationIOS.addEventListener(type, onRemoteNotification);
    return () => {
      PushNotificationIOS.removeEventListener(type);
    };
  }, []);

  const handleNotificationNavigation = (notificationData) => {
    if (!notificationData || !navigationRef.current?.isReady()) {
      console.log("⚠️ Navigation not ready or no notification data");
      return;
    }

    try {
      const { type, actor_user_id, post_id, comment_id } = notificationData;
      const navigation = navigationRef.current;
      const state = store.getState();
      const userData = state.userData || {};
      const accessToken = state.accessToken;

      // Only navigate if user is logged in
      if (!accessToken) {
        console.log("⚠️ User not logged in, skipping navigation");
        return;
      }

      console.log("🧭 Handling notification navigation:", {
        type,
        actor_user_id,
        post_id,
      });

      if (type === "follow") {
        // Navigate to user profile who followed
        if (actor_user_id) {
          const actorId = parseInt(actor_user_id);
          if (actorId === userData.id) {
            navigation.navigate(navigationStrings.ProfileScreen);
          } else {
            navigation.navigate(navigationStrings.ShowUser, {
              userID: actorId,
            });
          }
        } else {
          navigation.navigate(navigationStrings.Notifications);
        }
      } else if (type === "like" || type === "comment") {
        // Navigate based on actor_user_id
        if (actor_user_id) {
          const actorId = parseInt(actor_user_id);
          if (actorId === userData.id) {
            navigation.navigate(navigationStrings.ProfileScreen);
          } else {
            navigation.navigate(navigationStrings.ShowUser, {
              userID: actorId,
            });
          }
        } else {
          // Default: Navigate to Notifications screen
          navigation.navigate(navigationStrings.Notifications);
        }
      } else {
        // Default: Navigate to Notifications screen
        navigation.navigate(navigationStrings.Notifications);
      }
    } catch (error) {
      console.error("❌ Error navigating from notification:", error);
    }
  };

  const onRemoteNotification = (notification) => {
    try {
      // Safely get notification data
      const notificationData = notification.getData
        ? notification.getData()
        : notification.data || {};
      const isClicked = notificationData?.userInteraction === 1;

      if (isClicked) {
        // Navigate user to another screen
        console.log("📱 Notification clicked, userInteraction:", isClicked);
        // Handle navigation for iOS when notification is clicked
        if (notificationData && Object.keys(notificationData).length > 0) {
          handleNotificationNavigation(notificationData);
        }
      } else {
        // Do something else with push notification
        console.log("📱 Notification received (not clicked)");
      }

      // Use the appropriate result based on what you needed to do for this notification
      const result = PushNotificationIOS.FetchResult.NoData;
      if (notification.finish) {
        notification.finish(result);
      }
    } catch (error) {
      console.error("❌ Error handling remote notification:", error);
      // Still finish the notification even if there's an error
      if (notification.finish) {
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      }
    }
  };

  const initializeApp = async () => {
    // await mobileAds()
    //   .setRequestConfiguration({
    //     // Update all future requests suitable for parental guidance
    //     maxAdContentRating: MaxAdContentRating.G,
    //     // Indicates that you want your content treated as child-directed for purposes of COPPA.
    //     tagForChildDirectedTreatment: true,
    //     // Indicates that you want the ad request to be handled in a
    //     // manner suitable for users under the age of consent.
    //     tagForUnderAgeOfConsent: true,
    //     // An array of test device IDs to allow.
    //     testDeviceIdentifiers: ['EMULATOR', '1cb98702-e966-4d4b-9e7c-bdc73beff5cd'],
    //   })
    // const adapterStatuses = await mobileAds().initialize()

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled) {
      const fcmToken = await messaging().getToken();
      await AsyncStorage.setItem("fcmToken", fcmToken);
      messaging().onMessage((remoteMessage) => {
        console.log("📱 Remote Message Received:", remoteMessage);
        try {
          if (Platform.OS === "android") {
            // Create notification channel for Android
            PushNotification.createChannel(
              {
                channelId: "channel-id", // (required)
                channelName: "My channel", // (required)
                channelDescription:
                  "A channel to categorise your notifications", // (optional) default: undefined.
                playSound: true, // (optional) default: true
                soundName: "default", // (optional) See `soundName` parameter of `localNotification` function
                vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
              },
              (created) => {
                PushNotification.localNotification({
                  channelId: "channel-id", // (required) channelId, if the channel doesn't exist, notification will not trigger.
                  title: remoteMessage.notification?.title || "Crunchy", // (optional)
                  message: remoteMessage.notification?.body || "", // (required)
                  data: remoteMessage.data || {}, // Pass notification data
                  playSound: true,
                  soundName: "default",
                  userInfo: remoteMessage.data || {}, // For iOS compatibility
                });
              } // (optional) callback returns whether the channel was created, false means it already existed.
            );
          } else {
            // iOS notification handling
            PushNotificationIOS.addNotificationRequest({
              id: remoteMessage.messageId || Date.now().toString(),
              title: remoteMessage.notification?.title || "Crunchy",
              body: remoteMessage.notification?.body || "",
              sound: "default",
              badge: 1,
              userInfo: remoteMessage.data || {}, // Pass notification data
            });
          }
        } catch (error) {
          console.error("❌ Error handling onMessage notification:", error);
        }
      });

      // Handle notification when app is opened from background
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log(
          "📱 Notification opened app from background:",
          remoteMessage
        );
        if (remoteMessage.data) {
          console.log("📱 Notification data:", remoteMessage.data);
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            handleNotificationNavigation(remoteMessage.data);
          }, 500);
        }
      });

      // Handle notification when app is opened from quit state
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage) {
            console.log(
              "📱 Notification opened app from quit state:",
              remoteMessage
            );
            if (remoteMessage.data) {
              console.log("📱 Notification data:", remoteMessage.data);
              // Longer delay for quit state to ensure app is fully initialized
              setTimeout(() => {
                handleNotificationNavigation(remoteMessage.data);
              }, 1500);
            }
          }
        });
      // return unsubscribe;
    }
  };

  return (
    <PaperProvider>
      <Provider store={store}>
        <NavigationContainer ref={navigationRef}>
          <AppNavigation />
        </NavigationContainer>
      </Provider>
    </PaperProvider>
  );
};

export default App;
