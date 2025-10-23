import React from 'react';
import { ActivityIndicator, Modal, SafeAreaView, StyleSheet, Text, View, } from 'react-native';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
import CircularProgress from './CircularProgress';

export default function LoadingComponent({ title, percentage }) {
    return (
        <Modal transparent={true}>
            <View style={styles.modalInnerContainer}>
                <ActivityIndicator size={'large'} color={colors.appPrimary} />
                <Text style={commonStyles.textWhite(24, { fontWeight: '600', color: colors.appPrimary, alignSelf: 'center', textAlign: 'center' })}>
                    {title ? title : 'Please wait...'}
                </Text>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalFullContainer: {
        flex: 1,
        backgroundColor: 'transparent'
    },
    modalInnerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: `${colors.black}99`,
    }
})