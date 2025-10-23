import React, { useState } from 'react'
import { StyleSheet, TextInput, View, Text } from 'react-native'
// import { color } from 'react-native-reanimated'
import { colors } from '../Constants/colors'
import { commonStyles } from '../Constants/commonStyles'
import { fontScalingFactor, moderateScale, windowWidth } from '../Constants/globalConstants'
import Ionicons from 'react-native-vector-icons/Ionicons'

export default function AuthTextInput({ icon, placeholder, placeholderTextColor = colors.black, customStyles, customTextInputStyles, value, onChangeText = (text) => { }, isSecureEntry = false, multiLine = false, isEditable = true, ref, onSubmitEditing = () => { } }) {

    const [secureEntryEnabled, setSecureEntryEnabled] = useState(isSecureEntry)

    const onEyeIconPress = () => {
        setSecureEntryEnabled(!secureEntryEnabled)
    }

    return (
        <View style={styles.fullContainer(customStyles, true)}>
            {icon && icon()}
            <View style={styles.innerContainer}>
                <View style={styles.textInputContainer(multiLine)}>
                    <TextInput
                        ref={ref}
                        style={styles.textInput(customTextInputStyles)}
                        value={value}
                        placeholder={placeholder}
                        multiline={multiLine}
                        editable={isEditable}
                        placeholderTextColor={placeholderTextColor}
                        onSubmitEditing={onSubmitEditing}
                        onChangeText={(text) => { onChangeText(text) }}
                        secureTextEntry={secureEntryEnabled}
                    />
                </View>
            </View>
            {
                isSecureEntry &&
                <Ionicons onPress={onEyeIconPress} name={secureEntryEnabled ? 'eye-off' : 'eye'} style={{ fontSize: moderateScale(14), color: colors.black }} />
            }
        </View>
    )
}

const styles = StyleSheet.create({
    fullContainer: (customStyles, bool) => {
        return {
            height: moderateScale(35),
            width: windowWidth - moderateScale(16),
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: moderateScale(8),
            paddingVertical: bool ? 0 : moderateScale(4),
            backgroundColor: colors.white,
            ...customStyles
        }
    },
    innerContainer: {
        flex: 1,
        marginLeft: moderateScale(6),
    },
    textInputContainer: (multiLine) => {
        return {
            height: multiLine ? moderateScale(50) : moderateScale(30)
        }
    },
    textInput: (customTextInputStyles) => {
        return {
            flex: 1,
            padding: 0,
            color: colors.black,
            fontSize: 14 / fontScalingFactor,
            ...customTextInputStyles
        }
    }
})