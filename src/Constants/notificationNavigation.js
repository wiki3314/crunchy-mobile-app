// Global navigation handler for notifications
let navigationRef = null;
let notificationNavigationHandler = null;

export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

export const setNotificationNavigationHandler = (handler) => {
  notificationNavigationHandler = handler;
};

export const handleNotificationClick = (notificationData) => {
  if (notificationNavigationHandler) {
    notificationNavigationHandler(notificationData);
  } else {
    console.log("⚠️ Notification navigation handler not set yet");
  }
};

