// Event Priority Score calculation logic

/**
 * Calculates the priority score and returns level details.
 * @param {Object} event - The event object
 * @param {string} event.category - Event category
 * @param {string} event.date - Event date (YYYY-MM-DD)
 * @param {string} event.time - Event time (HH:MM)
 * @param {string} event.reminderTime - Reminder setting ("1h", "6h", "1d", "3d")
 * @returns {Object} { score, label, badgeClass }
 */
export function calculatePriority(event) {
  // 1. Category Score (Max 40 points)
  let categoryScore = 10;
  const category = event.category ? event.category.toLowerCase() : "";
  if (category === "exam" || category === "placement drive") {
    categoryScore = 40;
  } else if (category === "hackathon" || category === "workshop" || category === "club meeting") {
    categoryScore = 25;
  } else if (category === "seminar" || category === "other") {
    categoryScore = 10;
  }

  // 2. Time Score (Max 30 points)
  let timeScore = 5;
  if (event.date) {
    const eventDateTime = new Date(`${event.date}T${event.time || "00:00"}`);
    const now = new Date();
    const diffMs = eventDateTime - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffMs <= 0) {
      timeScore = 5; // Passed event
    } else if (diffDays < 1) {
      timeScore = 30; // Less than 24 hours
    } else if (diffDays < 3) {
      timeScore = 15; // Less than 3 days
    } else {
      timeScore = 5;  // 3 or more days
    }
  }

  // 3. Reminder Urgency Score (Max 30 points)
  let reminderScore = 5;
  const reminder = event.reminderTime || "";
  if (reminder === "1h" || reminder === "6h") {
    reminderScore = 30;
  } else if (reminder === "1d") {
    reminderScore = 15;
  } else if (reminder === "3d") {
    reminderScore = 5;
  }

  const totalScore = categoryScore + timeScore + reminderScore;

  let label = "Low";
  let badgeClass = "badge-low";
  
  if (totalScore >= 70) {
    label = "High";
    badgeClass = "badge-high";
  } else if (totalScore >= 40) {
    label = "Medium";
    badgeClass = "badge-medium";
  }

  return {
    score: totalScore,
    label: label,
    badgeClass: badgeClass
  };
}
