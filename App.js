import "react-native-gesture-handler";
import React, { useEffect } from "react";
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

const App = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    const type = "notification";
    PushNotificationIOS.addEventListener(type, onRemoteNotification);
    return () => {
      PushNotificationIOS.removeEventListener(type);
    };
  }, []);

  const onRemoteNotification = (notification) => {
    const isClicked = notification.getData().userInteraction === 1;

    if (isClicked) {
      // Navigate user to another screen
    } else {
      // Do something else with push notification
    }
    // Use the appropriate result based on what you needed to do for this notification
    const result = PushNotificationIOS.FetchResult.NoData;
    notification.finish(result);
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
        console.log("remote Message Support Ticket", remoteMessage);
        if (Platform.OS === "android") {
          // if (remoteMessage.collapseKey) {
          PushNotification.createChannel(
            {
              channelId: "channel-id", // (required)
              channelName: "My channel", // (required)
              channelDescription: "A channel to categorise your notifications", // (optional) default: undefined.
              playSound: false, // (optional) default: true
              soundName: "default", // (optional) See `soundName` parameter of `localNotification` function
              vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
            },
            (created) => {
              PushNotification.localNotification({
                channelId: "channel-id", // (required) channelId, if the channel doesn't exist, notification will not trigger.
                // largeIconUrl: "https://cdn4.iconfinder.com/data/icons/logos-brands-5/24/react-128.png", // (optional) default: undefine
                title: remoteMessage.notification.title, // (optional)
                message: remoteMessage.notification.body, // (required)
              });
            } // (optional) callback returns whether the channel was created, false means it already existed.
          );
          // }
        } else {
          console.log("ios notification");
        }
      });
      // return unsubscribe;
    }
  };

  return (
    <PaperProvider>
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigation />
        </NavigationContainer>
      </Provider>
    </PaperProvider>
  );
};

export default App;
