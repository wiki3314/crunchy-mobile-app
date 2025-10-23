import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Button, StyleSheet } from 'react-native';
import { helperFunctions } from '../Constants/helperFunctions';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { navigationStrings } from './NavigationStrings';
import LandingScreen from '../Screens/LandingScreen';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
// import { ColorSpace } from 'react-native-reanimated';
import Foundation from 'react-native-vector-icons/Foundation';
import { moderateScale, windowWidth } from '../Constants/globalConstants';
import Search from '../Screens/Search';
import Notifications from '../Screens/Notifications';
import ProfileScreen from '../Screens/ProfileScreen';
import EditProfile from '../Screens/EditProfile'
import AddPost from '../Screens/AddPost';
import HomeScreen from '../Screens/HomeScreen';
import RestaurantDetails from '../Screens/RestaurantDetails';
import ShowUser from '../Screens/ShowUser';
import { connect, useDispatch, useSelector } from "react-redux";
import HomeWithoutLogin from '../Screens/HomeWithoutLogin';
import CommonButton from '../Components/CommonButton';
import PressableImage from '../Components/PressableImage';
import UpdateSettings from '../Screens/UpdateSettings';
import UserPreferences1 from '../Screens/UserPreferences1';
import NewUserLandingPage from '../Screens/NewUserLandingPage';
import AppLaunchedFromLink from '../Screens/AppLaunchedFromLink';
import ViewRestaurant from '../Screens/ViewRestaurant';
import EditPost from '../Screens/EditPost';

const AppBottomNavigator = createBottomTabNavigator();

const MainStackNavigator = createStackNavigator()

const BottomNavigation = () => {

    const isNewUser = useSelector((state) => state.isNewUser)

    const navigationOptions = {
        headerShown: false
    }

    const tabOptions = {
        activeTintColor: "#CE0871",
        inactiveTintColor: "#00000000",
        showLabel: false,
    }

    const isDarkModeActive = useSelector((state) => state.isDarkModeActive)
    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)

    return <AppBottomNavigator.Navigator
        screenOptions={({ route }) => ({
            ...navigationOptions,
            tabBarStyle: styles.fullTabBarContainer(currentThemePrimaryColor),
            tabBarIcon: ({ focused, color, size }) => {
                switch (route.name) {
                    case navigationStrings.HomeScreen:
                        return (
                            <HomeTabItem iconName="home" color={color} focused={focused} />
                        );
                    case navigationStrings.SearchScreen:
                        return (
                            <SearchTab iconName="text-document"
                                color={color}
                                focused={focused} />
                        );
                    case navigationStrings.Notifications:
                        return (
                            <NotificationTab iconName="notifications" color={color} focused={focused} />
                        );
                    case navigationStrings.ProfileScreen:
                        return (
                            <ProfileTab iconName="person" color={color} focused={focused} />
                        );
                    default:
                        return  <MainTab iconName="person" color={color} focused={focused} />
                }
            },
        })}
        initialRouteName={isNewUser ? navigationStrings.HomeScreen : navigationStrings.HomeScreen}
        tabBarOptions={tabOptions}
    >
        <AppBottomNavigator.Screen name={navigationStrings.HomeScreen} component={HomeScreen} />
        <AppBottomNavigator.Screen name={navigationStrings.SearchScreen} component={Search} />
        <AppBottomNavigator.Screen name={navigationStrings.AddPost} component={AddPost} />
        <AppBottomNavigator.Screen name={navigationStrings.Notifications} component={Notifications} />
        <AppBottomNavigator.Screen name={navigationStrings.ProfileScreen} component={ProfileScreen} />
    </AppBottomNavigator.Navigator>

    function HomeTabItem(props) {
        return (
            <View style={[styles.tabItem, { backgroundColor: currentThemePrimaryColor }]}>
                <Foundation name="home" size={20} color={props.focused ? colors.appPrimary : colors.darkGrey} />
                <Text style={commonStyles.textWhite(11, { color: props.focused ? colors.appPrimary : colors.darkGrey })}>
                    Home
                </Text>
            </View>
        );
    }

    function ProfileTab(props) {
        return (
            <View style={[styles.tabItem, { backgroundColor: currentThemePrimaryColor }]}>
                <Ionicons
                    name={'person-circle-outline'}
                    size={20}
                    color={props.focused ? colors.appPrimary : colors.darkGrey}
                />
                <Text style={commonStyles.textWhite(11, { color: props.focused ? colors.appPrimary : colors.darkGrey })}>
                    Profile
                </Text>
            </View>
        );
    }

    function SearchTab(props) {
        return (
            <View style={[styles.tabItem, { backgroundColor: currentThemePrimaryColor }]}>
                <Ionicons name="search" size={20} color={props.focused ? colors.appPrimary : colors.darkGrey} />
                <Text style={commonStyles.textWhite(11, { color: props.focused ? colors.appPrimary : colors.darkGrey,textAlign:'center'  })}>
                    Search
                </Text>
            </View>
        );
    }

    function NotificationTab(props) {
        return (
            <View style={[styles.tabItem, { backgroundColor: currentThemePrimaryColor }]}>
                <Ionicons
                    name={props.iconName}
                    size={20}
                    color={props.focused ? colors.appPrimary : colors.darkGrey}
                />
                <Text style={commonStyles.textWhite(11, { color: props.focused ? colors.appPrimary : colors.darkGrey,textAlign:'center' })}>
                    Notifications
                </Text>
            </View>
        )
    }

    function MainTab(props) {
        return (
            <View style={[{
                position: 'absolute',
                // bottom: 20,
                top:moderateScale(-20),
                left:moderateScale(-2),
                alignSelf: 'center',
                borderRadius: moderateScale(25),
                borderColor: props.focused ? colors.green : colors.transparent, borderWidth: 2,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9,
            }]}>
                <View style={{
                    backgroundColor: isDarkModeActive ? (props.focused ? colors.appPrimary : colors.white) : props.focused ? colors.darkGrey : colors.appPrimary,
                    height: moderateScale(40),
                    width: moderateScale(40),
                    borderRadius: moderateScale(20),
                    alignItems: 'center',
                    justifyContent: 'center',
                    // marginBottom: moderateScale(30)
                }}>
                    <Ionicons name="camera" size={30} color={isDarkModeActive ? (props.focused ? colors.white : colors.appPrimary) : currentThemePrimaryColor} />
                </View>
            </View>
        );
    }
}

export const MainNavigationStack = (props) => {
    const isNewUser = useSelector((state) => state.isNewUser)
    const appLaunchedFromLink = useSelector((state) => state.appLaunchedFromLink)
    const navigationOptions = {
        headerShown: false
    }
    return <MainStackNavigator.Navigator screenOptions={navigationOptions} initialRouteName={isNewUser ? navigationStrings.NewUserLandingPage : navigationStrings.BottomTabNavigation}>
        <MainStackNavigator.Screen name={navigationStrings.ViewRestaurant} component={ViewRestaurant} />
        <MainStackNavigator.Screen name={navigationStrings.NewUserLandingPage} component={NewUserLandingPage} />
        <MainStackNavigator.Screen name={navigationStrings.UserPreferences1} component={UserPreferences1} />
        <MainStackNavigator.Screen name={navigationStrings.BottomTabNavigation} component={BottomNavigation} />
        <MainStackNavigator.Screen name={navigationStrings.EditPost} component={EditPost} />
        <MainStackNavigator.Screen name={navigationStrings.EditProfile} component={EditProfile} />
        <MainStackNavigator.Screen name={navigationStrings.RestaurantDetails} component={RestaurantDetails} />
        <MainStackNavigator.Screen name={navigationStrings.ShowUser} component={ShowUser} />
        <MainStackNavigator.Screen name={navigationStrings.UpdateSettings} component={UpdateSettings} />
    </MainStackNavigator.Navigator>
}

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
        justifyContent: "center",
        // paddingTop: moderateScale(3),
        alignItems: "center",
        backgroundColor: colors.white,
        zIndex: -1
    },
    tabCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.white,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: 'center',
        position: "relative",
        marginTop: 4
    },
    selector: {
        width: "5%",
        height: 3,
        backgroundColor: "#CE0871",
        position: "absolute",
        bottom: 0,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        marginBottom: 5
    },
    mainTabContainer: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        borderRadius: moderateScale(25),
        // backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9,
    },
    mainTabInnerContainer: {
        backgroundColor: colors.appPrimary,
        height: moderateScale(40),
        width: moderateScale(40),
        borderRadius: moderateScale(20),
        alignItems: 'center',
        justifyContent: 'center',
        // marginBottom: moderateScale(30)
    },
    fullTabBarContainer: (currentThemePrimaryColor) => {
        return {
            backgroundColor: currentThemePrimaryColor,
            // minHeight: moderateScale(22),
            width: windowWidth,
            alignSelf: 'center',
            // backgroundColor: 'transparent',
            borderTopWidth: 0,
            position: 'absolute',
        }
    }
});