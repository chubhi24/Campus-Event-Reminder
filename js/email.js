// EmailJS Integration and Client-Side Reminder Scheduler
import { emailjsConfig, IS_EMAIL_DEMO } from "./config.js";
import { NotificationHelper } from "./notifications.js";

// Initialize EmailJS if not in email demo mode
if (!IS_EMAIL_DEMO) {
  try {
    // We assume the EmailJS CDN script is loaded in index.html
    // emailjs.init(publicKey);
    if (window.emailjs) {
      window.emailjs.init(emailjsConfig.publicKey);
      console.log("📨 EmailJS: Initialized successfully.");
    } else {
      console.error("📨 EmailJS: SDK script not found on window object.");
    }
  } catch (e) {
    console.error("📨 EmailJS: Initialization failed", e);
  }
}

/**
 * Sends a reminder email via EmailJS
 * @param {Object} event - The event object
 * @param {Object} user - The current logged in user
 * @param {string} countdownText - Current countdown text to display in email
 * @returns {Promise<boolean>}
 */
export async function sendReminderEmail(event, user, countdownText) {
  const templateParams = {
    event_name: event.title,
    event_date: event.date,
    event_time: event.time,
    event_venue: event.venue,
    event_category: event.category,
    countdown_remaining: countdownText,
    to_email: user.email,
    to_name: user.name || user.email.split("@")[0],
    reply_to: "no-reply@campus-event-reminder.com"
  };

  if (IS_EMAIL_DEMO) {
    console.log(`%c📨 [DEMO EMAIL SENT] To: ${templateParams.to_email} | Event: ${templateParams.event_name} | Venue: ${templateParams.event_venue} | Countdown: ${templateParams.countdown_remaining}`, "color: #9b5de5; font-weight: bold; font-size: 11px;");
    return true;
  }

  try {
    if (!window.emailjs) {
      throw new Error("EmailJS SDK is not loaded.");
    }

    const response = await window.emailjs.send(
      emailjsConfig.serviceId,
      emailjsConfig.templateId,
      templateParams
    );
    
    console.log("📨 EmailJS: Reminder email sent successfully!", response.status, response.text);
    return true;
  } catch (error) {
    console.error("📨 EmailJS: Failed to send reminder email", error);
    return false;
  }
}

/**
 * Helper to calculate time remaining in words
 */
function getRemainingTimeText(diffMs) {
  if (diffMs <= 0) return "Starting now / Ended";
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ${diffHours % 24} hour${diffHours % 24 > 1 ? "s" : ""}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ${diffMins % 60} minute${diffMins % 60 > 1 ? "s" : ""}`;
  } else {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ${diffSecs % 60} second${diffSecs % 60 > 1 ? "s" : ""}`;
  }
}

/**
 * Iterates through all events and triggers reminders if eligible
 * @param {Array} events - List of all user events
 * @param {Object} user - The currently authenticated user
 * @param {Function} markAsSentCallback - DB function to flag reminder as sent
 */
export async function processReminderScheduler(events, user, markAsSentCallback) {
  if (!events || events.length === 0 || !user) return;

  const now = new Date().getTime();

  for (const event of events) {
    // Skip if reminder already sent or event passed
    if (event.reminderSent) continue;

    const eventDateTimeStr = `${event.date}T${event.time || "00:00"}`;
    const eventTime = new Date(eventDateTimeStr).getTime();
    
    if (eventTime <= now) {
      // Event is already in progress or completed, mark as sent so we don't try again
      await markAsSentCallback(event.id);
      continue;
    }

    // Determine offset in milliseconds
    let offsetMs = 0;
    const reminder = event.reminderTime || "1d";
    if (reminder === "1h") {
      offsetMs = 1 * 60 * 60 * 1000;
    } else if (reminder === "6h") {
      offsetMs = 6 * 60 * 60 * 1000;
    } else if (reminder === "1d") {
      offsetMs = 24 * 60 * 60 * 1000;
    } else if (reminder === "3d") {
      offsetMs = 3 * 24 * 60 * 60 * 1000;
    }

    const reminderTriggerTime = eventTime - offsetMs;

    // Trigger reminder if current time is past the trigger time
    if (now >= reminderTriggerTime) {
      const countdownText = getRemainingTimeText(eventTime - now);
      
      console.log(`⏰ Reminder trigger met for event: "${event.title}". Sending...`);

      // 1. Send Email
      const emailSuccess = await sendReminderEmail(event, user, countdownText);

      if (emailSuccess) {
        // 2. Show Browser Notification
        NotificationHelper.show(`Event Reminder: ${event.title}`, {
          body: `Happening in ${countdownText} at ${event.venue || "TBA"}.`,
          tag: `event-${event.id}`
        });

        // 3. Mark in DB to prevent duplicates
        await markAsSentCallback(event.id);
      }
    }
  }
}
