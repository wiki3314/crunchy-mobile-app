import React from 'react'
import { Image, TouchableOpacity } from 'react-native'



export default function PressableImage({ onImagePress = () => { }, imageStyle, imageSource }) {
    return (
        <TouchableOpacity onPress={onImagePress}>
            <Image style={imageStyle} source={imageSource} resizeMode='stretch' />
        </TouchableOpacity>
    )
}