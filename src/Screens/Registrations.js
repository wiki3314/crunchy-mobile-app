import React, { useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  Vibration,
  View,
} from "react-native";
import AuthHeader from "../Components/AuthHeader";
import AuthTextInput from "../Components/AuthTextInput";
import { colors } from "../Constants/colors";
import { commonStyles } from "../Constants/commonStyles";
import {
  errorVibrationPattern,
  fontScalingFactor,
  moderateScale,
  userSuccessPattern,
  windowHeight,
  windowWidth,
} from "../Constants/globalConstants";
import { imagePath } from "../Constants/imagePath";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "react-native-vector-icons/AntDesign";
// import { color } from 'react-native-reanimated';
import { useNavigation } from "@react-navigation/native";
import { navigationStrings } from "../Navigation/NavigationStrings";
import CommonButton from "../Components/CommonButton";
import Ionicons from "react-native-vector-icons/Ionicons";
import { apiHandler } from "../Constants/apiHandler";
import {
  enableDarkModeAutoUpdate,
  setAccessToken,
  setAdminAdvertisements,
  setCurrentSessionId,
  setFoodCategories,
  setIsNewUser,
  setUserData,
  toggleDarkMode,
  updateVibrationSettings,
} from "../Redux/actions/actions";
import { helperFunctions } from "../Constants/helperFunctions";
import { useDispatch, useSelector } from "react-redux";
import LoadingComponent from "../Components/LoadingComponent";
import CustomToast from "../Components/CustomToast";
import ErrorComponent from "../Components/ErrorComponent";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Registration(props) {
  const isDarkModeActive = useSelector((state) => state.isDarkModeActive);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loaderTitle, setLoaderTitle] = useState("");
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordSecureEntry, setPasswordSecureEntry] = useState(true);
  const [cPasswordSecureEntry, setCPasswordSecureEntry] = useState(true);
  const [termsAndConditionsAccepted, setTermsAndConditionsAccepted] =
    useState(false);

  const fullNameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();

  const navigation = useNavigation();

  const dispatch = useDispatch();

  const onFullNameChange = (text) => {
    setFullName(text);
  };

  const onEmailChange = (text) => {
    setEmail(text);
  };

  const onPasswordChange = (text) => {
    setPassword(text);
  };

  const onConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
  };

  const renderNameIcon = () => {
    return <Ionicons name="person-outline" style={styles.inputIcon} />;
  };

  const renderEmailIcon = () => {
    return <AntDesign name="mail" style={styles.inputIcon} />;
  };

  const renderPasswordIcon = () => {
    return <AntDesign name="lock" style={styles.inputIcon} />;
  };

  const validateEmail = (mail) => {
    return String(mail)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const enableDisableSecurePasswordEntry = () => {
    setPasswordSecureEntry(!passwordSecureEntry);
  };

  const enableDisableSecureCPasswordEntry = () => {
    setCPasswordSecureEntry(!cPasswordSecureEntry);
  };

  const onRegisterPress = async () => {
    if (fullName.trim() == "") {
      setErrorMessage("Full name can't be empty");
      setShowErrorMessage(true);
      Vibration.vibrate(errorVibrationPattern);
    }
    // else if (userName.trim() == '') {
    //     Toast.show('Username is required')
    // }
    else if (email.trim() == "" || !validateEmail(email.trim())) {
      setErrorMessage("Invalid email");
      setShowErrorMessage(true);
      Vibration.vibrate(errorVibrationPattern);
    } else if (password.trim().length < 7) {
      setErrorMessage("Password length too short");
      setShowErrorMessage(true);
      Vibration.vibrate(errorVibrationPattern);
    } else if (password.trim() !== confirmPassword.trim()) {
      setErrorMessage("Both passwords should match");
      setShowErrorMessage(true);
      Vibration.vibrate(errorVibrationPattern);
    } else if (!termsAndConditionsAccepted) {
      setErrorMessage("Terms and Conditions not accepted");
      setShowErrorMessage(true);
      Vibration.vibrate(errorVibrationPattern);
    } else {
      setIsLoading(true);
      setLoaderTitle("Adding details");
      try {
        let fcmToken = await AsyncStorage.getItem("fcmToken");
        let reqObj = {
          full_name: fullName,
          user_name: "userName",
          email: email,
          password: password,
          password_confirmation: confirmPassword,
          fcm_token: fcmToken,
        };
        // Send as JSON, not FormData
        let result = await apiHandler.registerUser(reqObj);

        console.log("Result is", result);
        setIsLoading(false);
        if (result && result.success == true) {
          try {
            AsyncStorage.setItem("swipeValue", "0");
            AsyncStorage.setItem("isReviewPosted", "false");
            Vibration.vibrate(userSuccessPattern);
            let token = result.token;
            await helperFunctions.storeAccessToken(token);

            let categories = await apiHandler.getAllCategories(token);
            let adminAdvertisements =
              await apiHandler.getAdminPanelAdvertisements(token);

            // Session API is optional - if it fails, use default session
            let session = null;
            try {
              session = await apiHandler.userSessionAPI(token, {});
            } catch (sessionError) {
              console.log("Session API failed, using default:", sessionError);
              session = { id: 0 }; // Default session
            }

            let userData = await apiHandler.getUserData(token);

            let userSavedAppSettings = userData.app_settings || {};
            // Default to light mode (white background) for new users
            let isDarkMode = userSavedAppSettings.dark_mode === "true";
            let isToggleDarkMode =
              userSavedAppSettings.toggledark_mode === "true";
            let isVibrationEnabled =
              userSavedAppSettings.vibrations !== "false";

            dispatch(setCurrentSessionId(session?.id || 0));
            dispatch(setAdminAdvertisements(adminAdvertisements || []));
            dispatch(setFoodCategories(categories || []));
            dispatch(toggleDarkMode(isDarkMode));
            dispatch(enableDarkModeAutoUpdate(isToggleDarkMode));
            dispatch(updateVibrationSettings(isVibrationEnabled));
            dispatch(setIsNewUser(true));
            dispatch(setUserData(userData));
            dispatch(setAccessToken(token));

            // Show success toast ONLY after all APIs succeed
            setShowCustomToast(true);
          } catch (dataError) {
            console.log(
              "Error loading user data after registration:",
              dataError
            );
            setIsLoading(false);
            setErrorMessage(
              "Registration successful but failed to load user data. Please login again."
            );
            setShowErrorMessage(true);
            Vibration.vibrate(errorVibrationPattern);
          }
        } else {
          setShowErrorMessage(true);
          setErrorMessage(result?.message || "Registration failed");
          Vibration.vibrate(errorVibrationPattern);
        }
      } catch (error) {
        setIsLoading(false);
        setErrorMessage(error.message || "An error occurred");
        setShowErrorMessage(true);
        Vibration.vibrate(errorVibrationPattern);
      }
    }
  };

  const onTermsAndConditionsAccepted = () => {
    setTermsAndConditionsAccepted(!termsAndConditionsAccepted);
  };

  const onTermsAndConditionsPress = () => {
    navigation.navigate(navigationStrings.TermsAndConditionsScreen, {
      termsAndConditions: true,
    });
  };

  const onPrivacyPolicyPress = () => {
    navigation.navigate(navigationStrings.TermsAndConditionsScreen, {
      termsAndConditions: false,
    });
  };

  return (
    <SafeAreaView
      style={[
        commonStyles.flexFull,
        { backgroundColor: currentThemePrimaryColor },
      ]}
    >
      <ErrorComponent
        isVisible={showErrorMessage}
        onToastShow={() => {
          setTimeout(() => {
            setShowErrorMessage(false);
          }, 1100);
        }}
        toastMessage={errorMessage}
      />
      <CustomToast
        isVisible={showCustomToast}
        onToastShow={() => {
          setTimeout(() => {
            setShowCustomToast(false);
          }, 900);
        }}
        toastMessage={"Registered successfully"}
      />
      <View style={commonStyles.screenContainer}>
        {isLoading && <LoadingComponent title={loaderTitle} />}
        <ImageBackground
          style={commonStyles.flexFull}
          source={
            isDarkModeActive ? imagePath.darkSplashBG : imagePath.splashBG
          }
        >
          <AuthHeader />
          <ScrollView style={commonStyles.flexFull}>
            <View style={commonStyles.flexFull}>
              <Text
                style={commonStyles.textWhite(24, {
                  color: currentThemeSecondaryColor,
                  alignSelf: "center",
                  marginTop: moderateScale(10),
                  fontWeight: "bold",
                })}
              >
                Welcome to Crunchii!
              </Text>
              <Text
                style={commonStyles.textWhite(18, {
                  color: currentThemeSecondaryColor,
                  alignSelf: "center",
                  marginTop: moderateScale(5),
                })}
              >
                The app helping indecisive people find
              </Text>
              <Text
                style={commonStyles.textWhite(18, {
                  color: currentThemeSecondaryColor,
                  alignSelf: "center",
                })}
              >
                where to eat
              </Text>
              <View
                style={{
                  height: moderateScale(35),
                  width: windowWidth - moderateScale(16),
                  alignSelf: "center",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: moderateScale(8),
                  paddingVertical: moderateScale(4),
                  backgroundColor: colors.white,
                  marginTop: moderateScale(20),
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.23,
                  shadowRadius: 2.62,
                  elevation: 4,
                  borderRadius: moderateScale(12),
                }}
              >
                {renderNameIcon()}
                <View style={styles.innerContainer}>
                  <View style={{ height: moderateScale(30) }}>
                    <TextInput
                      ref={fullNameRef}
                      style={{
                        flex: 1,
                        padding: 0,
                        color: colors.black,
                      }}
                      value={fullName}
                      placeholder={"Full Name"}
                      onSubmitEditing={() => {
                        emailRef.current.focus();
                      }}
                      placeholderTextColor={colors.black}
                      onChangeText={(text) => {
                        setFullName(text);
                      }}
                    />
                  </View>
                </View>
              </View>
              <View
                style={{
                  height: moderateScale(35),
                  width: windowWidth - moderateScale(16),
                  alignSelf: "center",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: moderateScale(8),
                  paddingVertical: moderateScale(4),
                  backgroundColor: colors.white,
                  marginTop: moderateScale(4),
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.23,
                  shadowRadius: 2.62,
                  elevation: 4,
                  borderRadius: moderateScale(12),
                }}
              >
                {renderEmailIcon()}
                <View style={styles.innerContainer}>
                  <View style={{ height: moderateScale(30) }}>
                    <TextInput
                      ref={emailRef}
                      style={{
                        flex: 1,
                        padding: 0,
                        color: colors.black,
                      }}
                      value={email}
                      placeholder={"Email"}
                      onSubmitEditing={() => {
                        passwordRef.current.focus();
                      }}
                      placeholderTextColor={colors.black}
                      onChangeText={(text) => {
                        setEmail(text);
                      }}
                    />
                  </View>
                </View>
              </View>
              <View
                style={{
                  height: moderateScale(35),
                  width: windowWidth - moderateScale(16),
                  alignSelf: "center",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: moderateScale(8),
                  paddingVertical: moderateScale(4),
                  backgroundColor: colors.white,
                  marginTop: moderateScale(4),
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.23,
                  shadowRadius: 2.62,
                  elevation: 4,
                  borderRadius: moderateScale(12),
                }}
              >
                {renderPasswordIcon()}
                <View style={styles.innerContainer}>
                  <View style={{ height: moderateScale(30) }}>
                    <TextInput
                      ref={passwordRef}
                      style={{
                        flex: 1,
                        padding: 0,
                        color: colors.black,
                        fontSize: 14 / fontScalingFactor,
                      }}
                      value={password}
                      placeholder={"Password"}
                      onSubmitEditing={() => {
                        confirmPasswordRef.current.focus();
                      }}
                      secureTextEntry={passwordSecureEntry}
                      placeholderTextColor={colors.black}
                      onChangeText={(text) => {
                        setPassword(text);
                      }}
                    />
                  </View>
                </View>
                <Ionicons
                  onPress={enableDisableSecurePasswordEntry}
                  name={passwordSecureEntry ? "eye-off" : "eye"}
                  style={{ fontSize: moderateScale(14), color: colors.black }}
                />
              </View>
              <View
                style={{
                  height: moderateScale(35),
                  width: windowWidth - moderateScale(16),
                  alignSelf: "center",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: moderateScale(8),
                  paddingVertical: moderateScale(4),
                  backgroundColor: colors.white,
                  marginTop: moderateScale(4),
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.23,
                  shadowRadius: 2.62,
                  elevation: 4,
                  borderRadius: moderateScale(12),
                  marginBottom: moderateScale(4),
                }}
              >
                {renderPasswordIcon()}
                <View style={styles.innerContainer}>
                  <View style={{ height: moderateScale(30) }}>
                    <TextInput
                      ref={confirmPasswordRef}
                      style={{
                        flex: 1,
                        padding: 0,
                        color: colors.black,
                      }}
                      value={confirmPassword}
                      placeholder={"Confirm-Password"}
                      onSubmitEditing={() => {}}
                      secureTextEntry={cPasswordSecureEntry}
                      placeholderTextColor={colors.black}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                      }}
                    />
                  </View>
                </View>
                <Ionicons
                  onPress={enableDisableSecureCPasswordEntry}
                  name={cPasswordSecureEntry ? "eye-off" : "eye"}
                  style={{ fontSize: moderateScale(14), color: colors.black }}
                />
              </View>
              <View style={styles.termsAndConditionsContainer}>
                <FontAwesome
                  name="check-circle"
                  onPress={onTermsAndConditionsAccepted}
                  style={styles.termsAndConditionsIcon(
                    termsAndConditionsAccepted,
                    isDarkModeActive
                  )}
                />
                <Text
                  style={commonStyles.textWhite(14, {
                    color: currentThemeSecondaryColor,
                    marginLeft: moderateScale(3),
                  })}
                >
                  I accept the
                  <Text
                    style={commonStyles.textWhite(14, {
                      color: colors.appPrimary,
                    })}
                    onPress={onTermsAndConditionsPress}
                  >
                    {" terms and conditions "}
                  </Text>
                  and
                  <Text
                    style={commonStyles.textWhite(14, {
                      color: colors.appPrimary,
                    })}
                    onPress={onPrivacyPolicyPress}
                  >
                    {" privacy policy "}
                  </Text>
                  for the application use
                </Text>
              </View>
            </View>
          </ScrollView>
          <CommonButton
            onButtonPress={onRegisterPress}
            buttonTitle={"Register"}
            buttonStyle={styles.registerButton}
            textStyle={commonStyles.textWhite(18, { fontWeight: "700" })}
          />
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    flex: 1,
    marginLeft: moderateScale(6),
  },
  logoImage: {
    height: windowHeight * 0.3,
    width: windowWidth * 0.8,
  },
  inputIcon: {
    color: colors.black,
    fontSize: 25,
  },
  rememberMeIcon: (bool) => {
    return {
      color: bool ? colors.appPrimary : colors.grey,
      fontSize: 30,
    };
  },
  registerButton: {
    width: windowWidth * 0.9,
    alignSelf: "center",
    paddingVertical: moderateScale(6),
    backgroundColor: colors.appPrimary,
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    marginVertical: moderateScale(15),
  },
  termsAndConditionsContainer: {
    width: windowWidth * 0.9,
    flexDirection: "row",
    alignSelf: "center",
    marginTop: moderateScale(4),
  },
  termsAndConditionsIcon: (bool, isDarkModeActive) => {
    return {
      color: !bool
        ? isDarkModeActive
          ? colors.lightGrey
          : colors.darkGrey
        : colors.green,
      fontSize: 38,
    };
  },
});
