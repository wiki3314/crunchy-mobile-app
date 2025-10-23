import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
import { moderateScale, windowHeight, windowWidth } from '../Constants/globalConstants';
import CommonButton from './CommonButton';


export default function DeletePostModal({ onDeletePress = () => { }, onCancelPress = () => { } }) {
    return (
        <Modal visible={true} transparent={true} animationType='slide' onRequestClose={onCancelPress}>
            <View style={styles.modalFullContainer}>
                <View style={styles.modalInnerContainer}>
                    <Text style={commonStyles.textWhite(18, { color: colors.black, textAlign: 'center', fontWeight: 'bold' })}>
                        Are you Sure?
                    </Text>
                    <Text style={commonStyles.textWhite(14, { color: colors.black, textAlign: 'center', fontWeight: '500' })}>
                        you want to delete this post
                    </Text>
                    <View style={styles.buttonContainer}>
                        <CommonButton onButtonPress={onDeletePress} buttonStyle={styles.deleteButtonStyle} buttonTitle='Delete' textStyle={{ color: colors.white }} />
                        <CommonButton onButtonPress={onCancelPress} buttonStyle={styles.cancelButtonContainer} buttonTitle='Cancel' textStyle={{ color: colors.appPrimary }} />
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalFullContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0)'
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
    deleteButtonStyle: {
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