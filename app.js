// ============================================================
// LootForward — app.js
// Complete production-grade application logic v2.0 (with Stripe)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getStorage
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";

// ─────────────────────────────────────────────────────────────
// FIREBASE CONFIGURATION
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyADLF3-RuOUP8L8nUXnNBQHHiZFWpQIHe4",
  authDomain: "lootforward.firebaseapp.com",
  projectId: "lootforward",
  storageBucket: "lootforward.firebasestorage.app",
  messagingSenderId: "290775361907",
  appId: "1:290775361907:web:bcff5b0c3326ab93eefd06",
  measurementId: "G-NHMD0BQNYL"
};

const firebaseConfigured = !Object.values(firebaseConfig).some(
  (v) => typeof v === "string" && v.startsWith("YOUR_")
);

let firestore = null;
let storage = null;
let auth = null;

if (firebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  firestore = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  signInAnonymously(auth).catch((e) => console.warn("Anon auth failed:", e.message));
}

// ─────────────────────────────────────────────────────────────
// STRIPE CONFIGURATION
// Replace with your Stripe Publishable Key (pk_test_...) from dashboard.stripe.com
// ─────────────────────────────────────────────────────────────
const STRIPE_PUBLISHABLE_KEY = "pk_test_51Pxxxxxx_YOUR_KEY_HERE";
let stripe = null;
let cardElement = null;

function initStripe() {
  if (window.Stripe && STRIPE_PUBLISHABLE_KEY && !STRIPE_PUBLISHABLE_KEY.includes("YOUR_KEY")) {
    stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements();

    cardElement = elements.create("card", {
      style: {
        base: {
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
          fontSmoothing: "antialiased",
          fontSize: "16px",
          "::placeholder": {
            color: "#a0aec0"
          }
        },
        invalid: {
          color: "#fa755a",
          iconColor: "#fa755a"
        }
      }
    });

    const mountNode = document.querySelector("#stripe-card-element");
    if (mountNode) {
      cardElement.mount("#stripe-card-element");
    }
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN PASSPHRASE
// ─────────────────────────────────────────────────────────────
const DEMO_ADMIN_PASS = "LOOTFORWARD2026";

// ─────────────────────────────────────────────────────────────
// RECIPIENTS DATA
// ─────────────────────────────────────────────────────────────
const recipients = [
  {
    id: "st-jude-gaming-hub",
    name: "St. Jude Children's Hospital Gaming Hub",
    mission: "Create accessible gaming spaces that support hospital-based recreation, connection, and positive downtime for patients.",
    needs: ["Current-generation consoles", "Comfortable controllers", "Headsets", "Gaming monitors"],
    region: "Verified Community Program",
    category: "Pediatric",
    target: 5,
    received: 3,
    targetItem: "PS5 Consoles"
  },
  {
    id: "low-income-esport-lab",
    name: "Low-Income Community Esport Center Lab",
    mission: "Build an affordable esports and digital skills lab for young people who lack reliable access to gaming hardware.",
    needs: ["Gaming PCs", "Mechanical keyboards", "Gaming mice", "Entry-level GPUs"],
    region: "Verified Community Program",
    category: "Youth Education",
    target: 8,
    received: 2,
    targetItem: "Gaming PCs"
  },
  {
    id: "youth-recreation-network",
    name: "Youth Recreation Network Game Room",
    mission: "Equip community recreation centers with shared gaming stations for supervised social play and digital learning.",
    needs: ["PlayStation / Xbox consoles", "TV displays", "Controllers", "Charging docks"],
    region: "Verified Community Program",
    category: "Recreation",
    target: 10,
    received: 7,
    targetItem: "Consoles & Displays"
  }
];

// ─────────────────────────────────────────────────────────────
// DROP-OFF PARTNER LOCATIONS
// ─────────────────────────────────────────────────────────────
const dropOffLocations = [
  { name: "GameStop Memphis — Harbor Town", type: "store", lat: 35.158, lng: -90.042, hours: "Mon–Sat 10am–9pm" },
  { name: "LootForward Chicago Hub", type: "hub", lat: 41.892, lng: -87.631, hours: "Mon–Fri 9am–6pm" },
  { name: "GameStop LA — Koreatown", type: "store", lat: 34.060, lng: -118.300, hours: "Daily 10am–10pm" },
  { name: "Play Again NYC — Brooklyn", type: "hub", lat: 40.678, lng: -73.944, hours: "Tue–Sun 11am–8pm" },
  { name: "GameStop Houston — Midtown", type: "store", lat: 29.748, lng: -95.369, hours: "Mon–Sat 10am–9pm" },
  { name: "LootForward Phoenix Hub", type: "hub", lat: 33.448, lng: -112.074, hours: "Mon–Fri 8am–5pm" },
  { name: "Disc Replay Seattle", type: "store", lat: 47.606, lng: -122.332, hours: "Daily 10am–8pm" },
  { name: "GameStop Boston — Fenway", type: "store", lat: 42.346, lng: -71.100, hours: "Mon–Sat 10am–9pm" }
];

// ─────────────────────────────────────────────────────────────
// GAMIFICATION — BADGE & XP CONFIG
// ─────────────────────────────────────────────────────────────
const BADGE_CONFIG = {
  console: { badge: "Console Rescuing Hero", icon: "🎮", description: "Donated a physical gaming console to a verified community.", xp: 150 },
  gadget: { badge: "Gear Guardian", icon: "🕹️", description: "Donated a gaming gadget or peripheral to a verified community.", xp: 80 },
  money: { badge: "Guild Backer", icon: "💎", description: "Provided direct monetary support to a gaming charity program.", xp: 100 },
  pediatric: { badge: "Hospital Gear Sponsor", icon: "🏥", description: "Donated specifically to a pediatric gaming program. Champion!", xp: 200 },
  pristine: { badge: "Pristine Donor", icon: "⭐", description: "Donated a brand-new or like-new item in perfect condition.", xp: 50 }
};

// ─────────────────────────────────────────────────────────────
// SERIAL NUMBER VALIDATION PATTERNS
// ─────────────────────────────────────────────────────────────
const SERIAL_PATTERNS = [
  { label: "PS5", pattern: /^(CF|SB)[0-9A-Z]{7,9}$/i },
  { label: "Xbox Series", pattern: /^[0-9A-Z]{4}-[0-9A-Z]{4}$/i },
  { label: "Nintendo Switch", pattern: /^(XKW|XAW|XKJ|XAJ)[0-9]{9,11}$/i },
  { label: "PC Component", pattern: /^[A-Z0-9]{10,20}$/i },
  { label: "Hardware", pattern: /^[A-Z0-9\-]{8,22}$/i }
];

// ─────────────────────────────────────────────────────────────
// APPLICATION STATE
// ─────────────────────────────────────────────────────────────
const state = {
  currentPage: "about",
  donationType: "console",
  selectedRecipient: null,
  latestSubmission: null,
  imageHash: null,
  adminUnlocked: false,
  localSubmissions: [],
  xpTotal: 0,
  earnedBadges: []
};

const PAGE_IDS = ["about", "donate", "recipients", "tracking", "confirmation", "admin"];

// ─────────────────────────────────────────────────────────────
// DOM ELEMENT CACHE
// ─────────────────────────────────────────────────────────────
const el = {
  pages: document.querySelectorAll(".page-view"),
  navLinks: document.querySelectorAll("[data-route]"),
  categoryButtons: document.querySelectorAll("[data-donation-type]"),
  tierButtons: document.querySelectorAll("[data-amount]"),
  donationForm: document.querySelector("#donation-form"),
  donationType: document.querySelector("#donation-type"),
  physicalFields: document.querySelector("#physical-fields"),
  moneyFields: document.querySelector("#monetary-fields"),
  itemName: document.querySelector("#item-name"),
  modelNumber: document.querySelector("#model-number"),
  serialNumber: document.querySelector("#serial-number"),
  serialBadge: document.querySelector("#serial-badge"),
  imageHashDisplay: document.querySelector("#image-hash-badge"),
  condition: document.querySelector("#condition"),
  faults: document.querySelector("#faults"),
  proofSnapshot: document.querySelector("#proof-image"),
  amount: document.querySelector("#custom-amount"),
  statementUpload: document.querySelector("#funding-statement"),
  lockedRecipient: document.querySelector("#selected-recipient-name"),
  recipientContext: document.querySelector("#recipient-context"),
  formAlert: document.querySelector("#toast-container"),
  recipientGrid: document.querySelector("#recipient-cards-container"),
  receiptItem: document.querySelector("#receipt-item"),
  receiptType: document.querySelector("#receipt-type"),
  receiptRecipient: document.querySelector("#receipt-recipient"),
  receiptProof: document.querySelector("#receipt-proof"),
  receiptSerial: document.querySelector("#receipt-serial"),
  receiptSerialRow: document.querySelector("#receipt-serial-row"),
  receiptTimestamp: document.querySelector("#receipt-timestamp"),
  receiptTicket: document.querySelector("#receipt-ticket"),
  receiptHash: document.querySelector("#receipt-hash"),
  receiptImageHash: document.querySelector("#receipt-image-hash"),
  navbarCollapse: document.querySelector("#mainNav"),
  hardwareStat: document.querySelector("#hardware-stat"),
  auditStat: document.querySelector("#audit-stat"),
  communityStat: document.querySelector("#community-stat"),
  trackingInput: document.querySelector("#tracking-input"),
  trackingSearchBtn: document.querySelector("#track-btn"),
  trackingResult: document.querySelector("#tracking-result"),
  trackingEmpty: document.querySelector("#tracking-empty"),
  trackingNotFound: document.querySelector("#tracking-not-found"),
  trackTicket: document.querySelector("#track-ticket-badge"),
  trackItem: document.querySelector("#track-item-name"),
  trackRecipient: document.querySelector("#track-recipient"),
  trackDate: document.querySelector("#track-timestamp"),
  trackingStatusMsg: document.querySelector("#tracking-status-msg"),
  stepperSteps: document.querySelectorAll(".step-item"),
  adminAuthGate: document.querySelector("#admin-auth-gate"),
  adminPanel: document.querySelector("#admin-panel"),
  adminPassphrase: document.querySelector("#admin-passphrase"),
  adminUnlockBtn: document.querySelector("#admin-unlock-btn"),
  adminAuthError: document.querySelector("#admin-auth-error"),
  adminLogoutBtn: document.querySelector("#admin-logout-btn"),
  adminQueue: document.querySelector("#admin-queue"),
  pendingCount: document.querySelector("#pending-count"),
  navAdminItem: document.querySelector("#nav-admin-item"),
  badgeAwardSection: document.querySelector("#badge-award-section"),
  xpBarFill: document.querySelector("#xp-bar-fill"),
  xpLabel: document.querySelector("#xp-label"),
  badgeList: document.querySelector("#badge-list"),
  submitBtn: document.querySelector("#submit-btn"),
  downloadCertBtn: document.querySelector("#download-certificate-btn"),
  terminalLive: document.querySelector("#terminal-live"),
  toastContainer: document.querySelector("#toast-container"),
  labelDownloadBtn: document.querySelector("#label-download-btn")
};

// ─────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────
function navigate(page, updateHash = true) {
  if (!PAGE_IDS.includes(page)) page = "about";
  state.currentPage = page;

  el.pages.forEach((view) => {
    view.classList.toggle("active-page", view.dataset.page === page);
  });

  el.navLinks.forEach((link) => {
    const isActive =
      link.dataset.route === page ||
      (page === "confirmation" && link.dataset.route === "about");
    link.classList.toggle("active", isActive);
  });

  if (updateHash && window.location.hash !== `#${page}`) {
    history.pushState({ page }, "", `#${page}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  closeMobileNav();
  updateDonationContext();

  if (page === "admin") onAdminPageLoad();
  if (page === "tracking") resetTrackingUI();
}

function resolveInitialPage() {
  const hash = window.location.hash.replace("#", "").trim();
  return PAGE_IDS.includes(hash) ? hash : "about";
}

function closeMobileNav() {
  if (!el.navbarCollapse || !window.bootstrap) return;
  if (el.navbarCollapse.classList.contains("show")) {
    window.bootstrap.Collapse.getOrCreateInstance(el.navbarCollapse).hide();
  }
}

// ─────────────────────────────────────────────────────────────
// DONATION CONTEXT
// ─────────────────────────────────────────────────────────────
function updateDonationContext() {
  if (state.selectedRecipient) {
    el.lockedRecipient.textContent = state.selectedRecipient.name;
    el.recipientContext.textContent =
      `Recipient locked: ${state.selectedRecipient.name}. You can change this target at any time before submission.`;
  } else {
    el.lockedRecipient.textContent = "No recipient selected";
    el.recipientContext.textContent = "Choose a verified recipient first, or select one below.";
  }
}

function selectRecipient(recipientId) {
  const recipient = recipients.find((r) => r.id === recipientId);
  if (!recipient) return;
  state.selectedRecipient = recipient;
  updateDonationContext();
  showToast(`🎯 Recipient locked: ${recipient.name}`, "success");
  navigate("donate");
}

// ─────────────────────────────────────────────────────────────
// RECIPIENT CARDS
// ─────────────────────────────────────────────────────────────
function renderRecipients() {
  if (!el.recipientGrid) return;
  el.recipientGrid.innerHTML = recipients.map((r) => {
    const pct = Math.min(Math.round((r.received / r.target) * 100), 100);
    const barColor = pct >= 80 ? "#6effb2" : pct >= 40 ? "#00f2fe" : "#9b51e0";

    return `
      <div class="col-md-6 col-xl-4">
        <article class="recipient-card h-100 glass-panel p-4">
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <span class="badge bg-secondary">${escapeHtml(r.region)}</span>
            <span class="badge bg-primary">${escapeHtml(r.category