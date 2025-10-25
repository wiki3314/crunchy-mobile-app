import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View,
} from "react-native";
import { commonStyles } from "../Constants/commonStyles";
import {
  moderateScale,
  POSTS_IMAGE_BASE_URL,
  ratingsData,
  USER_PROFILE_BASE_URL,
  windowHeight,
  windowWidth,
} from "../Constants/globalConstants";
import { imagePath } from "../Constants/imagePath";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { colors } from "../Constants/colors";
import { navigationStrings } from "../Navigation/NavigationStrings";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoadNewPosts,
  setLoadUserData,
  setUserData,
  updateFavoriteRestaurants,
} from "../Redux/actions/actions";
import LoadingComponent from "../Components/LoadingComponent";
import { apiHandler } from "../Constants/apiHandler";
import LinearGradient from "react-native-linear-gradient";
import AppIntroSlider from "react-native-app-intro-slider";
import AntDesign from "react-native-vector-icons/AntDesign";
import Video from "react-native-video";
import { TextInput } from "react-native-gesture-handler";
import CustomToast from "../Components/CustomToast";
import ErrorComponent from "../Components/ErrorComponent";
import AnimatedFilterBar from "../Components/AnimatedFilterBar";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Fontisto from "react-native-vector-icons/Fontisto";
import { helperFunctions } from "../Constants/helperFunctions";
import ConfirmationModal from "../Components/ConfirmationModal";
import DeletePostModal from "../Components/DeletePostModal";

export default function ProfileScreen(props) {
  const navigation = useNavigation();

  const dispatch = useDispatch();

  const token = useSelector((state) => state.accessToken);
  const isDarkModeActive = useSelector((state) => state.isDarkModeActive);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );
  const favoriteRestaurants = useSelector((state) => state.favoriteRestaurants);
  const isVibrationEnabled = useSelector((state) => state.isVibrationEnabled);
  const userDetails = useSelector((state) => state.userData);
  const loadUserData = useSelector((state) => state.loadUserData);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loaderTitle, setLoaderTitle] = useState("");
  const [selectedPost, setSelectedPost] = useState([]);
  const [showPostMedia, setShowPostMedia] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [userBio, setUserBio] = useState("");
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [customToastMessage, setCustomToastMessage] = useState("");
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [favRestaurants, setFavRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState({});
  const [showRestaurantOptions, setShowRestaurantOptions] = useState(false);
  const [postToDelete, setPostToDelete] = useState({});
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);

  const isFocused = useIsFocused();

  const bioTextInputRef = useRef();

  useEffect(() => {
    if (loadUserData) {
      getUserDetails();
    }
  }, [isFocused]);

  useEffect(() => {
    setFavRestaurants(favoriteRestaurants);
  }, [favoriteRestaurants]);

  const onSingleRestaurantPress = (item) => {
    navigation.navigate(navigationStrings.RestaurantDetails, {
      restaurant_id: item.restaurant_id,
      fromFavourites: true,
    });
  };

  function onLongPressRestaurant(item) {
    showHideRestaurantOptions();
    setSelectedRestaurant(item);
  }

  function renderRestaurent(item, index) {
    return (
      <TouchableOpacity
        onPress={() => {
          onSingleRestaurantPress(item);
        }}
        onLongPress={() => {
          onLongPressRestaurant(item);
        }}
        key={index}
      >
        <ImageBackground
          style={{
            height: moderateScale(70),
            width: windowWidth * 0.5 - moderateScale(12),
            borderRadius: 12,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            marginTop: moderateScale(4),
          }}
          source={{ uri: item.restaurantImage }}
        >
          <Text
            numberOfLines={2}
            style={commonStyles.textWhite(13, {
              fontWeight: "700",
              alignSelf: "center",
              textShadowColor: colors.black,
              textShadowOffset: { width: 5, height: 5 },
              textShadowRadius: 10,
            })}
          >
            {item.restaurantName}
          </Text>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  const renderSingleCard = () => {
    return (
      <View
        style={{
          minHeight: moderateScale(100),
          width: windowWidth - moderateScale(20),
          flexDirection: "row",
          alignSelf: "center",
        }}
      >
        <View
          style={{
            width: windowWidth * 0.5 - moderateScale(12),
            alignItems: "center",
          }}
        >
          {favRestaurants.map((item, index) => {
            return index % 2 == 0 && renderRestaurent(item, index);
          })}
        </View>
        <View
          style={{
            width: windowWidth * 0.5 - moderateScale(12),
            alignItems: "center",
            marginLeft: moderateScale(4),
          }}
        >
          {favRestaurants.map((item, index) => {
            return index % 2 != 0 && renderRestaurent(item, index);
          })}
        </View>
      </View>
    );
  };

  const onSlideChange = () => {
    if (isVibrationEnabled) {
      Vibration.vibrate(VIBRATION_PATTERN);
    }
  };

  const RenderFavorites = (props) => {
    return favRestaurants && favRestaurants.length > 0 ? (
      <View style={commonStyles.flexFull}>{renderSingleCard()}</View>
    ) : (
      <View
        style={{
          height: windowHeight * 0.3,
          width: windowWidth,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={commonStyles.textWhite(18, {
            color: currentThemeSecondaryColor,
          })}
        >
          No favorite restaurants yet.
        </Text>
      </View>
    );
  };

  const RenderPosts = () => {
    return (
      userDetails.posts &&
      (userDetails.posts.length == 0 ? (
        <View
          style={{
            height: windowHeight * 0.3,
            width: windowWidth,
            padding: moderateScale(8),
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={commonStyles.textWhite(18, {
              color: currentThemeSecondaryColor,
            })}
          >
            No posts added yet
          </Text>
        </View>
      ) : (
        <View
          style={{
            width: windowWidth,
            paddingHorizontal: moderateScale(5),
            flexDirection: "row",
            justifyContent: "space-between",
            alignSelf: "center",
          }}
        >
          <View
            style={{
              width: windowWidth * 0.5 - moderateScale(8),
              alignItems: "center",
            }}
          >
            {userDetails.posts.map((item, index) => {
              console.log("Item is", item);
              if (index % 2 == 0) {
                return (
                  item.file &&
                  item.file.length > 0 &&
                  item.file[0].type &&
                  (item.file[0].type == "image" ? (
                    <TouchableOpacity
                      onPress={() => {
                        onSinglePostPress(item);
                      }}
                      onLongPress={() => {
                        showHideDeletePostModal(item);
                      }}
                      style={{ marginBottom: 10 }}
                    >
                      <ImageBackground
                        source={{
                          uri: POSTS_IMAGE_BASE_URL + item.file[0].filenames,
                        }}
                        style={{
                          height: moderateScale(70),
                          width: windowWidth * 0.5 - moderateScale(10),
                          borderRadius: moderateScale(8),
                          overflow: "hidden",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        resizeMode="cover"
                      >
                        <Text
                          numberOfLines={2}
                          style={commonStyles.textWhite(16, {
                            color: colors.white,
                            fontWeight: "bold",
                            textShadowColor: colors.black,
                            textShadowOffset: { width: 2, height: 2 },
                            textShadowRadius: 2,
                            textAlign: "center",
                          })}
                        >
                          {item.restaurant}
                        </Text>
                        <View style={{ flexDirection: "row" }}>
                          {helperFunctions.getStarRatings(item.rating, 12)}
                        </View>
                      </ImageBackground>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        onSinglePostPress(item);
                      }}
                      onLongPress={() => {
                        showHideDeletePostModal(item);
                      }}
                      style={{
                        height: moderateScale(70),
                        borderRadius: moderateScale(7),
                        alignItems: "center",
                        marginBottom: 10,
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        numberOfLines={2}
                        style={commonStyles.textWhite(16, {
                          color: colors.white,
                          fontWeight: "bold",
                          textShadowColor: colors.black,
                          textShadowOffset: { width: 2, height: 2 },
                          textShadowRadius: 2,
                          zIndex: 77,
                          textAlign: "center",
                        })}
                      >
                        {item.restaurant}
                      </Text>
                      <View style={{ flexDirection: "row", zIndex: 77 }}>
                        {helperFunctions.getStarRatings(item.rating, 12)}
                      </View>
                      {/* <Text numberOfLines={2} style={commonStyles.textWhite(12, {
                                                fontWeight: '600', color: colors.grey, textShadowColor: colors.black,
                                                textShadowOffset: { width: 0.5, height: 0.5 },
                                                textShadowRadius: 0.5, zIndex: 77
                                            })}>
                                                {item.review}
                                            </Text> */}
                      <Video
                        source={{
                          uri: POSTS_IMAGE_BASE_URL + item.file[0].filenames,
                        }}
                        paused={true}
                        resizeMode="cover"
                        style={{
                          height: moderateScale(70),
                          width: windowWidth * 0.5 - moderateScale(10),
                          borderRadius: moderateScale(8),
                          overflow: "hidden",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "absolute",
                        }}
                      />
                    </TouchableOpacity>
                  ))
                );
              }
            })}
          </View>
          <View
            style={{
              width: windowWidth * 0.5 - moderateScale(8),
              marginLeft: moderateScale(4),
            }}
          >
            {userDetails.posts.map((item, index) => {
              if (index % 2 != 0) {
                return (
                  item.file &&
                  item.file.length > 0 &&
                  item.file[0].type &&
                  (item.file[0].type == "image" ? (
                    <TouchableOpacity
                      onPress={() => {
                        onSinglePostPress(item);
                      }}
                      onLongPress={() => {
                        showHideDeletePostModal(item);
                      }}
                      style={{ height: moderateScale(70), marginBottom: 10 }}
                    >
                      <ImageBackground
                        source={
                          item &&
                          item.file &&
                          item.file.length > 0 &&
                          item.file[0].type &&
                          item.file[0].type == "image"
                            ? {
                                uri:
                                  POSTS_IMAGE_BASE_URL + item.file[0].filenames,
                              }
                            : imagePath.americanFoodImage
                        }
                        style={{
                          height: moderateScale(70),
                          width: windowWidth / 2 - moderateScale(8),
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: moderateScale(8),
                          borderRadius: moderateScale(12),
                          overflow: "hidden",
                        }}
                        resizeMode="cover"
                      >
                        <Text
                          numberOfLines={2}
                          style={commonStyles.textWhite(16, {
                            fontWeight: "700",
                            color: colors.white,
                            textAlign: "center",
                          })}
                        >
                          {item.restaurant}
                        </Text>
                        <View style={{ flexDirection: "row", zIndex: 77 }}>
                          {helperFunctions.getStarRatings(item.rating, 12)}
                        </View>
                        {/* <Text numberOfLines={2} style={commonStyles.textWhite(12, { fontWeight: '600', color: colors.grey })}>
                                                    {item.review}
                                                </Text> */}
                      </ImageBackground>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        onSinglePostPress(item);
                      }}
                      onLongPress={() => {
                        showHideDeletePostModal(item);
                      }}
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Video
                        source={{
                          uri: POSTS_IMAGE_BASE_URL + item.file[0].filenames,
                        }}
                        paused={true}
                        resizeMode="cover"
                        style={{
                          height: moderateScale(70),
                          width: windowWidth * 0.5 - moderateScale(10),
                          borderRadius: 12,
                          overflow: "hidden",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        // style={{ height: moderateScale(80), width: (windowWidth / 2) - moderateScale(12), zIndex: 99 }}
                      />
                      <View
                        style={{
                          position: "absolute",
                          zIndex: 100,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          numberOfLines={2}
                          style={commonStyles.textWhite(16, {
                            fontWeight: "700",
                            color: colors.white,
                          })}
                        >
                          {item.restaurant}
                        </Text>
                        <View style={{ flexDirection: "row", zIndex: 77 }}>
                          {helperFunctions.getStarRatings(item.rating, 12)}
                        </View>
                        {/* <Text numberOfLines={2} style={commonStyles.textWhite(12, { fontWeight: '600', color: colors.grey })}>
                                                    {item.review}
                                                </Text> */}
                      </View>
                    </TouchableOpacity>
                  ))
                );
              }
            })}
          </View>
        </View>
      ))
    );
  };

  const renderSingleFollower = ({ item, index }) => {
    return (
      item &&
      item.follows && (
        <View
          style={{
            padding: moderateScale(8),
            flexDirection: "row",
            width: windowWidth - moderateScale(20),
            alignSelf: "center",
          }}
        >
          <Image
            style={{
              height: moderateScale(24),
              width: moderateScale(24),
              borderRadius: moderateScale(12),
            }}
            source={
              item.follows.image
                ? { uri: USER_PROFILE_BASE_URL + item.follows.image }
                : imagePath.dummyProfile
            }
          />
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginLeft: moderateScale(6),
            }}
          >
            <Text
              style={commonStyles.textWhite(18, {
                color: currentThemeSecondaryColor,
              })}
            >
              {item.follows.full_name}
            </Text>
          </View>
        </View>
      )
    );
  };

  const renderSingleFollowing = ({ item, index }) => {
    return (
      item &&
      item.following && (
        <View
          style={{
            padding: moderateScale(8),
            flexDirection: "row",
            width: windowWidth - moderateScale(20),
            alignSelf: "center",
          }}
        >
          <Image
            style={{
              height: moderateScale(24),
              width: moderateScale(24),
              borderRadius: moderateScale(12),
            }}
            source={
              item.following.image
                ? { uri: USER_PROFILE_BASE_URL + item.following.image }
                : imagePath.dummyProfile
            }
          />
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginLeft: moderateScale(6),
            }}
          >
            <Text
              style={commonStyles.textWhite(18, {
                color: currentThemeSecondaryColor,
              })}
            >
              {item.following.full_name}
            </Text>
          </View>
        </View>
      )
    );
  };

  const getUserDetails = async () => {
    setIsLoading(true);
    setLoaderTitle("Fetching your profile data");
    let userData = await apiHandler.getUserData(token);
    let userPosts = [];
    setUserBio(userData.bio);
    dispatch(setUserData(userData));
    dispatch(setLoadUserData(false));
    setIsLoading(false);
  };

  function onBackIconPress() {
    navigation.goBack();
  }

  function onEditProfilePress() {
    navigation.navigate(navigationStrings.EditProfile);
  }

  const onSingleOptionPress = (title) => {
    switch (title) {
      case "Followers":
        setShowFollowers(true);
        break;
      case "Following":
        setShowFollowing(true);
        break;
      default:
        break;
    }
  };

  const renderNextButton = () => {
    return (
      <View
        style={{
          padding: moderateScale(6),
          borderRadius: moderateScale(6),
          backgroundColor: colors.appPrimary,
        }}
      >
        <AntDesign name="right" style={{ fontSize: 20, color: colors.white }} />
      </View>
    );
  };

  const renderPrevButton = () => {
    return (
      <View
        style={{
          padding: moderateScale(6),
          borderRadius: moderateScale(6),
          backgroundColor: colors.appPrimary,
        }}
      >
        <AntDesign name="left" style={{ fontSize: 20, color: colors.white }} />
      </View>
    );
  };

  const renderDoneButton = () => {
    return (
      <TouchableOpacity
        onPress={showHidePostMedia}
        style={{
          padding: moderateScale(6),
          borderRadius: moderateScale(6),
          backgroundColor: colors.appPrimary,
        }}
      >
        <Text style={commonStyles.textWhite(15, { fontWeight: "600" })}>
          Done
        </Text>
      </TouchableOpacity>
    );
  };

  const onRestaurantNamePress = () => {
    setShowPostMedia(false);
    navigation.navigate(navigationStrings.RestaurantDetails, {
      restaurant_id: selectedPost.restaurant_id,
    });
  };

  function showHidePostMedia() {
    setShowPostMedia(!showHidePostMedia);
  }

  const renderSingleMedia = ({ item, index }) => {
    return (
      <View style={commonStyles.flexFull}>
        <Ionicons
          name="close"
          style={{
            fontSize: moderateScale(20),
            color: colors.black,
            position: "absolute",
            top: moderateScale(4),
            right: moderateScale(6),
            zIndex: 99,
          }}
          onPress={showHidePostMedia}
        />
        <View
          style={{
            position: "absolute",
            bottom: moderateScale(80),
            zIndex: 99,
            marginLeft: moderateScale(6),
          }}
        >
          <Text
            style={commonStyles.textWhite(24, {
              fontWeight: "bold",
              textShadowColor: colors.black,
              textShadowOffset: { width: 3, height: 3 },
              textShadowRadius: 2,
            })}
          >
            {selectedPost.name}
          </Text>
          <Text
            style={commonStyles.textWhite(20, {
              textShadowColor: colors.black,
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 2,
              marginTop: moderateScale(4),
            })}
            onPress={onRestaurantNamePress}
          >
            {selectedPost.restaurant}
          </Text>
          <View style={{ flexDirection: "row", marginTop: moderateScale(5) }}>
            {helperFunctions.getStarRatings(selectedPost.rating)}
          </View>
          <Text
            style={commonStyles.textWhite(18, {
              color: colors.grey,
              textShadowColor: colors.black,
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 2,
              marginTop: moderateScale(5),
            })}
          >
            {selectedPost.review}
          </Text>
        </View>
        {item.type == "image" ? (
          <Image
            style={{
              flex: 1,
              overflow: "hidden",
              padding: moderateScale(6),
              borderRadius: moderateScale(8),
            }}
            resizeMode="cover"
            source={{ uri: POSTS_IMAGE_BASE_URL + item.filenames }}
          >
            {/* <View style={commonStyles.flexFull}>
                </View> */}
          </Image>
        ) : (
          <Video
            source={{ uri: POSTS_IMAGE_BASE_URL + item.filenames }}
            style={{
              flex: 1,
              borderRadius: moderateScale(8),
              overflow: "hidden",
            }}
            resizeMode="cover"
            repeat={true}
          />
        )}
      </View>
    );
  };

  const onSinglePostPress = (item) => {
    setShowPostMedia(true);
    setSelectedPost(item);
  };

  const onEditBioIconPress = () => {
    setEditBio(!editBio);
    setTimeout(() => {
      bioTextInputRef?.current?.focus();
    }, 200);
  };

  const onUserBioChange = (text) => {
    if (text.trim().length > 125) {
      setErrorMessage("Maximum allowed length reached");
      setShowErrorMessage(true);
    } else {
      setUserBio(text);
    }
  };

  const onSaveBioPress = async () => {
    setIsLoading(true);
    setLoaderTitle("Updating bio");
    let reqObj = {
      full_name: userDetails.full_name,
      email: userDetails.email,
      password: userDetails.password,
      password_confirmation: userDetails.password,
      bio: userBio,
    };
    let response = await apiHandler.updateUserProfile(reqObj, token);
    response = response.user;
    dispatch(setUserData(response));
    setIsLoading(false);
    setEditBio(false);
    setCustomToastMessage("Bio updated successfully");
    setShowCustomToast(true);
  };

  const renderPostsIcon = (color) => {
    return (
      <Fontisto
        name="photograph"
        style={{
          fontSize: moderateScale(9),
          color: color,
          marginRight: moderateScale(3),
        }}
      />
    );
  };

  const renderRestaurantsIcon = (color) => {
    return (
      <FontAwesome
        name="heart"
        style={{
          fontSize: moderateScale(9),
          color: color,
          marginRight: moderateScale(3),
        }}
      />
    );
  };

  function showHideRestaurantOptions() {
    setShowRestaurantOptions(!showRestaurantOptions);
  }

  async function onUnlikeRestaurantConfirm() {
    setShowRestaurantOptions(false);
    let objRestaurant = {
      restaurant_id: selectedRestaurant.restaurant_id,
      restaurantName: selectedRestaurant.restaurantName,
      restaurantImage: selectedRestaurant.restaurantImage,
    };
    dispatch(updateFavoriteRestaurants(objRestaurant));
    let objPost = {
      restaurant_id: selectedRestaurant.restaurant_id,
      restaurant_name: selectedRestaurant.restaurantName,
      image: selectedRestaurant.restaurantImage,
    };
    await apiHandler.likeRestaurant(objPost, token);
  }

  const showHideDeletePostModal = (item) => {
    setPostToDelete(item);
    setShowDeletePostModal(true);
  };

  const deletePost = async () => {
    setShowDeletePostModal(false);
    const res = await apiHandler.deletePost(postToDelete.id, token);
    let objUserData = {
      ...userDetails,
    };
    let arrUserPosts = objUserData.posts;
    arrUserPosts = arrUserPosts.filter((objPost) => {
      return objPost.id != postToDelete.id;
    });
    objUserData.posts = arrUserPosts;
    setCustomToastMessage("Post deleted successfully");
    setShowCustomToast(true);
    dispatch(setUserData(objUserData));
    dispatch(setLoadNewPosts(true));
  };

  return (
    <SafeAreaView
      style={[
        commonStyles.flexFull,
        { backgroundColor: currentThemePrimaryColor },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={commonStyles.flexFull}
      >
        <View style={commonStyles.flexFull}>
          <CustomToast
            isVisible={showCustomToast}
            onToastShow={() => {
              setTimeout(() => {
                setShowCustomToast(false);
              }, 900);
            }}
            toastMessage={customToastMessage}
          />
          <ErrorComponent
            isVisible={showErrorMessage}
            onToastShow={() => {
              setTimeout(() => {
                setShowErrorMessage(false);
              }, 1100);
            }}
            toastMessage={errorMessage}
          />
          {isLoading && <LoadingComponent title={loaderTitle} />}
          <ImageBackground
            resizeMode="stretch"
            source={
              isDarkModeActive
                ? imagePath.darkRestaurantBG
                : imagePath.restaurantBG
            }
            style={{
              borderBottomLeftRadius: moderateScale(20),
              borderBottomRightRadius: moderateScale(20),
              overflow: "hidden",
              minHeight: moderateScale(70),
              width: windowWidth,
            }}
          >
            <View style={styles.headerFullContainer}>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={commonStyles.textWhite(20, {
                    color: currentThemeSecondaryColor,
                    marginLeft: moderateScale(22),
                    fontWeight: "bold",
                    alignSelf: "center",
                  })}
                >
                  My Profile
                </Text>
              </View>
              <Ionicons
                onPress={onEditProfilePress}
                name="settings"
                style={{
                  fontSize: moderateScale(12),
                  color: currentThemeSecondaryColor,
                  marginRight: moderateScale(10),
                }}
              />
            </View>
            <View
              style={{
                height: moderateScale(64),
                width: moderateScale(64),
                borderRadius: moderateScale(32),
                alignSelf: "center",
                backgroundColor: currentThemeSecondaryColor,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                style={{
                  height: moderateScale(62),
                  width: moderateScale(62),
                  borderRadius: moderateScale(31),
                  overflow: "hidden",
                }}
                source={
                  userDetails?.image
                    ? {
                        uri: userDetails.image.startsWith("http")
                          ? userDetails.image
                          : USER_PROFILE_BASE_URL + userDetails.image,
                      }
                    : imagePath.dummyProfile
                }
              />
            </View>
            <Text
              style={commonStyles.textWhite(32, {
                alignSelf: "center",
                marginTop: moderateScale(4),
                color: currentThemeSecondaryColor,
              })}
            >
              {userDetails?.full_name}
            </Text>
            <View style={styles.buttonsFullContainer}>
              <TouchableOpacity
                onPress={() => {
                  onSingleOptionPress("Followers");
                }}
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "row",
                  borderWidth: moderateScale(0.7),
                  borderColor: currentThemeSecondaryColor,
                  borderRadius: moderateScale(12),
                  paddingVertical: moderateScale(4),
                  paddingHorizontal: moderateScale(8),
                }}
              >
                <Text
                  style={commonStyles.textWhite(18, {
                    fontWeight: "600",
                    color: currentThemeSecondaryColor,
                  })}
                >
                  Followers :
                </Text>
                <Text
                  style={commonStyles.textWhite(18, {
                    fontWeight: "600",
                    marginLeft: moderateScale(2),
                    color: currentThemeSecondaryColor,
                  })}
                >
                  {userDetails &&
                  userDetails.followers &&
                  userDetails.followers.length > 0
                    ? userDetails.followers.length
                    : 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onSingleOptionPress("Following");
                }}
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "row",
                  borderWidth: moderateScale(0.7),
                  borderColor: currentThemeSecondaryColor,
                  borderRadius: moderateScale(12),
                  paddingVertical: moderateScale(4),
                  paddingHorizontal: moderateScale(8),
                }}
              >
                <Text
                  style={commonStyles.textWhite(18, {
                    fontWeight: "600",
                    color: currentThemeSecondaryColor,
                  })}
                >
                  Following :
                </Text>
                <Text
                  style={commonStyles.textWhite(18, {
                    fontWeight: "600",
                    marginLeft: moderateScale(2),
                    color: currentThemeSecondaryColor,
                  })}
                >
                  {userDetails &&
                  userDetails.following &&
                  userDetails.following.length > 0
                    ? userDetails.following.length
                    : 0}
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
          <View
            style={{
              flexDirection: "row",
              marginLeft: moderateScale(12),
              marginTop: moderateScale(12),
              alignItems: "center",
            }}
          >
            <Text
              style={commonStyles.textWhite(22, {
                marginTop: moderateScale(2),
                color: currentThemeSecondaryColor,
              })}
            >
              Bio
            </Text>
            {!editBio ? (
              <Ionicons
                name={"pencil"}
                style={{
                  fontSize: moderateScale(10),
                  color: currentThemeSecondaryColor,
                  marginLeft: moderateScale(6),
                }}
                onPress={onEditBioIconPress}
              />
            ) : (
              <TouchableOpacity
                onPress={onSaveBioPress}
                style={{
                  height: moderateScale(12),
                  width: moderateScale(22),
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: moderateScale(4),
                  marginLeft: moderateScale(4),
                  borderWidth: moderateScale(0.7),
                  borderColor: colors.appPrimary,
                }}
              >
                <Text
                  style={commonStyles.textWhite(12, {
                    color: colors.appPrimary,
                  })}
                >
                  Save
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {!editBio ? (
            <Text
              style={commonStyles.textWhite(16, {
                fontWeight: "600",
                margin: moderateScale(8),
                alignSelf: "center",
                textAlign: "center",
                width: windowWidth * 0.8 - moderateScale(19),
                color: currentThemeSecondaryColor,
                marginBottom: moderateScale(4),
              })}
            >
              {userBio}
            </Text>
          ) : (
            <TextInput
              ref={bioTextInputRef}
              style={[
                commonStyles.textWhite(16, {
                  fontWeight: "600",
                  margin: moderateScale(8),
                  marginLeft: moderateScale(12),
                  width: windowWidth * 0.8 - moderateScale(19),
                  color: currentThemeSecondaryColor,
                }),
                {
                  borderWidth: moderateScale(0.7),
                  minHeight: moderateScale(25),
                  borderRadius: moderateScale(6),
                  borderColor: currentThemeSecondaryColor,
                  padding: moderateScale(4),
                },
              ]}
              value={userBio}
              onChangeText={onUserBioChange}
              multiline={true}
            />
          )}
          {/* <Text style={commonStyles.textWhite(24, { color: currentThemeSecondaryColor, marginLeft: moderateScale(8) })}>
                        Posts
                    </Text> */}
          <View style={{ flex: 1, marginBottom: moderateScale(60) }}>
            <AnimatedFilterBar
              filterTabs={["Saved Restaurants", "Posts"]}
              innerComponents={[RenderFavorites, RenderPosts]}
              icons={[renderRestaurantsIcon, renderPostsIcon]}
            />
          </View>
        </View>
        <Modal
          transparent={true}
          visible={showFollowers || showFollowing}
          onRequestClose={() => {
            setShowFollowers(false);
            setShowFollowing(false);
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: `#00000077`,
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                flex: 0.8,
                backgroundColor: currentThemePrimaryColor,
                padding: moderateScale(10),
                borderTopLeftRadius: moderateScale(16),
                borderTopRightRadius: moderateScale(16),
              }}
            >
              <Ionicons
                name="close"
                style={{
                  fontSize: moderateScale(14),
                  color: currentThemeSecondaryColor,
                  alignSelf: "flex-end",
                }}
                onPress={() => {
                  setShowFollowers(false);
                  setShowFollowing(false);
                }}
              />
              <Text
                style={commonStyles.textWhite(22, {
                  color: currentThemeSecondaryColor,
                  fontWeight: "700",
                  alignSelf: "center",
                })}
              >
                {showFollowers
                  ? `${userDetails.full_name} followers`
                  : `${userDetails.full_name} follows`}
              </Text>
              <View style={commonStyles.flexFull}>
                {showFollowers ? (
                  <FlatList
                    data={userDetails && userDetails.followers}
                    renderItem={renderSingleFollower}
                    ListEmptyComponent={() => {
                      return (
                        <View
                          style={{
                            height: windowHeight * 0.4,
                            width: windowWidth,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={commonStyles.textWhite(18, {
                              color: currentThemeSecondaryColor,
                            })}
                          >
                            No followers yet
                          </Text>
                        </View>
                      );
                    }}
                  />
                ) : (
                  <FlatList
                    data={userDetails && userDetails.following}
                    renderItem={renderSingleFollowing}
                    ListEmptyComponent={() => {
                      return (
                        <View
                          style={{
                            height: windowHeight * 0.4,
                            width: windowWidth,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={commonStyles.textWhite(18, {
                              color: currentThemeSecondaryColor,
                            })}
                          >
                            Following no one yet..!!!
                          </Text>
                        </View>
                      );
                    }}
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={showPostMedia} transparent={true}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#000000aa",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={showHidePostMedia}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: colors.white,
                  height: windowHeight * 0.9,
                  width: windowWidth - moderateScale(10),
                  borderRadius: moderateScale(8),
                }}
              >
                <AppIntroSlider
                  data={selectedPost.file}
                  renderItem={renderSingleMedia}
                  renderNextButton={renderNextButton}
                  renderPrevButton={renderPrevButton}
                  renderDoneButton={renderDoneButton}
                  activeDotStyle={{ backgroundColor: colors.appPrimary }}
                />
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
        {showRestaurantOptions && (
          <ConfirmationModal
            onConfirmButtonPress={onUnlikeRestaurantConfirm}
            onCancelPress={showHideRestaurantOptions}
            modalTitle={`Unlike ${selectedRestaurant.restaurantName}?`}
            modalDescription={`Are you sure you want to unlike ${selectedRestaurant.restaurantName}?`}
          />
        )}
        {showDeletePostModal && (
          <DeletePostModal
            onCancelPress={() => {
              setShowDeletePostModal(false);
            }}
            onDeletePress={deletePost}
          />
        )}
      </ScrollView>
      {isDarkModeActive && (
        <LinearGradient
          style={{
            alignItems: "center",
            top: 0,
            zIndex: -1,
            backgroundColor: colors.black,
            height: windowHeight,
            width: windowWidth,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            bottom: 0,
            position: "absolute",
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8]}
          colors={[
            "#ffffff00",
            "#ffffff04",
            "#ffffff09",
            "#ffffff0c",
            "#ffffff10",
            "#ffffff15",
            "#ffffff19",
          ]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerFullContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(6),
    height: moderateScale(25),
    width: windowWidth,
    justifyContent: "space-between",
  },
  iconStyle: (currentThemePrimaryColor) => {
    return {
      fontSize: 35,
      marginLeft: moderateScale(8),
      color: currentThemePrimaryColor,
    };
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
  },
  buttonsFullContainer: {
    width: windowWidth,
    justifyContent: "space-evenly",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "transparent",
    marginTop: moderateScale(8),
  },
});
