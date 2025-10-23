import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useSelector } from 'react-redux'
import { colors } from '../Constants/colors'
import { commonStyles } from '../Constants/commonStyles'
import { fontScalingFactor, moderateScale, windowWidth } from '../Constants/globalConstants'

export default function AuthHeader({ title, rightIcon = () => { }, showBackButton = true }) {
    const navigation = useNavigation()
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)
    
    function onIconPress() {
        navigation.goBack()
    }

    return (
        <View style={styles.fullContainer}>
            {showBackButton && <Ionicons name='chevron-back-outline' style={styles.iconStyle(currentThemeSecondaryColor)} onPress={onIconPress} />}
            <View style={styles.innerContainer}>
                {title && <Text style={commonStyles.textWhite(20, { color: currentThemeSecondaryColor, marginRight: moderateScale(10), fontWeight: 'bold', alignSelf: 'center' })}>
                    {title}
                </Text>}
            </View>
            {rightIcon && rightIcon()}
        </View>
    )
}

const styles = StyleSheet.create({
    fullContainer: {
        width: windowWidth,
        flexDirection: 'row',
        alignSelf: 'center',
        alignItems: 'center',
        marginTop: moderateScale(6),
        height: moderateScale(25),
    },
    iconStyle: (currentThemeSecondaryColor) => {
        return {
            fontSize: moderateScale(18),
            marginLeft: moderateScale(5),
            color: currentThemeSecondaryColor
        }
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})