# 📅 Campus Event Reminder

A responsive, modern web application designed to help students track college exams, placements, hackathons, and other events. Built with a stunning **glassmorphism user interface**, real-time **Firebase Cloud synchronization**, and **EmailJS** reminder integration.

---

## ✨ Features

- **🎨 Modern Glassmorphism UI:** A sleek sidebar-oriented interface with fluid animations, glowing ambient backdrops, and interactive hover feedback. Supports **Light Mode** and **Dark Mode** with custom pastel palettes.
- **🔐 Firebase Authentication:** Real-time sign-up, sign-in, and sign-out using Firebase Auth (Email/Password).
- **🗄️ Firestore Database Integration:** Syncs and persists events dynamically in the cloud for authenticated users.
- **⚡ Priority Score Engine:** Automatically computes a priority score (Low, Medium, High) based on category, remaining time, and user-defined reminder offsets.
- **⏰ Live Countdown Timer:** Displays an active ticking countdown for the closest upcoming event.
- **📅 Monthly Interactive Calendar:** Dynamic calendar indicating days with events and providing quick detail view overlays.
- **📨 Email JS Reminders:** Dispatches reminder emails automatically before events.
- **🔔 Desktop Banner Notifications:** Desktop push notification alerts to notify students before deadlines.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, Custom Vanilla CSS, ES6 JavaScript Modules
- **Backend-as-a-Service:** Firebase Authentication, Cloud Firestore
- **Notifications:** EmailJS API, Web Notifications API
- **Deployment & Hosting:** Firebase Hosting compatible

---

## 🚀 Setup & Local Execution

### 1. Prerequisites
You need a local server environment (like Node.js or Python) to run the ES6 Modules without CORS errors.

### 2. Clone the Repository
```bash
git clone https://github.com/chubhi24/Campus-Event-Reminder.git
cd Campus-Event-Reminder
```

### 3. Configure API Credentials
For security, the live credentials file (`js/config.js`) is ignored by Git. Set up your local configuration by duplicating the template:
1. Make a copy of `js/config.example.js` and rename it to `js/config.js`.
2. Fill in your Firebase Web App configuration:
   ```javascript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
3. Set up your EmailJS keys to receive real email alerts:
   ```javascript
   export const emailjsConfig = {
     publicKey: "YOUR_PUBLIC_KEY",
     serviceId: "YOUR_SERVICE_ID",
     templateId: "YOUR_TEMPLATE_ID"
   };
   ```

### 4. Run the Local Server
Start serving the folder:
```bash
# Using Node.js http-server (runs at http://localhost:8080)
npx http-server . -p 8080 -c-1

# OR using Python
python3 -m http.server 8080
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 🔒 Security Note
Do **not** commit your `js/config.js` containing live Firebase API keys. A pre-configured `.gitignore` is included in this repository to prevent credentials leak.
