import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
import { moderateScale, windowHeight, windowWidth } from '../Constants/globalConstants';
import CommonButton from './CommonButton';


export default function ConfirmationModal({ modalTitle, modalDescription, onConfirmButtonPress = () => { }, onCancelPress = () => { } }) {
    return (
        <Modal visible={true} transparent={true} animationType='slide' onRequestClose={onCancelPress}>
            <TouchableOpacity style={styles.modalFullContainer} onPress={onCancelPress}>
                <TouchableWithoutFeedback>
                    <View style={styles.modalInnerContainer}>
                        <Text style={commonStyles.textWhite(18, { color: colors.black, textAlign: 'center', fontWeight: 'bold' })}>
                            {modalTitle}
                        </Text>
                        <Text style={commonStyles.textWhite(14, { color: colors.black, textAlign: 'center', fontWeight: '500', marginTop: moderateScale(8) })}>
                            {modalDescription}
                        </Text>
                        <View style={styles.buttonContainer}>
                            <CommonButton onButtonPress={onConfirmButtonPress} buttonStyle={styles.confirmButtonStyle} buttonTitle='Confirm' textStyle={{ color: colors.white }} />
                            <CommonButton onButtonPress={onCancelPress} buttonStyle={styles.cancelButtonContainer} buttonTitle='Cancel' textStyle={{ color: colors.appPrimary }} />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalFullContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    modalInnerContainer: {
        backgroundColor: colors.white,
        width: windowWidth - moderateScale(16),
        minHeight: windowHeight * 0.2,
        borderRadius: moderateScale(16),
        padding: moderateScale(10)
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: moderateScale(20)
    },
    confirmButtonStyle: {
        backgroundColor: colors.appPrimary,
        width: '40%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(8)
    },
    cancelButtonContainer: {
        backgroundColor: colors.white,
        borderColor: colors.appPrimary,
        borderWidth: moderateScale(0.7),
        width: '40%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(8)
    }
})