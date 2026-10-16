// ============================================================
// LootForward — app.js
// Complete production-grade application logic v2.0
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
// Replace with your own project credentials before deploying.
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyADLF3-RuOUP8L8nUXnNBQHHiZFWpQIHe4",
  authDomain:        "lootforward.firebaseapp.com",
  projectId:         "lootforward",
  storageBucket:     "lootforward.firebasestorage.app",
  messagingSenderId: "290775361907",
  appId:             "1:290775361907:web:bcff5b0c3326ab93eefd06",
  measurementId:     "G-NHMD0BQNYL"
};

const firebaseConfigured = !Object.values(firebaseConfig).some(
  (v) => typeof v === "string" && v.startsWith("YOUR_")
);

let firestore = null;
let storage   = null;
let auth      = null;

if (firebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  firestore  = getFirestore(app);
  storage    = getStorage(app);
  auth       = getAuth(app);
  signInAnonymously(auth).catch((e) => console.warn("Anon auth failed:", e.message));
}

// ─────────────────────────────────────────────────────────────
// ADMIN PASSPHRASE
// Demo only — replace with Firebase Custom Claims in production.
// ─────────────────────────────────────────────────────────────
const DEMO_ADMIN_PASS = "LOOTFORWARD2026";

// ─────────────────────────────────────────────────────────────
// RECIPIENTS DATA
// In production these would be loaded from Firestore.
// ─────────────────────────────────────────────────────────────
const recipients = [
  {
    id:          "st-jude-gaming-hub",
    name:        "St. Jude Children's Hospital Gaming Hub",
    mission:     "Create accessible gaming spaces that support hospital-based recreation, connection, and positive downtime for patients.",
    needs:       ["Current-generation consoles", "Comfortable controllers", "Headsets", "Gaming monitors"],
    region:      "Verified Community Program",
    category:    "Pediatric",
    target:      5,
    received:    3,
    targetItem:  "PS5 Consoles"
  },
  {
    id:          "low-income-esport-lab",
    name:        "Low-Income Community Esport Center Lab",
    mission:     "Build an affordable esports and digital skills lab for young people who lack reliable access to gaming hardware.",
    needs:       ["Gaming PCs", "Mechanical keyboards", "Gaming mice", "Entry-level GPUs"],
    region:      "Verified Community Program",
    category:    "Youth Education",
    target:      8,
    received:    2,
    targetItem:  "Gaming PCs"
  },
  {
    id:          "youth-recreation-network",
    name:        "Youth Recreation Network Game Room",
    mission:     "Equip community recreation centers with shared gaming stations for supervised social play and digital learning.",
    needs:       ["PlayStation / Xbox consoles", "TV displays", "Controllers", "Charging docks"],
    region:      "Verified Community Program",
    category:    "Recreation",
    target:      10,
    received:    7,
    targetItem:  "Consoles & Displays"
  }
];

// ─────────────────────────────────────────────────────────────
// DROP-OFF PARTNER LOCATIONS  (Leaflet map markers)
// ─────────────────────────────────────────────────────────────
const dropOffLocations = [
  { name: "GameStop Memphis — Harbor Town",   type: "store", lat: 35.158, lng: -90.042, hours: "Mon–Sat 10am–9pm"  },
  { name: "LootForward Chicago Hub",          type: "hub",   lat: 41.892, lng: -87.631, hours: "Mon–Fri 9am–6pm"   },
  { name: "GameStop LA — Koreatown",          type: "store", lat: 34.060, lng: -118.300,hours: "Daily 10am–10pm"   },
  { name: "Play Again NYC — Brooklyn",        type: "hub",   lat: 40.678, lng: -73.944, hours: "Tue–Sun 11am–8pm"  },
  { name: "GameStop Houston — Midtown",       type: "store", lat: 29.748, lng: -95.369, hours: "Mon–Sat 10am–9pm"  },
  { name: "LootForward Phoenix Hub",          type: "hub",   lat: 33.448, lng: -112.074,hours: "Mon–Fri 8am–5pm"   },
  { name: "Disc Replay Seattle",              type: "store", lat: 47.606, lng: -122.332,hours: "Daily 10am–8pm"    },
  { name: "GameStop Boston — Fenway",         type: "store", lat: 42.346, lng: -71.100, hours: "Mon–Sat 10am–9pm"  }
];

// ─────────────────────────────────────────────────────────────
// GAMIFICATION — BADGE & XP CONFIG
// ─────────────────────────────────────────────────────────────
const BADGE_CONFIG = {
  console:   { badge: "Console Rescuing Hero",   icon: "🎮", description: "Donated a physical gaming console to a verified community.",         xp: 150 },
  gadget:    { badge: "Gear Guardian",            icon: "🕹️", description: "Donated a gaming gadget or peripheral to a verified community.",      xp: 80  },
  money:     { badge: "Guild Backer",             icon: "💎", description: "Provided direct monetary support to a gaming charity program.",        xp: 100 },
  pediatric: { badge: "Hospital Gear Sponsor",    icon: "🏥", description: "Donated specifically to a pediatric gaming program. Champion!",       xp: 200 },
  pristine:  { badge: "Pristine Donor",           icon: "⭐", description: "Donated a brand-new or like-new item in perfect condition.",           xp: 50  }
};

// ─────────────────────────────────────────────────────────────
// SERIAL NUMBER VALIDATION PATTERNS
// ─────────────────────────────────────────────────────────────
const SERIAL_PATTERNS = [
  { label: "PS5",              pattern: /^(CF|SB)[0-9A-Z]{7,9}$/i      },
  { label: "Xbox Series",      pattern: /^[0-9A-Z]{4}-[0-9A-Z]{4}$/i   },
  { label: "Nintendo Switch",  pattern: /^(XKW|XAW|XKJ|XAJ)[0-9]{9,11}$/i },
  { label: "PC Component",     pattern: /^[A-Z0-9]{10,20}$/i            },
  { label: "Hardware",         pattern: /^[A-Z0-9\-]{8,22}$/i           }
];

// ─────────────────────────────────────────────────────────────
// APPLICATION STATE
// ─────────────────────────────────────────────────────────────
const state = {
  currentPage:      "about",
  donationType:     "console",
  selectedRecipient: null,
  latestSubmission:  null,
  imageHash:         null,
  adminUnlocked:     false,
  localSubmissions:  [],     // In-memory queue (persisted to Firestore when configured)
  xpTotal:           0,
  earnedBadges:      []
};

const PAGE_IDS = ["about", "donate", "recipients", "tracking", "confirmation", "admin"];

// ─────────────────────────────────────────────────────────────
// DOM ELEMENT CACHE
// ─────────────────────────────────────────────────────────────
const el = {
  pages:             document.querySelectorAll(".page-view"),
  navLinks:          document.querySelectorAll("[data-route]"),
  categoryButtons:   document.querySelectorAll("[data-donation-type]"),
  tierButtons:       document.querySelectorAll("[data-amount]"),
  donationForm:      document.querySelector("#donation-form"),
  donationType:      document.querySelector("#donation-type"),
  physicalFields:    document.querySelector("#physical-fields"),
  moneyFields:       document.querySelector("#money-fields"),
  itemName:          document.querySelector("#item-name"),
  modelNumber:       document.querySelector("#model-number"),
  serialNumber:      document.querySelector("#serial-number"),
  serialBadge:       document.querySelector("#serial-badge"),
  imageHashDisplay:  document.querySelector("#image-hash-display"),
  condition:         document.querySelector("#condition"),
  faults:            document.querySelector("#faults"),
  proofSnapshot:     document.querySelector("#proof-snapshot"),
  amount:            document.querySelector("#amount"),
  statementUpload:   document.querySelector("#statement-upload"),
  lockedRecipient:   document.querySelector("#locked-recipient"),
  recipientContext:  document.querySelector("#recipient-context"),
  formAlert:         document.querySelector("#form-alert"),
  recipientGrid:     document.querySelector("#recipient-grid"),
  receiptItem:       document.querySelector("#receipt-item"),
  receiptType:       document.querySelector("#receipt-type"),
  receiptRecipient:  document.querySelector("#receipt-recipient"),
  receiptProof:      document.querySelector("#receipt-proof"),
  receiptSerial:     document.querySelector("#receipt-serial"),
  receiptSerialRow:  document.querySelector("#receipt-serial-row"),
  receiptTimestamp:  document.querySelector("#receipt-timestamp"),
  receiptTicket:     document.querySelector("#receipt-ticket"),
  receiptHash:       document.querySelector("#receipt-hash"),
  receiptImageHash:  document.querySelector("#receipt-image-hash"),
  navbarCollapse:    document.querySelector("#mainNav"),
  hardwareStat:      document.querySelector("#hardware-stat"),
  auditStat:         document.querySelector("#audit-stat"),
  communityStat:     document.querySelector("#community-stat"),
  trackingInput:     document.querySelector("#tracking-input"),
  trackingSearchBtn: document.querySelector("#tracking-search-btn"),
  trackingResult:    document.querySelector("#tracking-result"),
  trackingEmpty:     document.querySelector("#tracking-empty"),
  trackingNotFound:  document.querySelector("#tracking-not-found"),
  trackTicket:       document.querySelector("#track-ticket"),
  trackItem:         document.querySelector("#track-item"),
  trackRecipient:    document.querySelector("#track-recipient"),
  trackDate:         document.querySelector("#track-date"),
  trackingStatusMsg: document.querySelector("#tracking-status-msg"),
  stepperSteps:      document.querySelectorAll(".stepper-step"),
  adminAuthGate:     document.querySelector("#admin-auth-gate"),
  adminPanel:        document.querySelector("#admin-panel"),
  adminPassphrase:   document.querySelector("#admin-passphrase"),
  adminUnlockBtn:    document.querySelector("#admin-unlock-btn"),
  adminAuthError:    document.querySelector("#admin-auth-error"),
  adminLogoutBtn:    document.querySelector("#admin-logout-btn"),
  adminQueue:        document.querySelector("#admin-queue"),
  pendingCount:      document.querySelector("#pending-count"),
  navAdminItem:      document.querySelector("#nav-admin-item"),
  badgeAwardSection: document.querySelector("#badge-award-section"),
  xpBarFill:         document.querySelector("#xp-bar-fill"),
  xpLabel:           document.querySelector("#xp-label"),
  badgeList:         document.querySelector("#badge-list"),
  submitBtn:         document.querySelector("#submit-btn"),
  submitLabel:       document.querySelector("#submit-label"),
  submitSpinner:     document.querySelector("#submit-spinner"),
  downloadCertBtn:   document.querySelector("#download-certificate-btn"),
  terminalLive:      document.querySelector("#terminal-live"),
  toastContainer:    document.querySelector("#toast-container"),
  labelDownloadBtn:  document.querySelector("#label-download-btn")
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

  if (page === "admin")    onAdminPageLoad();
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
// RECIPIENT CARDS WITH PROGRESS METERS
// ─────────────────────────────────────────────────────────────
function renderRecipients() {
  el.recipientGrid.innerHTML = recipients.map((r) => {
    const pct = Math.min(Math.round((r.received / r.target) * 100), 100);
    const barColor = pct >= 80 ? "#6effb2" : pct >= 40 ? "#00f2fe" : "#9b51e0";

    return `
      <div class="col-md-6 col-xl-4">
        <article class="recipient-card h-100">
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <span class="recipient-badge">${escapeHtml(r.region)}</span>
            <span class="recipient-category-tag">${escapeHtml(r.category)}</span>
          </div>
          <h3>${escapeHtml(r.name)}</h3>
          <p>${escapeHtml(r.mission)}</p>

          <strong class="stat-label">CURRENT NEEDS</strong>
          <ul class="needs-list">
            ${r.needs.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}
          </ul>

          <div class="progress-meter-wrap">
            <div class="d-flex justify-content-between align-items-baseline mb-1">
              <span class="progress-label">${escapeHtml(r.targetItem)}</span>
              <span class="progress-count">${r.received}/${r.target} Received</span>
            </div>
            <div class="progress-track" role="progressbar"
                 aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
                 aria-label="${r.targetItem} progress">
              <div class="progress-fill" style="width:${pct}%;background:${barColor}"></div>
            </div>
          </div>

          <button type="button" class="btn btn-neon w-100 mt-3"
                  data-select-recipient="${escapeHtml(r.id)}">
            Select Recipient
          </button>
        </article>
      </div>
    `;
  }).join("");
}

// ─────────────────────────────────────────────────────────────
// CATEGORY SWITCHER
// ─────────────────────────────────────────────────────────────
function setDonationType(type) {
  if (!["console", "gadget", "money"].includes(type)) return;
  state.donationType   = type;
  el.donationType.value = type;

  el.categoryButtons.forEach((btn) => {
    const active = btn.dataset.donationType === type;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  const isPhysical = type !== "money";
  el.physicalFields.classList.toggle("active-form-panel", isPhysical);
  el.moneyFields.classList.toggle("active-form-panel", !isPhysical);

  setRequired(el.itemName,      isPhysical);
  setRequired(el.modelNumber,   isPhysical);
  setRequired(el.serialNumber,  isPhysical);
  setRequired(el.condition,     isPhysical);
  setRequired(el.proofSnapshot, isPhysical);
  setRequired(el.amount,        !isPhysical);
  setRequired(el.statementUpload, !isPhysical);

  clearFormAlert();
}

function setRequired(element, required) {
  if (!element) return;
  element.required = required;
  element.setAttribute("aria-required", String(required));
}

// ─────────────────────────────────────────────────────────────
// SERIAL NUMBER VALIDATION (client-side anti-fraud)
// ─────────────────────────────────────────────────────────────
function validateSerial(serial) {
  const cleaned = serial.trim().toUpperCase();
  for (const { pattern, label } of SERIAL_PATTERNS) {
    if (pattern.test(cleaned)) return { valid: true, label };
  }
  return { valid: false, label: null };
}

function updateSerialBadge(serial) {
  if (!serial.trim()) {
    el.serialBadge.className = "serial-validation-badge d-none";
    return;
  }
  const { valid, label } = validateSerial(serial);
  el.serialBadge.classList.remove("d-none");

  if (valid) {
    el.serialBadge.className = "serial-validation-badge serial-valid";
    el.serialBadge.textContent = `✓ Valid ${label} serial format`;
    el.serialNumber.classList.remove("is-invalid");
  } else {
    el.serialBadge.className = "serial-validation-badge serial-invalid";
    el.serialBadge.textContent = "✗ Unrecognized serial format — check device label";
    el.serialNumber.classList.add("is-invalid");
  }
}

// ─────────────────────────────────────────────────────────────
// SHA-256 IMAGE HASHING  (Web Crypto API — duplicate detection)
// ─────────────────────────────────────────────────────────────
async function hashFile(file) {
  try {
    const buffer      = await file.arrayBuffer();
    const hashBuffer  = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray   = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

async function handleProofImageChange(file) {
  el.imageHashDisplay.classList.remove("d-none");

  if (!file) {
    state.imageHash = null;
    el.imageHashDisplay.innerHTML = "";
    el.imageHashDisplay.classList.add("d-none");
    return;
  }

  el.imageHashDisplay.innerHTML = `<span class="hash-computing">⏳ Computing SHA-256 fingerprint...</span>`;

  const hash = await hashFile(file);

  if (!hash) {
    el.imageHashDisplay.innerHTML = `<span class="hash-error">⚠ Could not compute image fingerprint.</span>`;
    state.imageHash = null;
    return;
  }

  state.imageHash = hash;

  const isDuplicate = state.localSubmissions.some((s) => s.imageHash === hash);

  if (isDuplicate) {
    el.imageHashDisplay.innerHTML =
      `<span class="hash-duplicate">⚠️ DUPLICATE DETECTED — this image was already submitted. Upload a unique photo of the actual device.</span>`;
    el.proofSnapshot.classList.add("is-invalid");
  } else {
    el.imageHashDisplay.innerHTML =
      `<span class="hash-valid">✓ SHA-256: ${hash.substring(0, 32)}...</span>`;
    el.proofSnapshot.classList.remove("is-invalid");
  }
}

// ─────────────────────────────────────────────────────────────
// FORM VALIDATION
// ─────────────────────────────────────────────────────────────
function clearValidation() {
  el.donationForm.querySelectorAll(".is-invalid")
    .forEach((e) => e.classList.remove("is-invalid"));
}

async function validateForm() {
  clearValidation();
  clearFormAlert();

  if (!state.selectedRecipient) {
    showFormAlert("Please select a verified recipient before submitting your donation.");
    return false;
  }

  const isPhysical = state.donationType !== "money";

  const required = isPhysical
    ? [el.itemName, el.modelNumber, el.serialNumber, el.condition, el.proofSnapshot]
    : [el.amount, el.statementUpload];

  let valid = true;
  required.forEach((input) => {
    const empty = input.type === "file"
      ? input.files.length === 0
      : !String(input.value).trim();
    if (empty) { input.classList.add("is-invalid"); valid = false; }
  });

  if (!valid) {
    showFormAlert("Please complete every required verification field.");
    return false;
  }

  if (isPhysical) {
    const { valid: serialOk } = validateSerial(el.serialNumber.value);
    if (!serialOk) {
      el.serialNumber.classList.add("is-invalid");
      showFormAlert("Serial number format not recognized. Double-check the label on the device.");
      return false;
    }
    if (el.proofSnapshot.classList.contains("is-invalid")) {
      showFormAlert("Duplicate proof image detected. Please upload a unique photo.");
      return false;
    }
    if (!state.imageHash && el.proofSnapshot.files[0]) {
      await handleProofImageChange(el.proofSnapshot.files[0]);
    }
  }

  if (!isPhysical && Number(el.amount.value) < 1) {
    el.amount.classList.add("is-invalid");
    showFormAlert("The monetary contribution must be at least $1.");
    return false;
  }

  return true;
}

function showFormAlert(msg) {
  el.formAlert.textContent = msg;
  el.formAlert.classList.remove("d-none");
}

function clearFormAlert() {
  el.formAlert.textContent = "";
  el.formAlert.classList.add("d-none");
}

// ─────────────────────────────────────────────────────────────
// SUBMISSION BUILD & CLOUD PERSIST
// ─────────────────────────────────────────────────────────────
function getFileName(fileInput) {
  return fileInput.files.length > 0 ? fileInput.files[0].name : "Not supplied";
}

function randomId(length) {
  const alpha  = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => alpha[v % alpha.length]).join("");
}

function buildSubmission() {
  const isPhysical = state.donationType !== "money";
  const ticket     = `PENDING_AUDIT_${randomId(8)}`;

  return {
    donationType:      state.donationType,
    recipientId:       state.selectedRecipient.id,
    recipientName:     state.selectedRecipient.name,
    recipientCategory: state.selectedRecipient.category || "",
    itemName:          isPhysical
                         ? el.itemName.value.trim()
                         : `$${Number(el.amount.value).toFixed(2)} USD`,
    modelNumber:       isPhysical ? el.modelNumber.value.trim() : null,
    serialNumber:      isPhysical ? el.serialNumber.value.trim().toUpperCase() : null,
    condition:         isPhysical ? el.condition.value : null,
    faults:            isPhysical ? (el.faults.value.trim() || null) : null,
    proofFile:         isPhysical ? getFileName(el.proofSnapshot) : getFileName(el.statementUpload),
    imageHash:         state.imageHash || null,
    ticket,
    createdAt:         new Date().toISOString(),
    auditStatus:       "PENDING_AUDIT",
    auditStep:         0
  };
}

function createReceiptHash(sub) {
  const input = [sub.ticket, sub.recipientName, sub.itemName, sub.proofFile].join("|");
  let   h     = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h  = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

async function persistSubmission(sub) {
  if (!firestore) return { persisted: false, reason: "Firebase not configured." };
  try {
    await addDoc(collection(firestore, "donationSubmissions"), {
      ...sub,
      createdAt: serverTimestamp()
    });
    return { persisted: true };
  } catch (err) {
    console.error("Firebase write error:", err);
    return { persisted: false, reason: "Local submission complete; cloud sync failed." };
  }
}

// ─────────────────────────────────────────────────────────────
// GAMIFICATION ENGINE  — XP & Badges
// ─────────────────────────────────────────────────────────────
function calculateRewards(sub) {
  const badges = [];
  let   xp     = 0;

  const typeReward = BADGE_CONFIG[sub.donationType];
  if (typeReward) { badges.push(typeReward); xp += typeReward.xp; }

  if (sub.recipientCategory === "Pediatric") {
    badges.push(BADGE_CONFIG.pediatric);
    xp += BADGE_CONFIG.pediatric.xp;
  }

  if (sub.condition === "New / Sealed" || sub.condition === "Like New") {
    badges.push(BADGE_CONFIG.pristine);
    xp += BADGE_CONFIG.pristine.xp;
  }

  state.xpTotal += xp;
  state.earnedBadges.push(...badges);

  return { badges, xp };
}

function renderBadges(badges, xp) {
  if (!badges.length) {
    el.badgeAwardSection.classList.add("d-none");
    return;
  }

  el.badgeAwardSection.classList.remove("d-none");
  el.xpLabel.textContent = `+${xp} XP Earned`;

  const pct = Math.min((xp / 500) * 100, 100);
  el.xpBarFill.style.width = "0%";
  requestAnimationFrame(() => {
    setTimeout(() => { el.xpBarFill.style.width = `${pct}%`; }, 200);
  });

  el.badgeList.innerHTML = badges.map((b) => `
    <div class="badge-card">
      <div class="badge-icon">${b.icon}</div>
      <div>
        <div class="badge-name">${escapeHtml(b.badge)}</div>
        <div class="badge-desc">${escapeHtml(b.description)}</div>
      </div>
    </div>
  `).join("");
}

// ─────────────────────────────────────────────────────────────
// CONFIRMATION RENDER
// ─────────────────────────────────────────────────────────────
function renderConfirmation(sub) {
  const typeLabel = { money: "MONETARY FUNDING", console: "CONSOLE HARDWARE", gadget: "GAMING GADGET" }[sub.donationType] || "HARDWARE";
  const isPhysical = sub.donationType !== "money";

  el.receiptItem.textContent      = sub.itemName;
  el.receiptType.textContent      = typeLabel;
  el.receiptRecipient.textContent = sub.recipientName;
  el.receiptProof.textContent     = sub.proofFile;
  el.receiptTimestamp.textContent = new Date(sub.createdAt).toLocaleString();
  el.receiptTicket.textContent    = sub.ticket;
  el.receiptHash.textContent      = `LF-${createReceiptHash(sub)}`;
  el.receiptImageHash.textContent = sub.imageHash
    ? `${sub.imageHash.substring(0, 40)}...`
    : "N/A (monetary drop)";

  el.receiptSerialRow.classList.toggle("d-none", !isPhysical || !sub.serialNumber);
  if (isPhysical && sub.serialNumber) {
    el.receiptSerial.textContent = sub.serialNumber;
  }

  const { badges, xp } = calculateRewards(sub);
  renderBadges(badges, xp);
}

// ─────────────────────────────────────────────────────────────
// PDF IMPACT & TAX CERTIFICATE  (jsPDF)
// ─────────────────────────────────────────────────────────────
function downloadCertificate(sub) {
  if (!sub) {
    showToast("No submission found. Please complete a donation first.", "error");
    return;
  }

  if (!window.jspdf?.jsPDF) {
    showToast("PDF library not available. Check your connection and refresh.", "error");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf       = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Dark background
  pdf.setFillColor(15, 12, 27);
  pdf.rect(0, 0, 210, 297, "F");

  // Cyan header strip
  pdf.setFillColor(0, 242, 254);
  pdf.rect(0, 0, 210, 20, "F");
  pdf.setTextColor(6, 16, 22);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.text("LOOTFORWARD — IMPACT & TAX CERTIFICATE", 105, 13, { align: "center" });

  // Platform tag
  pdf.setTextColor(0, 242, 254);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("GAMERS HELPING GAMERS  ·  AUDIT-FIRST DONATION PLATFORM", 105, 30, { align: "center" });

  // Title
  pdf.setTextColor(245, 247, 255);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("DONATION IMPACT CERTIFICATE", 105, 45, { align: "center" });

  // Divider
  pdf.setDrawColor(0, 242, 254);
  pdf.setLineWidth(0.5);
  pdf.line(20, 52, 190, 52);

  // Recipient statement
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(168, 165, 189);
  pdf.text("This certifies that a verified contribution was submitted to:", 105, 62, { align: "center" });
  pdf.setTextColor(245, 247, 255);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.text(sub.recipientName, 105, 72, { align: "center" });

  // Data rows
  const rows = [
    ["Ticket ID",       sub.ticket],
    ["Donation Type",   sub.donationType.toUpperCase()],
    ["Item / Amount",   sub.itemName],
    ["Model Number",    sub.modelNumber || "N/A"],
    ["Serial Number",   sub.serialNumber || "N/A"],
    ["Condition",       sub.condition || "N/A"],
    ["Proof File",      sub.proofFile],
    ["Submitted",       new Date(sub.createdAt).toLocaleString()],
    ["Audit Status",    sub.auditStatus],
    ["Receipt Hash",    `LF-${createReceiptHash(sub)}`]
  ];

  pdf.setFontSize(9);
  let y = 88;
  rows.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 242, 254);
    pdf.text((label + ":").toUpperCase(), 22, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(245, 247, 255);
    const lines = pdf.splitTextToSize(String(value ?? "—"), 110);
    pdf.text(lines, 80, y);
    y += lines.length > 1 ? 8 * lines.length : 9;
  });

  // SHA-256 fingerprint
  if (sub.imageHash) {
    y += 3;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 242, 254);
    pdf.text("SHA-256 IMAGE FINGERPRINT:", 22, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(168, 165, 189);
    pdf.setFontSize(7);
    pdf.text(sub.imageHash, 22, y);
    y += 10;
  }

  // Divider
  pdf.setDrawColor(155, 81, 224);
  pdf.setLineWidth(0.4);
  pdf.line(20, y + 3, 190, y + 3);
  y += 14;

  // Legal disclaimer
  pdf.setFontSize(8);
  pdf.setTextColor(120, 115, 140);
  pdf.setFont("helvetica", "italic");
  const disclaimer = [
    "This certificate is issued for informational purposes only and does not constitute a",
    "legally binding tax receipt. LootForward is a donation coordination platform. All",
    "contributions are subject to verification and audit before final acceptance.",
    "Consult a tax advisor regarding deductibility. Generated: " + new Date().toLocaleString()
  ];
  disclaimer.forEach((line) => { pdf.text(line, 105, y, { align: "center" }); y += 6; });

  // Footer strip
  pdf.setFillColor(0, 242, 254);
  pdf.rect(0, 283, 210, 14, "F");
  pdf.setTextColor(6, 16, 22);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("© 2026 LOOTFORWARD — GAMERS HELPING GAMERS  ·  lootforward.org", 105, 291, { align: "center" });

  pdf.save(`LootForward_Certificate_${sub.ticket}.pdf`);
  showToast("📄 Certificate downloaded!", "success");
}

// ─────────────────────────────────────────────────────────────
// TRACKING PAGE
// ─────────────────────────────────────────────────────────────
const AUDIT_STEPS = [
  "Submitted",
  "AI Serial Check",
  "Admin Audit",
  "Label Generated",
  "In Transit",
  "Delivered"
];

const STEP_MESSAGES = [
  "Your contribution has been received and is queued for automated processing.",
  "Automated serial verification is scanning hardware records and stolen-device blacklists.",
  "A human verifier is reviewing the evidence and audit details.",
  "Verification complete. A pre-paid shipping label has been generated for you.",
  "The package is in transit to the verified recipient hub.",
  "Delivery confirmed. Your contribution has made a real impact. Thank you! 🎮"
];

function resetTrackingUI() {
  el.trackingResult.classList.add("d-none");
  el.trackingEmpty.classList.remove("d-none");
  el.trackingNotFound.classList.add("d-none");
  el.trackingInput.value = "";
}

function lookupTracking(ticketId) {
  const cleaned = ticketId.trim().toUpperCase();

  el.trackingEmpty.classList.add("d-none");

  if (!cleaned.startsWith("PENDING_AUDIT_")) {
    el.trackingNotFound.classList.remove("d-none");
    el.trackingResult.classList.add("d-none");
    return;
  }

  const found = state.localSubmissions.find((s) => s.ticket === cleaned);

  if (!found) {
    el.trackingNotFound.classList.remove("d-none");
    el.trackingResult.classList.add("d-none");
    return;
  }

  el.trackingNotFound.classList.add("d-none");
  el.trackingResult.classList.remove("d-none");

  el.trackTicket.textContent    = found.ticket;
  el.trackItem.textContent      = found.itemName;
  el.trackRecipient.textContent = found.recipientName;
  el.trackDate.textContent      = new Date(found.createdAt).toLocaleDateString();

  const step = found.auditStep || 0;
  el.stepperSteps.forEach((stepEl, i) => {
    stepEl.classList.remove("step-active", "step-complete", "step-pending");
    if (i < step)      stepEl.classList.add("step-complete");
    else if (i === step) stepEl.classList.add("step-active");
    else               stepEl.classList.add("step-pending");
  });

  el.trackingStatusMsg.innerHTML = `
    <div class="tracking-status-inner glass-panel">
      <span class="tracking-step-label">${escapeHtml(AUDIT_STEPS[step])}</span>
      <p>${escapeHtml(STEP_MESSAGES[step])}</p>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// ADMIN PANEL
// ─────────────────────────────────────────────────────────────
function onAdminPageLoad() {
  if (state.adminUnlocked) {
    el.adminAuthGate.classList.add("d-none");
    el.adminPanel.classList.remove("d-none");
    renderAdminQueue();
  } else {
    el.adminAuthGate.classList.remove("d-none");
    el.adminPanel.classList.add("d-none");
  }
}

function unlockAdmin(passphrase) {
  if (passphrase.trim() === DEMO_ADMIN_PASS) {
    state.adminUnlocked = true;
    el.adminAuthGate.classList.add("d-none");
    el.adminPanel.classList.remove("d-none");
    el.adminAuthError.classList.add("d-none");
    el.navAdminItem.style.display = "";
    renderAdminQueue();
    showToast("🔓 Admin panel unlocked. Welcome, Verifier.", "success");
  } else {
    el.adminAuthError.classList.remove("d-none");
    el.adminPassphrase.value = "";
    el.adminPassphrase.focus();
  }
}

function lockAdmin() {
  state.adminUnlocked = false;
  el.adminAuthGate.classList.remove("d-none");
  el.adminPanel.classList.add("d-none");
  el.adminPassphrase.value = "";
  el.adminAuthError.classList.add("d-none");
  showToast("🔒 Admin panel locked.", "info");
}

function renderAdminQueue() {
  const pending = state.localSubmissions.filter((s) => s.auditStatus === "PENDING_AUDIT");
  el.pendingCount.textContent = pending.length;

  if (!pending.length) {
    el.adminQueue.innerHTML = `
      <div class="text-center py-5 text-muted">
        <div style="font-size:2.5rem;margin-bottom:12px">📭</div>
        <p>No pending submissions in the local queue.</p>
      </div>
    `;
    return;
  }

  el.adminQueue.innerHTML = `
    <div class="table-responsive">
      <table class="table admin-table">
        <thead>
          <tr>
            <th>TICKET</th>
            <th>ITEM</th>
            <th>TYPE</th>
            <th>RECIPIENT</th>
            <th>SERIAL</th>
            <th>SUBMITTED</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          ${pending.map((s) => `
            <tr>
              <td class="ticket-cell font-mono">${escapeHtml(s.ticket)}</td>
              <td>${escapeHtml(s.itemName)}</td>
              <td><span class="type-badge type-${escapeHtml(s.donationType)}">${s.donationType.toUpperCase()}</span></td>
              <td>${escapeHtml(s.recipientName)}</td>
              <td class="font-mono">${escapeHtml(s.serialNumber || "N/A")}</td>
              <td>${new Date(s.createdAt).toLocaleDateString()}</td>
              <td><span class="status-badge status-pending">PENDING</span></td>
              <td class="action-cell">
                <button class="btn btn-sm btn-approve" data-action="approve" data-ticket="${escapeHtml(s.ticket)}">✓ Approve</button>
                <button class="btn btn-sm btn-reject"  data-action="reject"  data-ticket="${escapeHtml(s.ticket)}">✗ Reject</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function approveSubmission(ticket) {
  const sub = state.localSubmissions.find((s) => s.ticket === ticket);
  if (!sub) return;

  sub.auditStatus = "APPROVED";
  sub.auditStep   = 3;

  renderAdminQueue();
  showShippingLabelModal(sub);
  showToast(`✅ Approved: ${ticket}. Shipping label generated.`, "success");
}

function rejectSubmission(ticket) {
  const sub = state.localSubmissions.find((s) => s.ticket === ticket);
  if (!sub) return;

  sub.auditStatus = "REJECTED_FRAUD";
  sub.auditStep   = 0;

  renderAdminQueue();
  showToast(`🚫 Rejected & fraud-flagged: ${ticket}.`, "error");
}

// ─────────────────────────────────────────────────────────────
// SHIPPING LABEL GENERATOR  (EasyPost / Shippo mock)
// ─────────────────────────────────────────────────────────────
function generateLabel(sub) {
  const trackingNum = `LF${randomId(12)}`;
  const dest        = recipients.find((r) => r.id === sub.recipientId);
  return {
    carrier:        "LootForward Logistics (EasyPost Demo)",
    tracking:       trackingNum,
    service:        "USPS Priority Mail — Pre-Paid",
    from:           "DONOR — VIA LOOTFORWARD NETWORK",
    to:             dest ? `${dest.name}, c/o LootForward Network, USA` : "LootForward Verified Hub, USA",
    item:           sub.itemName,
    weight:         "Est. up to 10 lbs",
    generated:      new Date().toLocaleString()
  };
}

function showShippingLabelModal(sub) {
  const label = generateLabel(sub);

  document.querySelector("#shipping-label-content").innerHTML = `
    <div class="label-header">
      <span class="label-carrier">${escapeHtml(label.carrier)}</span>
      <span class="label-service">${escapeHtml(label.service)}</span>
    </div>
    <div class="label-section">
      <span class="label-field-title">FROM</span>
      <strong>${escapeHtml(label.from)}</strong>
    </div>
    <div class="label-section">
      <span class="label-field-title">TO</span>
      <strong>${escapeHtml(label.to)}</strong>
    </div>
    <div class="label-section">
      <span class="label-field-title">ITEM</span>
      <strong>${escapeHtml(label.item)}</strong>
    </div>
    <div class="label-section">
      <span class="label-field-title">EST. WEIGHT</span>
      <strong>${escapeHtml(label.weight)}</strong>
    </div>
    <div class="label-barcode">
      <div class="barcode-lines" aria-hidden="true"></div>
      <div class="barcode-number">${escapeHtml(label.tracking)}</div>
    </div>
    <div class="label-generated">Generated: ${escapeHtml(label.generated)}</div>
  `;

  new window.bootstrap.Modal(document.querySelector("#labelModal")).show();
}

// ─────────────────────────────────────────────────────────────
// LEAFLET DROP-OFF MAP
// ─────────────────────────────────────────────────────────────
let mapInitialized = false;

function initDropOffMap() {
  if (mapInitialized || typeof window.L === "undefined") return;

  const mapEl = document.querySelector("#drop-map");
  if (!mapEl) return;

  const map = L.map("drop-map", {
    center:          [39.5, -98.35],
    zoom:            4,
    zoomControl:     true,
    scrollWheelZoom: false
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains:  "abcd",
    maxZoom:     19
  }).addTo(map);

  const makeIcon = (color) => L.divIcon({
    className: "",
    html:      `<div style="width:14px;height:14px;border-radius:50%;background:${color};box-shadow:0 0 10px ${color};border:2px solid rgba(255,255,255,0.3)"></div>`,
    iconSize:  [14, 14],
    iconAnchor:[7,   7]
  });

  const storeIcon = makeIcon("#00f2fe");
  const hubIcon   = makeIcon("#9b51e0");

  dropOffLocations.forEach((loc) => {
    L.marker([loc.lat, loc.lng], { icon: loc.type === "store" ? storeIcon : hubIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:180px">
          <strong style="color:#0f0c1b">${loc.name}</strong><br>
          <span style="color:#555">${loc.type === "store" ? "🎮 Partner Game Store" : "🏢 Community Hub"}</span><br>
          <small>Hours: ${loc.hours}</small>
        </div>
      `);
  });

  mapInitialized = true;
}

// ─────────────────────────────────────────────────────────────
// ANIMATED STAT COUNTERS
// ─────────────────────────────────────────────────────────────
function animateCounter(el, target, duration = 1800) {
  const start     = performance.now();
  const startVal  = 0;

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(startVal + (target - startVal) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function initStatCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(el.hardwareStat,  2481);
      animateCounter(el.auditStat,     8942);
      animateCounter(el.communityStat,  126);
      observer.disconnect();
    });
  }, { threshold: 0.3 });

  if (el.hardwareStat) observer.observe(el.hardwareStat);
}

// ─────────────────────────────────────────────────────────────
// TERMINAL LIVE FEED ANIMATION
// ─────────────────────────────────────────────────────────────
const TERMINAL_LINES = [
  "awaiting next contribution...",
  "scanning serial CF2481739...",
  "verifying recipient: St. Jude Gaming Hub",
  "image hash computed: a3f2b1c8...",
  "anti-fraud check: PASS",
  "shipping label generated",
  "queue position: 3 / 12 pending",
  "audit status: APPROVED",
  "in transit to verified hub",
  "contribution delivered ✓"
];

let terminalIdx = 0;

function cycleTerminal() {
  if (!el.terminalLive) return;
  terminalIdx = (terminalIdx + 1) % TERMINAL_LINES.length;
  el.terminalLive.style.opacity = "0";
  setTimeout(() => {
    el.terminalLive.textContent = TERMINAL_LINES[terminalIdx];
    el.terminalLive.style.opacity = "1";
  }, 280);
}

// ─────────────────────────────────────────────────────────────
// TOAST NOTIFICATION SYSTEM
// ─────────────────────────────────────────────────────────────
const TOAST_COLORS = {
  success: { bg: "rgba(110,255,178,0.12)", border: "rgba(110,255,178,0.4)"  },
  error:   { bg: "rgba(255,95,95,0.12)",   border: "rgba(255,95,95,0.4)"    },
  info:    { bg: "rgba(0,242,254,0.12)",   border: "rgba(0,242,254,0.35)"   }
};

function showToast(message, type = "info") {
  const c = TOAST_COLORS[type] || TOAST_COLORS.info;
  const toast = document.createElement("div");
  toast.className = "lf-toast";
  toast.style.cssText = `background:${c.bg};border:1px solid ${c.border}`;
  toast.textContent   = message;

  el.toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("lf-toast-show"));

  setTimeout(() => {
    toast.classList.remove("lf-toast-show");
    toast.classList.add("lf-toast-hide");
    setTimeout(() => toast.remove(), 380);
  }, 4000);
}

// ─────────────────────────────────────────────────────────────
// FORM SUBMISSION HANDLER
// ─────────────────────────────────────────────────────────────
async function handleDonationSubmit(event) {
  event.preventDefault();

  el.submitLabel.textContent = "Validating...";
  el.submitSpinner.classList.remove("d-none");
  el.submitBtn.disabled      = true;

  const valid = await validateForm();

  if (!valid) {
    el.submitLabel.textContent = "Submit for Audit";
    el.submitSpinner.classList.add("d-none");
    el.submitBtn.disabled      = false;
    return;
  }

  const sub = buildSubmission();
  state.latestSubmission = sub;
  state.localSubmissions.push(sub);

  renderConfirmation(sub);
  navigate("confirmation");

  el.submitLabel.textContent = "Submit for Audit";
  el.submitSpinner.classList.add("d-none");
  el.submitBtn.disabled      = false;

  // Fire-and-forget Firestore persist
  persistSubmission(sub).then(({ persisted, reason }) => {
    if (!persisted && firebaseConfigured) console.warn("Sync:", reason);
  });

  showToast("🎮 Drop submitted! Audit ticket assigned.", "success");
}

function resetDonationForm() {
  el.donationForm.reset();
  clearValidation();
  clearFormAlert();
  state.imageHash = null;
  el.imageHashDisplay.classList.add("d-none");
  el.serialBadge.className = "serial-validation-badge d-none";
  setDonationType("console");
}

// ─────────────────────────────────────────────────────────────
// THREE.JS NEON PARTICLE MATRIX
// ─────────────────────────────────────────────────────────────
function initParticleMatrix() {
  const canvas    = document.querySelector("#matrix-canvas");
  const scene     = new THREE.Scene();
  const camera    = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 22;

  const renderer  = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0f0c1b, 0);

  const count     = window.innerWidth < 768 ? 650 : 1200;
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);

  const cyan   = new THREE.Color(0x00f2fe);
  const purple = new THREE.Color(0x9b51e0);
  const white  = new THREE.Color(0xffffff);

  for (let i = 0; i < count; i++) {
    const o = i * 3;
    positions[o]     = (Math.random() - 0.5) * 60;
    positions[o + 1] = (Math.random() - 0.5) * 42;
    positions[o + 2] = (Math.random() - 0.5) * 40;

    const roll  = Math.random();
    const color = roll > 0.66 ? cyan : roll > 0.33 ? purple : white;
    colors[o]     = color.r;
    colors[o + 1] = color.g;
    colors[o + 2] = color.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size:         0.075,
    vertexColors: true,
    transparent:  true,
    opacity:      0.72,
    depthWrite:   false,
    blending:     THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  const mouse  = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  window.addEventListener("mousemove", (e) => {
    target.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  const clock = new THREE.Clock();

  (function animate() {
    const t  = clock.getElapsedTime();
    mouse.x += (target.x - mouse.x) * 0.025;
    mouse.y += (target.y - mouse.y) * 0.025;

    particles.rotation.y = t * 0.018 + mouse.x * 0.08;
    particles.rotation.x = Math.sin(t * 0.1) * 0.03 + mouse.y * 0.04;
    particles.position.x = mouse.x * 1.3;
    particles.position.y = -mouse.y * 1.0;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  })();
}

// ─────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────
function escapeHtml(value) {
  return String(value)
    .replaceAll("&",  "&amp;")
    .replaceAll("<",  "&lt;")
    .replaceAll(">",  "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ─────────────────────────────────────────────────────────────
// EVENT BINDING
// ─────────────────────────────────────────────────────────────
function bindEvents() {
  // Global click delegation
  document.addEventListener("click", (event) => {
    const recipientBtn = event.target.closest("[data-select-recipient]");
    if (recipientBtn) { selectRecipient(recipientBtn.dataset.selectRecipient); return; }

    const routeEl = event.target.closest("[data-route]");
    if (routeEl) { event.preventDefault(); navigate(routeEl.dataset.route); return; }

    const actionBtn = event.target.closest("[data-action]");
    if (actionBtn && state.adminUnlocked) {
      const { action, ticket } = actionBtn.dataset;
      if (action === "approve") approveSubmission(ticket);
      if (action === "reject")  rejectSubmission(ticket);
    }
  });

  // Donation category
  el.categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => setDonationType(btn.dataset.donationType));
  });

  // Tier buttons
  el.tierButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      el.amount.value = btn.dataset.amount;
      el.tierButtons.forEach((t) => t.classList.toggle("active", t === btn));
      el.amount.classList.remove("is-invalid");
    });
  });

  // Form submit
  el.donationForm.addEventListener("submit", handleDonationSubmit);

  // Serial live validation
  el.serialNumber.addEventListener("input", () => updateSerialBadge(el.serialNumber.value));

  // Proof image hashing
  el.proofSnapshot.addEventListener("change", async () => {
    await handleProofImageChange(el.proofSnapshot.files[0] || null);
  });

  // Tracking
  el.trackingSearchBtn.addEventListener("click",  () => lookupTracking(el.trackingInput.value));
  el.trackingInput.addEventListener("keydown", (e) => { if (e.key === "Enter") lookupTracking(el.trackingInput.value); });

  // Admin
  el.adminUnlockBtn.addEventListener("click", () => unlockAdmin(el.adminPassphrase.value));
  el.adminPassphrase.addEventListener("keydown", (e) => { if (e.key === "Enter") unlockAdmin(el.adminPassphrase.value); });
  el.adminLogoutBtn.addEventListener("click", lockAdmin);

  // Certificate download
  el.downloadCertBtn.addEventListener("click", () => downloadCertificate(state.latestSubmission));

  // Shipping label download
  el.labelDownloadBtn.addEventListener("click", () => {
    showToast("📦 EasyPost integration required for production label download.", "info");
  });

  // Browser navigation
  window.addEventListener("popstate",   () => navigate(resolveInitialPage(), false));
  window.addEventListener("hashchange", () => navigate(resolveInitialPage(), false));
}

// ─────────────────────────────────────────────────────────────
// INITIALIZE
// ─────────────────────────────────────────────────────────────
function initialize() {
  renderRecipients();
  setDonationType("console");
  bindEvents();
  updateDonationContext();
  navigate(resolveInitialPage(), false);
  initParticleMatrix();
  initStatCounters();

  // Init Leaflet map slightly deferred so the about page renders first
  setTimeout(initDropOffMap, 600);

  // Terminal animation loop
  setInterval(cycleTerminal, 3200);

  // Expose debug interface
  window.lootForward = { state, recipients, navigate, resetDonationForm, showToast, unlockAdmin };
}

initialize();
