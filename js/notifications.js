// Browser Notification API Helper

export const NotificationHelper = {
  /**
   * Request permission for showing notifications
   * @returns {Promise<boolean>}
   */
  async requestPermission() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notification");
      return false;
    }
    
    if (Notification.permission === "granted") {
      return true;
    }
    
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    
    return false;
  },

  /**
   * Check if notification permission is granted
   * @returns {boolean}
   */
  hasPermission() {
    return "Notification" in window && Notification.permission === "granted";
  },

  /**
   * Show a local browser notification
   * @param {string} title - Title of notification
   * @param {Object} options - Notification options (body, icon, etc.)
   */
  show(title, options = {}) {
    if (!this.hasPermission()) {
      return;
    }

    try {
      const defaultOptions = {
        icon: "/favicon.ico", // fallback placeholder
        badge: "/favicon.ico",
        vibrate: [200, 100, 200],
        tag: "campus-event-reminder",
        renotify: true
      };

      const notificationOptions = { ...defaultOptions, ...options };
      new Notification(title, notificationOptions);
    } catch (e) {
      console.error("Failed to trigger browser notification:", e);
    }
  }
};
