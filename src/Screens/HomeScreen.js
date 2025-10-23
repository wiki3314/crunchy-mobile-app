import { useIsFocused } from "@react-navigation/native";
import React from "react";
import { SafeAreaView, View } from "react-native";
import { useSelector } from "react-redux";
import SinglePostComponent from "../Components/SinglePostComponent";
import { commonStyles } from "../Constants/commonStyles";

export default function HomeScreen(props) {
  const isFocused = useIsFocused();
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );

  return (
    <View
      style={[
        commonStyles.flexFull,
        { backgroundColor: currentThemePrimaryColor },
      ]}
    >
      <SafeAreaView style={commonStyles.flexFull}>
        <SinglePostComponent />
      </SafeAreaView>
    </View>
  );
}
