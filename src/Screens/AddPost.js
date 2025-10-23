import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View,
} from "react-native";
import AuthHeader from "../Components/AuthHeader";
import AuthTextInput from "../Components/AuthTextInput";
import { colors } from "../Constants/colors";
import { commonStyles } from "../Constants/commonStyles";
import {
  appRatingData,
  errorVibrationPattern,
  moderateScale,
  ratingsData,
  windowHeight,
  windowWidth,
} from "../Constants/globalConstants";
import { imagePath } from "../Constants/imagePath";
import CommonButton from "../Components/CommonButton";
import PressableImage from "../Components/PressableImage";
import * as ImagePicker from "react-native-image-picker";
import { useDispatch, useSelector } from "react-redux";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useNavigation, useRoute } from "@react-navigation/native";
import { apiHandler, BASE_URL } from "../Constants/apiHandler";
import LoadingComponent from "../Components/LoadingComponent";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import CustomToast from "../Components/CustomToast";
import ErrorComponent from "../Components/ErrorComponent";
import { setLoadNewPosts, setLoadUserData } from "../Redux/actions/actions";
import LinearGradient from "react-native-linear-gradient";
import {
  PanGestureHandler,
  TapGestureHandler,
} from "react-native-gesture-handler";
import axios from "axios";
import CircularProgress from "../Components/CircularProgress";
import { navigationStrings } from "../Navigation/NavigationStrings";
import Video from "react-native-video";
import {
  Image as ImageCompressor,
  Video as VideoCompressor,
} from "react-native-compressor";

navigator.geolocation = require("@react-native-community/geolocation");

export default function AddPost(props) {
  const route = useRoute();

  const userData = useSelector((state) => state.userData);
  const userLocation = useSelector((state) => state.userLocation);
  const accessToken = useSelector((state) => state.accessToken);
  const isDarkModeActive = useSelector((state) => state.isDarkModeActive);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );
  const isVibrationEnabled = useSelector((state) => state.isVibrationEnabled);
  const allFoodCategories = useSelector((state) => state.foodCategories);
  const isEditPost = route?.params?.isEditPost || false;
  const postToBeUpdated = route?.params?.postDetails || {};
  const [isLoading, setIsLoading] = useState(false);
  const [loaderTitle, setLoaderTitle] = useState("Please wait");
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(-1);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedImagesThumbnails, setUploadedImagesThumbnails] = useState([]);
  const [starRatings, setStarRatings] = useState(appRatingData);
  const [ratingCount, setRatingCount] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [selectedRestaurantID, setSelectedRestaurantID] = useState("");
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [customToastMessage, setCustomToastMessage] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadMediaTitle, setUploadMediaTitle] = useState("");
  const googleInputRef = useRef();
  const textInputRef = useRef();

  const [ratingViewWidth, setRatingViewWidth] = useState(0);
  const [progress, setProgress] = useState(0);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  let options = {
    storageOptions: {
      skipBackup: true,
      // path: 'images',
      mediaType: "mixed",
    },
  };

  useEffect(() => {
    if (isEditPost) {
      setTitle(postToBeUpdated.name);
      setReview(postToBeUpdated.review);
      setStarRatings(postToBeUpdated.rating);
      let objCategory = { id: postToBeUpdated.category_id };
      setSelectedCategory(objCategory);
    }
  }, []);

  const onReviewChange = (text) => {
    setReview(text);
  };

  const onCategorySelect = (item) => {
    setSelectedCategory(item);
  };

  const onShareReviewPress = async () => {
    if (ratingCount == 0) {
      setErrorMessage("Rating is missing");
      setShowErrorMessage(true);
      if (isVibrationEnabled) {
        Vibration.vibrate(errorVibrationPattern);
      }
    } else if (selectedCategory == -1) {
      setErrorMessage("No Category selected");
      setShowErrorMessage(true);
      if (isVibrationEnabled) {
        Vibration.vibrate(errorVibrationPattern);
      }
    } else if (review == "") {
      setErrorMessage("Post review is missing");
      setShowErrorMessage(true);
      if (isVibrationEnabled) {
        Vibration.vibrate(errorVibrationPattern);
      }
    } else if (selectedRestaurantID == "") {
      setErrorMessage("Restaurant details are missing");
      setShowErrorMessage(true);
      if (isVibrationEnabled) {
        Vibration.vibrate(errorVibrationPattern);
      }
    } else {
      setIsLoading(true);
      isEditPost
        ? setLoaderTitle("Updating post")
        : setLoaderTitle("Adding Post");

      // Format images for API - extract URLs only
      const imageUrls = uploadedImages.map((img) => img.url);

      let reqObj = {
        description: review, // Backend expects 'description', not 'review'
        rating: ratingCount,
        latitude: latitude,
        longitude: longitude,
        user_id: userData.id,
        category_id: selectedCategory,
        restaurant: selectedRestaurant,
        restaurant_id: selectedRestaurantID,
        images: imageUrls,
        location: selectedRestaurant, // Add location field
      };

      console.log("Post Request Object:", JSON.stringify(reqObj, null, 2));

      try {
        if (isEditPost) {
          const response = await apiHandler.updatePost(
            postToBeUpdated.id,
            reqObj,
            accessToken
          );
          console.log("Update Post Response:", response);
          setIsLoading(false);
          if (response && response.success) {
            setCustomToastMessage("Post edited successfully");
            setShowCustomToast(true);
          } else {
            setErrorMessage(response?.message || "Failed to update post");
            setShowErrorMessage(true);
          }
        } else {
          const response = await apiHandler.addPost(reqObj, accessToken);
          console.log("Add Post Response:", response);
          setIsLoading(false);
          if (response && response.success) {
            dispatch(setLoadNewPosts(true));
            dispatch(setLoadUserData(true));
            setCustomToastMessage("Post added successfully");
            setShowCustomToast(true);
          } else {
            setErrorMessage(response?.message || "Failed to create post");
            setShowErrorMessage(true);
          }
        }
      } catch (error) {
        console.error("Post Save Error:", error);
        setIsLoading(false);
        setErrorMessage("Failed to save post. Please try again.");
        setShowErrorMessage(true);
      }
      setTitle("");
      setStarRatings(appRatingData);
      setRatingCount(0);
      setReview("");
      setSelectedCategory({});
      setUploadedImages([]);
      setUploadedImagesThumbnails([]);
      setSelectedRestaurant("");
      setSelectedRestaurantID("");
      setLatitude(0);
      setLongitude(0);
      if (googleInputRef.current) {
        googleInputRef.current.clear();
      }
    }
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "App Camera Permission",
          message: "App needs access to your camera ",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        onAddImagePress();
      } else {
        setErrorMessage("Permission denied");
        setShowErrorMessage(true);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  async function removeImageThumbnail(selectedItem, selectedIndex) {
    setIsLoading(true);
    setLoaderTitle(`Deleting ${selectedItem.type}`);
    let reqObj = {
      image: selectedItem.url,
    };
    let response = await apiHandler.removeImage(reqObj, accessToken);
    let arrUploadedImages = [...uploadedImages];
    let arrUploadedImagesThumbnails = [...uploadedImagesThumbnails];
    arrUploadedImages = arrUploadedImages.filter((item, index) => {
      return index != selectedIndex;
    });
    arrUploadedImagesThumbnails = arrUploadedImagesThumbnails.filter(
      (item, index) => {
        return index != selectedIndex;
      }
    );
    setUploadedImages(arrUploadedImages);
    setUploadedImagesThumbnails(arrUploadedImagesThumbnails);
    setIsLoading(false);
  }

  const onAddImagePress = () => {
    setShowAddImageModal(true);
  };

  async function uploadMedia(reqObj) {
    let res = await axios.post(BASE_URL + "imageupload", reqObj, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          let percentage = Math.floor(
            (progressEvent.loaded / progressEvent.total) * 100
          );
          console.log(
            "Progress is",
            percentage,
            "Loaded:",
            progressEvent.loaded,
            "Total:",
            progressEvent.total
          );
          setProgress(percentage);
        }
      },
    });
    return res.data;
  }

  const onCameraPress = () => {
    ImagePicker.launchCamera(
      {
        mediaType: "photo",
      },
      async (response) => {
        setShowAddImageModal(false);
        if (response.didCancel) {
          setErrorMessage("You did not select any image");
          setShowErrorMessage(true);
        } else if (response.error) {
          setErrorMessage("ImagePicker Error: ");
          setShowErrorMessage(true);
        } else if (response.customButton) {
          setErrorMessage("User tapped custom button: ");
          setShowErrorMessage(true);
        } else {
          setProgress(0);
          setIsUploadingMedia(true);
          setUploadMediaTitle("Uploading Image");
          let arrUploadedImages = [...uploadedImages];
          let arrUploadedImagesThumbnails = [...uploadedImagesThumbnails];
          const url = response?.assets[0]?.uri;
          const compressedURL = await ImageCompressor.compress(url, {
            compressionMethod: "auto",
          });
          let objImage = {
            type: "image",
            image: {
              uri: compressedURL,
              name: response?.assets[0]?.fileName,
              type: response?.assets[0]?.type,
            },
          };
          arrUploadedImagesThumbnails.push(objImage);
          objImage = apiHandler.createFormData(objImage);
          let uploadImage = await uploadMedia(objImage);
          arrUploadedImages.push({
            type: "image",
            url: uploadImage.path,
          });
          setUploadedImages(arrUploadedImages);
          setUploadedImagesThumbnails(arrUploadedImagesThumbnails);
          setIsUploadingMedia(false);
          setProgress(0);
        }
      }
    );
  };

  const recordVideo = () => {
    console.log("Record video");
    setShowAddImageModal(false);
    ImagePicker.launchCamera(
      {
        mediaType: "video",
        durationLimit: 30,
        videoQuality: "high",
      },
      async (response) => {
        setShowAddImageModal(false);
        if (response.didCancel) {
          setErrorMessage("You did not select any video");
          setShowErrorMessage(true);
        } else if (response.error) {
          setErrorMessage("ImagePicker Error: ");
          setShowErrorMessage(true);
        } else if (response.customButton) {
          setErrorMessage("User tapped custom button: ");
          setShowErrorMessage(true);
        } else {
          setProgress(0);
          setIsUploadingMedia(true);
          setUploadMediaTitle("Uploading Video");
          let arrUploadedImages = [...uploadedImages];
          let arrUploadedImagesThumbnails = [...uploadedImagesThumbnails];
          const url = response?.assets[0]?.uri;
          const compressedURL = await VideoCompressor.compress(url, {
            compressionMethod: "auto",
          });
          let objImage = {
            type: "video",
            image: {
              uri: compressedURL,
              name: response?.assets[0]?.fileName,
              type: response?.assets[0]?.type,
            },
          };
          arrUploadedImagesThumbnails.push(objImage);
          objImage = apiHandler.createFormData(objImage);
          let uploadImage = await uploadMedia(objImage);
          arrUploadedImages.push({
            type: "video",
            url: uploadImage.path,
          });
          setUploadedImages(arrUploadedImages);
          setUploadedImagesThumbnails(arrUploadedImagesThumbnails);
          setIsUploadingMedia(false);
          setProgress(0);
        }
      }
    );
  };

  const onGalleryPress = () => {
    ImagePicker.launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        setErrorMessage("You did not select any image");
        setShowErrorMessage(true);
      } else if (response.error) {
        setErrorMessage("ImagePicker Error: ");
        setShowErrorMessage(true);
      } else if (response.customButton) {
        setErrorMessage("User tapped custom button: ");
        setShowErrorMessage(true);
      } else {
        setProgress(0);
        setIsUploadingMedia(true);
        setUploadMediaTitle("Uploading Image");
        let arrUploadedImages = [...uploadedImages];
        let arrUploadedImagesThumbnails = [...uploadedImagesThumbnails];
        const url = response?.assets[0]?.uri;
        const compressedURL = await ImageCompressor.compress(url, {
          compressionMethod: "auto",
        });
        let objImage = {
          type: "image",
          image: {
            uri: compressedURL,
            name: response?.assets[0]?.fileName,
            type: response?.assets[0]?.type,
          },
        };
        arrUploadedImagesThumbnails.push(objImage);
        objImage = apiHandler.createFormData(objImage);
        let uploadImage = await uploadMedia(objImage);
        arrUploadedImages.push({
          type: "image",
          url: uploadImage.path,
        });
        setUploadedImages(arrUploadedImages);
        setUploadedImagesThumbnails(arrUploadedImagesThumbnails);
        setIsUploadingMedia(false);
        setProgress(0);
      }
    });
  };

  const onImagePickerOptionSelect = (selectedOption) => {
    console.log("Called", selectedOption);
    switch (selectedOption) {
      case "camera":
        onCameraPress();
        break;
      case "photo":
        setShowAddImageModal(false);
        onGalleryPress();
        break;
      case "file-video-o":
        setShowAddImageModal(false);
        uploadVideoFromGallery();
        break;
      case "video-camera":
        recordVideo();
        break;
      default:
        break;
    }
  };

  const uploadVideoFromGallery = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: "video",
        videoQuality: "high",
        durationLimit: 30,
      },
      async (response) => {
        if (response.didCancel) {
          setErrorMessage("You did not select any video");
          setShowErrorMessage(true);
        } else if (response.error) {
          setErrorMessage("ImagePicker Error: ");
          setShowErrorMessage(true);
        } else if (response.customButton) {
          setErrorMessage("User tapped custom button: ");
          setShowErrorMessage(true);
        } else {
          setProgress(0);
          setIsUploadingMedia(true);
          setUploadMediaTitle("Uploading Video");
          let arrUploadedImages = [...uploadedImages];
          let arrUploadedImagesThumbnails = [...uploadedImagesThumbnails];
          const url = response?.assets[0]?.uri;
          const compressedURL = await VideoCompressor.compress(url, {
            compressionMethod: "auto",
          });
          let objImage = {
            type: "video",
            image: {
              uri: compressedURL,
              name: response?.assets[0]?.fileName,
              type: response?.assets[0]?.type,
            },
          };
          arrUploadedImagesThumbnails.push(objImage);
          objImage = apiHandler.createFormData(objImage);
          let uploadImage = await uploadMedia(objImage);
          arrUploadedImages.push({
            type: "video",
            url: uploadImage.path,
          });
          setUploadedImages(arrUploadedImages);
          setUploadedImagesThumbnails(arrUploadedImagesThumbnails);
          setIsUploadingMedia(false);
          setProgress(0);
        }
      }
    );
  };

  const SinglePickerIcon = ({ title, iconName }) => {
    console.log("Title is", title);
    return (
      <TouchableOpacity
        activeOpacity={1}
        style={styles.pickerContainer(iconName)}
        onPress={() => {
          console.log("Pressed");
          onImagePickerOptionSelect(iconName);
        }}
      >
        <FontAwesome name={iconName} style={styles.pickerIcon} />
        <View style={styles.pickerInnerContainer(iconName)}>
          <Text
            style={commonStyles.textWhite(19, {
              color: colors.appPrimary,
              fontWeight: "600",
              marginLeft: moderateScale(8),
            })}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  function handleRatingGesture(nativeEvent) {
    let elapsedPart = nativeEvent.x / ratingViewWidth;
    elapsedPart = parseFloat(elapsedPart);
    let currentElapsedRating = Math.round(elapsedPart * 20);
    currentElapsedRating = parseInt(currentElapsedRating);
    currentElapsedRating = currentElapsedRating / 4;
    let wholeStars = Math.floor(currentElapsedRating);
    let partialStar = currentElapsedRating - wholeStars;
    let arrRatings = [...appRatingData];
    if (currentElapsedRating <= 5) {
      for (var i = 0; i < wholeStars; i++) {
        let objStar = {
          imageSource: imagePath.fullStar,
        };
        arrRatings[i] = objStar;
      }
      switch (partialStar) {
        case 0.25:
          arrRatings[wholeStars] = {
            imageSource: imagePath.quarterStar,
          };
          break;
        case 0.5:
          arrRatings[wholeStars] = {
            imageSource: imagePath.halfStar,
          };
          break;
        case 0.75:
          arrRatings[wholeStars] = {
            imageSource: imagePath.threeQuarterStar,
          };
          break;
        default:
          break;
      }
      setStarRatings(arrRatings);
      setRatingCount(currentElapsedRating);
    }
  }

  console.log(isUploadingMedia);

  return (
    <SafeAreaView
      style={[
        commonStyles.flexFull,
        { backgroundColor: currentThemePrimaryColor },
      ]}
    >
      <View style={commonStyles.screenContainer}>
        <CustomToast
          isVisible={showCustomToast}
          toastMessage={customToastMessage}
          onToastShow={() => {
            setTimeout(() => {
              setShowCustomToast(false);
              navigation.navigate(navigationStrings.HomeScreen);
            }, 900);
          }}
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
        {isLoading && (
          <LoadingComponent title={loaderTitle} percentage={progress} />
        )}
        <AuthHeader
          title={isEditPost ? "Edit Post" : "Add new post"}
          showBackButton={false}
        />
        <View style={styles.screenInnerContainer}>
          <ScrollView
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={commonStyles.textWhite(16, {
                fontWeight: "700",
                marginTop: moderateScale(4),
                color: currentThemeSecondaryColor,
              })}
            >
              Search Restaurant
            </Text>
            <GooglePlacesAutocomplete
              ref={googleInputRef}
              placeholder="Search Restaurants"
              fetchDetails={true}
              onPress={(data, details = null) => {
                console.log("Selected Place Details:", details);
                console.log("Place Data:", data);
                setLatitude(details.geometry.location.lat);
                setLongitude(details.geometry.location.lng);
                setSelectedRestaurant(data.structured_formatting.main_text);
                setSelectedRestaurantID(data.place_id);
              }}
              listViewDisplayed="auto"
              value={selectedRestaurant}
              query={{
                key: "AIzaSyC67cbOCHYz64VdKTn2oOnzxM9sVKm-lQY",
                language: "en",
                type: "establishment",
              }}
              enablePoweredByContainer={false}
              GooglePlacesSearchQuery={{
                rankby: "distance",
              }}
              nearbyPlacesAPI="GooglePlacesSearch"
              debounce={400}
              minLength={2}
              requestUrl={{
                useOnPlatform: "web",
                url: "https://maps.googleapis.com/maps/api",
              }}
              styles={{
                textInput: styles.googlePlacesTextInput,
                row: styles.googlePlacesRow,
                listView: {
                  backgroundColor: colors.white,
                  borderRadius: moderateScale(8),
                  marginTop: moderateScale(2),
                  maxHeight: moderateScale(120),
                },
                separator: {
                  height: 1,
                  backgroundColor: colors.lightGrey,
                },
                powered: {
                  height: 0,
                },
                description: {
                  color: colors.black,
                  fontSize: 14,
                },
                predefinedPlacesDescription: {
                  color: colors.black,
                },
              }}
              numberOfLines={5}
              renderRow={(data, index) => {
                console.log("Restaurant Row Data:", data);
                return (
                  <View style={styles.googleRowContainer}>
                    <Text
                      style={commonStyles.textWhite(13, {
                        color: colors.black,
                      })}
                    >
                      {data.description}
                    </Text>
                  </View>
                );
              }}
              textInputProps={{
                color: colors.black,
                placeholderTextColor: colors.darkGrey,
              }}
              onFail={(error) => {
                console.error("Google Places Error:", error);
                if (error.includes("BILLING")) {
                  setErrorMessage(
                    "Please enable billing on Google Cloud Console to use restaurant search."
                  );
                } else {
                  setErrorMessage("Failed to fetch restaurants: " + error);
                }
                setShowErrorMessage(true);
              }}
            />
            <Text
              style={commonStyles.textWhite(16, {
                fontWeight: "700",
                marginTop: moderateScale(8),
                color: currentThemeSecondaryColor,
              })}
            >
              Upload Media
            </Text>
            <View style={styles.postMediaFullContainer}>
              <PressableImage
                imageSource={imagePath.addIcon}
                imageStyle={styles.imageStyle}
                onImagePress={
                  Platform.OS == "ios"
                    ? onAddImagePress
                    : requestCameraPermission
                }
              />
              {uploadedImagesThumbnails &&
                uploadedImagesThumbnails.length > 0 &&
                uploadedImagesThumbnails.map((item, index) => {
                  return (
                    <View>
                      <FontAwesome
                        name="close"
                        style={styles.removeMediaContainer}
                        onPress={() => {
                          removeImageThumbnail(item, index);
                        }}
                      />
                      {item.type == "image" ? (
                        <Image
                          source={{ uri: item.image.uri }}
                          style={styles.singleMediaContainer}
                        />
                      ) : (
                        <Video
                          source={{ uri: item.image.uri }}
                          paused={true}
                          resizeMode="stretch"
                          style={styles.singleMediaContainer}
                        />
                      )}
                    </View>
                  );
                })}
            </View>
            {/* <Text style={commonStyles.textWhite(16, { fontWeight: '700', marginTop: moderateScale(8), color: currentThemeSecondaryColor })}>
                            Post Title
                        </Text>
                        <AuthTextInput customStyles={styles.titleInputContainer} customTextInputStyles={styles.titleText} placeholder={'Enter title'} value={title} onChangeText={(text) => { onTitleChange(text) }} /> */}
            <Text
              style={commonStyles.textWhite(16, {
                fontWeight: "700",
                marginTop: moderateScale(8),
                color: currentThemeSecondaryColor,
              })}
            >
              Select food category :
            </Text>
            <View style={styles.foodCategoriesFullContainer}>
              {allFoodCategories.map((item, index) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onCategorySelect(item.id);
                    }}
                    style={styles.singleCategoryContainer(
                      item.id == selectedCategory,
                      currentThemeSecondaryColor,
                      currentThemePrimaryColor
                    )}
                  >
                    <Text
                      style={commonStyles.textWhite(11, {
                        color:
                          item.id == selectedCategory
                            ? currentThemePrimaryColor
                            : currentThemeSecondaryColor,
                      })}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text
              style={commonStyles.textWhite(16, {
                fontWeight: "700",
                marginTop: moderateScale(10),
                color: currentThemeSecondaryColor,
              })}
            >
              Write Reviews :
            </Text>
            <View style={styles.reviewInputFullContainer}>
              <View style={styles.reviewInputInnerContainer}>
                <TextInput
                  ref={textInputRef}
                  style={styles.reviewTextInput}
                  value={review}
                  placeholder={"Enter review"}
                  multiline={true}
                  placeholderTextColor={colors.black}
                  onSubmitEditing={() => {
                    textInputRef.current.blur();
                  }}
                  onChangeText={(text) => {
                    onReviewChange(text);
                  }}
                />
              </View>
            </View>
            <View style={styles.ratingsFullContainer}>
              <Text
                style={commonStyles.textWhite(24, {
                  fontWeight: "600",
                  color: currentThemeSecondaryColor,
                })}
              >
                Crunch Stars:
              </Text>
              <PanGestureHandler
                onGestureEvent={(event) => {
                  handleRatingGesture(event.nativeEvent);
                }}
              >
                <TapGestureHandler
                  numberOfTaps={1}
                  onHandlerStateChange={(event) => {
                    handleRatingGesture(event.nativeEvent);
                  }}
                >
                  <View
                    onLayout={(event) => {
                      let ratingViewWidthVal = event.nativeEvent.layout.width;
                      setRatingViewWidth(ratingViewWidthVal);
                    }}
                    // onPress={(event) => {
                    //     // let touchedPoint = event.nativeEvent.locationX
                    // }}
                    style={commonStyles.flexRow_CenterItems}
                  >
                    {starRatings.map((item, index) => {
                      return (
                        <Image
                          source={item.imageSource}
                          style={{
                            height: moderateScale(15),
                            width: moderateScale(15),
                            resizeMode: "contain",
                            marginLeft: moderateScale(3),
                          }}
                        />
                      );
                    })}
                  </View>
                </TapGestureHandler>
              </PanGestureHandler>
            </View>
            <CommonButton
              onButtonPress={onShareReviewPress}
              buttonTitle={"Share Review"}
              buttonStyle={styles.shareButton}
              textStyle={commonStyles.textWhite(18, {
                fontWeight: "400",
                color: colors.white,
              })}
            />
          </ScrollView>
        </View>
        <Modal
          visible={showAddImageModal}
          animationType="slide"
          transparent={true}
        >
          <View style={commonStyles.flexFull}>
            <View style={styles.imagePickerModalFullContainer}>
              <View style={styles.imagePickerModalInnerContainer}>
                <View style={styles.pickerContainer("")}>
                  <Text
                    style={commonStyles.textWhite(19, {
                      color: colors.appPrimary,
                      fontWeight: "600",
                      marginLeft: moderateScale(8),
                    })}
                  >
                    Select an option
                  </Text>
                </View>
                <SinglePickerIcon
                  title={"Take a picture"}
                  iconName={"camera"}
                />
                <SinglePickerIcon
                  title={"Record a video"}
                  iconName={"video-camera"}
                />
                <SinglePickerIcon
                  title={"Upload an image"}
                  iconName={"photo"}
                />
                <SinglePickerIcon
                  title={"Upload a video"}
                  iconName={"file-video-o"}
                />
              </View>
            </View>
          </View>
        </Modal>
        {isUploadingMedia && (
          <Modal transparent={true} visible={isUploadingMedia}>
            <View style={styles.uploadMediaModalInnerContainer}>
              <CircularProgress progress={progress} />
              <Text
                style={commonStyles.textWhite(24, {
                  fontWeight: "600",
                  color: colors.appPrimary,
                  alignSelf: "center",
                  textAlign: "center",
                })}
              >
                {uploadMediaTitle}
              </Text>
            </View>
          </Modal>
        )}
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
              "#ffffff0b",
              "#ffffff16",
              "#ffffff1f",
              "#ffffff29",
              "#ffffff32",
            ]}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenInnerContainer: {
    flex: 1,
    padding: moderateScale(8),
    paddingBottom: moderateScale(24),
    paddingTop: 0,
  },
  imageStyle: {
    height: moderateScale(28),
    width: moderateScale(28),
    borderRadius: moderateScale(5),
  },
  shareButton: {
    width: windowWidth - moderateScale(30),
    alignSelf: "center",
    paddingVertical: moderateScale(8),
    backgroundColor: colors.appPrimary,
    borderRadius: moderateScale(18),
    marginTop: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(40),
  },
  pickerContainer: (iconName) => {
    return {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderTopWidth: iconName == "" ? 0 : 0.5,
      paddingHorizontal: moderateScale(8),
      paddingVertical: moderateScale(8),
      borderColor: colors.appPrimary,
      flexDirection: "row",
      alignItems: "center",
    };
  },
  pickerIcon: { fontSize: 25, color: colors.appPrimary },
  pickerInnerContainer: (iconName) => {
    return {
      flex: 1,
      backgroundColor: colors.white,
      justifyContent: "center",
      alignItems: iconName == "" ? "center" : "flex-start",
    };
  },
  googlePlacesTextInput: {
    height: moderateScale(26),
    color: colors.black,
    fontSize: 16,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(8),
    borderColor: colors.grey,
    backgroundColor: colors.lightGrey,
  },
  googlePlacesRow: {
    borderBottomWidth: 1,
    borderColor: colors.darkGrey,
  },
  googleRowContainer: { padding: moderateScale(2) },
  postMediaFullContainer: { flexDirection: "row", marginTop: moderateScale(6) },
  removeMediaContainer: {
    color: "#aa0000",
    fontSize: 20,
    position: "absolute",
    zIndex: 5,
    right: -7,
    top: -10,
  },
  singleMediaContainer: {
    height: moderateScale(28),
    width: moderateScale(28),
    borderRadius: moderateScale(5),
    marginLeft: moderateScale(3),
  },
  titleInputContainer: {
    marginTop: moderateScale(5),
    height: moderateScale(26),
    width: windowWidth - moderateScale(16),
    alignSelf: "center",
    backgroundColor: colors.lightGrey,
    borderRadius: moderateScale(8),
    opacity: 0.8,
  },
  titleText: { textAlignVertical: "center" },
  reviewInputFullContainer: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    marginTop: moderateScale(5),
    height: moderateScale(60),
    width: windowWidth - moderateScale(16),
    alignSelf: "center",
    backgroundColor: colors.lightGrey,
    borderRadius: moderateScale(8),
    opacity: 0.8,
  },
  reviewInputInnerContainer: {
    flex: 1,
    marginLeft: moderateScale(6),
  },
  reviewTextInput: {
    flex: 1,
    padding: 0,
    color: colors.black,
    textAlignVertical: "top",
  },
  ratingsFullContainer: {
    flexDirection: "row",
    marginTop: moderateScale(10),
    alignItems: "center",
  },
  singleRatingStar: {
    height: moderateScale(12),
    width: moderateScale(12),
    marginLeft: moderateScale(4),
  },
  imagePickerModalFullContainer: {
    flex: 1,
    backgroundColor: `${colors.black}aa`,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePickerModalInnerContainer: {
    width: windowWidth * 0.8,
    backgroundColor: colors.appPrimary,
    borderRadius: moderateScale(8),
  },
  imagePickerModalTitleContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderTopWidth: 0.5,
    paddingHorizontal: moderateScale(8),
    borderColor: colors.appPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  singleCategoryContainer: (
    bool,
    currentThemeSecondaryColor,
    currentThemePrimaryColor
  ) => {
    return {
      marginVertical: moderateScale(3),
      marginHorizontal: moderateScale(5),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: moderateScale(6),
      borderWidth: moderateScale(0.7),
      borderColor: bool ? colors.appPrimary : currentThemeSecondaryColor,
      paddingHorizontal: moderateScale(5),
      paddingVertical: moderateScale(3),
      backgroundColor: bool ? colors.appPrimary : currentThemePrimaryColor,
    };
  },
  foodCategoriesFullContainer: {
    flexDirection: "row",
    marginTop: moderateScale(6),
    flexWrap: "wrap",
  },
  uploadMediaModalFullContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  uploadMediaModalInnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${colors.black}99`,
  },
});
