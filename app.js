// ============================================================
// LootForward — app.js (Production Fixed & Synchronized)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
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
// Replace pk_test_... with your actual Publishable key from dashboard.stripe.com
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
          fontSize: "16px",
          "::placeholder": { color: "#a0aec0" }
        },
        invalid: { color: "#fa755a", iconColor: "#fa755a" }
      }
    });

    const mountNode = document.querySelector("#stripe-card-element");
    if (mountNode) {
      cardElement.mount("#stripe-card-element");
    }
  }
}

const DEMO_ADMIN_PASS = "LOOTFORWARD2026";

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

const BADGE_CONFIG = {
  console: { badge: "Console Rescuing Hero", icon: "🎮", description: "Donated a physical gaming console to a verified community.", xp: 150 },
  gadget: { badge: "Gear Guardian", icon: "🕹️", description: "Donated a gaming gadget or peripheral to a verified community.", xp: 80 },
  money: { badge: "Guild Backer", icon: "💎", description: "Provided direct monetary support to a gaming charity program.", xp: 100 },
  pediatric: { badge: "Hospital Gear Sponsor", icon: "🏥", description: "Donated specifically to a pediatric gaming program. Champion!", xp: 200 },
  pristine: { badge: "Pristine Donor", icon: "⭐", description: "Donated a brand-new or like-new item in perfect condition.", xp: 50 }
};

const SERIAL_PATTERNS = [
  { label: "PS5", pattern: /^(CF|SB)[0-9A-Z]{7,9}$/i },
  { label: "Xbox Series", pattern: /^[0-9A-Z]{4}-[0-9A-Z]{4}$/i },
  { label: "Nintendo Switch", pattern: /^(XKW|XAW|XKJ|XAJ)[0-9]{9,11}$/i },
  { label: "PC Component", pattern: /^[A-Z0-9]{10,20}$/i },
  { label: "Hardware", pattern: /^[A-Z0-9\-]{8,22}$/i }
];

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

// DOM Selector map - Safely query HTML elements
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
  imageHashDisplay: document.querySelector("#hash-value"),
  condition: document.querySelector("#condition"),
  faults: document.querySelector("#faults"),
  proofSnapshot: document.querySelector("#proof-image"),
  amount: document.querySelector("#custom-amount"),
  statementUpload: document.querySelector("#funding-statement"),
  lockedRecipient: document.querySelector("#selected-recipient-name"),
  recipientContext: document.querySelector("#recipient-context"),
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

function updateDonationContext() {
  if (!el.lockedRecipient || !el.recipientContext) return;
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
            <span class="badge bg-primary">${escapeHtml(r.category)}</span>
          </div>
          <h3>${escapeHtml(r.name)}</h3>
          <p class="text-muted">${escapeHtml(r.mission)}</p>

          <strong class="stat-label">CURRENT NEEDS</strong>
          <ul class="needs-list mb-3">
            ${r.needs.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}
          </ul>

          <div class="progress-meter-wrap">
            <div class="d-flex justify-content-between align-items-baseline mb-1">
              <span class="progress-label">${escapeHtml(r.targetItem)}</span>
              <span class="progress-count">${r.received}/${r.target} Received</span>
            </div>
            <div class="progress" style="height:8px;">
              <div class="progress-bar" style="width:${pct}%;background:${barColor}"></div>
            </div>
          </div>

          <button type="button" class="btn btn-neon w-100 mt-4"
                  data-select-recipient="${escapeHtml(r.id)}">
            Select Recipient
          </button>
        </article>
      </div>
    `;
  }).join("");
}

function setDonationType(type) {
  if (!["console", "gadget", "money"].includes(type)) return;
  state.donationType = type;
  if (el.donationType) el.donationType.value = type;

  el.categoryButtons.forEach((btn) => {
    const active = btn.dataset.donationType === type;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  const isPhysical = type !== "money";
  if (el.physicalFields) el.physicalFields.classList.toggle("d-none", !isPhysical);
  if (el.moneyFields) el.moneyFields.classList.toggle("d-none", isPhysical);

  setRequired(el.itemName, isPhysical);
  setRequired(el.modelNumber, isPhysical);
  setRequired(el.serialNumber, isPhysical);
  setRequired(el.condition, isPhysical);
  setRequired(el.proofSnapshot, isPhysical);
  setRequired(el.amount, !isPhysical);
  setRequired(el.statementUpload, !isPhysical);
}

function setRequired(element, required) {
  if (!element) return;
  element.required = required;
  element.setAttribute("aria-required", String(required));
}

function validateSerial(serial) {
  const cleaned = serial.trim().toUpperCase();
  for (const { pattern, label } of SERIAL_PATTERNS) {
    if (pattern.test(cleaned)) return { valid: true, label };
  }
  return { valid: false, label: null };
}

function updateSerialBadge(serial) {
  if (!el.serialBadge) return;
  if (!serial.trim()) {
    el.serialBadge.className = "serial-validation-badge d-none";
    return;
  }
  const { valid, label } = validateSerial(serial);
  el.serialBadge.classList.remove("d-none");

  if (valid) {
    el.serialBadge.className = "serial-validation-badge serial-valid text-success mt-1";
    el.serialBadge.textContent = `✓ Valid ${label} serial format`;
    if (el.serialNumber) el.serialNumber.classList.remove("is-invalid");
  } else {
    el.serialBadge.className = "serial-validation-badge serial-invalid text-danger mt-1";
    el.serialBadge.textContent = "✗ Unrecognized serial format";
    if (el.serialNumber) el.serialNumber.classList.add("is-invalid");
  }
}

async function hashFile(file) {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

async function handleProofImageChange(file) {
  if (!el.imageHashDisplay) return;
  const container = document.querySelector("#image-preview-container");
  if (container) container.classList.remove("d-none");

  if (!file) {
    state.imageHash = null;
    el.imageHashDisplay.textContent = "";
    if (container) container.classList.add("d-none");
    return;
  }

  el.imageHashDisplay.textContent = "Computing...";

  const hash = await hashFile(file);

  if (!hash) {
    el.imageHashDisplay.textContent = "Error computing hash";
    state.imageHash = null;
    return;
  }

  state.imageHash = hash;
  el.imageHashDisplay.textContent = `${hash.substring(0, 32)}...`;
}

function clearValidation() {
  if (!el.donationForm) return;
  el.donationForm.querySelectorAll(".is-invalid")
    .forEach((e) => e.classList.remove("is-invalid"));
}

async function validateForm() {
  clearValidation();

  if (!state.selectedRecipient) {
    showToast("Please select a verified recipient before submitting.", "error");
    return false;
  }

  const isPhysical = state.donationType !== "money";

  const required = isPhysical
    ? [el.itemName, el.modelNumber, el.serialNumber, el.condition, el.proofSnapshot]
    : [el.amount, el.statementUpload];

  let valid = true;
  required.forEach((input) => {
    if (!input) return;
    const empty = input.type === "file"
      ? input.files.length === 0
      : !String(input.value).trim();
    if (empty) { input.classList.add("is-invalid"); valid = false; }
  });

  if (!valid) {
    showToast("Please complete every required field.", "error");
    return false;
  }

  if (isPhysical && el.serialNumber) {
    const { valid: serialOk } = validateSerial(el.serialNumber.value);
    if (!serialOk) {
      el.serialNumber.classList.add("is-invalid");
      showToast("Serial number format not recognized.", "error");
      return false;
    }
  }

  if (!isPhysical && el.amount && Number(el.amount.value) < 1) {
    el.amount.classList.add("is-invalid");
    showToast("The monetary contribution must be at least $1.", "error");
    return false;
  }

  return true;
}

function getFileName(fileInput) {
  return fileInput && fileInput.files.length > 0 ? fileInput.files[0].name : "Not supplied";
}

function randomId(length) {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => alpha[v % alpha.length]).join("");
}

function buildSubmission(stripeTokenId = null) {
  const isPhysical = state.donationType !== "money";
  const ticket = `PENDING_AUDIT_${randomId(8)}`;

  return {
    donationType: state.donationType,
    recipientId: state.selectedRecipient ? state.selectedRecipient.id : "unknown",
    recipientName: state.selectedRecipient ? state.selectedRecipient.name : "Unassigned",
    recipientCategory: state.selectedRecipient ? state.selectedRecipient.category : "",
    itemName: isPhysical
      ? (el.itemName ? el.itemName.value.trim() : "Hardware")
      : `$${Number(el.amount ? el.amount.value : 0).toFixed(2)} USD`,
    modelNumber: isPhysical && el.modelNumber ? el.modelNumber.value.trim() : null,
    serialNumber: isPhysical && el.serialNumber ? el.serialNumber.value.trim().toUpperCase() : null,
    condition: isPhysical && el.condition ? el.condition.value : null,
    faults: isPhysical && el.faults ? (el.faults.value.trim() || null) : null,
    proofFile: isPhysical ? getFileName(el.proofSnapshot) : getFileName(el.statementUpload),
    imageHash: state.imageHash || null,
    stripeToken: stripeTokenId,
    ticket,
    createdAt: new Date().toISOString(),
    auditStatus: "PENDING_AUDIT",
    auditStep: 0
  };
}

function createReceiptHash(sub) {
  const input = [sub.ticket, sub.recipientName, sub.itemName, sub.proofFile].join("|");
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
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

function calculateRewards(sub) {
  const badges = [];
  let xp = 0;

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
  if (!el.badgeAwardSection) return;
  if (!badges.length) {
    el.badgeAwardSection.classList.add("d-none");
    return;
  }

  el.badgeAwardSection.classList.remove("d-none");
  if (el.xpLabel) el.xpLabel.textContent = `+${xp} XP`;

  const pct = Math.min((xp / 500) * 100, 100);
  if (el.xpBarFill) el.xpBarFill.style.width = `${pct}%`;

  if (el.badgeList) {
    el.badgeList.innerHTML = badges.map((b) => `
      <div class="badge-card d-flex align-items-center gap-2 mb-2">
        <div class="badge-icon fs-4">${b.icon}</div>
        <div>
          <div class="badge-name fw-bold">${escapeHtml(b.badge)}</div>
          <div class="badge-desc text-muted small">${escapeHtml(b.description)}</div>
        </div>
      </div>
    `).join("");
  }
}

function renderConfirmation(sub) {
  const typeLabel = { money: "MONETARY FUNDING", console: "CONSOLE HARDWARE", gadget: "GAMING GADGET" }[sub.donationType] || "HARDWARE";
  const isPhysical = sub.donationType !== "money";

  if (el.receiptItem) el.receiptItem.textContent = sub.itemName;
  if (el.receiptType) el.receiptType.textContent = typeLabel;
  if (el.receiptRecipient) el.receiptRecipient.textContent = sub.recipientName;
  if (el.receiptProof) el.receiptProof.textContent = sub.proofFile;
  if (el.receiptTimestamp) el.receiptTimestamp.textContent = new Date(sub.createdAt).toLocaleString();
  if (el.receiptTicket) el.receiptTicket.textContent = sub.ticket;
  if (el.receiptHash) el.receiptHash.textContent = `LF-${createReceiptHash(sub)}`;
  if (el.receiptImageHash) {
    el.receiptImageHash.textContent = sub.imageHash
      ? `${sub.imageHash.substring(0, 40)}...`
      : "N/A (monetary drop)";
  }

  if (el.receiptSerialRow) el.receiptSerialRow.classList.toggle("d-none", !isPhysical || !sub.serialNumber);
  if (isPhysical && sub.serialNumber && el.receiptSerial) {
    el.receiptSerial.textContent = sub.serialNumber;
  }

  const { badges, xp } = calculateRewards(sub);
  renderBadges(badges, xp);
}

function downloadCertificate(sub) {
  if (!sub) {
    showToast("No submission found.", "error");
    return;
  }

  if (!window.jspdf?.jsPDF) {
    showToast("PDF library not available.", "error");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  pdf.setFillColor(15, 12, 27);
  pdf.rect(0, 0, 210, 297, "F");

  pdf.setFillColor(0, 242, 254);
  pdf.rect(0, 0, 210, 20, "F");
  pdf.setTextColor(6, 16, 22);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.text("LOOTFORWARD — IMPACT & TAX CERTIFICATE", 105, 13, { align: "center" });

  pdf.save(`LootForward_Certificate_${sub.ticket}.pdf`);
  showToast("📄 Certificate downloaded!", "success");
}

function resetTrackingUI() {
  if (el.trackingResult) el.trackingResult.classList.add("d-none");
  if (el.trackingEmpty) el.trackingEmpty.classList.remove("d-none");
  if (el.trackingNotFound) el.trackingNotFound.classList.add("d-none");
  if (el.trackingInput) el.trackingInput.value = "";
}

function lookupTracking(ticketId) {
  const cleaned = ticketId.trim().toUpperCase();
  if (el.trackingEmpty) el.trackingEmpty.classList.add("d-none");

  const found = state.localSubmissions.find((s) => s.ticket === cleaned);

  if (!found) {
    if (el.trackingNotFound) el.trackingNotFound.classList.remove("d-none");
    if (el.trackingResult) el.trackingResult.classList.add("d-none");
    return;
  }

  if (el.trackingNotFound) el.trackingNotFound.classList.add("d-none");
  if (el.trackingResult) el.trackingResult.classList.remove("d-none");

  if (el.trackTicket) el.trackTicket.textContent = found.ticket;
  if (el.trackItem) el.trackItem.textContent = found.itemName;
  if (el.trackRecipient) el.trackRecipient.textContent = found.recipientName;
  if (el.trackDate) el.trackDate.textContent = new Date(found.createdAt).toLocaleDateString();
}

function onAdminPageLoad() {
  if (state.adminUnlocked) {
    if (el.adminAuthGate) el.adminAuthGate.classList.add("d-none");
    if (el.adminPanel) el.adminPanel.classList.remove("d-none");
  } else {
    if (el.adminAuthGate) el.adminAuthGate.classList.remove("d-none");
    if (el.adminPanel) el.adminPanel.classList.add("d-none");
  }
}

function unlockAdmin(passphrase) {
  if (passphrase.trim() === DEMO_ADMIN_PASS) {
    state.adminUnlocked = true;
    if (el.adminAuthGate) el.adminAuthGate.classList.add("d-none");
    if (el.adminPanel) el.adminPanel.classList.remove("d-none");
    if (el.adminAuthError) el.adminAuthError.classList.add("d-none");
    showToast("🔓 Admin panel unlocked.", "success");
  } else {
    if (el.adminAuthError) el.adminAuthError.classList.remove("d-none");
  }
}

function lockAdmin() {
  state.adminUnlocked = false;
  if (el.adminAuthGate) el.adminAuthGate.classList.remove("d-none");
  if (el.adminPanel) el.adminPanel.classList.add("d-none");
  showToast("🔒 Admin panel locked.", "info");
}

let mapInitialized = false;

function initDropOffMap() {
  if (mapInitialized || typeof window.L === "undefined") return;
  const mapEl = document.querySelector("#drop-map");
  if (!mapEl) return;

  const map = L.map("drop-map", { center: [39.5, -98.35], zoom: 4, scrollWheelZoom: false });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  mapInitialized = true;
}

function showToast(message, type = "info") {
  if (!el.toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `alert alert-${type === "error" ? "danger" : type} py-2 px-3 m-2`;
  toast.textContent = message;
  el.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function handleDonationSubmit(event) {
  event.preventDefault();

  if (el.submitBtn) el.submitBtn.disabled = true;

  const valid = await validateForm();
  if (!valid) {
    if (el.submitBtn) el.submitBtn.disabled = false;
    return;
  }

  let stripeTokenId = null;

  if (state.donationType === "money") {
    if (stripe && cardElement) {
      const { token, error } = await stripe.createToken(cardElement);
      if (error) {
        showToast(error.message, "error");
        if (el.submitBtn) el.submitBtn.disabled = false;
        return;
      }
      stripeTokenId = token.id;
    }
  }

  const sub = buildSubmission(stripeTokenId);
  state.latestSubmission = sub;
  state.localSubmissions.push(sub);

  renderConfirmation(sub);
  navigate("confirmation");

  if (el.submitBtn) el.submitBtn.disabled = false;

  persistSubmission(sub).then(({ persisted, reason }) => {
    if (!persisted && firebaseConfigured) console.warn("Sync:", reason);
  });

  showToast("🎮 Contribution submitted for audit!", "success");
}

function initParticleMatrix() {
  const canvas = document.querySelector("#matrix-canvas");
  if (!canvas) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 22;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const count = 500;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 50;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({ size: 0.1, color: 0x00f2fe });
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  (function animate() {
    particles.rotation.y += 0.001;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  })();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  // Global routing delegate for buttons with [data-route]
  document.addEventListener("click", (event) => {
    const recipientBtn = event.target.closest("[data-select-recipient]");
    if (recipientBtn) {
      selectRecipient(recipientBtn.dataset.selectRecipient);
      return;
    }

    const routeEl = event.target.closest("[data-route]");
    if (routeEl) {
      event.preventDefault();
      navigate(routeEl.dataset.route);
      return;
    }
  });

  el.categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => setDonationType(btn.dataset.donationType));
  });

  el.tierButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (el.amount) el.amount.value = btn.dataset.amount;
    });
  });

  if (el.donationForm) {
    el.donationForm.addEventListener("submit", handleDonationSubmit);
  }

  if (el.serialNumber) {
    el.serialNumber.addEventListener("input", () => updateSerialBadge(el.serialNumber.value));
  }

  if (el.proofSnapshot) {
    el.proofSnapshot.addEventListener("change", async () => {
      await handleProofImageChange(el.proofSnapshot.files[0] || null);
    });
  }

  if (el.trackingSearchBtn) {
    el.trackingSearchBtn.addEventListener("click", () => lookupTracking(el.trackingInput.value));
  }

  if (el.adminUnlockBtn) {
    el.adminUnlockBtn.addEventListener("click", () => unlockAdmin(el.adminPassphrase.value));
  }

  if (el.adminLogoutBtn) {
    el.adminLogoutBtn.addEventListener("click", lockAdmin);
  }

  if (el.downloadCertBtn) {
    el.downloadCertBtn.addEventListener("click", () => downloadCertificate(state.latestSubmission));
  }

  window.addEventListener("popstate", () => navigate(resolveInitialPage(), false));
  window.addEventListener("hashchange", () => navigate(resolveInitialPage(), false));
}

function initialize() {
  renderRecipients();
  setDonationType("console");
  bindEvents();
  updateDonationContext();
  navigate(resolveInitialPage(), false);
  initParticleMatrix();
  initStripe();

  setTimeout(initDropOffMap, 600);
}

initialize();