import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors } from '../Constants/colors';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { commonStyles } from '../Constants/commonStyles';
import { moderateScale } from '../Constants/globalConstants';


export default function CustomToast({ isVisible, onToastShow = () => { }, toastMessage }) {

    return (
        <Modal visible={isVisible} onShow={onToastShow} transparent={true} animationType='fade'>
            <View style={styles.fullContainer}>
                <Ionicons name='checkmark-circle' style={styles.iconStyle} />
                <Text style={commonStyles.textWhite(20, { fontWeight: '600', alignSelf: 'center', textAlign: 'center' })}>
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
        backgroundColor: `${colors.black}cc`
    },
    iconStyle: {
        fontSize: moderateScale(150),
        color: colors.green
    }
})