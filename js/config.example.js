// Campus Event Reminder - Configuration Template
// Duplicate this file, rename it to config.js, and fill in your actual credentials.

export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

export const emailjsConfig = {
  publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
  serviceId: "YOUR_EMAILJS_SERVICE_ID",
  templateId: "YOUR_EMAILJS_TEMPLATE_ID"
};

// Check if database configuration is updated or if we should run in local Demo Mode.
export const IS_DEMO_MODE = 
  firebaseConfig.apiKey.includes("YOUR_FIREBASE") ||
  firebaseConfig.projectId.includes("YOUR_FIREBASE");

// Check if EmailJS configuration is updated or if we should run in simulated email mode.
export const IS_EMAIL_DEMO = 
  emailjsConfig.publicKey.includes("YOUR_EMAILJS");

if (IS_DEMO_MODE) {
  console.warn("⚠️ Campus Event Reminder: Database is in DEMO MODE. LocalStorage is used for Auth and DB.");
} else {
  console.log("🔥 Campus Event Reminder: Database is in Firebase Cloud Mode.");
}

if (IS_EMAIL_DEMO) {
  console.warn("⚠️ Campus Event Reminder: Email notifications are SIMULATED. Update EmailJS config in config.js to send real emails.");
} else {
  console.log("📨 Campus Event Reminder: Real Email notifications are ENABLED.");
}
