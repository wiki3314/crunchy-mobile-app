import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";
import { useSelector } from "react-redux";
import AuthHeader from "../Components/AuthHeader";
import LoadingComponent from "../Components/LoadingComponent";
import { apiHandler } from "../Constants/apiHandler";
import { colors } from "../Constants/colors";
import { commonStyles } from "../Constants/commonStyles";
import {
  GOOGLE_API_KEY,
  moderateScale,
  USER_PROFILE_BASE_URL,
  VIBRATION_PATTERN,
  windowHeight,
  windowWidth,
} from "../Constants/globalConstants";
import { helperFunctions } from "../Constants/helperFunctions";
import { imagePath } from "../Constants/imagePath";
import { navigationStrings } from "../Navigation/NavigationStrings";
import LinearGradient from "react-native-linear-gradient";

export default function Notifications(props) {
  const userData = useSelector((state) => state.userData);
  const accessToken = useSelector((state) => state.accessToken);
  const isDarkModeActive = useSelector((state) => state.isDarkModeActive);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const isFocused = useIsFocused();

  const navigation = useNavigation();

  useEffect(() => {
    getInitialData();
  }, []);

  async function getInitialData() {
    setIsLoading(true);
    try {
      let arrNotifications = await apiHandler.getNotifications(accessToken);
      if (arrNotifications && Array.isArray(arrNotifications)) {
        arrNotifications.sort((a, b) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
        console.log("Notifications are", arrNotifications);
        setNotifications(arrNotifications);
      } else {
        console.log("No notifications received or API error");
        setNotifications([]);
      }
    } catch (error) {
      console.log("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }

  function onSingleNotificationPress(item) {
    console.log("Item is", item.user);
    item.user.id !== 144 &&
      (item.user.id == userData.id
        ? navigation.navigate(navigationStrings.ProfileScreen)
        : navigation.navigate(navigationStrings.ShowUser, {
            userID: item.user.id,
          }));
  }

  function renderNotifications({ item, index }) {
    return (
      <TouchableOpacity
        key={index}
        style={styles.singleNotificationContainer}
        onPress={() => {
          onSingleNotificationPress(item);
        }}
      >
        <Image
          source={
            item.user.image ? { uri: item.user.image } : imagePath.appLogo
          }
          style={styles.notificationUserImage}
        />
        <Text
          style={commonStyles.textWhite(16, {
            color: currentThemeSecondaryColor,
            fontWeight: "600",
            flex: 1,
            marginLeft: moderateScale(3),
          })}
        >
          {item.message}
        </Text>
        <Text
          style={commonStyles.textWhite(10, {
            color: colors.grey,
            fontWeight: "600",
          })}
        >
          {helperFunctions.getElapsedTime(item.created_at)}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView
      style={[
        commonStyles.flexFull,
        { backgroundColor: currentThemePrimaryColor },
      ]}
    >
      {isLoading && <LoadingComponent title={"Fetching data"} />}
      <View style={commonStyles.screenContainer}>
        <AuthHeader title={"Notifications"} showBackButton={false} />
        <View style={styles.screenInnerContainer}>
          <FlatList
            data={notifications}
            renderItem={renderNotifications}
            ListEmptyComponent={() => {
              return (
                <View style={styles.listEmptyContainer}>
                  <Text
                    style={commonStyles.textWhite(16, {
                      color: currentThemeSecondaryColor,
                      fontWeight: "600",
                    })}
                  >
                    No Notifications to display
                  </Text>
                </View>
              );
            }}
            keyExtractor={(item) => {
              return item.id;
            }}
          />
        </View>
        {isDarkModeActive && (
          <LinearGradient
            style={{
              alignItems: "center",
              top: 0,
              zIndex: -1,
              backgroundColor: colors.black,
              height: windowHeight,
              width: windowWidth,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              bottom: 0,
              position: "absolute",
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            locations={[0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8]}
            colors={[
              "#ffffff00",
              "#ffffff04",
              "#ffffff09",
              "#ffffff0c",
              "#ffffff10",
              "#ffffff15",
              "#ffffff19",
            ]}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenInnerContainer: {
    flex: 1,
    padding: moderateScale(8),
    paddingTop: moderateScale(20),
  },
  singleNotificationContainer: {
    flexDirection: "row",
    flex: 1,
    paddingVertical: moderateScale(5),
    alignItems: "center",
    borderBottomColor: colors.grey,
    borderBottomWidth: moderateScale(0.7),
  },
  notificationUserImage: {
    height: moderateScale(20),
    width: moderateScale(20),
    borderRadius: moderateScale(10),
  },
  singleNotificationInnerContainer: {
    flex: 1,
    justifyContent: "space-between",
    marginHorizontal: moderateScale(3),
    flexDirection: "row",
    alignItems: "center",
  },
  listEmptyContainer: {
    height: windowHeight * 0.5,
    width: windowWidth,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(40),
  },
});
