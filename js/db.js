// Firestore Database Integration (with Demo Mode fallback)
import { firebaseConfig, IS_DEMO_MODE } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Initialize Firebase
let firebaseApp = null;
let db = null;

if (!IS_DEMO_MODE) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
  } catch (e) {
    console.error("🔥 Firebase Firestore: Initialization failed", e);
  }
}

// LocalStorage key for Demo Mode
const DEMO_EVENTS_KEY = "campus_reminder_events";

// Helper to get demo events
function getDemoEvents() {
  return JSON.parse(localStorage.getItem(DEMO_EVENTS_KEY)) || [];
}

// Helper to save demo events
function saveDemoEvents(events) {
  localStorage.setItem(DEMO_EVENTS_KEY, JSON.stringify(events));
}

export const DbService = {
  /**
   * Save a new event to database
   * @param {Object} eventData - Form fields
   * @param {string} userId - Auth user ID
   * @returns {Promise<Object>} Saved event with ID
   */
  async createEvent(eventData, userId) {
    const newEvent = {
      userId: userId,
      title: eventData.title,
      description: eventData.description || "",
      category: eventData.category,
      date: eventData.date, // YYYY-MM-DD
      time: eventData.time, // HH:MM
      venue: eventData.venue || "TBD",
      reminderTime: eventData.reminderTime, // "1h", "6h", "1d", "3d"
      reminderSent: false, // track whether EmailJS has sent it
      createdAt: new Date().toISOString()
    };

    if (IS_DEMO_MODE) {
      const events = getDemoEvents();
      newEvent.id = "demo-event-" + Math.random().toString(36).substring(2, 11);
      events.push(newEvent);
      saveDemoEvents(events);
      return newEvent;
    } else {
      const docRef = await addDoc(collection(db, "events"), newEvent);
      newEvent.id = docRef.id;
      return newEvent;
    }
  },

  /**
   * Fetch all events belonging to a user
   * @param {string} userId 
   * @returns {Promise<Array>} List of events
   */
  async getEvents(userId) {
    if (IS_DEMO_MODE) {
      const events = getDemoEvents();
      // Filter by user ID
      return events.filter(e => e.userId === userId);
    } else {
      const q = query(collection(db, "events"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const events = [];
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });
      return events;
    }
  },

  /**
   * Update an existing event
   * @param {string} eventId 
   * @param {Object} updatedFields 
   * @returns {Promise<boolean>}
   */
  async updateEvent(eventId, updatedFields) {
    if (IS_DEMO_MODE) {
      const events = getDemoEvents();
      const index = events.findIndex(e => e.id === eventId);
      if (index === -1) throw new Error("Event not found");
      
      events[index] = { ...events[index], ...updatedFields };
      saveDemoEvents(events);
      return true;
    } else {
      const eventDocRef = doc(db, "events", eventId);
      await updateDoc(eventDocRef, updatedFields);
      return true;
    }
  },

  /**
   * Delete an event from database
   * @param {string} eventId 
   * @returns {Promise<boolean>}
   */
  async deleteEvent(eventId) {
    if (IS_DEMO_MODE) {
      const events = getDemoEvents();
      const updatedEvents = events.filter(e => e.id !== eventId);
      saveDemoEvents(updatedEvents);
      return true;
    } else {
      const eventDocRef = doc(db, "events", eventId);
      await deleteDoc(eventDocRef);
      return true;
    }
  }
};
