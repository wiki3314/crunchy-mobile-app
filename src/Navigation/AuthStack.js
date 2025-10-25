import React, { useEffect } from "react";
import { View, Text, Button, StyleSheet, Pressable } from "react-native";
import { helperFunctions } from "../Constants/helperFunctions";
import { navigationStrings } from "./NavigationStrings";
import SplashScreen from "../Screens/SplashScreen";
import Login from "../Screens/Login";
import Registration from "../Screens/Registrations";
import ForgotPassword from "../Screens/ForgotPassword";
import { createStackNavigator } from "@react-navigation/stack";
import LandingScreen from "../Screens/LandingScreen";
import HomeWithoutLogin from "../Screens/HomeWithoutLogin";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Foundation from "react-native-vector-icons/Foundation";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../Constants/colors";
import { commonStyles } from "../Constants/commonStyles";
import { moderateScale, windowWidth } from "../Constants/globalConstants";
import { useDispatch, useSelector } from "react-redux";
import { showHideForceLoginModal } from "../Redux/actions/actions";
import AppLaunchedFromLink from "../Screens/AppLaunchedFromLink";
import ViewRestaurant from "../Screens/ViewRestaurant";
import TermsAndConditions from "../Screens/TermsAndConditions";

const AuthStack = createStackNavigator();
const WithoutLoginBottomNavigation = createBottomTabNavigator();

const AuthBottomNavigation = () => {
  const navigationOptions = {
    headerShown: false,
  };

  const isDarkModeActive = useSelector((state) => state.isDarkModeActive);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );

  const dispatch = useDispatch();

  const changeModalState = () => {
    dispatch(showHideForceLoginModal(true));
  };

  function HomeTabItem(props) {
    return (
      <Pressable
        onPress={changeModalState}
        style={[styles.tabItem, { backgroundColor: currentThemePrimaryColor }]}
      >
        <Foundation
          name="home"
          size={20}
          color={props.focused ? colors.appPrimary : colors.grey}
        />
        <Text
          style={commonStyles.textWhite(11, {
            color: props.focused ? colors.appPrimary : colors.grey,
            fontWeight: "bold",
          })}
        >
          Home
        </Text>
      </Pressable>
    );
  }

  function ProfileTab(props) {
    return (
      <Pressable
        onPress={changeModalState}
        style={[styles.tabItem, { backgroundColor: currentThemePrimaryColor }]}
      >
        <Ionicons
          name={"person-circle-outline"}
          size={20}
          color={props.focused ? colors.appPrimary : colors.grey}
        />
        <Text
          style={commonStyles.textWhite(11, {
            color: props.focused ? colors.appPrimary : colors.grey,
            fontWeight: "bold",
          })}
        >
          Profile
        </Text>
      </Pressable>
    );
  }

  function SearchTab(props) {
    return (
      <Pressable
        onPress={changeModalState}
        style={[styles.tabItem, { backgroundColor: currentThemePrimaryColor }]}
      >
        <Ionicons
          name="search"
          size={20}
          color={props.focused ? colors.appPrimary : colors.grey}
        />
        <Text
          style={commonStyles.textWhite(11, {
            color: props.focused ? colors.appPrimary : colors.grey,
            fontWeight: "bold",
          })}
        >
          Search
        </Text>
      </Pressable>
    );
  }

  function NotificationTab(props) {
    return (
      <Pressable
        onPress={changeModalState}
        style={[styles.tabItem, { backgroundColor: currentThemePrimaryColor }]}
      >
        <Ionicons
          name={props.iconName}
          size={20}
          color={props.focused ? colors.appPrimary : colors.grey}
        />
        <Text
          style={commonStyles.textWhite(11, {
            color: props.focused ? colors.appPrimary : colors.grey,
            fontWeight: "bold",
          })}
        >
          Notifications
        </Text>
      </Pressable>
    );
  }

  function MainTab(props) {
    return (
      <Pressable
        style={{ flex: 1, justifyContent: "flex-end" }}
        onPress={changeModalState}
      >
        <View
          style={{
            position: "absolute",
            bottom: 30,
            alignSelf: "center",
            borderRadius: moderateScale(25),
            alignItems: "center",
            justifyContent: "center",

            zIndex: 9,
          }}
        >
          <View
            style={{
              backgroundColor: colors.appPrimary,
              height: moderateScale(40),
              width: moderateScale(40),
              borderRadius: moderateScale(20),
              alignItems: "center",
              justifyContent: "center",
              // marginBottom: moderateScale(30)
            }}
          >
            <Ionicons name="camera" size={35} color={colors.white} />
          </View>
        </View>
        {/* <View style={{ height: 15, backgroundColor: colors.white, width: windowWidth / 5 }} /> */}
      </Pressable>
    );
  }

  return (
    <WithoutLoginBottomNavigation.Navigator
      screenOptions={({ route }) => ({
        ...navigationOptions,
        tabBarStyle: styles.fullTabBarContainer(currentThemePrimaryColor),
        showIcon: true,
        showLabel: false,
        lazyLoad: true,
        tabBarIcon: ({ focused, color, size }) => {
          switch (route.name) {
            case navigationStrings.HomeScreen:
              return (
                <HomeTabItem iconName="home" color={color} focused={focused} />
              );
            case navigationStrings.SearchScreen:
              return (
                <SearchTab
                  iconName="text-document"
                  color={color}
                  focused={focused}
                />
              );
            case navigationStrings.Notifications:
              return (
                <NotificationTab
                  iconName="notifications"
                  color={color}
                  focused={focused}
                />
              );
            case navigationStrings.ProfileScreen:
              return (
                <ProfileTab iconName="person" color={color} focused={focused} />
              );
            default:
              return (
                <MainTab iconName="person" color={color} focused={focused} />
              );
          }
        },
        tabBarActiveTintColor: "#CE0871",
        tabBarInactiveTintColor: "#00000000",
        tabBarShowLabel: false,
      })}
    >
      <WithoutLoginBottomNavigation.Screen
        name={navigationStrings.HomeScreen}
        component={HomeWithoutLogin}
      />
      <WithoutLoginBottomNavigation.Screen
        name={navigationStrings.SearchScreen}
        component={HomeWithoutLogin}
      />
      <WithoutLoginBottomNavigation.Screen
        name={navigationStrings.AddPost}
        component={HomeWithoutLogin}
      />
      <WithoutLoginBottomNavigation.Screen
        name={navigationStrings.Notifications}
        component={HomeWithoutLogin}
      />
      <WithoutLoginBottomNavigation.Screen
        name={navigationStrings.ProfileScreen}
        component={HomeWithoutLogin}
      />
    </WithoutLoginBottomNavigation.Navigator>
  );
};

export const AuthorizationStack = () => {
  const navigationOptions = {
    headerShown: false,
  };

  return (
    <AuthStack.Navigator
      screenOptions={navigationOptions}
      initialRouteName={navigationStrings.SplashScreen}
    >
      <AuthStack.Screen
        name={navigationStrings.ViewRestaurant}
        component={ViewRestaurant}
      />
      <AuthStack.Screen
        name={navigationStrings.SplashScreen}
        component={SplashScreen}
      />
      <AuthStack.Screen
        name={navigationStrings.LandingScreen}
        component={LandingScreen}
      />
      <AuthStack.Screen
        name={navigationStrings.AuthBottomNavigation}
        component={AuthBottomNavigation}
      />
      <AuthStack.Screen name={navigationStrings.Login} component={Login} />
      <AuthStack.Screen
        name={navigationStrings.Registration}
        component={Registration}
      />
      <AuthStack.Screen
        name={navigationStrings.ForgotPassword}
        component={ForgotPassword}
      />
      <AuthStack.Screen
        name={navigationStrings.TermsAndConditionsScreen}
        component={TermsAndConditions}
      />
    </AuthStack.Navigator>
  );
};

const styles = StyleSheet.create({
  icon: {
    position: "absolute",
    color: "rgba(50,54,67,1)",
    fontSize: 40,
    left: 0,
    top: 0,
  },
  tabItem: {
    width: windowWidth / 5,
    // height: '100%',
    justifyContent: "flex-end",
    paddingBottom: 8,
    alignItems: "center",
    zIndex: -1,
    backgroundColor: colors.white,
  },
  tabCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    position: "relative",
    marginTop: 4,
  },
  selector: {
    width: "5%",
    height: 3,
    backgroundColor: "#CE0871",
    position: "absolute",
    bottom: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginBottom: 5,
  },
  fullTabBarContainer: (currentThemePrimaryColor) => {
    return {
      backgroundColor: currentThemePrimaryColor,
      // minHeight: moderateScale(30),
      width: windowWidth,
      alignSelf: "center",
      // backgroundColor: 'transparent',
      borderTopWidth: 0,
      position: "absolute",
    };
  },
});
