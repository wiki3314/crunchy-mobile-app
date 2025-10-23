import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
import { moderateScale } from '../Constants/globalConstants';
import { navigationStrings } from '../Navigation/NavigationStrings';
import FontAwesome from 'react-native-vector-icons/FontAwesome'

export default function NewUserLandingPage() {

    const isDarkModeActive = useSelector((state) => state.isDarkModeActive)
    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)
    const userDetails = useSelector((state) => state.userData)
    console.log("userDetailsuserDetailsuserDetails", userDetails)
    const [fadeAnim1] = useState(new Animated.Value(0));
    const [fadeAnim2] = useState(new Animated.Value(0));
    const [fadeAnim3] = useState(new Animated.Value(0));
    const [fadeAnim4] = useState(new Animated.Value(0));

    const navigation = useNavigation()

    useEffect(() => {
        Animated.timing(fadeAnim1, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
        }).start(() => {
            Animated.timing(fadeAnim2, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true
            }).start(() => {
                Animated.timing(fadeAnim3, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true
                }).start(() => {
                    Animated.timing(fadeAnim4, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true
                    }).start();
                });
            })
        });
    }, [])

    const onNextPress = () => {
        navigation.replace(navigationStrings.UserPreferences1)
    }

    return (
        <View style={commonStyles.flexFull}>
            <View style={styles.fullScreenContainer}>
                <Animated.View style={{ opacity: fadeAnim1 }}>
                    <Text style={commonStyles.textWhite(36, { alignSelf: 'center', textAlign: 'center' })}>
                        Hi, {userDetails.full_name}
                    </Text>
                </Animated.View>
                <Animated.View style={{ opacity: fadeAnim2 }}>
                    <Text style={commonStyles.textWhite(28, { alignSelf: 'center', textAlign: 'center' })}>
                        Welcome to Crunchii
                    </Text>
                </Animated.View>
                <Animated.View style={{ opacity: fadeAnim3 }}>
                    <Text style={commonStyles.textWhite(24, { alignSelf: 'center', textAlign: 'center' })}>
                        A guide and social hub for foodies
                    </Text>
                </Animated.View>
                <Animated.View style={{ opacity: fadeAnim4 }}>
                    <TouchableOpacity style={styles.nextButton} onPress={onNextPress}>
                        <Text style={commonStyles.textWhite(20, { fontWeight: '600' })}>
                            Next
                        </Text>
                        <FontAwesome name='arrow-right' style={{ fontSize: moderateScale(12), color: colors.white, marginLeft: moderateScale(8) }} />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        padding: moderateScale(10),
        justifyContent: 'space-evenly',
        backgroundColor: colors.appPrimary
    },
    nextButton: {
        padding: moderateScale(20),
        flexDirection: 'row',
        alignSelf: 'center',
        paddingVertical: moderateScale(8),
        backgroundColor: colors.black,
        borderRadius: moderateScale(10),
        alignItems: 'center',
    }
})