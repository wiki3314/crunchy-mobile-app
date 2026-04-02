module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: false
    },
    android: {}
  },
  assets: ['./assets/fonts/'],
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
      },
    },
  },
};