import React from "react";
import { SafeAreaView, View } from "react-native";
import { useSelector } from "react-redux";
import PostWithoutLogin from "../Components/PostWithoutLogin";
import { commonStyles } from "../Constants/commonStyles";

export default function HomeWithoutLogin(props) {
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
        <PostWithoutLogin isMyPost={true} />
      </SafeAreaView>
    </View>
  );
}
