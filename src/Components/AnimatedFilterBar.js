import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';
import { colors } from '../Constants/colors';
import { fontScalingFactor, moderateScale, windowWidth } from '../Constants/globalConstants';

export default function AnimatedFilterBar({ filterTabs, innerComponents, icons }) {

    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef()
    const onCLick = i => scrollViewRef.current.scrollTo({ x: i * windowWidth });

    return (
        <View style={styles.container}>
            <View style={{ padding: 5, paddingTop: 0 }}>
                <ButtonContainer buttons={filterTabs} onClick={onCLick} scrollX={scrollX} icons={icons} />
            </View>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                keyboardShouldPersistTaps='always'
                pagingEnabled
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false },
                )}>
                {innerComponents.map((item, index) => {
                    return <View style={styles.card} key={index} >
                        {item()}
                    </View>
                })}
            </ScrollView>
        </View>
    );
}

export function ButtonContainer({ buttons, onClick, scrollX, icons }) {

    const [btnContainerWidth, setWidth] = useState(0);
    const btnWidth = btnContainerWidth / buttons.length;
    const translateX = scrollX.interpolate({
        inputRange: [0, windowWidth],
        outputRange: [0, btnWidth],
    });
    const translateXOpposit = scrollX.interpolate({
        inputRange: [0, windowWidth],
        outputRange: [0, -btnWidth],
    });
    return (
        <View
            style={styles.btnContainer}
            onLayout={e => setWidth(e.nativeEvent.layout.width)}>
            {buttons.map((btn, i) => (
                <TouchableOpacity
                    key={i}
                    style={styles.btn}
                    onPress={() => onClick(i)}>
                    {icons[i](colors.black)}
                    <Text style={{ color: colors.black, fontSize: 14 / fontScalingFactor }}>{btn}</Text>
                </TouchableOpacity>
            ))}
            <Animated.View
                style={[
                    styles.animatedBtnContainer,
                    { width: btnWidth, transform: [{ translateX }] },
                ]}>
                {buttons.map((btn, index) => (
                    <Animated.View
                        key={btn}
                        style={[
                            styles.animatedBtn,
                            { width: btnWidth, transform: [{ translateX: translateXOpposit }] },
                        ]}>
                        {icons[index](colors.white)}
                        <Text style={styles.btnTextActive}>{btn}</Text>
                    </Animated.View>
                ))}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    btnContainer: {
        height: moderateScale(20),
        borderRadius: moderateScale(8),
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        width: windowWidth - moderateScale(20),
        alignSelf: 'center',
        borderColor: colors.appPrimary,
        borderWidth: moderateScale(0.5)
    },
    btn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    },
    animatedBtnContainer: {
        height: moderateScale(20),
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        overflow: 'hidden',
        backgroundColor: colors.appPrimary,
    },
    animatedBtn: {
        height: moderateScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    },
    btnTextActive: {
        color: '#fff',
        fontSize: 14 / fontScalingFactor
    },
    card: {
        width: windowWidth,
        // paddingHorizontal: moderateScale(10),
        alignSelf: 'center',
        height: '100%',
    },
});