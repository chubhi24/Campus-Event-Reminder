// Firebase Authentication Helper (with Demo Mode fallback)
import { firebaseConfig, IS_DEMO_MODE } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Initialize Firebase
let firebaseApp = null;
let auth = null;

if (!IS_DEMO_MODE) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
  } catch (e) {
    console.error("🔥 Firebase Auth: Initialization failed", e);
  }
}

// Keep track of auth callbacks (for SPA state routing)
const authListeners = [];

// LocalStorage Keys for Demo Mode
const DEMO_USERS_KEY = "campus_reminder_users";
const DEMO_SESSION_KEY = "campus_reminder_session";

// Helper to get demo users
function getDemoUsers() {
  return JSON.parse(localStorage.getItem(DEMO_USERS_KEY)) || [];
}

// Helper to save demo users
function saveDemoUsers(users) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

// Initialize Authentication logic
export const AuthService = {
  /**
   * Register a new user
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   * @returns {Promise<Object>} The user object
   */
  async register(email, password, name) {
    if (IS_DEMO_MODE) {
      const users = getDemoUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("User already exists with this email.");
      }
      
      const newUser = {
        uid: "demo-uid-" + Math.random().toString(36).substring(2, 11),
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      saveDemoUsers(users);

      // Log in
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(newUser));
      this._notifyListeners(newUser);
      return newUser;
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      await updateProfile(userCredential.user, { displayName: name });
      
      // Save user profile metadata to Firestore (will be handled by db.js or app.js if needed, 
      // but Firebase Auth contains user profile data directly)
      const user = userCredential.user;
      return {
        uid: user.uid,
        name: user.displayName,
        email: user.email
      };
    }
  },

  /**
   * Log in user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} The user object
   */
  async login(email, password) {
    if (IS_DEMO_MODE) {
      const users = getDemoUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      // Simple validation for Demo Mode
      if (!user) {
        throw new Error("No user found with this email. Please register.");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      // Log in
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
      this._notifyListeners(user);
      return user;
    } else {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      return {
        uid: user.uid,
        name: user.displayName,
        email: user.email
      };
    }
  },

  /**
   * Log out user
   */
  async logout() {
    if (IS_DEMO_MODE) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      this._notifyListeners(null);
    } else {
      await signOut(auth);
    }
  },

  /**
   * Subscribe to authentication changes (e.g. login/logout)
   * @param {Function} callback - Callback function receiving user object or null
   */
  subscribe(callback) {
    authListeners.push(callback);
    
    if (IS_DEMO_MODE) {
      // Trigger immediately with current demo session
      const session = localStorage.getItem(DEMO_SESSION_KEY);
      const user = session ? JSON.parse(session) : null;
      callback(user);
    } else {
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          callback({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
            email: firebaseUser.email
          });
        } else {
          callback(null);
        }
      });
    }
  },

  /**
   * Notify custom listeners (mostly for Demo Mode updates)
   * @private
   */
  _notifyListeners(user) {
    authListeners.forEach(callback => {
      try {
        callback(user);
      } catch (e) {
        console.error("Error in auth listener callback", e);
      }
    });
  }
};
