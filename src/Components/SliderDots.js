import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { colors } from "../Constants/colors";
import { moderateScale } from "../Constants/globalConstants";


export default function SliderDots({ number, activeIndex, customStyle }) {

    const [totalDots, setTotalDots] = useState([])

    useEffect(() => {
        let arrTotalDots = []
        for (var i = 0; i < number; i++) {
            arrTotalDots.push(0)
        }
        setTotalDots(arrTotalDots)
    }, [])

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: '#00000000',...customStyle }}>
            {totalDots.map((item, index) => {
                return <View style={{ height: moderateScale(6), width: moderateScale(6), borderRadius: moderateScale(3), marginLeft: index == 0 ? 0 : moderateScale(1), backgroundColor: index == activeIndex ? colors.appPrimary : colors.lightGrey }}>

                </View>
            })}
        </View>
    )
}