import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
  FlatList,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "../Constants/colors";
import { commonStyles } from "../Constants/commonStyles";
import {
  moderateScale,
  windowWidth,
  windowHeight,
  GOOGLE_API_KEY,
  ratingsData,
  VIBRATION_PATTERN,
} from "../Constants/globalConstants";
import { imagePath } from "../Constants/imagePath";
import Entypo from "react-native-vector-icons/Entypo";
import PressableImage from "./PressableImage";
import { useNavigation } from "@react-navigation/native";
import { navigationStrings } from "../Navigation/NavigationStrings";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  AccessToken,
  LoginManager,
  GraphRequest,
  GraphRequestManager,
} from "react-native-fbsdk-next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiHandler, BASE_URL } from "../Constants/apiHandler";
import {
  setAccessToken,
  setUserData,
  showHideForceLoginModal,
  setPostsWithoutLogin,
  setAdminAdvertisements,
  setFoodCategories,
  setIsNewUser,
  setCurrentSessionId,
  setLikedPosts,
  setFavouritePlaces,
  setFavoriteRestaurants,
} from "../Redux/actions/actions";
import LoadingComponent from "../Components/LoadingComponent";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import CommonButton from "./CommonButton";
import { helperFunctions } from "../Constants/helperFunctions";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { PanGestureHandler } from "react-native-gesture-handler";

export default function PostWithoutLogin() {
  const isDarkModeActive = useSelector((state) => state.isDarkModeActive);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );

  const images =
    Platform.OS == "ios"
      ? [
          {
            id: 0,
            imageSource: imagePath.gmailIcon,
          },
          {
            id: 1,
            imageSource: imagePath.facebookIcon,
          },
          {
            id: 2,
            imageSource: imagePath.appleIcon,
          },
        ]
      : [
          {
            id: 0,
            imageSource: imagePath.gmailIcon,
          },
          {
            id: 1,
            imageSource: imagePath.facebookIcon,
          },
        ];

  const allPosts = useSelector((state) => state.postsWithoutLogin);
  const userLocation = useSelector((state) => state.userLocation);
  const showForceLoginModal = useSelector((state) => state.showForceLoginModal);

  const listRef = useRef();

  const [isLoading, setIsLoading] = useState(false);
  const [componentHeight, setComponentHeight] = useState(0);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  async function getPostsWithoutLogin() {
    // TEMPORARILY DISABLED FOR DESIGN TESTING - API call commented out
    console.log("API calls disabled for design testing");
    setIsLoading(false);

    // Mock data for design testing
    const mockPosts = [];
    dispatch(setPostsWithoutLogin(mockPosts));

    /* ORIGINAL CODE - UNCOMMENT TO ENABLE API
    setIsLoading(true);
    let reqObj = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    };
    let postsWithoutLogin = await apiHandler.getPostsWithoutLogin(reqObj);
    postsWithoutLogin = postsWithoutLogin.filter((item, index) => {
      if (item) {
        return item;
      }
    });
    dispatch(setPostsWithoutLogin(postsWithoutLogin));
    if (postsWithoutLogin && postsWithoutLogin.length > 0) {
      listRef.current.scrollToIndex({ index: 0 });
    }
    setIsLoading(false);
    */
  }

  useEffect(() => {
    getPostsWithoutLogin();
  }, []);

  useEffect(() => {}, []);

  const onRegisterPress = () => {
    dispatch(showHideForceLoginModal(false));
    navigation.navigate(navigationStrings.Registration);
  };

  const onLoginPress = () => {
    dispatch(showHideForceLoginModal(false));
    navigation.navigate(navigationStrings.Login);
  };

  const changeModalState = () => {
    dispatch(showHideForceLoginModal(!showForceLoginModal));
  };

  function onSocialLoginPress(id) {
    switch (id) {
      case 0:
        onGooglePress();
        break;
      case 1:
        loginWithFacebook();
        break;
      case 2:
        onApplePress();
        break;
      default:
        break;
    }
  }

  const onApplePress = async () => {
    // TEMPORARILY DISABLED FOR DESIGN TESTING
    console.log("Apple login disabled for design testing");
    dispatch(showHideForceLoginModal(false));
    return;

    /* ORIGINAL CODE - UNCOMMENT TO ENABLE
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });
    const credentialState = await appleAuth.getCredentialStateForUser(
      appleAuthRequestResponse.user
    );
    if (credentialState == 1) {
    */
    if (false) {
      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      let fcmToken = await AsyncStorage.getItem("fcmToken");
      var raw = JSON.stringify({
        full_name: "User",
        // "name": appleAuthRequestResponse?.fullName?.givenName != null ? appleAuthRequestResponse.fullName.givenName : "",
        email:
          appleAuthRequestResponse.email != null
            ? appleAuthRequestResponse.email
            : "",
        provider_id: appleAuthRequestResponse.user,
        password: "123456789",
        device_type: "ios",
        provider_name: "apple",
        image: "",
        mobile_number: "96860970",
        user_name: "user",
        fcm_token: fcmToken,
      });
      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };
      try {
        await fetch(BASE_URL + "socialLogin", requestOptions)
          .then((response) => response.json())
          .then(async (response) => {
            if (response?.status == 200) {
              const socialResponse = response;
              const token = socialResponse?.token;
              await helperFunctions.storeAccessToken(token);
              AsyncStorage.setItem("swipeValue", "0");
              AsyncStorage.setItem("isReviewPosted", "false");
              if (socialResponse.token) {
                let userData = socialResponse.userData;
                dispatch(setUserData(userData[0]));
              } else {
                let userData = await apiHandler.getUserData(
                  socialResponse.token
                );
                dispatch(setUserData(userData[0]));
              }
              if (socialResponse?.isUser) {
                console.log("New userrrrrrrrr");
                dispatch(setIsNewUser(true));
              } else {
                dispatch(setIsNewUser(false));
              }
              let categories = await apiHandler.getAllCategories(token);
              let adminAdvertisements =
                await apiHandler.getAdminPanelAdvertisements(token);
              let session = await apiHandler.userSessionAPI(token, {});
              dispatch(setCurrentSessionId(session.id));
              dispatch(setAdminAdvertisements(adminAdvertisements));
              dispatch(setFoodCategories(categories));
              dispatch(setAccessToken(token));
              setIsLoading(false);
            } else {
              setIsLoading(false);
            }
          });
        // })
      } catch (error) {
        setIsLoading(false);
      }
    }
  };

  const onGooglePress = () => {
    // TEMPORARILY DISABLED FOR DESIGN TESTING
    console.log("Google login disabled for design testing");
    dispatch(showHideForceLoginModal(false));
    return;

    /* ORIGINAL CODE - UNCOMMENT TO ENABLE
    setIsLoading(true);
    GoogleSignin.configure({
      iosClientId:
        "887856847210-br194482savpiontotn1d0kucuosbdct.apps.googleusercontent.com",
      androidClientId:
        "887856847210-kn6g0ggbduj48m2qpgntaog0bfmmp0os.apps.googleusercontent.com",
    });
    GoogleSignin.hasPlayServices()
    */
    Promise.resolve()
      .then((hasPlayService) => {
        if (hasPlayService) {
          console.log("Google sign in", hasPlayService);
          GoogleSignin.signIn()
            .then((userInfo) => {
              socialLogin(userInfo.user, "google");
              setIsLoading(false);
            })
            .catch((e) => {
              setIsLoading(false);
              console.log("ERROR IS: " + JSON.stringify(e));
            });
        }
      })
      .catch((e) => {
        console.log("ERROR IS: " + JSON.stringify(e));
      });
  };

  const loginWithFacebook = () => {
    // TEMPORARILY DISABLED FOR DESIGN TESTING
    console.log("Facebook login disabled for design testing");
    dispatch(showHideForceLoginModal(false));
    return;

    /* ORIGINAL CODE - UNCOMMENT TO ENABLE
    LoginManager.logInWithPermissions([
      "public_profile",
      "email",
      "user_friends",
    ]).then((result) => {
    */
    Promise.resolve({ isCancelled: true }).then((result) => {
      console.log("result for the facebook ", result);
      if (result.isCancelled) {
        setIsLoading(false);
        console.log("is canceleddddd");
      } else {
        AccessToken.getCurrentAccessToken()
          .then((data) => {
            console.log("data is the fov", data);
            const accessToken = data.accessToken.toString();
            getUserInfoFromFacebookToken(accessToken);
          })
          .catch((error) => {
            console.log("Error fetching accessToken");
          });
      }
    });
  };

  const getUserInfoFromFacebookToken = (token) => {
    const PROFILE_REQUEST_PARAMS = {
      fields: {
        string: "id, name, first_name, last_name, birthday, email",
      },
    };
    const profileRequest = new GraphRequest(
      "/me",
      { token, parameters: PROFILE_REQUEST_PARAMS },
      (error, result) => {
        if (error) {
          console.log("Login Info has an error:", error);
        } else {
          if (result.isCancelled) {
            console.log("Login cancelled");
          }
          if (result.email === undefined) {
            Alert.alert(
              "Error",
              "To contiune MyApp plase allow access to your email",
              "Ok"
            );
          } else {
            socialLogin(result, "facebook");
          }
        }
      }
    );
    new GraphRequestManager().addRequest(profileRequest).start();
  };

  const socialLogin = async (result, type) => {
    console.log("resultresult", result);
    let fcmToken = await AsyncStorage.getItem("fcmToken");
    console.log("FCCCCMMMMM", fcmToken);
    let socialLogindata = {
      full_name: result.full_name,
      email: result.email,
      provider_id: result.id,
      provider_name: type,
      password: 12345678,
      device_type: Platform.OS,
      image: result.photo,
    };
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    var raw = JSON.stringify({
      provider_id: result.id,
      password: "123456789",
      device_type: "ios",
      full_name: result.name,
      email: result.email,
      provider_name: type,
      image: result.photo,
      fcm_token: fcmToken,
    });
    try {
      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };
      fetch(BASE_URL + "socialLogin", requestOptions)
        .then((response) => response.json())
        .then(async (response) => {
          // .then(async (res) => {
          console.log("************ ", response);
          // let formData = apiHandler.createFormData(socialLogindata)
          // const socialResponse = await apiHandler.socialLogin(formData)
          let socialResponse = response;
          AsyncStorage.setItem("swipeValue", "0");
          AsyncStorage.setItem("isReviewPosted", "false");
          if (socialResponse?.token) {
            const token = socialResponse?.token;
            await helperFunctions.storeAccessToken(token);
            if (socialResponse.userData) {
              let userData = socialResponse.userData;
              dispatch(setUserData(userData[0]));
            } else {
              let userData = await apiHandler.getUserData(socialResponse.token);
              dispatch(setUserData(userData[0]));
            }
            if (socialResponse?.isUser) {
              console.log("New userrrrrrrrr");
              dispatch(setIsNewUser(true));
            } else {
              dispatch(setIsNewUser(false));
            }
            let categories = await apiHandler.getAllCategories(token);
            let adminAdvertisements =
              await apiHandler.getAdminPanelAdvertisements(token);
            let session = await apiHandler.userSessionAPI(token, {});
            let likedInAppPosts = await apiHandler.getFavoriteRestaurants(
              token
            );
            let googlePosts = await apiHandler.getGoogleLikedPosts(token);
            let favoriteRestaurants = await apiHandler.getLikedRestaurants(
              token
            );
            favoriteRestaurants = favoriteRestaurants.map((item, index) => {
              return {
                restaurantName: item.restaurant_name,
                restaurantImage: item.image,
                restaurant_id: item.restaurant_id,
              };
            });
            dispatch(setLikedPosts(likedInAppPosts));
            dispatch(setFavouritePlaces(googlePosts));
            dispatch(setFavoriteRestaurants(favoriteRestaurants));
            dispatch(setCurrentSessionId(session.id));
            dispatch(setAdminAdvertisements(adminAdvertisements));
            dispatch(setFoodCategories(categories));
            dispatch(setAccessToken(token));
            setIsLoading(false);
          } else {
            setIsLoading(false);
          }
        });
    } catch (error) {
      console.log("social login ", error.message);
    }
  };

  const handleGesture = (event) => {
    if (event.nativeEvent.state == 5) {
      if (event.nativeEvent.translationX < -50) {
        dispatch(showHideForceLoginModal(true));
      } else if (event.nativeEvent.translationX > 50) {
        dispatch(showHideForceLoginModal(true));
      }
    }
  };

  const renderPost = ({ item, index }) => {
    return (
      <ImageBackground
        resizeMode="cover"
        source={
          item && {
            uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${700}&photo_reference=${
              item.restaurantImage
            }&key=${GOOGLE_API_KEY}`,
          }
        }
        style={{
          height: componentHeight,
          width: windowWidth,
          padding: moderateScale(4),
          paddingBottom: moderateScale(12),
        }}
      >
        <PanGestureHandler
          failOffsetY={[-5, 5]}
          activeOffsetX={[-5, 5]}
          onHandlerStateChange={(event) => {
            handleGesture(event);
          }}
        >
          <View style={styles.fullInnerContainer}>
            <View style={styles.commentSectionContainer}>
              <TouchableOpacity
                style={styles.restaurantImageContainer}
                onPress={changeModalState}
              >
                <Image
                  source={
                    item && {
                      uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${700}&photo_reference=${
                        item.restaurantImage
                      }&key=${GOOGLE_API_KEY}`,
                    }
                  }
                  style={styles.restaurantImage}
                />
              </TouchableOpacity>
              <PressableImage
                imageSource={imagePath.unlikedPost}
                imageStyle={styles.likePostImage}
                onImagePress={changeModalState}
              />
              <PressableImage
                imageSource={imagePath.commentImage}
                imageStyle={styles.commentImage}
                onImagePress={changeModalState}
              />
              <Entypo
                name="share"
                style={styles.shareIcon}
                onPress={changeModalState}
              />
            </View>
            <View
              style={{
                minHeight: moderateScale(100),
                width: windowWidth * 0.7,
                padding: moderateScale(5),
                position: "absolute",
                left: moderateScale(0),
                bottom: windowHeight * 0.1,
              }}
            >
              <Text
                style={commonStyles.textWhite(20, {
                  fontWeight: "bold",
                  width: "85%",
                  textShadowColor: colors.black,
                  textShadowOffset: { width: 5, height: 5 },
                  textShadowRadius: 10,
                })}
              >
                {item && item.restaurantName}
              </Text>
              {item &&
                item.restaurantRating &&
                helperFunctions.getStarRatings(item.restaurantRating)}
              {item && item.restaurantPrice && (
                <View style={styles.singleTextContainer}>
                  {ratingsData.map((ratingItem, index) => {
                    return (
                      ratingItem <= Math.floor(item.restaurantPrice) && (
                        <FontAwesome
                          name="dollar"
                          style={commonStyles.ratingImageStyle(index)}
                        />
                      )
                    );
                  })}
                </View>
              )}
              <Text
                numberOfLines={4}
                style={commonStyles.textWhite(14, {
                  fontWeight: "400",
                  width: "80%",
                  color: colors.grey,
                  textShadowColor: colors.black,
                  textShadowOffset: { width: 5, height: 5 },
                  textShadowRadius: 10,
                })}
              >
                {item && item.review}
              </Text>
            </View>
          </View>
        </PanGestureHandler>
      </ImageBackground>
    );
  };

  return (
    <View style={commonStyles.flexFull}>
      {isLoading && <LoadingComponent title={"Fetching near by restaurants"} />}
      <FlatList
        ref={listRef}
        data={allPosts}
        renderItem={renderPost}
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        onLayout={(event) => {
          setComponentHeight(event.nativeEvent.layout.height);
        }}
        removeClippedSubviews={true}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={() => {
          return (
            <View
              style={{
                height: componentHeight,
                width: windowWidth,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: currentThemePrimaryColor,
              }}
            >
              <Text
                style={commonStyles.textWhite(28, {
                  color: currentThemeSecondaryColor,
                })}
              >
                Oops..!!!
              </Text>
              <Text
                style={commonStyles.textWhite(22, {
                  color: currentThemeSecondaryColor,
                })}
              >
                No restaurants found
              </Text>
            </View>
          );
        }}
      />
      <Modal
        transparent={true}
        visible={showForceLoginModal}
        onRequestClose={changeModalState}
      >
        <View style={styles.forceLoginModalFullContainer(isDarkModeActive)}>
          <View
            style={styles.forceLoginModalInnerContainer(
              currentThemePrimaryColor
            )}
          >
            <Ionicons
              name="close"
              style={styles.closeLoginModalIcon(currentThemeSecondaryColor)}
              onPress={() => {
                dispatch(showHideForceLoginModal(false));
              }}
            />
            <Text
              style={commonStyles.textWhite(18, {
                color: currentThemeSecondaryColor,
                alignSelf: "center",
                marginTop: moderateScale(15),
              })}
            >
              Please login or register to continue
            </Text>
            <View style={styles.buttonsContainer}>
              <CommonButton
                buttonStyle={styles.loginButton}
                onButtonPress={onLoginPress}
                buttonTitle="Login"
                textStyle={commonStyles.textWhite(18)}
              />
              <CommonButton
                buttonStyle={styles.registrationButton(
                  currentThemePrimaryColor
                )}
                onButtonPress={onRegisterPress}
                buttonTitle="Registration"
                textStyle={commonStyles.textWhite(18, {
                  color: isDarkModeActive ? colors.white : colors.appPrimary,
                })}
              />
            </View>
            <View style={styles.borderViewContainer}>
              <View style={styles.borderLine} />
              <Text
                style={commonStyles.textWhite(18, {
                  color: colors.grey,
                  marginHorizontal: moderateScale(6),
                })}
              >
                or
              </Text>
              <View style={styles.borderLine} />
            </View>
            <Text
              style={commonStyles.textWhite(18, {
                color: currentThemeSecondaryColor,
                alignSelf: "center",
                marginTop: moderateScale(10),
              })}
            >
              Sign up with
            </Text>
            <View style={styles.socialLoginContainer}>
              {images.map((item, index) => {
                return (
                  <PressableImage
                    key={index}
                    imageSource={item.imageSource}
                    onImagePress={() => onSocialLoginPress(item.id)}
                    imageStyle={styles.socialLoginImage(item.id)}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    height: windowHeight,
    width: windowWidth,
    padding: moderateScale(4),
    paddingBottom: moderateScale(12),
  },
  advertisementImage: {
    flex: 1,
  },
  fullInnerContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  commentSectionContainer: {
    minHeight: moderateScale(100),
    width: moderateScale(40),
    position: "absolute",
    right: moderateScale(0),
    bottom: windowHeight * 0.2,
    alignItems: "center",
  },
  restaurantImageContainer: {
    height: moderateScale(30),
    width: moderateScale(30),
    borderRadius: moderateScale(15),
    borderWidth: moderateScale(1),
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantImage: {
    height: moderateScale(28),
    width: moderateScale(28),
    borderRadius: moderateScale(14),
    overflow: "hidden",
  },
  likePostImage: {
    height: moderateScale(15),
    width: moderateScale(15),
    marginTop: moderateScale(10),
  },
  commentImage: {
    height: moderateScale(14),
    width: moderateScale(14),
    marginTop: moderateScale(10),
  },
  forceLoginModalFullContainer: (isDarkModeActive) => {
    return {
      flex: 1,
      backgroundColor: isDarkModeActive ? "rgba(1,1,1,0.2)" : "rgba(0,0,0,0.5)",
      justifyContent: "center",
    };
  },
  forceLoginModalInnerContainer: (currentThemePrimaryColor) => {
    return {
      backgroundColor: currentThemePrimaryColor,
      borderRadius: moderateScale(12),
      padding: moderateScale(10),
      paddingBottom: moderateScale(20),
    };
  },
  buttonsContainer: {
    flexDirection: "row",
    width: windowWidth * 0.9,
    alignSelf: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(20),
  },
  loginButton: {
    backgroundColor: colors.appPrimary,
    width: windowWidth * 0.4,
    // paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(6),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(14),
  },
  registrationButton: (currentThemePrimaryColor) => {
    return {
      backgroundColor: currentThemePrimaryColor,
      width: windowWidth * 0.4,
      // paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(6),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: moderateScale(14),
      borderWidth: 1,
      borderColor: colors.appPrimary,
    };
  },
  socialLoginImage: (id) => {
    return {
      height: moderateScale(30),
      width: moderateScale(30),
      marginLeft: id != 0 ? moderateScale(10) : 0,
    };
  },
  modalTopContainer: {
    marginTop: moderateScale(8),
    flexDirection: "row",
    // alignSelf: 'center',
    justifyContent: "flex-start",
  },
  singleDetailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: moderateScale(12),
  },
  singleImageStyle: {
    height: moderateScale(10),
    width: moderateScale(10),
    resizeMode: "stretch",
  },
  borderStyle: {
    height: moderateScale(0.7),
    width: windowWidth,
    backgroundColor: colors.lightGrey,
    marginTop: moderateScale(6),
  },
  likeViewContainer: {
    flexDirection: "row",
    width: windowWidth,
    alignSelf: "center",
    borderBottomWidth: moderateScale(0.7),
    borderBottomColor: colors.lightGrey,
    padding: moderateScale(7),
    alignItems: "center",
  },
  likedViewInnerContainer: {},
  singleTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  borderViewContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: moderateScale(10),
  },
  borderLine: {
    height: 2,
    backgroundColor: colors.grey,
    width: windowWidth * 0.3,
  },
  socialLoginContainer: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    marginTop: moderateScale(10),
  },
  shareIcon: {
    fontSize: 35,
    color: colors.white,
    marginTop: moderateScale(10),
  },
  singleRatingImage: { height: 25, width: 25, marginRight: 5 },
  closeLoginModalIcon: (currentThemeSecondaryColor) => {
    return {
      fontSize: moderateScale(14),
      color: currentThemeSecondaryColor,
      alignSelf: "flex-end",
    };
  },
});
