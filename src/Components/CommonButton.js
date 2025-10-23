import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { moderateScale } from '../Constants/globalConstants';



export default function CommonButton({ buttonStyle, buttonTitle, textStyle, onButtonPress = () => { } }) {
    return (
        <TouchableOpacity style={styles.fullButtonContainer(buttonStyle)} onPress={onButtonPress}>
            <Text style={{ ...textStyle }}>
                {buttonTitle}
            </Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    fullButtonContainer: (buttonStyle) => {
        return {
            ...buttonStyle,
            paddingVertical: moderateScale(6)
        }
    }
})