import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, Vibration, View } from 'react-native';
import { colors } from '../Constants/colors';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { commonStyles } from '../Constants/commonStyles';
import { moderateScale } from '../Constants/globalConstants';


export default function ErrorComponent({ isVisible, onToastShow = () => { }, toastMessage }) {

    return (
        <Modal visible={isVisible} onShow={onToastShow} transparent={true} animationType='fade'>
            <View style={styles.fullContainer}>
                <Ionicons name='close-circle-sharp' style={styles.iconStyle} />
                <Text style={commonStyles.textWhite(32, { fontWeight: '700' })}>
                    {'Oops! '}
                </Text>
                <Text style={commonStyles.textWhite(20, { fontWeight: '600', marginTop: moderateScale(5) })}>
                    {toastMessage}
                </Text>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: `${colors.black}77`
    },
    iconStyle: {
        fontSize: 250,
        color: '#ff0000'
    }
})