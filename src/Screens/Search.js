import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import CommonButton from "../Components/CommonButton";
import { colors } from "../Constants/colors";
import { commonStyles } from "../Constants/commonStyles";
import {
  CATEGORY_IMAGES_BASE_URL,
  errorVibrationPattern,
  fontScalingFactor,
  GOOGLE_API_KEY,
  moderateScale,
  quickFoodsSearch,
  searchVibrationPattern,
  USER_PROFILE_BASE_URL,
  VIBRATION_PATTERN,
  windowHeight,
  windowWidth,
} from "../Constants/globalConstants";
import Slider from "react-native-slider";
import { useDispatch, useSelector } from "react-redux";
import { apiHandler } from "../Constants/apiHandler";
import LoadingComponent from "../Components/LoadingComponent";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import {
  savePostsRadius,
  setAccessToken,
  setAdminAdvertisements,
  setFavoriteRestaurants,
  setFavouritePlaces,
  setFoodCategories,
  setLikedPosts,
  setLoadNewPosts,
  setLoadRandomPosts,
  setSearchingForQuickBites,
  setUserData,
  updateFoodCategories,
} from "../Redux/actions/actions";
import { navigationStrings } from "../Navigation/NavigationStrings";
import { useEffect } from "react";
import { ScrollView } from "react-native-gesture-handler";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { helperFunctions } from "../Constants/helperFunctions";
import CustomToast from "../Components/CustomToast";
import Ionicons from "react-native-vector-icons/Ionicons";
import { imagePath } from "../Constants/imagePath";
import AppIntroSlider from "react-native-app-intro-slider";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import ErrorComponent from "../Components/ErrorComponent";
import LinearGradient from "react-native-linear-gradient";
import AnimatedFilterBar from "../Components/AnimatedFilterBar";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function Search(props) {
  const filterData = [
    {
      id: 0,
      title: "Restaurants",
    },
    {
      id: 1,
      title: "Users",
    },
  ];

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const accessToken = useSelector((state) => state.accessToken);
  const userData = useSelector((state) => state.userData);
  const foodCategories = useSelector((state) => state.foodCategories);
  const isVibrationEnabled = useSelector((state) => state.isVibrationEnabled);
  const savedFoodCategories = useSelector((state) => state.savedFoodCategories);
  const savedPostsRadius = useSelector((state) => state.postsRadius);
  const loadRandomPosts = useSelector((state) => state.loadRandomPosts);
  const isDarkModeActive = useSelector((state) => state.isDarkModeActive);
  const currentThemePrimaryColor = useSelector(
    (state) => state.currentThemePrimaryColor
  );
  const currentThemeSecondaryColor = useSelector(
    (state) => state.currentThemeSecondaryColor
  );
  const userLocation = useSelector((state) => state.userLocation);

  const [selectedCategories, setSelectedCategories] =
    useState(savedFoodCategories);
  const [distance, setDistance] = useState(20);
  const [sliderState, setSliderState] = useState({ currentPage: 0 });
  const [displayedFoodCategories, setDisplayedFoodCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loaderTitle, setLoaderTitle] = useState("");
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [selectedRestaurantID, setSelectedRestaurantID] = useState("");
  const [showRestaurantSearch, setShowRestaurantSearch] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadRandomPosts, setIsLoadRandomPosts] = useState(false);
  const [selectedFilterTab, setSelectedFilterTab] = useState(filterData[0]);
  const [searchedName, setSearchedName] = useState("");
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchedQuickBitesNames, setSearchedQuickBiteNames] = useState("");
  const [remainingQuickBites, setRemainingQuickBites] = useState([]);
  const [isSearchingForUsers, setIsSearchingForUsers] = useState(false);
  const [filteredQuickBites, setFilteredQuickBites] = useState([]);

  const googleInputRef = useRef();

  const searchInputRef = useRef();

  const isFocused = useIsFocused();

  useEffect(() => {
    getSavedCategories();
  }, []);

  useEffect(() => {
    setRemainingQuickBites(quickFoodsSearch);
    // setDistance(savedPostsRadius)
    setIsLoadRandomPosts(loadRandomPosts);
  }, [isFocused, loadRandomPosts]);

  const getSavedCategories = async () => {
    setIsLoading(true);
    setLoaderTitle("Fetching saved preferences");
    try {
      if (
        userData &&
        userData.search_randomly &&
        userData.search_randomly == 1
      ) {
        dispatch(setLoadRandomPosts(true));
        setIsLoadRandomPosts(true);
      }
      // Check if foodCategories is valid before transforming
      if (
        foodCategories &&
        Array.isArray(foodCategories) &&
        foodCategories.length > 0
      ) {
        let displayedData = helperFunctions.transformArray(foodCategories);
        setDisplayedFoodCategories(displayedData);
      } else {
        console.log("Food categories not loaded yet");
        setDisplayedFoodCategories([]);
      }

      // Check if userData and radius are valid
      if (userData && userData.radius) {
        const radius = parseInt(userData.radius);
        if (!isNaN(radius)) {
          setDistance(radius);
          dispatch(savePostsRadius(radius));
        }
      }

      if (userData && userData.settings && userData.settings.length > 0) {
        let arrCurrentFoodCategories = [];
        arrCurrentFoodCategories = userData.settings;
        arrCurrentFoodCategories = arrCurrentFoodCategories.map(
          (item, index) => {
            return item.category;
          }
        );
        dispatch(updateFoodCategories(arrCurrentFoodCategories));
        setSelectedCategories(arrCurrentFoodCategories);
      }
    } catch (error) {
      console.log("Error in getSavedCategories:", error);
      setErrorMessage("Network Error");
      setShowErrorMessage(true);
    }
    setIsLoading(false);
  };

  const onRandomPress = () => {
    dispatch(setLoadRandomPosts(!loadRandomPosts));
    if (isVibrationEnabled) {
      Vibration.vibrate(VIBRATION_PATTERN);
    }
    let arrSelectedCategories = [];
    if (loadRandomPosts) {
      setSelectedCategories(arrSelectedCategories);
    } else {
      arrSelectedCategories = [...foodCategories];
      setSelectedCategories(arrSelectedCategories);
    }
  };

  async function onSavePress() {
    if (distance == 0) {
      setShowErrorMessage(true);
      setErrorMessage("Distance must be greater than 0");
      if (isVibrationEnabled) {
        Vibration.vibrate(errorVibrationPattern);
      }
    } else if (selectedCategories.length == 0) {
      setShowErrorMessage(true);
      setErrorMessage("No category selected..!!!");
      if (isVibrationEnabled) {
        Vibration.vibrate(errorVibrationPattern);
      }
    } else {
      let arrSelectedCategories = [...selectedCategories];
      arrSelectedCategories = arrSelectedCategories.map((item, index) => {
        return item.id;
      });
      setIsLoading(true);
      setLoaderTitle("Updating preferences");
      let reqObj = {
        category_id: arrSelectedCategories,
        radius: distance,
        search_randomly: isLoadRandomPosts ? 1 : 0,
      };
      try {
        await apiHandler.saveUserPreference(reqObj, accessToken);
        dispatch(savePostsRadius(distance));
        dispatch(updateFoodCategories(selectedCategories));
        setIsLoading(false);
        setShowCustomToast(true);
        dispatch(setLoadNewPosts(true));
        if (isVibrationEnabled) {
          Vibration.vibrate(searchVibrationPattern);
        }
      } catch (error) {
        setIsLoading(false);
        alert(error.message);
      }
    }
  }

  function onSingleCategoryPress(category) {
    if (isVibrationEnabled) {
      Vibration.vibrate([0, 50, 70, 100]);
    }
    let arrSelectedCategories = [...selectedCategories];
    if (
      arrSelectedCategories &&
      arrSelectedCategories.length > 0 &&
      helperFunctions.findElement(arrSelectedCategories, category)
    ) {
      arrSelectedCategories = arrSelectedCategories.filter((item, index) => {
        return item.id !== category.id;
      });
    } else {
      arrSelectedCategories.push(category);
    }
    setSelectedCategories(arrSelectedCategories);
  }

  function renderFoodCategory({ item, index }) {
    const isSelected =
      selectedCategories &&
      selectedCategories.length > 0 &&
      helperFunctions.findElement(selectedCategories, item);

    return (
      <ImageBackground
        key={index}
        resizeMode="cover"
        source={
          item.image
            ? { uri: CATEGORY_IMAGES_BASE_URL + item.image }
            : imagePath.americanFoodImage
        }
        defaultSource={imagePath.americanFoodImage}
        style={{
          height: windowHeight * 0.12,
          width: windowWidth * 0.5 - moderateScale(16),
          overflow: "hidden",
          marginLeft: index % 2 != 0 ? moderateScale(8) : 0,
          marginTop: moderateScale(8),
          borderRadius: 12,
          borderWidth: isSelected ? 3 : 1.5,
          borderColor: isSelected ? colors.appPrimary : colors.grey,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            onSingleCategoryPress(item);
          }}
          style={{
            flex: 1,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isSelected
              ? "rgba(42, 177, 60, 0.35)"
              : "rgba(0, 0, 0, 0.4)",
          }}
        >
          <Text
            style={commonStyles.textWhite(16, {
              fontWeight: "bold",
              textShadowColor: "rgba(0, 0, 0, 0.75)",
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 10,
            })}
          >
            {item.name}
          </Text>
          {isSelected ? (
            <View
              style={{
                position: "absolute",
                top: moderateScale(4),
                right: moderateScale(4),
                backgroundColor: colors.appPrimary,
                borderRadius: moderateScale(10),
                height: moderateScale(20),
                width: moderateScale(20),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="checkmark"
                style={{
                  color: colors.white,
                  fontSize: moderateScale(14),
                }}
              />
            </View>
          ) : (
            <View
              style={{
                position: "absolute",
                top: moderateScale(4),
                right: moderateScale(4),
                backgroundColor: "rgba(128, 128, 128, 0.6)",
                borderRadius: moderateScale(10),
                height: moderateScale(20),
                width: moderateScale(20),
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: colors.white,
              }}
            >
              <Ionicons
                name="add"
                style={{
                  color: colors.white,
                  fontSize: moderateScale(14),
                }}
              />
            </View>
          )}
        </TouchableOpacity>
      </ImageBackground>
    );
  }

  const getMeal = () => {
    let time = new Date().getHours();
    if (time < 12) {
      return "breakfast?";
    } else if (time < 18) {
      return "lunch?";
    } else {
      return "dinner?";
    }
  };

  const renderSingleCard = ({ item, index }) => {
    // Validate that item exists and is an array
    if (!item || !Array.isArray(item) || item.length === 0) {
      return null;
    }
    return (
      <View style={styles.foodItemsContainer}>
        <FlatList
          data={item}
          renderItem={renderFoodCategory}
          numColumns={2}
          keyExtractor={(item, idx) => `category-${item?.id || idx}`}
        />
      </View>
    );
  };

  const onSlideChange = () => {
    if (isVibrationEnabled) {
      Vibration.vibrate();
    }
  };

  const renderLimitingDistance = (distance) => {
    return (
      <View style={styles.singleContainer}>
        <Text
          style={commonStyles.textWhite(18, {
            color: currentThemeSecondaryColor,
            fontWeight: "bold",
          })}
        >
          {distance}
        </Text>
        {distance == 0 ? (
          <FontAwesome
            name="bullseye"
            style={styles.singlePinContainer(currentThemeSecondaryColor)}
          />
        ) : (
          <Ionicons
            name={"pin"}
            style={styles.singlePinContainer(currentThemeSecondaryColor)}
          />
        )}
      </View>
    );
  };

  const showHideSearchRestaurantModal = () => {
    setShowRestaurantSearch(!showRestaurantSearch);
    setSearchedName("");
    setSearchedUsers([]);
    setSelectedRestaurant("");
    setSelectedRestaurantID("");
  };

  const onSingleFilterTabPress = (item) => {
    setSelectedFilterTab(item);
    setSearchedName("");
    setSearchedUsers([]);
    setSelectedRestaurant("");
    setSelectedRestaurantID("");
  };

  const onUserSearch = async (val) => {
    setSearchedName(val);
    if (val != "") {
      setIsSearchingForUsers(true);
      let response = await apiHandler.searchUser(accessToken, val);
      setIsSearchingForUsers(false);
      setSearchedUsers(response);
    }
  };

  const FilterComponent = () => {
    return (
      <View style={styles.filterTabFullComponent(isDarkModeActive)}>
        {filterData.map((item, index) => {
          return (
            <TouchableOpacity
              onPress={() => {
                onSingleFilterTabPress(item);
              }}
              style={styles.singleFilterTabContainer(
                item.id == selectedFilterTab.id,
                currentThemePrimaryColor
              )}
            >
              <Text
                style={commonStyles.textWhite(16, {
                  color:
                    item.id == selectedFilterTab.id
                      ? currentThemePrimaryColor
                      : currentThemeSecondaryColor,
                })}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const onSingleUserPress = (item) => {
    showHideSearchRestaurantModal();
    item.id == userData.id
      ? navigation.navigate(navigationStrings.ProfileScreen)
      : navigation.navigate(navigationStrings.ShowUser, {
          userID: item.id,
        });
  };

  const renderUser = ({ item, index }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          onSingleUserPress(item);
        }}
        style={{
          width: windowWidth - moderateScale(24),
          minHeight: moderateScale(30),
          flexDirection: "row",
          borderBottomWidth: moderateScale(0.6),
          borderBottomColor: isDarkModeActive ? colors.lightGrey : colors.grey,
          marginTop: moderateScale(8),
          paddingBottom: moderateScale(3),
          alignItems: "center",
          alignSelf: "center",
        }}
      >
        <Image
          source={
            item && item.image ? { uri: item.image } : imagePath.dummyProfile
          }
          style={{
            height: moderateScale(24),
            width: moderateScale(24),
            borderRadius: moderateScale(12),
          }}
        />
        <View style={{ flex: 1, marginLeft: moderateScale(4) }}>
          <Text
            style={commonStyles.textWhite(16, {
              color: currentThemeSecondaryColor,
              fontWeight: "700",
            })}
          >
            {item.full_name}
          </Text>
          <Text
            style={commonStyles.textWhite(14, {
              color: currentThemeSecondaryColor,
            })}
          >
            {item.bio}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward-circle-outline"
          style={{
            color: currentThemeSecondaryColor,
            fontSize: moderateScale(12),
          }}
        />
      </TouchableOpacity>
    );
  };

  const clearUserSearchValue = () => {
    setSearchedName("");
    let arrUsers = [];
    setSearchedUsers(arrUsers);
    searchInputRef.current.blur();
  };

  const renderSearchRestaurants = () => {
    return (
      <View style={commonStyles.flexFull}>
        <View style={{ flex: 1, paddingHorizontal: moderateScale(10) }}>
          <GooglePlacesAutocomplete
            ref={googleInputRef}
            placeholder="Search Restaurants"
            fetchDetails={true}
            onPress={(data, details = null) => {
              console.log("Pressed", data);

              if (data.place_id && data.place_id != "") {
                setTimeout(() => {
                  showHideSearchRestaurantModal();
                  setSelectedRestaurant(data.structured_formatting.main_text);
                  setSelectedRestaurantID(data.place_id);
                }, 100);
                navigation.navigate(navigationStrings.RestaurantDetails, {
                  restaurant_id: data.place_id,
                });
              } else {
                if (isVibrationEnabled) {
                  Vibration.vibrate(errorVibrationPattern);
                }
                setErrorMessage("No restaurant selected..!!!");
                setShowErrorMessage(true);
              }
            }}
            listViewDisplayed={false}
            value={selectedRestaurant}
            query={{
              key: "AIzaSyC67cbOCHYz64VdKTn2oOnzxM9sVKm-lQY",
              language: "en",
              type: "restaurant",
            }}
            disableScroll={false}
            GooglePlacesSearchQuery={{ type: "restaurant", rankby: "distance" }}
            styles={{
              container: {
                backgroundColor: currentThemePrimaryColor,
              },
              textInput: {
                height: moderateScale(26),
                color: currentThemeSecondaryColor,
                fontSize: 16 / fontScalingFactor,
                borderWidth: moderateScale(1),
                borderRadius: moderateScale(8),
                marginTop: moderateScale(8),
                borderColor: isDarkModeActive ? colors.lightGrey : colors.grey,
                backgroundColor: currentThemePrimaryColor,
                paddingLeft: moderateScale(4),
              },
              row: {
                borderBottomWidth: moderateScale(0.5),
                borderColor: isDarkModeActive
                  ? colors.lightGrey
                  : colors.darkGrey,
              },
              separator: {
                height: 0,
              },
              powered: {
                height: 0,
              },
              description: {
                color: currentThemeSecondaryColor,
              },
              predefinedPlacesDescription: {
                color: currentThemeSecondaryColor,
              },
            }}
            numberOfLines={5}
            renderRow={(data, index) => {
              return (
                <View
                  style={{
                    paddingVertical: moderateScale(6),
                    paddingLeft: moderateScale(4),
                    backgroundColor: currentThemePrimaryColor,
                  }}
                >
                  <Text
                    style={commonStyles.textWhite(13, {
                      color: currentThemeSecondaryColor,
                    })}
                  >
                    {data.description}
                  </Text>
                </View>
              );
            }}
            textInputProps={{
              color: currentThemeSecondaryColor,
              placeholderTextColor: currentThemeSecondaryColor,
            }}
          />
        </View>

        {/* <CommonButton buttonTitle={'Explore'}
             onButtonPress={onRestaurantSearchPress}
             buttonStyle={styles.visitNowButton} textStyle={commonStyles.textWhite(22, { fontWeight: '600' })} /> */}
      </View>
    );
  };

  const renderSearchUsers = () => {
    return (
      <View style={commonStyles.flexFull}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: moderateScale(4),
            backgroundColor: currentThemePrimaryColor,
            marginTop: moderateScale(8),
            height: moderateScale(26),
            width: windowWidth - moderateScale(20),
            alignSelf: "center",
            borderColor: isDarkModeActive ? colors.lightGrey : colors.grey,
            borderWidth: moderateScale(0.7),
            borderRadius: moderateScale(8),
          }}
        >
          <TextInput
            ref={searchInputRef}
            style={{
              flex: 1,
              marginLeft: moderateScale(2),
              color: currentThemeSecondaryColor,
            }}
            value={searchedName}
            placeholder={"Search Crunch partners"}
            placeholderTextColor={
              isDarkModeActive ? colors.lightGrey : colors.darkGrey
            }
            onChangeText={(text) => {
              onUserSearch(text);
            }}
          />
          {searchedName.trim().length > 0 && (
            <Ionicons
              name="close"
              style={{
                fontSize: moderateScale(12),
                color: currentThemeSecondaryColor,
              }}
              onPress={clearUserSearchValue}
            />
          )}
        </View>
        {isSearchingForUsers ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator
              size={"large"}
              color={currentThemeSecondaryColor}
            />
          </View>
        ) : (
          <FlatList
            data={searchedUsers}
            renderItem={renderUser}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => {
              return (
                searchedName.trim().length > 0 && (
                  <View
                    style={{
                      height: windowHeight * 0.4,
                      width: windowWidth - moderateScale(20),
                      alignSelf: "center",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={commonStyles.textWhite(28, {
                        color: currentThemeSecondaryColor,
                        fontWeight: "700",
                      })}
                    >
                      Oops..!!!
                    </Text>
                    <Text
                      style={commonStyles.textWhite(22, {
                        color: currentThemeSecondaryColor,
                      })}
                    >
                      No Crunch partners go by this name
                    </Text>
                  </View>
                )
              );
            }}
          />
        )}
      </View>
    );
  };

  const renderUsersIcon = (color) => {
    return (
      <FontAwesome
        name="users"
        style={{
          fontSize: moderateScale(9),
          color: color,
          marginRight: moderateScale(3),
        }}
      />
    );
  };

  const onQuickBitesSearch = async (val) => {
    setSearchedQuickBiteNames(val);
    if (val != "") {
      let arrQuickBites = [...quickFoodsSearch];
      let arrSearchedBites = [];
      let arrRemainingBites = [];
      arrSearchedBites = arrQuickBites.filter((item, index) => {
        return item.toLowerCase().startsWith(val.toLowerCase());
      });
      arrRemainingBites = arrQuickBites.filter((item, index) => {
        return !item.toLowerCase().startsWith(val.toLowerCase());
      });
      if (
        !arrSearchedBites.some((item, index) => {
          return item.toLowerCase() == val.toLowerCase();
        })
      ) {
        arrSearchedBites.unshift(val);
      }
      setFilteredQuickBites(arrSearchedBites);
      setRemainingQuickBites(arrRemainingBites);
    } else {
      setFilteredQuickBites([]);
    }
  };

  const renderQuickBiteFoods = () => {
    return (
      <View style={commonStyles.flexFull}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: moderateScale(4),
            backgroundColor: currentThemePrimaryColor,
            marginTop: moderateScale(8),
            height: moderateScale(26),
            width: windowWidth - moderateScale(20),
            alignSelf: "center",
            borderColor: isDarkModeActive ? colors.lightGrey : colors.grey,
            borderWidth: moderateScale(0.7),
            borderRadius: moderateScale(8),
          }}
        >
          <TextInput
            ref={searchInputRef}
            style={{
              flex: 1,
              marginLeft: moderateScale(2),
              color: currentThemeSecondaryColor,
            }}
            value={searchedQuickBitesNames}
            onFocus={() => {
              // setSearchedQuickBites(quickFoodsSearch)
            }}
            // autoFocus={true}
            placeholder={"Quick Search"}
            placeholderTextColor={
              isDarkModeActive ? colors.lightGrey : colors.darkGrey
            }
            onChangeText={(text) => {
              onQuickBitesSearch(text);
            }}
          />
          {searchedQuickBitesNames.trim().length > 0 && (
            <Ionicons
              name="close"
              style={{
                fontSize: moderateScale(12),
                color: currentThemeSecondaryColor,
              }}
              onPress={clearUserSearchValue}
            />
          )}
        </View>

        <ScrollView style={commonStyles.flexFull}>
          {filteredQuickBites.map((item, index) => {
            return renderSingleQuickBite(item, index, true);
          })}
          {remainingQuickBites.map((item, index) => {
            return renderSingleQuickBite(item, index, false);
          })}
        </ScrollView>
      </View>
    );
  };

  const onSingleQuickBitePress = (item) => {
    setSearchedQuickBiteNames("");
    setRemainingQuickBites([]);
    setFilteredQuickBites([]);
    dispatch(setSearchingForQuickBites(item));
    dispatch(setLoadNewPosts(false));
    setShowRestaurantSearch(false);
    navigation.navigate(navigationStrings.HomeScreen);
  };

  const renderSingleQuickBite = (item, index, isFiltered) => {
    return (
      <TouchableOpacity
        onPress={() => {
          onSingleQuickBitePress(item);
        }}
        style={{
          width: windowWidth - moderateScale(24),
          minHeight: moderateScale(30),
          flexDirection: "row",
          borderBottomWidth: isFiltered ? 0 : moderateScale(0.6),
          borderBottomColor: isDarkModeActive ? colors.lightGrey : colors.grey,
          marginTop: moderateScale(8),
          padding: moderateScale(3),
          alignItems: "center",
          alignSelf: "center",
          backgroundColor: isFiltered
            ? colors.appPrimary
            : currentThemePrimaryColor,
          borderRadius: moderateScale(8),
        }}
      >
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text
            style={commonStyles.textWhite(16, {
              color: currentThemeSecondaryColor,
              fontWeight: "700",
            })}
          >
            {item}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward-circle-outline"
          style={{
            color: currentThemeSecondaryColor,
            fontSize: moderateScale(12),
          }}
        />
      </TouchableOpacity>
    );
  };

  const renderQuickBitesIcon = (color) => {
    return (
      <MaterialCommunityIcons
        name="map-search"
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
      <MaterialCommunityIcons
        name="food"
        style={{
          fontSize: moderateScale(9),
          color: color,
          marginRight: moderateScale(3),
        }}
      />
    );
  };
  useEffect(() => {
    // clearUserSearchValue()
  }, []);
  return (
    <SafeAreaView
      style={[
        commonStyles.flexFull,
        { backgroundColor: currentThemePrimaryColor },
      ]}
    >
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRestaurantSearch}
      >
        <View style={styles.searchModalFullContainer}>
          <View
            style={styles.searchModalInnerContainer(currentThemePrimaryColor)}
          >
            <Ionicons
              name="arrow-back"
              style={{
                fontSize: 30,
                color: currentThemeSecondaryColor,
                alignSelf: "flex-start",
                marginLeft: moderateScale(10),
                marginTop: moderateScale(20),
              }}
              onPress={showHideSearchRestaurantModal}
            />
            <View style={{ flex: 1, marginTop: moderateScale(10) }}>
              <AnimatedFilterBar
                filterTabs={["Quick bites", "Restaurants", "Users"]}
                innerComponents={[
                  renderQuickBiteFoods,
                  renderSearchRestaurants,
                  renderSearchUsers,
                ]}
                icons={[
                  renderQuickBitesIcon,
                  renderRestaurantsIcon,
                  renderUsersIcon,
                ]}
              />
            </View>
          </View>
        </View>
      </Modal>
      <CustomToast
        isVisible={showCustomToast}
        onToastShow={() => {
          setTimeout(() => {
            setShowCustomToast(false);
            navigation.navigate(navigationStrings.HomeScreen);
          }, 900);
        }}
        toastMessage={"New preferences updated successfully"}
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
      <View style={commonStyles.fullScreenContainer}>
        {isLoading && <LoadingComponent title={loaderTitle} />}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.titleFullContainer}>
            <View style={styles.titleInnerContainer}>
              {userData.full_name.length <= 6 ? (
                <Text
                  style={commonStyles.textWhite(28, {
                    color: currentThemeSecondaryColor,
                    alignSelf: "center",
                    fontWeight: "700",
                    flexWrap: "wrap",
                    textAlign: "center",
                    marginLeft: moderateScale(14),
                  })}
                >
                  Welcome, {userData.full_name} !
                </Text>
              ) : (
                <View style={{ alignSelf: "center", alignItems: "center" }}>
                  <Text
                    style={commonStyles.textWhite(28, {
                      color: currentThemeSecondaryColor,
                      alignSelf: "center",
                      fontWeight: "700",
                      flexWrap: "wrap",
                      textAlign: "center",
                      marginLeft: moderateScale(14),
                    })}
                  >
                    Welcome,
                  </Text>
                  <Text
                    style={commonStyles.textWhite(28, {
                      color: currentThemeSecondaryColor,
                      alignSelf: "center",
                      fontWeight: "700",
                      flexWrap: "wrap",
                      textAlign: "center",
                      marginLeft: moderateScale(14),
                    })}
                  >
                    {userData.full_name} !
                  </Text>
                </View>
              )}
              <Text
                style={commonStyles.textWhite(20, {
                  color: currentThemeSecondaryColor,
                  alignSelf: "center",
                  marginTop: moderateScale(3),
                  marginLeft: moderateScale(14),
                })}
              >
                {"What's for " + getMeal()}
              </Text>
            </View>
            <Ionicons
              name="search"
              style={styles.searchIcon}
              onPress={showHideSearchRestaurantModal}
            />
          </View>
          <View>
            <View style={styles.distanceContainer}>
              {renderLimitingDistance(1)}
              {renderLimitingDistance(50)}
            </View>
            <Slider
              value={distance}
              onValueChange={(value) => {
                if (value > 0) {
                  setDistance(value);
                  if (isVibrationEnabled) {
                    Vibration.vibrate(50, true);
                  }
                }
              }}
              step={1}
              maximumValue={50}
              minimumTrackTintColor={colors.appPrimary}
              maximumTrackTintColor={colors.grey}
              style={styles.sliderContainer}
              thumbStyle={{
                height: 14,
                width: 14,
                borderRadius: 7,
                backgroundColor: colors.appPrimary,
              }}
            />
            <Text
              style={commonStyles.textWhite(22, {
                color: currentThemeSecondaryColor,
                fontWeight: "600",
                alignSelf: "center",
              })}
            >
              {distance + " "}
              miles
            </Text>
          </View>
          <TouchableOpacity
            style={styles.randomButton(isLoadRandomPosts)}
            onPress={onRandomPress}
          >
            <Text
              style={commonStyles.textWhite(18, {
                fontWeight: "600",
                marginLeft: moderateScale(8),
                color: colors.white,
              })}
            >
              Random
            </Text>
            <FontAwesome name="random" style={styles.randomButtonIcon} />
          </TouchableOpacity>
          <View style={commonStyles.flexFull}>
            {displayedFoodCategories && displayedFoodCategories.length > 0 ? (
              <AppIntroSlider
                data={displayedFoodCategories}
                renderItem={renderSingleCard}
                activeDotStyle={{
                  backgroundColor: colors.appPrimary,
                  height: moderateScale(8),
                  width: moderateScale(8),
                  borderRadius: moderateScale(4),
                  marginTop: moderateScale(55),
                }}
                dotStyle={{
                  backgroundColor: colors.grey,
                  height: moderateScale(8),
                  width: moderateScale(8),
                  borderRadius: moderateScale(4),
                  marginTop: moderateScale(55),
                }}
                onSlideChange={onSlideChange}
                renderDoneButton={() => {
                  return <View />;
                }}
                renderNextButton={() => {
                  return <View />;
                }}
              />
            ) : (
              <View
                style={{
                  minHeight: moderateScale(200),
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={commonStyles.textWhite(16, {
                    color: currentThemeSecondaryColor,
                    textAlign: "center",
                  })}
                >
                  Loading categories...
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.saveButtonContainer}
            onPress={onSavePress}
          >
            <Text
              style={commonStyles.textWhite(18, {
                fontWeight: "600",
                marginLeft: moderateScale(8),
                color: colors.white,
              })}
            >
              Explore places
            </Text>
            <FontAwesome
              name="arrow-right"
              style={{
                fontSize: moderateScale(10),
                color: colors.white,
                marginLeft: moderateScale(12),
              }}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>
      {isDarkModeActive && (
        <LinearGradient
          style={{
            alignItems: "center",
            top: 0,
            zIndex: -1,
            height: windowHeight,
            width: windowWidth,
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
  randomButton: (isLoadRandomPosts) => {
    return {
      flexDirection: "row",
      alignSelf: "center",
      paddingVertical: moderateScale(8),
      paddingHorizontal: moderateScale(12),
      backgroundColor: isLoadRandomPosts ? "#7a7a7a" : colors.appPrimary,
      borderRadius: moderateScale(20),
      marginTop: moderateScale(10),
      alignItems: "center",
      borderWidth: moderateScale(1.4),
      borderColor: isLoadRandomPosts ? colors.green : colors.appPrimary,
    };
  },
  distanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: windowWidth - moderateScale(20),
    alignSelf: "center",
    marginTop: moderateScale(8),
  },
  singleContainer: {
    alignItems: "center",
  },
  singlePinContainer: (currentColor) => {
    return {
      fontSize: 20,
      color: currentColor,
    };
  },
  sliderContainer: {
    marginTop: -moderateScale(5),
    width: windowWidth - moderateScale(25),
    alignSelf: "center",
  },
  foodItemsContainer: {
    minHeight: moderateScale(100),
    width: windowWidth - moderateScale(20),
  },
  searchModalFullContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: `${colors.black}77`,
  },
  searchModalInnerContainer: (currentThemePrimaryColor) => {
    return { flex: 1, backgroundColor: currentThemePrimaryColor };
  },
  closeIcon: { fontSize: 30, color: colors.black, alignSelf: "flex-start" },
  visitNowButton: {
    alignSelf: "center",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
    backgroundColor: colors.appPrimary,
    borderRadius: 12,
    marginBottom: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  titleFullContainer: {
    flexDirection: "row",
    width: windowWidth - moderateScale(20),
    alignItems: "center",
  },
  titleInnerContainer: { flex: 1, alignItems: "center" },
  searchIcon: { color: colors.appPrimary, fontSize: 30 },
  randomButtonIcon: {
    fontSize: moderateScale(10),
    color: colors.white,
    marginLeft: moderateScale(12),
  },
  saveButtonContainer: {
    width: "100%",
    alignSelf: "center",
    paddingVertical: moderateScale(8),
    backgroundColor: colors.appPrimary,
    borderRadius: 24,
    marginVertical: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(50),
    flexDirection: "row",
  },
  filterTabFullComponent: (isDarkModeActive) => {
    return {
      borderRadius: moderateScale(12),
      marginTop: moderateScale(8),
      flexDirection: "row",
      borderWidth: moderateScale(0.7),
      borderColor: isDarkModeActive ? colors.lightGrey : colors.grey,
      alignSelf: "center",
    };
  },
  singleFilterTabContainer: (bool, currentThemePrimaryColor) => {
    return {
      minHeight: moderateScale(24),
      width: windowWidth / 2 - moderateScale(12),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: moderateScale(12),
      backgroundColor: bool ? colors.appPrimary : currentThemePrimaryColor,
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
  googleRowContainer: {},
});
