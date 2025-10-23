import { StyleSheet } from "react-native";
import { colors } from "./colors";
import {
  fontScalingFactor,
  moderateScale,
  windowHeight,
  windowWidth,
} from "./globalConstants";

export const commonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flexFull: {
    flex: 1,
  },
  flexRow_FullWidth: {
    width: windowWidth,
    flexDirection: "row",
    alignItems: "center",
  },
  textWhite: (fontSize, customStyles) => {
    return {
      fontSize: fontSize / fontScalingFactor,
      color: colors.white,
      fontFamily: "Montserrat-Regular",
      ...customStyles,
    };
  },
  flexRow_CenterItems: {
    flexDirection: "row",
    alignItems: "center",
  },
  fullScreenContainer: {
    flex: 1,
    padding: moderateScale(10),
  },
  ratingImageStyle: (currentIndex) => {
    return {
      fontSize: 25,
      color: colors.black,
      marginLeft: currentIndex !== 0 ? moderateScale(3) : 0,
    };
  },
});
