// Campus Event Reminder - Core Frontend Application
import { AuthService } from "./auth.js";
import { DbService } from "./db.js";
import { calculatePriority } from "./priority.js";
import { processReminderScheduler } from "./email.js";
import { NotificationHelper } from "./notifications.js";
import { IS_DEMO_MODE } from "./config.js";

// ================= STATE MANAGEMENT =================
let currentUser = null;
let userEvents = [];
let countdownInterval = null;
let mainSchedulerInterval = null;
let currentCalendarDate = new Date(); // tracks month/year in calendar view

// DOM Element References
const DOMElements = {
  // Theme toggles
  html: document.documentElement,
  themeToggle: document.getElementById("theme-toggle"),
  themeIconMoon: document.getElementById("theme-icon-moon"),
  themeIconSun: document.getElementById("theme-icon-sun"),

  // Layout Containers
  authContainer: document.getElementById("auth-container"),
  appLayout: document.getElementById("app-layout"),
  sidebar: document.querySelector(".sidebar"),
  mobileHamburger: document.getElementById("mobile-hamburger"),
  sidebarOverlay: document.getElementById("sidebar-overlay"),

  // Auth Forms
  loginForm: document.getElementById("login-form"),
  signupForm: document.getElementById("signup-form"),
  authToggleLogin: document.getElementById("auth-toggle-login"),
  authToggleSignup: document.getElementById("auth-toggle-signup"),

  // Header
  pageTitle: document.getElementById("header-page-title"),
  pageSubtitle: document.getElementById("header-subtitle"),
  clockDisplay: document.getElementById("clock-display"),
  bellBadge: document.getElementById("bell-badge"),

  // Navigation Items
  navItems: document.querySelectorAll(".sidebar-menu .menu-item"),
  logoutItem: document.getElementById("sidebar-logout"),

  // Sections
  viewSections: document.querySelectorAll(".view-section"),

  // Dashboard View
  statTotalVal: document.getElementById("stat-total-val"),
  statUpcomingVal: document.getElementById("stat-upcoming-val"),
  statTodayVal: document.getElementById("stat-today-val"),
  statNearestVal: document.getElementById("stat-nearest-val"),
  nearestTitleText: document.getElementById("nearest-title-text"),
  nearestPriorityBadge: document.getElementById("nearest-priority-badge"),
  nearestDateText: document.getElementById("nearest-date-text"),
  nearestTimeText: document.getElementById("nearest-time-text"),
  nearestVenueText: document.getElementById("nearest-venue-text"),
  cdDays: document.getElementById("cd-days"),
  cdHours: document.getElementById("cd-hours"),
  cdMins: document.getElementById("cd-mins"),
  cdSecs: document.getElementById("cd-secs"),
  dashboardFeedList: document.getElementById("dashboard-feed-list"),
  dashViewAll: document.getElementById("dash-view-all"),

  // Add/Edit Event View
  eventForm: document.getElementById("event-form"),
  eventEditId: document.getElementById("event-edit-id"),
  formActionTitle: document.getElementById("form-action-title"),
  eventTitle: document.getElementById("event-title"),
  eventDescription: document.getElementById("event-description"),
  eventCategory: document.getElementById("event-category"),
  eventReminder: document.getElementById("event-reminder"),
  eventDate: document.getElementById("event-date"),
  eventTime: document.getElementById("event-time"),
  eventVenue: document.getElementById("event-venue"),
  eventFormSubmit: document.getElementById("event-form-submit"),
  eventFormCancel: document.getElementById("event-form-cancel"),

  // Event List View
  eventSearchInput: document.getElementById("event-search-input"),
  filterCategory: document.getElementById("filter-category"),
  filterTimeframe: document.getElementById("filter-timeframe"),
  eventsDisplayGrid: document.getElementById("events-display-grid"),

  // Calendar View
  calendarMonthYear: document.getElementById("calendar-month-year"),
  calendarPrevBtn: document.getElementById("calendar-prev-btn"),
  calendarNextBtn: document.getElementById("calendar-next-btn"),
  calendarGridDaysContainer: document.getElementById("calendar-grid-days-container"),

  // Settings View
  settingsUsername: document.getElementById("settings-username"),
  settingsUseremail: document.getElementById("settings-useremail"),
  settingsLogoutBtn: document.getElementById("settings-logout-btn"),
  settingsPushToggle: document.getElementById("settings-push-toggle"),
  settingsTriggerTest: document.getElementById("settings-trigger-test"),
  settingsDbModeDesc: document.getElementById("settings-db-mode-desc"),
  settingsClearDemo: document.getElementById("settings-clear-demo"),
  demoCleanRow: document.getElementById("demo-clean-row"),

  // Detail Modal
  modalOverlay: document.getElementById("modal-overlay"),
  modalCloseTrigger: document.getElementById("modal-close-trigger"),
  modalDetailTitle: document.getElementById("modal-detail-title"),
  modalDetailPriority: document.getElementById("modal-detail-priority"),
  modalDetailCategory: document.getElementById("modal-detail-category"),
  modalDetailDate: document.getElementById("modal-detail-date"),
  modalDetailTimeReminder: document.getElementById("modal-detail-time-reminder"),
  modalDetailVenue: document.getElementById("modal-detail-venue"),
  modalDetailCountdown: document.getElementById("modal-detail-countdown"),
  modalDetailDesc: document.getElementById("modal-detail-desc"),

  // Feedback Toast
  toastContainer: document.getElementById("toast-container")
};

// ================= TOAST NOTIFICATION SYSTEM =================
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let iconSVG = "";
  if (type === "success") {
    iconSVG = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === "warning") {
    iconSVG = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else if (type === "danger") {
    iconSVG = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSVG}</div>
    <div class="toast-message">${message}</div>
  `;
  
  DOMElements.toastContainer.appendChild(toast);
  
  // Fade out and remove
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initAuthListener();
  setupEventListeners();
});

// Theme Logic
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  DOMElements.html.setAttribute("data-theme", savedTheme);
  updateThemeUI(savedTheme);
}

function updateThemeUI(theme) {
  if (theme === "dark") {
    DOMElements.themeIconMoon.style.display = "none";
    DOMElements.themeIconSun.style.display = "block";
    DOMElements.themeToggle.querySelector("span").textContent = "Light Mode";
  } else {
    DOMElements.themeIconMoon.style.display = "block";
    DOMElements.themeIconSun.style.display = "none";
    DOMElements.themeToggle.querySelector("span").textContent = "Dark Mode";
  }
}

// Authentication Change Listener
function initAuthListener() {
  AuthService.subscribe((user) => {
    currentUser = user;
    if (user) {
      // User is authenticated
      DOMElements.authContainer.style.display = "none";
      DOMElements.appLayout.style.display = "flex";
      
      // Update header profile details
      document.getElementById("user-display-name").textContent = user.name || "Student User";
      document.getElementById("user-avatar").textContent = (user.name || "S").charAt(0).toUpperCase();
      DOMElements.pageSubtitle.textContent = `Welcome back, ${user.name}! Keep tracking your campus schedule.`;
      
      // Load event data
      loadUserEvents();
      
      // Start system intervals
      startIntervals();
      
      // Initialize browser push notification status
      initNotificationToggle();
    } else {
      // User is logged out
      DOMElements.appLayout.style.display = "none";
      DOMElements.authContainer.style.display = "flex";
      stopIntervals();
      userEvents = [];
    }
  });
}

// ================= DATABASE READ & METRICS =================
async function loadUserEvents() {
  if (!currentUser) return;
  try {
    userEvents = await DbService.getEvents(currentUser.uid);
    // Sort events by date & time ascending
    sortEvents();
    
    // Rerender UI panels
    renderDashboard();
    renderEventList();
    renderCalendar();
  } catch (error) {
    showToast("Failed to fetch events from database: " + error.message, "danger");
  }
}

function sortEvents() {
  userEvents.sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
    const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
    return timeA - timeB;
  });
}

// Mark reminder as sent callback (passed to EmailJS runner)
async function markReminderAsSent(eventId) {
  try {
    await DbService.updateEvent(eventId, { reminderSent: true });
    // Update local state
    const index = userEvents.findIndex(e => e.id === eventId);
    if (index !== -1) {
      userEvents[index].reminderSent = true;
    }
    // Update Bell icon visual alert
    DOMElements.bellBadge.classList.add("active");
  } catch (err) {
    console.error("Failed to mark reminder sent in DB", err);
  }
}

// ================= NAVIGATION / ROUTER =================
function switchView(targetSectionId) {
  DOMElements.viewSections.forEach((section) => {
    if (section.id === targetSectionId) {
      section.classList.add("active");
    } else {
      section.classList.remove("active");
    }
  });

  // Update navigation items styling
  DOMElements.navItems.forEach((nav) => {
    if (nav.getAttribute("data-target") === targetSectionId) {
      nav.classList.add("active");
    } else {
      nav.classList.remove("active");
    }
  });

  // Close mobile sidebar if active
  DOMElements.sidebar.classList.remove("active");
  DOMElements.sidebarOverlay.classList.remove("active");

  // Adjust Page Title in Header
  let title = "Dashboard";
  if (targetSectionId === "view-events") title = "Event List";
  if (targetSectionId === "view-add-event") {
    title = DOMElements.eventEditId.value ? "Edit Campus Event" : "Add Campus Event";
  }
  if (targetSectionId === "view-calendar") title = "Calendar Schedule";
  if (targetSectionId === "view-settings") title = "Settings Profile";
  
  DOMElements.pageTitle.textContent = title;
}

// ================= COUNTDOWN ENGINE =================
function getNearestUpcomingEvent() {
  const now = new Date().getTime();
  return userEvents.find((event) => {
    const eventTime = new Date(`${event.date}T${event.time || "00:00"}`).getTime();
    return eventTime > now;
  });
}

function updateLiveCountdowns() {
  // 1. Update Nearest Event Card countdown on Dashboard
  const nearest = getNearestUpcomingEvent();
  if (nearest) {
    DOMElements.statNearestVal.textContent = nearest.title;
    
    // Populate details in card
    DOMElements.nearestTitleText.textContent = nearest.title;
    
    // Priority badge
    const priority = calculatePriority(nearest);
    DOMElements.nearestPriorityBadge.textContent = `${priority.label} Priority`;
    DOMElements.nearestPriorityBadge.className = `badge ${priority.badgeClass}`;

    // Meta details
    DOMElements.nearestDateText.textContent = formatDateString(nearest.date);
    DOMElements.nearestTimeText.textContent = formatTimeString(nearest.time);
    DOMElements.nearestVenueText.textContent = nearest.venue || "TBD";

    // Run timer calculation
    const now = new Date().getTime();
    const eventTime = new Date(`${nearest.date}T${nearest.time || "00:00"}`).getTime();
    const diffMs = eventTime - now;

    if (diffMs > 0) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      DOMElements.cdDays.textContent = String(days).padStart(2, "0");
      DOMElements.cdHours.textContent = String(hours).padStart(2, "0");
      DOMElements.cdMins.textContent = String(mins).padStart(2, "0");
      DOMElements.cdSecs.textContent = String(secs).padStart(2, "0");
    } else {
      clearCountdownDisplay();
    }
  } else {
    DOMElements.statNearestVal.textContent = "None";
    DOMElements.nearestTitleText.textContent = "No Event Scheduled";
    DOMElements.nearestPriorityBadge.className = "badge badge-low";
    DOMElements.nearestPriorityBadge.textContent = "Low";
    DOMElements.nearestDateText.textContent = "--/--/----";
    DOMElements.nearestTimeText.textContent = "--:--";
    DOMElements.nearestVenueText.textContent = "TBD";
    clearCountdownDisplay();
  }

  // 2. Update countdown elements in the Event List (if they are visible)
  const listCountdownElements = document.querySelectorAll("[data-countdown-target]");
  listCountdownElements.forEach((el) => {
    const eventTimeStr = el.getAttribute("data-countdown-target");
    const eventTime = new Date(eventTimeStr).getTime();
    const now = new Date().getTime();
    const diff = eventTime - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      let text = "";
      if (days > 0) text += `${days}d `;
      if (hours > 0 || days > 0) text += `${hours}h `;
      text += `${mins}m ${secs}s`;
      
      el.textContent = text;
    } else {
      el.textContent = "Completed / Past";
      el.style.color = "var(--text-muted)";
    }
  });

  // 3. Update Modal Countdown (if open)
  if (DOMElements.modalOverlay.classList.contains("active")) {
    const modalTarget = DOMElements.modalOverlay.getAttribute("data-modal-event-time");
    if (modalTarget) {
      const targetTime = new Date(modalTarget).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        let text = "";
        if (days > 0) text += `${days} Day${days > 1 ? "s" : ""}, `;
        if (hours > 0 || days > 0) text += `${hours} Hour${hours > 1 ? "s" : ""}, `;
        text += `${mins} Min${mins > 1 ? "s" : ""}, ${secs} Secs remaining`;
        DOMElements.modalDetailCountdown.textContent = text;
        DOMElements.modalDetailCountdown.style.color = "var(--color-primary)";
      } else {
        DOMElements.modalDetailCountdown.textContent = "This event has started or completed.";
        DOMElements.modalDetailCountdown.style.color = "var(--text-muted)";
      }
    }
  }
}

function clearCountdownDisplay() {
  DOMElements.cdDays.textContent = "00";
  DOMElements.cdHours.textContent = "00";
  DOMElements.cdMins.textContent = "00";
  DOMElements.cdSecs.textContent = "00";
}

// ================= RENDER: DASHBOARD =================
function renderDashboard() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const nowTime = now.getTime();

  // Metrics calculation
  const totalEvents = userEvents.length;
  const upcomingEvents = userEvents.filter(e => new Date(`${e.date}T${e.time || "00:00"}`).getTime() > nowTime).length;
  const todayEvents = userEvents.filter(e => e.date === todayStr).length;

  DOMElements.statTotalVal.textContent = totalEvents;
  DOMElements.statUpcomingVal.textContent = upcomingEvents;
  DOMElements.statTodayVal.textContent = todayEvents;

  // Next 3 upcoming events list
  DOMElements.dashboardFeedList.innerHTML = "";
  const upcomingFeed = userEvents.filter(e => new Date(`${e.date}T${e.time || "00:00"}`).getTime() > nowTime).slice(0, 3);

  if (upcomingFeed.length === 0) {
    DOMElements.dashboardFeedList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>No upcoming events scheduled.</p>
      </div>
    `;
  } else {
    upcomingFeed.forEach((event) => {
      const priority = calculatePriority(event);
      const feedItem = document.createElement("div");
      feedItem.className = "feed-item";
      feedItem.style.cursor = "pointer";
      feedItem.addEventListener("click", () => showEventModal(event));

      feedItem.innerHTML = `
        <div class="feed-left">
          <div class="feed-icon">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="feed-info">
            <span class="feed-title">${escapeHTML(event.title)}</span>
            <span class="feed-time">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${formatDateString(event.date)} at ${formatTimeString(event.time)}
            </span>
          </div>
        </div>
        <span class="badge ${priority.badgeClass}">${priority.label}</span>
      `;
      DOMElements.dashboardFeedList.appendChild(feedItem);
    });
  }
}

// ================= RENDER: EVENT LIST =================
function renderEventList() {
  const searchQuery = DOMElements.eventSearchInput.value.toLowerCase().trim();
  const categoryFilter = DOMElements.filterCategory.value;
  const timeframeFilter = DOMElements.filterTimeframe.value;
  
  const now = new Date();
  const nowTime = now.getTime();
  const todayStr = now.toISOString().split("T")[0];

  // Filtering
  const filteredEvents = userEvents.filter((event) => {
    // 1. Search Query
    const matchesSearch = event.title.toLowerCase().includes(searchQuery);
    
    // 2. Category Filter
    const matchesCategory = categoryFilter === "All" || event.category === categoryFilter;

    // 3. Timeframe Filter
    const eventTime = new Date(`${event.date}T${event.time || "00:00"}`).getTime();
    let matchesTimeframe = true;

    if (timeframeFilter === "upcoming") {
      matchesTimeframe = eventTime > nowTime;
    } else if (timeframeFilter === "today") {
      matchesTimeframe = event.date === todayStr;
    } else if (timeframeFilter === "past") {
      matchesTimeframe = eventTime <= nowTime;
    }

    return matchesSearch && matchesCategory && matchesTimeframe;
  });

  DOMElements.eventsDisplayGrid.innerHTML = "";

  if (filteredEvents.length === 0) {
    DOMElements.eventsDisplayGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; background-color: var(--glass-bg); padding: 50px; border-radius: 16px; border: 1px solid var(--glass-border);">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3>No Events Found</h3>
        <p>Try resetting filters or create a new event to get started.</p>
      </div>
    `;
    return;
  }

  filteredEvents.forEach((event) => {
    const priority = calculatePriority(event);
    const eventCard = document.createElement("div");
    eventCard.className = "event-card";

    const eventDateTimeStr = `${event.date}T${event.time || "00:00"}`;

    eventCard.innerHTML = `
      <div class="card-top">
        <h4 class="card-title" title="${escapeHTML(event.title)}" style="cursor:pointer;">${escapeHTML(event.title)}</h4>
        <div class="card-badges">
          <span class="badge ${priority.badgeClass}">${priority.label} Priority</span>
          <span class="badge badge-category">${escapeHTML(event.category)}</span>
        </div>
      </div>
      <p class="card-description" style="cursor:pointer;">${escapeHTML(event.description) || "<i>No additional notes.</i>"}</p>
      <div class="card-details" style="cursor:pointer;">
        <div class="card-details-item">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>${formatDateString(event.date)}</span>
        </div>
        <div class="card-details-item">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>${formatTimeString(event.time)} (Alert ${getReminderText(event.reminderTime)})</span>
        </div>
        <div class="card-details-item">
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${escapeHTML(event.venue)}</span>
        </div>
      </div>
      <div class="card-countdown">
        <div class="countdown-text-container">
          <span class="countdown-main-label">Time Remaining</span>
          <span class="countdown-live-val" data-countdown-target="${eventDateTimeStr}">Calculating...</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action-btn btn-edit" data-id="${event.id}">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>Edit</span>
        </button>
        <button class="card-action-btn btn-delete" data-id="${event.id}">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          <span>Delete</span>
        </button>
      </div>
    `;

    // Click handlers to open full detail modal
    const elementsToTriggerModal = eventCard.querySelectorAll(".card-title, .card-description, .card-details");
    elementsToTriggerModal.forEach(item => {
      item.addEventListener("click", () => showEventModal(event));
    });

    // Action button listeners
    eventCard.querySelector(".btn-edit").addEventListener("click", (e) => {
      e.stopPropagation();
      editEventTrigger(event);
    });

    eventCard.querySelector(".btn-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteEventTrigger(event);
    });

    DOMElements.eventsDisplayGrid.appendChild(eventCard);
  });
}

// Helper: Translate Reminder Value to UI Text
function getReminderText(val) {
  if (val === "1h") return "1 hour before";
  if (val === "6h") return "6 hours before";
  if (val === "1d") return "1 day before";
  if (val === "3d") return "3 days before";
  return val;
}

// ================= RENDER: CALENDAR =================
function renderCalendar() {
  DOMElements.calendarGridDaysContainer.innerHTML = "";
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  // Set header Month Year text
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  DOMElements.calendarMonthYear.textContent = `${monthNames[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay(); // weekday index (0 = Sun, 6 = Sat)
  const lastDay = new Date(year, month + 1, 0).getDate(); // last day of current month
  const prevLastDay = new Date(year, month, 0).getDate(); // last day of previous month

  const today = new Date();
  const isCurrentMonthYear = today.getFullYear() === year && today.getMonth() === month;

  // 1. Render days from previous month to fill the first row grid
  for (let x = firstDayIndex; x > 0; x--) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day-cell other-month";
    dayCell.innerHTML = `<span class="calendar-day-num">${prevLastDay - x + 1}</span>`;
    DOMElements.calendarGridDaysContainer.appendChild(dayCell);
  }

  // 2. Render actual month days
  for (let i = 1; i <= lastDay; i++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day-cell";
    
    const isToday = isCurrentMonthYear && today.getDate() === i;
    if (isToday) {
      dayCell.classList.add("today");
    }

    // Format current date in YYYY-MM-DD
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    
    // Find events matching this day
    const dayEvents = userEvents.filter(e => e.date === dateStr);

    let eventsHtml = "";
    if (dayEvents.length > 0) {
      eventsHtml = `<div class="calendar-day-events">`;
      dayEvents.forEach((ev) => {
        const priority = calculatePriority(ev);
        let prioShort = priority.label.toLowerCase(); // high, medium, low
        eventsHtml += `<div class="calendar-event-dot ${prioShort}" title="${escapeHTML(ev.title)}">${escapeHTML(ev.title)}</div>`;
      });
      eventsHtml += `</div>`;
    }

    dayCell.innerHTML = `
      <span class="calendar-day-num">${i}</span>
      ${eventsHtml}
    `;

    // Click handler for day cell
    dayCell.addEventListener("click", () => {
      if (dayEvents.length === 1) {
        showEventModal(dayEvents[0]);
      } else if (dayEvents.length > 1) {
        // Switch to list view filtered for this date
        DOMElements.eventSearchInput.value = "";
        DOMElements.filterCategory.value = "All";
        DOMElements.filterTimeframe.value = "all";
        
        // Custom search injection or show list
        switchView("view-events");
        
        // Filter elements in UI specifically for this day
        const selectedDateEvents = userEvents.filter(e => e.date === dateStr);
        renderFilteredDayEvents(selectedDateEvents, dateStr);
      }
    });

    DOMElements.calendarGridDaysContainer.appendChild(dayCell);
  }

  // 3. Render empty padding days from next month to fill out the last row grid
  const totalGridItems = firstDayIndex + lastDay;
  const nextMonthCellsCount = (7 - (totalGridItems % 7)) % 7;
  for (let j = 1; j <= nextMonthCellsCount; j++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day-cell other-month";
    dayCell.innerHTML = `<span class="calendar-day-num">${j}</span>`;
    DOMElements.calendarGridDaysContainer.appendChild(dayCell);
  }
}

// Temporary rendering filter for a selected calendar day containing multiple events
function renderFilteredDayEvents(eventsList, dateStr) {
  DOMElements.eventsDisplayGrid.innerHTML = `
    <div style="grid-column: 1 / -1; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="font-weight:600;">Events on ${formatDateString(dateStr)}</h3>
      <button class="submit-btn btn-secondary" id="btn-reset-list-view" style="margin-top:0; padding: 6px 12px; font-size: 0.85rem;">Show All Events</button>
    </div>
  `;
  
  // Re-append events
  eventsList.forEach(event => {
    const priority = calculatePriority(event);
    const eventCard = document.createElement("div");
    eventCard.className = "event-card";
    const eventDateTimeStr = `${event.date}T${event.time || "00:00"}`;

    eventCard.innerHTML = `
      <div class="card-top">
        <h4 class="card-title" title="${escapeHTML(event.title)}" style="cursor:pointer;">${escapeHTML(event.title)}</h4>
        <div class="card-badges">
          <span class="badge ${priority.badgeClass}">${priority.label} Priority</span>
          <span class="badge badge-category">${escapeHTML(event.category)}</span>
        </div>
      </div>
      <p class="card-description" style="cursor:pointer;">${escapeHTML(event.description) || "<i>No notes.</i>"}</p>
      <div class="card-details" style="cursor:pointer;">
        <div class="card-details-item">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>${formatDateString(event.date)}</span>
        </div>
        <div class="card-details-item">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>${formatTimeString(event.time)}</span>
        </div>
        <div class="card-details-item">
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${escapeHTML(event.venue)}</span>
        </div>
      </div>
      <div class="card-countdown">
        <div class="countdown-text-container">
          <span class="countdown-main-label">Time Remaining</span>
          <span class="countdown-live-val" data-countdown-target="${eventDateTimeStr}">Calculating...</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action-btn btn-edit" data-id="${event.id}">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>Edit</span>
        </button>
        <button class="card-action-btn btn-delete" data-id="${event.id}">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          <span>Delete</span>
        </button>
      </div>
    `;

    // Event modals
    const modalTriggers = eventCard.querySelectorAll(".card-title, .card-description, .card-details");
    modalTriggers.forEach(item => item.addEventListener("click", () => showEventModal(event)));
    
    eventCard.querySelector(".btn-edit").addEventListener("click", () => editEventTrigger(event));
    eventCard.querySelector(".btn-delete").addEventListener("click", () => deleteEventTrigger(event));
    DOMElements.eventsDisplayGrid.appendChild(eventCard);
  });

  document.getElementById("btn-reset-list-view").addEventListener("click", () => {
    renderEventList();
  });
}

// ================= ACTION HANDLERS =================

// Form Create or Update Event Submit
DOMElements.eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const editId = DOMElements.eventEditId.value;
  const eventData = {
    title: DOMElements.eventTitle.value,
    description: DOMElements.eventDescription.value,
    category: DOMElements.eventCategory.value,
    reminderTime: DOMElements.eventReminder.value,
    date: DOMElements.eventDate.value,
    time: DOMElements.eventTime.value,
    venue: DOMElements.eventVenue.value
  };

  try {
    if (editId) {
      // Edit mode (Update)
      // If event time/date changed, reset reminderSent flag to false
      const oldEvent = userEvents.find(e => e.id === editId);
      if (oldEvent && (oldEvent.date !== eventData.date || oldEvent.time !== eventData.time)) {
        eventData.reminderSent = false;
      }
      
      await DbService.updateEvent(editId, eventData);
      showToast("Event updated successfully!");
    } else {
      // Add Mode (Create)
      await DbService.createEvent(eventData, currentUser.uid);
      showToast("Event created successfully!");
    }

    // Reset Form
    resetEventForm();
    
    // Reload state
    await loadUserEvents();
    
    // Navigate back to dashboard or event list
    switchView("view-dashboard");
  } catch (error) {
    showToast("Failed to save event: " + error.message, "danger");
  }
});

function resetEventForm() {
  DOMElements.eventForm.reset();
  DOMElements.eventEditId.value = "";
  DOMElements.formActionTitle.innerHTML = `
    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    Create New Campus Event
  `;
  DOMElements.eventFormSubmit.querySelector("span").textContent = "Save Event";
}

// Trigger Form Prepopulation for Edit
function editEventTrigger(event) {
  DOMElements.eventEditId.value = event.id;
  DOMElements.eventTitle.value = event.title;
  DOMElements.eventDescription.value = event.description || "";
  DOMElements.eventCategory.value = event.category;
  DOMElements.eventReminder.value = event.reminderTime || "1d";
  DOMElements.eventDate.value = event.date;
  DOMElements.eventTime.value = event.time;
  DOMElements.eventVenue.value = event.venue || "TBD";

  DOMElements.formActionTitle.innerHTML = `
    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    Modify Campus Event
  `;
  DOMElements.eventFormSubmit.querySelector("span").textContent = "Update Event";
  
  switchView("view-add-event");
}

// Trigger Event Deletion
async function deleteEventTrigger(event) {
  const confirmDelete = confirm(`Are you sure you want to delete the event: "${event.title}"?`);
  if (!confirmDelete) return;

  try {
    await DbService.deleteEvent(event.id);
    showToast("Event deleted successfully.", "success");
    await loadUserEvents();
  } catch (error) {
    showToast("Failed to delete event: " + error.message, "danger");
  }
}

// Detail Modal Overlay Handler
function showEventModal(event) {
  const priority = calculatePriority(event);
  
  DOMElements.modalDetailTitle.textContent = event.title;
  
  // badges
  DOMElements.modalDetailPriority.className = `badge ${priority.badgeClass}`;
  DOMElements.modalDetailPriority.textContent = `${priority.label} Priority`;
  
  DOMElements.modalDetailCategory.textContent = event.category;
  DOMElements.modalDetailDate.textContent = formatDateString(event.date);
  DOMElements.modalDetailTimeReminder.textContent = `${formatTimeString(event.time)} (Reminder ${getReminderText(event.reminderTime)})`;
  DOMElements.modalDetailVenue.textContent = event.venue || "TBA";
  DOMElements.modalDetailDesc.textContent = event.description || "No description provided.";
  
  // Set tracking timestamp for live countdown update inside modal
  const eventDateTimeStr = `${event.date}T${event.time || "00:00"}`;
  DOMElements.modalOverlay.setAttribute("data-modal-event-time", eventDateTimeStr);
  
  // Show modal
  DOMElements.modalOverlay.classList.add("active");
  // Quick run of live timer to align countdown immediately
  updateLiveCountdowns();
}

function hideEventModal() {
  DOMElements.modalOverlay.classList.remove("active");
  DOMElements.modalOverlay.removeAttribute("data-modal-event-time");
}

// ================= AUTH FORMS HANDLERS =================

// Auth Signup Submission
DOMElements.signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPass = document.getElementById("signup-confirm-password").value;

  if (password !== confirmPass) {
    showToast("Passwords do not match.", "danger");
    return;
  }

  try {
    await AuthService.register(email, password, name);
    showToast("Account registered successfully!");
    DOMElements.signupForm.reset();
  } catch (error) {
    showToast(error.message, "danger");
  }
});

// Auth Login Submission
DOMElements.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    await AuthService.login(email, password);
    showToast("Signed in successfully!");
    DOMElements.loginForm.reset();
  } catch (error) {
    showToast(error.message, "danger");
  }
});

// Auth Toggle button actions
DOMElements.authToggleLogin.addEventListener("click", () => {
  DOMElements.authToggleLogin.classList.add("active");
  DOMElements.authToggleSignup.classList.remove("active");
  DOMElements.loginForm.style.display = "flex";
  DOMElements.signupForm.style.display = "none";
});

DOMElements.authToggleSignup.addEventListener("click", () => {
  DOMElements.authToggleSignup.classList.add("active");
  DOMElements.authToggleLogin.classList.remove("active");
  DOMElements.signupForm.style.display = "flex";
  DOMElements.loginForm.style.display = "none";
});

// Settings & Sidebar Logout
async function triggerLogout() {
  try {
    await AuthService.logout();
    showToast("Logged out successfully.");
  } catch (e) {
    showToast("Failed to logout: " + e.message, "danger");
  }
}

// ================= TIMERS AND BACKGROUND TASKS =================
function startIntervals() {
  // 1. Precise 1s timer for live countdowns & clock update
  updateLiveClock();
  updateLiveCountdowns();
  
  countdownInterval = setInterval(() => {
    updateLiveClock();
    updateLiveCountdowns();
  }, 1000);

  // 2. Email Reminder Scheduler Runner - runs every 30 seconds
  runReminderScheduler();
  mainSchedulerInterval = setInterval(() => {
    runReminderScheduler();
  }, 30000);
}

function stopIntervals() {
  if (countdownInterval) clearInterval(countdownInterval);
  if (mainSchedulerInterval) clearInterval(mainSchedulerInterval);
}

function updateLiveClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const formattedHours = String(hours).padStart(2, "0");
  
  DOMElements.clockDisplay.textContent = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
}

async function runReminderScheduler() {
  if (!currentUser || userEvents.length === 0) return;
  // Run logic
  await processReminderScheduler(userEvents, currentUser, markReminderAsSent);
}

// ================= SETTINGS HANDLERS =================
function initNotificationToggle() {
  DOMElements.settingsUsername.textContent = currentUser.name || "Student User";
  DOMElements.settingsUseremail.textContent = currentUser.email;

  // Database Mode description
  DOMElements.settingsDbModeDesc.innerHTML = IS_DEMO_MODE 
    ? "⚠️ Running in <strong>Demo Mock Mode</strong> (LocalStorage persistence)." 
    : "🔥 Running in <strong>Firebase Cloud Mode</strong> (Syncs in real-time).";

  // Hide Clean Demo DB row if in Firebase Mode
  if (!IS_DEMO_MODE) {
    DOMElements.demoCleanRow.style.display = "none";
  } else {
    DOMElements.demoCleanRow.style.display = "flex";
  }

  // Update Notification toggle checkbox
  DOMElements.settingsPushToggle.checked = NotificationHelper.hasPermission();
}

// Request Notification Permission on toggle
DOMElements.settingsPushToggle.addEventListener("change", async (e) => {
  if (e.target.checked) {
    const granted = await NotificationHelper.requestPermission();
    if (granted) {
      showToast("Browser notification alerts enabled!");
    } else {
      showToast("Notification permission was denied by your browser.", "danger");
      e.target.checked = false;
    }
  }
});

// Trigger demo test notification
DOMElements.settingsTriggerTest.addEventListener("click", async () => {
  const granted = await NotificationHelper.requestPermission();
  if (granted) {
    NotificationHelper.show("Test Notification ✅", {
      body: "Browser alerts are working perfectly! You'll receive real-time warnings here.",
    });
    showToast("Test notification sent!");
  } else {
    showToast("Notifications blocked. Enable permission first.", "warning");
  }
});

// Header Bell test action
DOMElements.bellBadge.addEventListener("click", () => {
  DOMElements.bellBadge.classList.remove("active");
  // Query notifications status
  showToast("No new alerts. Your notifications are synchronized.", "success");
});
DOMElements.triggerTestNotif.addEventListener("click", () => {
  DOMElements.bellBadge.classList.remove("active");
});

// Reset local Demo Database
DOMElements.settingsClearDemo.addEventListener("click", () => {
  const confirmClear = confirm("CAUTION: This will delete all users, events, and mock data stored locally in your browser. Proceed?");
  if (!confirmClear) return;
  
  localStorage.clear();
  showToast("Local database has been wiped. Logging out...", "warning");
  setTimeout(() => {
    window.location.reload();
  }, 1000);
});

// ================= GLOBAL EVENT LISTENERS =================
function setupEventListeners() {
  // Sidebar router navigation clicks
  DOMElements.navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-target");
      switchView(target);
    });
  });

  // Sidebar Logout clicks
  DOMElements.logoutItem.addEventListener("click", triggerLogout);
  DOMElements.settingsLogoutBtn.addEventListener("click", triggerLogout);

  // Mobile drawer controls
  DOMElements.mobileHamburger.addEventListener("click", () => {
    DOMElements.sidebar.classList.add("active");
    DOMElements.sidebarOverlay.classList.add("active");
  });

  DOMElements.sidebarOverlay.addEventListener("click", () => {
    DOMElements.sidebar.classList.remove("active");
    DOMElements.sidebarOverlay.classList.remove("active");
  });

  // Dark Mode Toggle Click
  DOMElements.themeToggle.addEventListener("click", () => {
    const currentTheme = DOMElements.html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    DOMElements.html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeUI(newTheme);
    showToast(`Switched to ${newTheme} mode!`);
  });

  // Event Cancel Button
  DOMElements.eventFormCancel.addEventListener("click", () => {
    resetEventForm();
    switchView("view-dashboard");
  });

  // View All events dashboard link redirection
  DOMElements.dashViewAll.addEventListener("click", () => {
    switchView("view-events");
  });

  // Filter input listeners (real-time filtering)
  DOMElements.eventSearchInput.addEventListener("input", renderEventList);
  DOMElements.filterCategory.addEventListener("change", renderEventList);
  DOMElements.filterTimeframe.addEventListener("change", renderEventList);

  // Month navigation in Calendar
  DOMElements.calendarPrevBtn.addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
  });

  DOMElements.calendarNextBtn.addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
  });

  // Close Detail Modal trigger click
  DOMElements.modalCloseTrigger.addEventListener("click", hideEventModal);
  
  // Close Modal on outside click
  DOMElements.modalOverlay.addEventListener("click", (e) => {
    if (e.target === DOMElements.modalOverlay) {
      hideEventModal();
    }
  });
}

// ================= FORMATTER HELPERS =================
function formatDateString(dateStr) {
  if (!dateStr) return "N/A";
  const dateObj = new Date(`${dateStr}T00:00:00`);
  return dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatTimeString(timeStr) {
  if (!timeStr) return "N/A";
  const [hour, min] = timeStr.split(":");
  let formattedHour = parseInt(hour);
  const ampm = formattedHour >= 12 ? "PM" : "AM";
  formattedHour = formattedHour % 12;
  formattedHour = formattedHour ? formattedHour : 12; // 0 to 12
  return `${String(formattedHour).padStart(2, "0")}:${min} ${ampm}`;
}

function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
