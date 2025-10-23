import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AppLaunchedFromLink from '../Screens/AppLaunchedFromLink';
import { navigationStrings } from './NavigationStrings';


const SharedLinkNavigator = createStackNavigator()

const screenOptions = {
    headerShown: false
}

export function SharedLinkStack() {
    return <SharedLinkNavigator.Navigator screenOptions={screenOptions}>
        <SharedLinkNavigator.Screen name={navigationStrings.AppLaunchedFromLink} component={AppLaunchedFromLink} />
    </SharedLinkNavigator.Navigator>
}