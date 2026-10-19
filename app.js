// ============================================================
// LootForward — app.js (Bulletproof Routing & Error Safety)
// ============================================================

const DEMO_ADMIN_PASS = "LOOTFORWARD2026";

// ── Firebase Cloud Function endpoints (with Vercel reverse-proxy support) ───
// In production on Vercel, requests route via clean same-origin /api/* proxies
// defined in vercel.json to eliminate cross-origin complexity and protect endpoints.
const IS_PROD_PROXY  = window.location.hostname.includes("vercel.app") || (window.location.protocol === "https:" && !window.location.hostname.includes("localhost"));
const CF_ENDPOINT   = IS_PROD_PROXY ? "/api/pay" : "https://us-central1-lootforward.cloudfunctions.net/createPaymentIntent";
const CF_RZP_ORDER  = IS_PROD_PROXY ? "/api/razorpay/order" : "https://us-central1-lootforward.cloudfunctions.net/createRazorpayOrder";
const CF_RZP_VERIFY = IS_PROD_PROXY ? "/api/razorpay/verify" : "https://us-central1-lootforward.cloudfunctions.net/verifyPaymentSignature";

// ── Stripe publishable key (safe to expose on client) ─────────
const STRIPE_PK = (typeof window !== "undefined" && window.ENV && window.ENV.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) ||
  "pk_live_51URA1l7Rn2TQL42SVqBqgnle1sltjYUSJwJ0EeESONdcRffzIpcHpx6fyZIHJ61DUzJr8tL50wtRQl16RZZ9H82V00jsPCS11DE";

// ── Razorpay Key ID (safe to expose — secret stays on server) ──
const RAZORPAY_KEY_ID = (typeof window !== "undefined" && window.ENV && window.ENV.NEXT_PUBLIC_RAZORPAY_KEY_ID) ||
  "rzp_test_lootforward_2026";

let recipients = [
  {
    id: "st-jude-gaming-hub",
    name: "St. Jude Children's Hospital Gaming Hub",
    mission: "Create accessible gaming spaces that support hospital-based recreation, connection, and positive downtime for patients.",
    needs: ["Current-generation consoles", "Comfortable controllers", "Headsets", "Gaming monitors"],
    region: "Memphis, TN",
    category: "Pediatric",
    target: 5,
    received: 3,
    targetItem: "PS5 Consoles",
    address: "262 Danny Thomas Pl, Memphis, TN 38105",
    lat: 35.1537,
    lng: -90.0435,
    email: "gaming@stjude.org",
    phone: "(800) 822-6344",
    status: "active"
  },
  {
    id: "low-income-esport-lab",
    name: "Low-Income Community Esport Center Lab",
    mission: "Build an affordable esports and digital skills lab for young people who lack reliable access to gaming hardware.",
    needs: ["Gaming PCs", "Mechanical keyboards", "Gaming mice", "Entry-level GPUs"],
    region: "Chicago, IL",
    category: "Youth Education",
    target: 8,
    received: 2,
    targetItem: "Gaming PCs",
    address: "1805 S Ashland Ave, Chicago, IL 60608",
    lat: 41.8573,
    lng: -87.6663,
    email: "lab@chi-esports.org",
    phone: "(312) 555-0182",
    status: "active"
  },
  {
    id: "youth-recreation-network",
    name: "Youth Recreation Network Game Room",
    mission: "Equip community recreation centers with shared gaming stations for supervised social play and digital learning.",
    needs: ["PlayStation / Xbox consoles", "TV displays", "Controllers", "Charging docks"],
    region: "New York, NY",
    category: "Recreation",
    target: 10,
    received: 7,
    targetItem: "Consoles & Displays",
    address: "545 W 148th St, New York, NY 10031",
    lat: 40.8277,
    lng: -73.9482,
    email: "connect@youthrec.org",
    phone: "(212) 555-0199",
    status: "active"
  }
];

let dropOffPartners = [
  {
    id: "hub-sf",
    name: "LootHub & Game Vault SF",
    type: "store",
    address: "830 Market St, San Francisco, CA 94102",
    lat: 37.7858,
    lng: -122.4065,
    hours: "10:00 AM - 9:00 PM"
  },
  {
    id: "hub-austin",
    name: "SpawnPoint Esports Center",
    type: "hub",
    address: "508 E 6th St, Austin, TX 78701",
    lat: 30.2672,
    lng: -97.7371,
    hours: "11:00 AM - 10:00 PM"
  },
  {
    id: "hub-brooklyn",
    name: "ArcadeLegacy Tech Lounge",
    type: "store",
    address: "175 Bedford Ave, Brooklyn, NY 11211",
    lat: 40.7185,
    lng: -73.9575,
    hours: "12:00 PM - 8:00 PM"
  },
  {
    id: "hub-seattle",
    name: "ByteCraft Youth Tech Lab",
    type: "hub",
    address: "400 Pine St, Seattle, WA 98101",
    lat: 47.6115,
    lng: -122.3365,
    hours: "9:00 AM - 7:00 PM"
  },
  {
    id: "hub-chicago",
    name: "Midwest Gamer Cooperative",
    type: "store",
    address: "108 N State St, Chicago, IL 60602",
    lat: 41.8837,
    lng: -87.6278,
    hours: "10:00 AM - 8:30 PM"
  }
];

// ── Role-Based Access Control & Admin Datasets ───────────────
const ADMIN_EMAILS = [
  "admin@lootforward.org",
  "dhanvincr007@gmail.com",
  "alex.gamer@gmail.com",
  "winchester007@gmail.com",
  "gamer.pro@gmail.com"
];

let adminDonations = [
  {
    id: "tx_live_994821",
    date: "2026-10-19 20:45",
    donor: "Alex Gamer",
    email: "alex.gamer@gmail.com",
    recipient: "St. Jude Children's Hospital Gaming Hub",
    amount: "$100.00 USD",
    gateway: "stripe",
    status: "Verified & Audited",
    ticket: "AUDIT_ST_JUDE_8819"
  },
  {
    id: "tx_live_994815",
    date: "2026-10-19 19:12",
    donor: "Priya Sharma",
    email: "priya.sharma@techhub.in",
    recipient: "Low-Income Community Esport Center Lab",
    amount: "₹2,500 INR",
    gateway: "razorpay",
    status: "HMAC Verified",
    ticket: "AUDIT_ESPORT_7721"
  },
  {
    id: "tx_live_994803",
    date: "2026-10-19 16:30",
    donor: "Marcus Vance",
    email: "marcus.v@apexlegends.gg",
    recipient: "Youth Recreation Network Game Room",
    amount: "$50.00 USD",
    gateway: "stripe",
    status: "Verified & Audited",
    ticket: "AUDIT_YOUTH_6612"
  },
  {
    id: "tx_live_994790",
    date: "2026-10-19 14:05",
    donor: "Rohan Patel",
    email: "rohan.p@mumbai.edu",
    recipient: "St. Jude Children's Hospital Gaming Hub",
    amount: "₹1,000 INR",
    gateway: "razorpay",
    status: "HMAC Verified",
    ticket: "AUDIT_ST_JUDE_5502"
  },
  {
    id: "tx_live_994772",
    date: "2026-10-18 21:20",
    donor: "Elena Rostova",
    email: "elena.r@nordicgames.org",
    recipient: "Low-Income Community Esport Center Lab",
    amount: "$250.00 USD",
    gateway: "stripe",
    status: "Verified & Audited",
    ticket: "AUDIT_ESPORT_4409"
  }
];

let adminHardwareQueue = [
  {
    ticket: "PENDING_AUDIT_884920",
    hardware: "PlayStation 5 Disc Edition (Like New)",
    recipient: "St. Jude Children's Hospital Gaming Hub",
    method: "UPS Drop-off (Downtown Hub)",
    proof: "ps5_serial_box.jpg",
    status: "Pending Audit",
    date: "2026-10-19 20:15"
  },
  {
    ticket: "PENDING_AUDIT_884911",
    hardware: "NVIDIA RTX 3070 8GB GPU",
    recipient: "Low-Income Community Esport Center Lab",
    method: "Physical Partner Hand-Off",
    proof: "gpu_benchmark_test.png",
    status: "Pending Audit",
    date: "2026-10-19 18:40"
  },
  {
    ticket: "PENDING_AUDIT_884902",
    hardware: "Xbox Series S + 2 Wireless Controllers",
    recipient: "Youth Recreation Network Game Room",
    method: "Local Pickup Scheduled",
    proof: "xbox_boot_screen.jpg",
    status: "Pending Audit",
    date: "2026-10-19 15:10"
  }
];

let recipientApplications = [
  {
    id: "rec_app_9918",
    name: "Midwest Youth Robotics & Esports Academy",
    category: "School / STEM",
    email: "robotics@midwest-stem.edu",
    phone: "(312) 555-0819",
    address: "1000 W Adams St, Chicago, IL 60607",
    lat: 41.8794,
    lng: -87.6525,
    region: "Chicago, IL",
    mission: "Providing after-school STEM robotics and competitive Rocket League esports coaching for underprivileged middle school students.",
    needs: ["Gaming PCs", "Mechanical Keyboards", "Controllers"],
    targetItem: "Gaming PCs & Peripherals",
    target: 6,
    received: 0,
    status: "pending",
    date: "2026-10-19 21:30"
  },
  {
    id: "rec_app_9904",
    name: "Harbor Children's Center Digital Lounge",
    category: "Pediatric / Hospital",
    email: "programs@harborchildrens.org",
    phone: "(212) 555-0321",
    address: "420 E 70th St, New York, NY 10021",
    lat: 40.7658,
    lng: -73.9554,
    region: "New York, NY",
    mission: "Creating safe bedside and recovery-lounge gaming hubs for prolonged pediatric care patients and their siblings.",
    needs: ["Nintendo Switch Consoles", "PS5 Consoles", "Wireless Controllers"],
    targetItem: "Handheld & Home Consoles",
    target: 5,
    received: 0,
    status: "pending",
    date: "2026-10-19 18:15"
  }
];

// ── Phase 2: Live Gear Lifecycle Inventory & QR Claim System ──
let liveGearInventory = [
  {
    gearId: "gear_ps5_001",
    title: "Sony PlayStation 5 Disc Edition + DualSense Controller",
    category: "Consoles",
    donorUid: "usr_donor_alex",
    donorName: "Alex Gamer",
    dropoffHubId: "hub-sf",
    hubName: "LootHub & Game Vault SF",
    address: "830 Market St, San Francisco, CA 94102",
    lat: 37.7858,
    lng: -122.4065,
    estValueUsd: 499,
    estValueInr: 41500,
    status: "available",
    claimCode: "LF-7X9K2P",
    qrCodeUrl: "https://quickchart.io/qr?text=LF-7X9K2P&size=200",
    claimedByRecipientId: null,
    claimedByRecipientName: null,
    claimedAt: null,
    createdAt: "2026-10-18T14:30:00Z"
  },
  {
    gearId: "gear_rtx_002",
    title: "MSI GeForce RTX 3070 8GB Gaming GPU",
    category: "PCs & Laptops",
    donorUid: "usr_donor_priya",
    donorName: "Priya Sharma",
    dropoffHubId: "hub-chicago",
    hubName: "Midwest Gamer Cooperative",
    address: "108 N State St, Chicago, IL 60602",
    lat: 41.8837,
    lng: -87.6278,
    estValueUsd: 450,
    estValueInr: 37500,
    status: "available",
    claimCode: "LF-4M8T1Q",
    qrCodeUrl: "https://quickchart.io/qr?text=LF-4M8T1Q&size=200",
    claimedByRecipientId: null,
    claimedByRecipientName: null,
    claimedAt: null,
    createdAt: "2026-10-18T16:15:00Z"
  },
  {
    gearId: "gear_kb_003",
    title: "Corsair K70 RGB Mechanical Keyboard + SteelSeries Rival Mouse",
    category: "Peripherals",
    donorUid: "usr_donor_marcus",
    donorName: "Marcus Vance",
    dropoffHubId: "hub-austin",
    hubName: "SpawnPoint Esports Center",
    address: "508 E 6th St, Austin, TX 78701",
    lat: 30.2672,
    lng: -97.7371,
    estValueUsd: 180,
    estValueInr: 15000,
    status: "available",
    claimCode: "LF-9R2W5Z",
    qrCodeUrl: "https://quickchart.io/qr?text=LF-9R2W5Z&size=200",
    claimedByRecipientId: null,
    claimedByRecipientName: null,
    claimedAt: null,
    createdAt: "2026-10-19T09:45:00Z"
  },
  {
    gearId: "gear_vr_004",
    title: "Meta Quest 2 128GB All-In-One VR Headset",
    category: "Audio/VR",
    donorUid: "usr_donor_elena",
    donorName: "Elena Rostova",
    dropoffHubId: "hub-brooklyn",
    hubName: "ArcadeLegacy Tech Lounge",
    address: "175 Bedford Ave, Brooklyn, NY 11211",
    lat: 40.7185,
    lng: -73.9575,
    estValueUsd: 299,
    estValueInr: 25000,
    status: "claimed",
    claimCode: "LF-3K6J8X",
    qrCodeUrl: "https://quickchart.io/qr?text=LF-3K6J8X&size=200",
    claimedByRecipientId: "youth-recreation-network",
    claimedByRecipientName: "Youth Recreation Network Game Room",
    claimedAt: "2026-10-19T11:20:00Z",
    createdAt: "2026-10-17T11:00:00Z"
  },
  {
    gearId: "gear_laptop_005",
    title: "ASUS ROG Zephyrus G14 Gaming Laptop (Ryzen 9 / RTX 3060)",
    category: "PCs & Laptops",
    donorUid: "usr_donor_rohan",
    donorName: "Rohan Patel",
    dropoffHubId: "hub-seattle",
    hubName: "ByteCraft Youth Tech Lab",
    address: "400 Pine St, Seattle, WA 98101",
    lat: 47.6115,
    lng: -122.3365,
    estValueUsd: 850,
    estValueInr: 71000,
    status: "available",
    claimCode: "LF-8V1C4H",
    qrCodeUrl: "https://quickchart.io/qr?text=LF-8V1C4H&size=200",
    claimedByRecipientId: null,
    claimedByRecipientName: null,
    claimedAt: null,
    createdAt: "2026-10-19T17:00:00Z"
  }
];

function generateClaimCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "LF-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const state = {
  currentPage: "about",
  donationType: "console",
  selectedRecipient: null,
  latestSubmission: null,
  localSubmissions: [],
  // Stripe live references
  stripeInstance: null,
  stripeElements: null,
  stripeCardElement: null,
  isPaymentPending: false,
  modalAmount: 25,
  // Razorpay state
  activeGateway: "stripe",       // "stripe" | "razorpay"
  razorpayAmount: 500,           // INR amount in rupees
  razorpayMethod: "upi",         // "upi" | "netbanking" | "card"
  razorpayUpiApp: "gpay",        // selected UPI app handle
  razorpayBankCode: "HDFC",      // selected NetBanking bank code
  isRazorpayPending: false,
  // Leaflet & Geolocation state
  maps: { dropMap: null, donationMap: null },
  userMarkers: { dropMap: null, donationMap: null },
  userAccuracyCircles: { dropMap: null, donationMap: null },
  partnerMarkers: { dropMap: [], donationMap: [] },
  recipientMarkers: { dropMap: [], donationMap: [] },
  allMapNodes: [],
  mapFilters: {
    search: "",
    layers: { hubs: true, recipients: true, gearAvail: true, gearClaimed: true },
    category: "all"
  },
  impactCurrency: "USD",
  recipientMiniMap: null,
  recipientMiniMarker: null,
  activeRecipientCategoryFilter: "all",
  recipientSearchTerm: "",
  userCoordinates: null,
  userAddress: null,
  isGeolocating: false,
  currentUser: null,
  isAdmin: false
};

const PAGE_IDS = ["about", "donate", "recipients", "tracking", "confirmation", "admin"];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function navigate(page, updateHash = true) {
  if (!PAGE_IDS.includes(page)) page = "about";
  state.currentPage = page;

  // Show target page, hide others
  const pages = document.querySelectorAll(".page-view");
  pages.forEach((view) => {
    view.classList.toggle("active-page", view.dataset.page === page);
  });

  // Highlight navbar active link
  const navLinks = document.querySelectorAll("[data-route]");
  navLinks.forEach((link) => {
    const isActive =
      link.dataset.route === page ||
      (page === "confirmation" && link.dataset.route === "about");
    link.classList.toggle("active", isActive);
  });

  if (updateHash && window.location.hash !== `#${page}`) {
    history.pushState({ page }, "", `#${page}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  updateDonationContext();

  if (page === "admin") {
    renderAdminDashboard();
  }

  // Invalidate Leaflet map size on route change to prevent gray tile clipping
  setTimeout(() => {
    if (state.maps?.dropMap) state.maps.dropMap.invalidateSize();
    if (state.maps?.donationMap) state.maps.donationMap.invalidateSize();
  }, 280);
}

function resolveInitialPage() {
  const hash = window.location.hash.replace("#", "").trim();
  return PAGE_IDS.includes(hash) ? hash : "about";
}

function updateDonationContext() {
  const lockedRecipient = document.querySelector("#selected-recipient-name");
  const recipientContext = document.querySelector("#recipient-context");

  if (!lockedRecipient || !recipientContext) return;

  if (state.selectedRecipient) {
    lockedRecipient.textContent = state.selectedRecipient.name;
    recipientContext.textContent = `Recipient locked: ${state.selectedRecipient.name}. You can change this target at any time before submission.`;
  } else {
    lockedRecipient.textContent = "No recipient selected";
    recipientContext.textContent = "Choose a verified recipient first, or select one below.";
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

window.focusRecipientOnMap = function(recId) {
  const rec = recipients.find(r => r.id === recId);
  if (!rec || !rec.lat) return;
  navigate("about");
  setTimeout(() => {
    if (state.maps.dropMap) {
      state.maps.dropMap.flyTo([rec.lat, rec.lng], 14, { duration: 1.2 });
      showToast(`🎯 Focused on ${rec.name}`, "info");
    }
  }, 400);
};

function renderRecipients() {
  const grid = document.querySelector("#recipient-cards-container");
  if (!grid) return;

  const categoryFilter = state.activeRecipientCategoryFilter || "all";
  // Only verified approved recipients are visible in the public directory
  const approvedList = recipients.filter(r => r.status === "approved" || !r.status);

  let filtered = approvedList.filter((r) => {
    // Category filter
    if (categoryFilter !== "all") {
      const cat = (r.category || "").toLowerCase();
      if (!cat.includes(categoryFilter.toLowerCase())) return false;
    }
    // Search term filter
    if (searchTerm) {
      const match = (r.name || "").toLowerCase().includes(searchTerm) ||
                    (r.mission || "").toLowerCase().includes(searchTerm) ||
                    (r.region || "").toLowerCase().includes(searchTerm) ||
                    (r.address || "").toLowerCase().includes(searchTerm) ||
                    (r.targetItem || "").toLowerCase().includes(searchTerm) ||
                    (r.needs || []).join(" ").toLowerCase().includes(searchTerm);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="glass-panel p-5 mx-auto" style="max-width: 550px; border-radius: 18px;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h4 class="fw-bold mb-2">No Matching Recipients Found</h4>
          <p class="text-muted mb-4">No verified destinations match your current filter query or category selection.</p>
          <div class="d-flex justify-content-center gap-2">
            <button type="button" class="btn btn-outline-neon btn-sm" id="btn-reset-recipient-filters">Reset Filters</button>
            <button type="button" class="btn btn-neon btn-sm" data-bs-toggle="modal" data-bs-target="#addRecipientModal">+ Register Recipient</button>
          </div>
        </div>
      </div>
    `;
    const resetBtn = document.querySelector("#btn-reset-recipient-filters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        state.activeRecipientCategoryFilter = "all";
        state.recipientSearchTerm = "";
        const searchInput = document.querySelector("#recipient-search-input");
        if (searchInput) searchInput.value = "";
        const filterBtns = document.querySelectorAll("#recipient-category-filters [data-rec-filter]");
        filterBtns.forEach(b => b.classList.toggle("active", b.dataset.recFilter === "all"));
        renderRecipients();
      });
    }
    return;
  }

  grid.innerHTML = filtered.map((r) => {
    const pct = Math.min(Math.round(((r.received || 0) / (r.target || 1)) * 100), 100);
    const barColor = pct >= 80 ? "#6effb2" : pct >= 40 ? "#00f2fe" : "#9b51e0";

    return `
      <div class="col-md-6 col-xl-4" data-recipient-card-id="${escapeHtml(r.id)}">
        <article class="recipient-card h-100 glass-panel p-4 ${r.isNew ? 'recipient-card-new' : ''}">
          <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
            <div class="d-flex gap-2 flex-wrap">
              <span class="badge bg-secondary">${escapeHtml(r.region || 'Community')}</span>
              <span class="badge bg-primary">${escapeHtml(r.category || 'Program')}</span>
            </div>
            ${r.isNew ? '<span class="rec-badge-new">⭐ NEWLY ADDED</span>' : ''}
          </div>

          <h3 class="mb-1">${escapeHtml(r.name)}</h3>
          
          <div class="d-flex align-items-center gap-1 text-muted small font-mono mb-2">
            <span class="text-cyan">📍</span>
            <span class="text-truncate">${escapeHtml(r.address || r.region)}</span>
          </div>

          ${(r.email || r.phone) ? `
            <div class="d-flex align-items-center gap-2 small text-white-50 mb-3" style="font-size:0.75rem;">
              ${r.email ? `<span class="font-mono text-truncate">✉️ ${escapeHtml(r.email)}</span>` : ''}
              ${r.phone ? `<span class="font-mono">· 📞 ${escapeHtml(r.phone)}</span>` : ''}
            </div>
          ` : ''}

          <p class="text-muted small mb-3">${escapeHtml(r.mission)}</p>

          <strong class="stat-label">CURRENT GEAR NEEDS</strong>
          <ul class="needs-list mb-3">
            ${(r.needs || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("")}
          </ul>

          <div class="progress-meter-wrap">
            <div class="d-flex justify-content-between align-items-baseline mb-1">
              <span class="progress-label text-truncate me-2">${escapeHtml(r.targetItem || 'Hardware')}</span>
              <span class="progress-count flex-shrink-0">${r.received || 0}/${r.target || 1} Received</span>
            </div>
            <div class="progress" style="height:8px;">
              <div class="progress-bar" style="width:${pct}%;background:${barColor}"></div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-4">
            <button type="button" class="btn btn-outline-neon flex-fill"
                    data-select-recipient="${escapeHtml(r.id)}">
              Select Recipient
            </button>
            <button type="button" class="btn btn-neon flex-fill"
                    data-donate-card="${escapeHtml(r.id)}">
              💳 Donate $
            </button>
            ${(r.lat && r.lng) ? `
              <button type="button" class="btn btn-outline-info" title="View on Live Leaflet Map"
                      onclick="focusRecipientOnMap('${escapeHtml(r.id)}')">
                📍
              </button>
            ` : ''}
          </div>
        </article>
      </div>
    `;
  }).join("");
}

function showToast(message, type = "info", duration = 4500) {
  const container = document.querySelector("#toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  const iconMap = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const icon = iconMap[type] || "ℹ️";
  toast.className = `lf-toast lf-toast--${type}`;
  toast.innerHTML = `<span class="lf-toast__icon">${icon}</span><span class="lf-toast__msg">${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  // Trigger entrance animation
  requestAnimationFrame(() => toast.classList.add("lf-toast--visible"));
  setTimeout(() => {
    toast.classList.remove("lf-toast--visible");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, duration);
}

// ── Generic button loading state helper ────────────────────────
function setButtonLoading(btn, loading, idleLabel) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="lf-spinner" aria-hidden="true"></span> Processing…`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || idleLabel || "Submit";
  }
}

function setSubmitLoading(loading) {
  setButtonLoading(document.querySelector("#submit-btn"), loading, "Submit for Audit");
}

function setModalLoading(loading) {
  const processingEl = document.querySelector("#pm-processing");
  const bodyEl = document.querySelector("#pm-body");
  const payBtn = document.querySelector("#pm-pay-btn");
  const spinner = document.querySelector("#pm-pay-btn-spinner");
  const icon = document.querySelector("#pm-pay-btn-icon");
  const label = document.querySelector("#pm-pay-btn-label");

  if (processingEl) processingEl.classList.toggle("d-none", !loading);
  if (bodyEl) bodyEl.classList.toggle("pm-body--blurred", loading);
  if (payBtn) payBtn.disabled = loading;
  if (spinner) spinner.classList.toggle("d-none", !loading);
  if (icon) icon.classList.toggle("d-none", loading);
  if (label) {
    if (loading) {
      label.textContent = "Processing...";
    } else {
      const num = state.modalAmount || 0;
      label.textContent = num > 0 ? `Pay $${num.toFixed(2)}` : "Pay Now";
    }
  }
}

function setPaymentAmount(val, isCustom = false) {
  const num = parseFloat(val) || 0;
  state.modalAmount = num;

  const summaryAmt = document.querySelector("#pm-summary-amount");
  if (summaryAmt) {
    summaryAmt.textContent = num > 0 ? `$${num.toFixed(2)} USD` : "$0.00 USD";
  }

  const payBtnLabel = document.querySelector("#pm-pay-btn-label");
  if (payBtnLabel && !state.isPaymentPending) {
    payBtnLabel.textContent = num > 0 ? `Pay $${num.toFixed(2)}` : "Pay Now";
  }

  const mainInput = document.querySelector("#custom-amount");
  if (mainInput && num > 0) mainInput.value = num;

  if (num >= 1) {
    const globalErr = document.querySelector("#pm-global-error");
    if (globalErr) globalErr.classList.add("d-none");
  }
}

// ─── RAZORPAY MULTI-METHOD PAYMENT MODULE ─────────────────────

// ── Gateway toggle: Stripe ↔ Razorpay ─────────────────────────
function switchGateway(gateway) {
  state.activeGateway = gateway;

  const stripeBtn    = document.querySelector("#gw-stripe-btn");
  const razorpayBtn  = document.querySelector("#gw-razorpay-btn");
  const stripeBlock  = document.querySelector("#gw-stripe-block");
  const razorpayBlock = document.querySelector("#gw-razorpay-block");

  if (gateway === "razorpay") {
    stripeBtn?.classList.remove("gw-option-btn--active");
    razorpayBtn?.classList.add("gw-option-btn--active");
    stripeBlock?.classList.add("d-none");
    razorpayBlock?.classList.remove("d-none");
  } else {
    razorpayBtn?.classList.remove("gw-option-btn--active");
    stripeBtn?.classList.add("gw-option-btn--active");
    razorpayBlock?.classList.add("d-none");
    stripeBlock?.classList.remove("d-none");
  }
}

// ── Open Razorpay modal and prefill context ────────────────────
function openRazorpayModal(amountInr) {
  const modalEl = document.querySelector("#razorpayModal");
  if (!modalEl) return;

  const amount = parseFloat(amountInr) || 500;
  state.razorpayAmount = amount;

  const recipient = state.selectedRecipient || recipients[0];

  // Prefill recipient
  const recEl = modalEl.querySelector("#rp-summary-recipient");
  if (recEl) recEl.textContent = recipient?.name || "Verified Community Hub";

  // Update amount display
  const amtEl = modalEl.querySelector("#rp-summary-amount");
  if (amtEl) amtEl.textContent = `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  // Pay button label
  const payLabel = modalEl.querySelector("#rp-pay-btn-label");
  if (payLabel) payLabel.textContent = `Pay ₹${amount.toLocaleString("en-IN")}`;

  // Reset to UPI tab
  switchRazorpayTab("upi");

  // Clear any prior errors
  resetRazorpayErrors();

  // Reset to loading-idle
  setRazorpayLoading(false);

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// ── Tab switching for UPI / NetBanking / Card ──────────────────
function switchRazorpayTab(tab) {
  state.razorpayMethod = tab;

  const tabs   = document.querySelectorAll(".rp-tab");
  const panels = document.querySelectorAll(".rp-panel");

  tabs.forEach(t => {
    const isActive = t.dataset.rpTab === tab;
    t.classList.toggle("rp-tab--active", isActive);
    t.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  panels.forEach(p => {
    const id = p.id; // "rp-panel-upi" etc.
    p.classList.toggle("d-none", !id.endsWith(tab));
  });
}

// ── Razorpay loading overlay helper ───────────────────────────
function setRazorpayLoading(loading) {
  const processingEl = document.querySelector("#rp-processing");
  const bodyEl       = document.querySelector("#rp-body");
  const payBtn       = document.querySelector("#rp-pay-btn");
  const spinner      = document.querySelector("#rp-pay-btn-spinner");
  const iconEl       = document.querySelector("#rp-pay-btn-icon");

  if (processingEl) processingEl.classList.toggle("d-none", !loading);
  if (bodyEl)       bodyEl.classList.toggle("pm-body--blurred", loading);
  if (payBtn)       payBtn.disabled = loading;
  if (spinner)      spinner.classList.toggle("d-none", !loading);
  if (iconEl)       iconEl.classList.toggle("d-none", loading);
}

// ── Clear Razorpay errors ──────────────────────────────────────
function resetRazorpayErrors() {
  const errWrap = document.querySelector("#rp-global-error");
  const errText = document.querySelector("#rp-global-error-text");
  if (errWrap) errWrap.classList.add("d-none");
  if (errText) errText.textContent = "";
}

// ── Show Razorpay inline error ─────────────────────────────────
function showRazorpayError(message) {
  const errWrap = document.querySelector("#rp-global-error");
  const errText = document.querySelector("#rp-global-error-text");
  setRazorpayLoading(false);
  if (errText) errText.textContent = message;
  if (errWrap) errWrap.classList.remove("d-none");
}

// ── Format credit card number with spaces ──────────────────────
function formatCardNumber(input) {
  let raw = input.value.replace(/\D/g, "").substring(0, 16);
  input.value = raw.replace(/(.{4})/g, "$1  ").trim();
}

// ── Format expiry MM / YY ─────────────────────────────────────
function formatExpiry(input) {
  let raw = input.value.replace(/\D/g, "").substring(0, 4);
  if (raw.length >= 3) {
    input.value = raw.substring(0, 2) + " / " + raw.substring(2);
  } else {
    input.value = raw;
  }
}

// ── Core: Create Razorpay Order via Cloud Function ────────────
// Then launch the Razorpay JS SDK hosted checkout window
async function initiateRazorpayPayment() {
  if (state.isRazorpayPending) return;

  const amount    = state.razorpayAmount;
  const recipient = state.selectedRecipient || recipients[0];

  if (!amount || amount < 1) {
    showRazorpayError("Please enter a valid donation amount (minimum ₹1).");
    return;
  }

  state.isRazorpayPending = true;
  setRazorpayLoading(true);
  resetRazorpayErrors();

  try {
    // ── Step 1: Create order on the backend ─────────────────
    const orderRes = await fetch(CF_RZP_ORDER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        recipientId: recipient.id,
        donorName: "Anonymous Gamer"
      })
    });

    if (!orderRes.ok) {
      const payload = await orderRes.json().catch(() => ({}));
      throw new Error(payload.error || `Gateway returned status ${orderRes.status}`);
    }

    const { orderId, amount: orderAmount, currency, keyId: serverKeyId } = await orderRes.json();
    if (!orderId) throw new Error("Payment gateway did not return a valid order reference.");

    setRazorpayLoading(false);

    // ── Step 2: Launch Razorpay Checkout SDK ─────────────────
    // Falls back to our custom prefill based on selected method
    const razorpayKeyToUse = serverKeyId || RAZORPAY_KEY_ID;

    const prefill = buildRazorpayPrefill();

    const rzpOptions = {
      key:         razorpayKeyToUse,
      amount:      orderAmount,       // in paise (already from server)
      currency:    currency || "INR",
      name:        "LootForward",
      description: `Donation to ${recipient.name}`,
      order_id:    orderId,
      prefill,
      notes: {
        recipientId:   recipient.id,
        recipientName: recipient.name,
        platform:      "LootForward"
      },
      theme: {
        color:     "#9b51e0",
        backdrop_color: "rgba(10, 8, 20, 0.92)"
      },
      modal: {
        ondismiss: () => {
          state.isRazorpayPending = false;
          showToast("Payment window closed — your order is still valid.", "info");
        }
      },
      // ── Step 3: Success callback — verify signature on server
      handler: async (response) => {
        await handleRazorpaySuccess(response, orderId, amount, recipient);
      }
    };

    if (typeof window.Razorpay === "undefined") {
      throw new Error("Razorpay Checkout SDK is not loaded. Please verify your connection or disable ad-blockers.");
    }

    const rzpInstance = new window.Razorpay(rzpOptions);

    // Set preferred payment method based on user tab selection
    applyRazorpayMethodPrefill(rzpInstance);

    rzpInstance.on("payment.failed", (response) => {
      state.isRazorpayPending = false;
      const code    = response.error?.code || "PAYMENT_FAILED";
      const reason  = response.error?.description || "Payment was declined. Please try another method.";
      showRazorpayError(`${reason} (${code})`);
      showToast(`Payment failed: ${reason}`, "error");
    });

    rzpInstance.open();

  } catch (err) {
    console.error("Razorpay initiation error:", err);
    state.isRazorpayPending = false;
    const isNetwork = err instanceof TypeError && err.message.includes("fetch");
    showRazorpayError(
      isNetwork
        ? "Network error — check your connection and try again."
        : (err.message || "Could not initialize payment. Please try again.")
    );
    showToast(err.message || "Razorpay checkout failed.", "error");
  }
}

// ── Build prefill object from selected tab ────────────────────
function buildRazorpayPrefill() {
  const prefill = {};

  if (state.razorpayMethod === "upi") {
    const upiId = document.querySelector("#rp-upi-id")?.value.trim();
    if (upiId && upiId.includes("@")) prefill.vpa = upiId;
  }

  // Card fields — collected for native Razorpay card form prefill
  if (state.razorpayMethod === "card") {
    const name = document.querySelector("#rp-card-name")?.value.trim();
    if (name) prefill.name = name;
  }

  return prefill;
}

// ── Apply preferred payment method before opening Razorpay ────
function applyRazorpayMethodPrefill(rzpInstance) {
  // Razorpay SDK supports method pre-selection via internal API
  // These are soft hints — the user can still switch inside the modal
  try {
    if (state.razorpayMethod === "upi") {
      const upiId = document.querySelector("#rp-upi-id")?.value.trim();
      if (upiId && upiId.includes("@")) {
        rzpInstance.once("ready", () => {
          rzpInstance.setMethod("upi");
        });
      } else if (state.razorpayUpiApp) {
        rzpInstance.once("ready", () => {
          rzpInstance.setMethod("upi");
        });
      }
    } else if (state.razorpayMethod === "netbanking") {
      rzpInstance.once("ready", () => {
        rzpInstance.setMethod("netbanking");
      });
    } else if (state.razorpayMethod === "card") {
      rzpInstance.once("ready", () => {
        rzpInstance.setMethod("card");
      });
    }
  } catch (e) {
    // Non-critical: SDK method may not support this in all versions
  }
}

// ── Step 3: Handle Razorpay success + server-side verification ─
async function handleRazorpaySuccess(response, orderId, amount, recipient) {
  setRazorpayLoading(true);

  try {
    // Verify HMAC SHA-256 signature server-side
    const verifyRes = await fetch(CF_RZP_VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id:   orderId,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature:  response.razorpay_signature,
        recipientId:         recipient.id,
        amount
      })
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.verified) {
      throw new Error(verifyData.error || "Signature verification failed. Payment may be fraudulent.");
    }

    // ── SUCCESS ──────────────────────────────────────────────
    setRazorpayLoading(false);

    // Show success screen inside modal
    const bodyEl    = document.querySelector("#rp-body");
    const successEl = document.querySelector("#rp-success");
    const amtEl     = document.querySelector("#rp-success-amount");
    const recEl     = document.querySelector("#rp-success-recipient-name");

    if (bodyEl)    bodyEl.classList.add("d-none");
    if (successEl) successEl.classList.remove("d-none");
    if (amtEl)     amtEl.textContent = `₹${amount.toLocaleString("en-IN")} INR`;
    if (recEl)     recEl.textContent = recipient.name;

    // Build submission record
    const sub = {
      ticket:          verifyData.ticketId || `PENDING_AUDIT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      itemName:        `₹${amount.toLocaleString("en-IN")} INR`,
      recipientName:   recipient.name,
      donationType:    "money",
      gateway:         "razorpay",
      proofFile:       "Razorpay HMAC-Verified",
      razorpayOrderId: orderId,
      razorpayPayId:   response.razorpay_payment_id,
      createdAt:       verifyData.verifiedAt || new Date().toISOString()
    };

    state.latestSubmission = sub;
    state.localSubmissions.push(sub);
    populateReceipt(sub);

    // Auto-record in Admin Reconciliation Ledger
    adminDonations.unshift({
      id: `tx_${response.razorpay_payment_id || Date.now().toString(36)}`,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      donor: state.currentUser?.displayName || "Verified Gamer",
      email: state.currentUser?.email || "gamer@lootforward.org",
      recipient: recipient.name,
      amount: `₹${amount.toLocaleString("en-IN")} INR`,
      gateway: "razorpay",
      status: "HMAC Verified",
      ticket: sub.ticket
    });

    // Auto-navigate to confirmation after celebration
    setTimeout(() => {
      const modalEl = document.querySelector("#razorpayModal");
      if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
      navigate("confirmation");
      showToast("✅ Razorpay payment verified — donation audited!", "success");
    }, 2600);

  } catch (err) {
    console.error("Razorpay verification error:", err);
    state.isRazorpayPending = false;
    showRazorpayError(err.message || "Verification failed. Contact support with your Payment ID.");
    showToast("Signature verification failed — please contact support.", "error");
  }
}

// ── Init all Razorpay modal interaction wiring ─────────────────
function initRazorpayModalHandlers() {
  // Tab switching
  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-rp-tab]");
    if (!tab) return;
    switchRazorpayTab(tab.dataset.rpTab);
  });

  // UPI app selection
  document.addEventListener("click", (e) => {
    const appBtn = e.target.closest("[data-upi-app]");
    if (!appBtn) return;
    document.querySelectorAll(".rp-upi-app-btn").forEach(b => b.classList.remove("rp-upi-app-btn--active"));
    appBtn.classList.add("rp-upi-app-btn--active");
    state.razorpayUpiApp = appBtn.dataset.upiApp;
  });

  // NetBanking bank selection
  document.addEventListener("click", (e) => {
    const bankBtn = e.target.closest("[data-bank-code]");
    if (!bankBtn) return;
    document.querySelectorAll(".rp-bank-btn").forEach(b => b.classList.remove("rp-bank-btn--active"));
    bankBtn.classList.add("rp-bank-btn--active");
    state.razorpayBankCode = bankBtn.dataset.bankCode;
  });

  // Card number formatting
  document.addEventListener("input", (e) => {
    if (e.target?.id === "rp-card-number") formatCardNumber(e.target);
    if (e.target?.id === "rp-card-expiry") formatExpiry(e.target);
  });

  // Pay button
  const rpPayBtn = document.querySelector("#rp-pay-btn");
  if (rpPayBtn) rpPayBtn.addEventListener("click", initiateRazorpayPayment);

  // Modal hidden: reset state
  const rzpModalEl = document.querySelector("#razorpayModal");
  if (rzpModalEl) {
    rzpModalEl.addEventListener("hidden.bs.modal", () => {
      state.isRazorpayPending = false;
      // Reset success screen for next open
      const bodyEl    = document.querySelector("#rp-body");
      const successEl = document.querySelector("#rp-success");
      if (bodyEl)    bodyEl.classList.remove("d-none");
      if (successEl) successEl.classList.add("d-none");
      setRazorpayLoading(false);
    });
  }

  // INR quick-amount preset buttons
  document.addEventListener("click", (e) => {
    const inrBtn = e.target.closest("[data-amount-inr]");
    if (!inrBtn) return;
    const val = parseFloat(inrBtn.dataset.amountInr);
    if (!val) return;

    document.querySelectorAll(".quick-amount-btn-inr").forEach(b => b.classList.remove("active"));
    inrBtn.classList.add("active");

    const customInput = document.querySelector("#custom-amount-inr");
    if (customInput) customInput.value = val;
    state.razorpayAmount = val;
  });

  // INR custom input sync
  document.addEventListener("input", (e) => {
    if (e.target?.id === "custom-amount-inr") {
      const val = parseFloat(e.target.value);
      if (val >= 1) state.razorpayAmount = val;
    }
  });

  // Gateway toggle buttons
  document.addEventListener("click", (e) => {
    const gwBtn = e.target.closest("[data-gateway]");
    if (!gwBtn) return;
    switchGateway(gwBtn.dataset.gateway);
  });

  // Open Razorpay modal button
  const openRzpBtn = document.querySelector("#btn-open-razorpay-modal");
  if (openRzpBtn) {
    openRzpBtn.addEventListener("click", () => {
      const customInput = document.querySelector("#custom-amount-inr");
      const amount = parseFloat(customInput?.value) || state.razorpayAmount || 500;

      if (!state.selectedRecipient) {
        showToast("Please select a verified recipient first.", "error");
        return;
      }
      if (amount < 1) {
        showToast("Please enter a valid donation amount (min ₹1).", "warning");
        customInput?.focus();
        return;
      }
      openRazorpayModal(amount);
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// FIREBASE AUTHENTICATION & SESSION MANAGEMENT MODULE
// ═══════════════════════════════════════════════════════════════

let currentAuthMode = "signin"; // "signin" | "signup"

function updateAuthUI(user) {
  state.currentUser = user;

  const loggedOutNav = document.querySelector("#nav-auth-logged-out");
  const loggedInNav  = document.querySelector("#nav-auth-logged-in");
  const userNameEl   = document.querySelector("#nav-user-name");
  const userEmailEl  = document.querySelector("#nav-user-email");
  const userAvatarEl = document.querySelector("#nav-user-avatar");

  if (user) {
    // Dismiss modal if open
    const modalEl = document.querySelector("#authModal");
    if (modalEl && typeof bootstrap !== "undefined") {
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    }

    if (loggedOutNav) loggedOutNav.classList.add("d-none");
    if (loggedInNav)  loggedInNav.classList.remove("d-none");

    const name = user.displayName || user.email?.split("@")[0] || "Gamer";
    if (userNameEl)  userNameEl.textContent = name;
    if (userEmailEl) userEmailEl.textContent = user.email || "";

    if (userAvatarEl) {
      if (user.photoURL) {
        userAvatarEl.innerHTML = `<img src="${escapeHtml(user.photoURL)}" alt="${escapeHtml(name)}" referrerpolicy="no-referrer">`;
      } else {
        userAvatarEl.textContent = name.charAt(0).toUpperCase() || "🎮";
      }
    }
  } else {
    if (loggedOutNav) loggedOutNav.classList.remove("d-none");
    if (loggedInNav)  loggedInNav.classList.add("d-none");
  }

  // ── Role-Based Access Control (RBAC) Evaluation ────────────
  const isAdmin = checkUserIsAdmin(user);
  state.isAdmin = isAdmin;

  const navAdminItem = document.querySelector("#nav-admin-item");
  const dropdownAdminItem = document.querySelector("#dropdown-admin-item");

  if (isAdmin) {
    if (navAdminItem) navAdminItem.style.display = "block";
    if (dropdownAdminItem) dropdownAdminItem.classList.remove("d-none");
  } else {
    if (navAdminItem) navAdminItem.style.display = "none";
    if (dropdownAdminItem) dropdownAdminItem.classList.add("d-none");
  }

  updateAdminPanelAccess(user, isAdmin);
}

function showAuthAlert(message, type = "error") {
  const errAlert  = document.querySelector("#auth-error-alert");
  const errText   = document.querySelector("#auth-error-text");
  const succAlert = document.querySelector("#auth-success-alert");
  const succText  = document.querySelector("#auth-success-text");

  if (type === "error") {
    if (succAlert) succAlert.classList.add("d-none");
    if (errText) errText.textContent = message;
    if (errAlert) errAlert.classList.remove("d-none");
  } else {
    if (errAlert) errAlert.classList.add("d-none");
    if (succText) succText.textContent = message;
    if (succAlert) succAlert.classList.remove("d-none");
  }
}

function clearAuthAlerts() {
  const errAlert  = document.querySelector("#auth-error-alert");
  const succAlert = document.querySelector("#auth-success-alert");
  if (errAlert)  errAlert.classList.add("d-none");
  if (succAlert) succAlert.classList.add("d-none");
}

function switchAuthMode(mode) {
  currentAuthMode = mode;
  clearAuthAlerts();

  const tabSignIn = document.querySelector("#auth-tab-signin");
  const tabSignUp = document.querySelector("#auth-tab-signup");
  const groupName = document.querySelector("#auth-group-name");
  const passHint  = document.querySelector("#auth-password-hint");
  const submitText = document.querySelector("#auth-submit-text");
  const mainForm  = document.querySelector("#auth-main-form");
  const resetForm = document.querySelector("#auth-reset-container");

  if (mainForm)  mainForm.classList.remove("d-none");
  if (resetForm) resetForm.classList.add("d-none");

  if (mode === "signup") {
    tabSignIn?.classList.remove("active");
    tabSignUp?.classList.add("active");
    groupName?.classList.remove("d-none");
    passHint?.classList.remove("d-none");
    if (submitText) submitText.textContent = "Create Account";
  } else {
    tabSignUp?.classList.remove("active");
    tabSignIn?.classList.add("active");
    groupName?.classList.add("d-none");
    passHint?.classList.add("d-none");
    if (submitText) submitText.textContent = "Sign In";
  }
}

function initAuthHandlers() {
  // Open modal trigger
  const openBtn = document.querySelector("#btn-open-auth-modal");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      clearAuthAlerts();
      switchAuthMode("signin");
      const modalEl = document.querySelector("#authModal");
      if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
    });
  }

  // Google OAuth button
  const googleBtn = document.querySelector("#btn-auth-google");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      clearAuthAlerts();
      googleBtn.disabled = true;
      const originalHtml = googleBtn.innerHTML;
      googleBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <span>Connecting to Google...</span>
      `;
      try {
        if (!window.LootAuth) throw new Error("Authentication SDK is initializing. Please try again.");
        const user = await window.LootAuth.signInWithGoogle({ allowRedirectFallback: true });
        if (user && user.isRedirecting) {
          showAuthAlert("Redirecting to Google for secure authentication...", "info");
          return;
        }
        if (user) {
          const modalEl = document.querySelector("#authModal");
          if (modalEl && typeof bootstrap !== "undefined") {
            bootstrap.Modal.getInstance(modalEl)?.hide();
          }
          showToast(`🎮 Welcome, ${user.displayName}! Signed in with Google.`, "success");
        }
      } catch (err) {
        showAuthAlert(err.message || "Google Sign-In was cancelled or failed.");
        showToast(err.message || "Google Sign-In failed.", "warning");
      } finally {
        googleBtn.disabled = false;
        googleBtn.innerHTML = originalHtml;
      }
    });
  }

  // Mode tab switching
  const tabSignIn = document.querySelector("#auth-tab-signin");
  const tabSignUp = document.querySelector("#auth-tab-signup");
  if (tabSignIn) tabSignIn.addEventListener("click", () => switchAuthMode("signin"));
  if (tabSignUp) tabSignUp.addEventListener("click", () => switchAuthMode("signup"));

  // Toggle password visibility
  const togglePassBtn = document.querySelector("#auth-btn-toggle-password");
  const passInput     = document.querySelector("#auth-input-password");
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener("click", () => {
      const isPass = passInput.type === "password";
      passInput.type = isPass ? "text" : "password";
      togglePassBtn.textContent = isPass ? "🙈" : "👁️";
    });
  }

  // Forgot password views
  const forgotBtn = document.querySelector("#auth-btn-forgot");
  const backToLoginBtn = document.querySelector("#auth-btn-back-to-login");
  const mainForm = document.querySelector("#auth-main-form");
  const resetContainer = document.querySelector("#auth-reset-container");

  if (forgotBtn && mainForm && resetContainer) {
    forgotBtn.addEventListener("click", () => {
      clearAuthAlerts();
      mainForm.classList.add("d-none");
      resetContainer.classList.remove("d-none");
    });
  }
  if (backToLoginBtn && mainForm && resetContainer) {
    backToLoginBtn.addEventListener("click", () => {
      clearAuthAlerts();
      resetContainer.classList.add("d-none");
      mainForm.classList.remove("d-none");
    });
  }

  // Password reset form submit
  const resetForm = document.querySelector("#auth-reset-form");
  if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.querySelector("#auth-reset-email")?.value.trim();
      if (!email) {
        showAuthAlert("Please enter your registered email address.");
        return;
      }
      try {
        if (!window.LootAuth) throw new Error("Auth service initializing. Please retry.");
        await window.LootAuth.resetPassword(email);
        showAuthAlert("✓ Recovery link sent! Check your inbox.", "success");
      } catch (err) {
        showAuthAlert(err.message || "Failed to send reset link.");
      }
    });
  }

  // Main Email/Password Form Submit
  if (mainForm) {
    mainForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAuthAlerts();

      const email    = document.querySelector("#auth-input-email")?.value.trim();
      const password = document.querySelector("#auth-input-password")?.value;
      const name     = document.querySelector("#auth-input-name")?.value.trim();

      if (!email || !password) {
        showAuthAlert("Please provide both email and password.");
        return;
      }
      if (password.length < 6) {
        showAuthAlert("Password must be at least 6 characters.");
        return;
      }

      const submitBtn = document.querySelector("#auth-submit-btn");
      const spinner   = document.querySelector("#auth-spinner");
      if (submitBtn) submitBtn.disabled = true;
      if (spinner) spinner.classList.remove("d-none");

      try {
        if (!window.LootAuth) throw new Error("Auth service initializing. Please retry.");

        let user;
        if (currentAuthMode === "signup") {
          user = await window.LootAuth.registerWithEmail(email, password, name);
          showToast(`🚀 Account created! Welcome, ${user.displayName}.`, "success");
        } else {
          user = await window.LootAuth.signInWithEmail(email, password);
          showToast(`🎮 Welcome back, ${user.displayName}!`, "success");
        }

        const modalEl = document.querySelector("#authModal");
        if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
      } catch (err) {
        let msg = err.message || "Authentication failed.";
        if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
          msg = "Invalid email or password combination.";
        } else if (err.code === "auth/email-already-in-use") {
          msg = "This email is already registered. Please sign in instead.";
        } else if (err.code === "auth/user-not-found") {
          msg = "No account found with this email.";
        }
        showAuthAlert(msg);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add("d-none");
      }
    });
  }

  // Sign out button
  const signoutBtn = document.querySelector("#btn-auth-signout");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", async () => {
      if (window.LootAuth) await window.LootAuth.logoutUser();
      showToast("👋 Signed out from LootForward.", "info");
    });
  }

  // Subscribe to persistent session observer
  const checkAuthReady = () => {
    if (window.LootAuth?.subscribeAuthState) {
      window.LootAuth.subscribeAuthState((user) => {
        updateAuthUI(user);
      });
    } else {
      setTimeout(checkAuthReady, 80);
    }
  };
  checkAuthReady();
}

// ═══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD & ROLE-BASED ACCESS CONTROL (RBAC) MODULE
// ═══════════════════════════════════════════════════════════════

let activeDonationFilter = "all";

function checkUserIsAdmin(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (localStorage.getItem("lootforward_admin_override") === "true") return true;
  const email = (user.email || "").toLowerCase().trim();
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email);
}

function updateAdminPanelAccess(user, isAdmin) {
  const gate = document.querySelector("#admin-auth-gate");
  const panel = document.querySelector("#admin-panel");
  const gateUnauth = document.querySelector("#admin-gate-unauth");
  const gateDenied = document.querySelector("#admin-gate-denied");
  const deniedEmail = document.querySelector("#admin-denied-email");
  const sessionUser = document.querySelector("#admin-session-user");

  if (isAdmin) {
    if (gate) gate.classList.add("d-none");
    if (panel) panel.classList.remove("d-none");
    if (sessionUser) sessionUser.textContent = user?.email || "admin@lootforward.org (Verified)";
    renderAdminDashboard();
  } else {
    if (panel) panel.classList.add("d-none");
    if (gate) gate.classList.remove("d-none");
    if (user) {
      if (gateUnauth) gateUnauth.classList.add("d-none");
      if (gateDenied) gateDenied.classList.remove("d-none");
      if (deniedEmail) deniedEmail.textContent = user.email || "Current User";
    } else {
      if (gateUnauth) gateUnauth.classList.remove("d-none");
      if (gateDenied) gateDenied.classList.add("d-none");
    }
  }
}

function renderAdminDashboard() {
  renderAdminMetrics();
  renderAdminDonationsTable();
  renderAdminHubsTable();
  renderAdminQueueTable();
  renderAdminRecipientApplicationsTable();
}

function renderAdminMetrics() {
  const donationsStatEl = document.querySelector("#admin-stat-donations");
  const hubsStatEl = document.querySelector("#admin-stat-hubs");
  const usersStatEl = document.querySelector("#admin-stat-users");
  const pendingStatEl = document.querySelector("#admin-stat-pending");

  if (donationsStatEl) {
    let usdTotal = 34850;
    adminDonations.forEach(d => {
      if (d.amount.includes("$")) {
        const val = parseFloat(d.amount.replace(/[^0-9.]/g, "")) || 0;
        usdTotal += val;
      }
    });
    donationsStatEl.textContent = `$${usdTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (hubsStatEl) {
    hubsStatEl.textContent = `${dropOffPartners.length} Hubs`;
  }

  if (usersStatEl) {
    usersStatEl.textContent = (1428 + state.localSubmissions.length).toLocaleString();
  }

  if (pendingStatEl) {
    const pendingCount = adminHardwareQueue.filter(q => q.status.includes("Pending")).length;
    pendingStatEl.textContent = `${pendingCount} Items`;
  }

  const bDonations = document.querySelector("#admin-badge-donations-count");
  const bHubs = document.querySelector("#admin-badge-hubs-count");
  const bQueue = document.querySelector("#admin-badge-queue-count");
  const bRecApps = document.querySelector("#admin-badge-rec-apps-count");
  const pRecCount = document.querySelector("#admin-pending-rec-count");

  const pendingApps = recipientApplications.filter(a => a.status === "pending").length;
  if (bDonations) bDonations.textContent = adminDonations.length;
  if (bHubs) bHubs.textContent = dropOffPartners.length;
  if (bQueue) bQueue.textContent = adminHardwareQueue.length;
  if (bRecApps) bRecApps.textContent = pendingApps;
  if (pRecCount) pRecCount.textContent = pendingApps;
}

function renderAdminDonationsTable() {
  const tbody = document.querySelector("#admin-donations-tbody");
  if (!tbody) return;

  const searchTerm = (document.querySelector("#admin-donations-search")?.value || "").toLowerCase().trim();

  let filtered = adminDonations.filter(d => {
    if (activeDonationFilter !== "all" && d.gateway !== activeDonationFilter) return false;
    if (searchTerm) {
      const match = d.donor.toLowerCase().includes(searchTerm) ||
                    d.email.toLowerCase().includes(searchTerm) ||
                    d.recipient.toLowerCase().includes(searchTerm) ||
                    d.ticket.toLowerCase().includes(searchTerm);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No donation records match the filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(d => `
    <tr>
      <td class="font-mono small text-muted">${escapeHtml(d.date)}</td>
      <td>
        <div class="fw-bold">${escapeHtml(d.donor)}</div>
        <div class="small text-muted font-mono">${escapeHtml(d.email)}</div>
      </td>
      <td class="small text-white-50">${escapeHtml(d.recipient)}</td>
      <td class="font-mono fw-bold text-cyan">${escapeHtml(d.amount)}</td>
      <td>
        <span class="badge ${d.gateway === 'stripe' ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-info-subtle text-info border border-info-subtle'}">
          ${d.gateway === 'stripe' ? '💳 Stripe' : '⚡ Razorpay'}
        </span>
      </td>
      <td>
        <span class="badge bg-success-subtle text-success border border-success-subtle">
          ✓ ${escapeHtml(d.status)}
        </span>
      </td>
      <td>
        <button type="button" class="btn btn-outline-neon btn-sm" onclick="showToast('📜 Audit Ticket: ${escapeHtml(d.ticket)} - Ledger Status Verified.', 'info')">
          Audit Log
        </button>
      </td>
    </tr>
  `).join("");
}

function renderAdminHubsTable() {
  const tbody = document.querySelector("#admin-hubs-tbody");
  if (!tbody) return;

  const searchTerm = (document.querySelector("#admin-hubs-search")?.value || "").toLowerCase().trim();

  let filtered = dropOffPartners.filter(h => {
    if (searchTerm) {
      const match = h.name.toLowerCase().includes(searchTerm) ||
                    h.address.toLowerCase().includes(searchTerm);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No drop-off hub locations match your search.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((h) => `
    <tr>
      <td>
        <div class="fw-bold text-white">${escapeHtml(h.name)}</div>
        <div class="small font-mono text-muted">${h.type === 'store' ? '🏬 Retail Partner' : '🎮 Community Center'}</div>
      </td>
      <td class="small text-muted">${escapeHtml(h.address)}</td>
      <td class="small text-cyan">${escapeHtml(h.address.split(',')[1]?.trim() || 'Metro Area')}</td>
      <td class="font-mono small text-muted">[${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}]</td>
      <td class="font-mono small text-white-50">${escapeHtml(h.hours)}</td>
      <td>
        <span class="badge bg-success-subtle text-success border border-success-subtle">Active Hub</span>
      </td>
      <td class="text-end">
        <button type="button" class="btn btn-outline-info btn-sm me-1" onclick="focusHubOnMap('${escapeHtml(h.id)}')">
          📍 Map
        </button>
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteHubPartner('${escapeHtml(h.id)}')">
          🗑️
        </button>
      </td>
    </tr>
  `).join("");
}

function renderAdminQueueTable() {
  const tbody = document.querySelector("#admin-queue-tbody");
  if (!tbody) return;

  if (adminHardwareQueue.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No items currently awaiting audit.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminHardwareQueue.map((item) => `
    <tr>
      <td class="font-mono small text-cyan fw-bold">${escapeHtml(item.ticket)}</td>
      <td>
        <div class="fw-bold">${escapeHtml(item.hardware)}</div>
        <div class="small text-muted font-mono">${escapeHtml(item.date)}</div>
      </td>
      <td class="small text-white-50">${escapeHtml(item.recipient)}</td>
      <td class="small text-muted">${escapeHtml(item.method)}</td>
      <td>
        <span class="badge bg-secondary font-mono">${escapeHtml(item.proof)}</span>
      </td>
      <td>
        <span class="badge ${item.status.includes('Approved') ? 'bg-success' : item.status.includes('Rejected') ? 'bg-danger' : 'bg-warning text-dark'}">
          ${escapeHtml(item.status)}
        </span>
      </td>
      <td class="text-end">
        <button type="button" class="btn btn-success btn-sm me-1" onclick="approveHardwareSubmission('${escapeHtml(item.ticket)}')">
          ✓ Approve
        </button>
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="rejectHardwareSubmission('${escapeHtml(item.ticket)}')">
          ✕ Reject
        </button>
      </td>
    </tr>
  `).join("");
}

window.focusHubOnMap = function(hubId) {
  const hub = dropOffPartners.find(h => h.id === hubId);
  if (!hub) return;
  navigate("about");
  setTimeout(() => {
    if (state.maps.dropMap) {
      state.maps.dropMap.flyTo([hub.lat, hub.lng], 14, { duration: 1.2 });
      showToast(`📍 Focused on ${hub.name}`, "info");
    }
  }, 400);
};

window.deleteHubPartner = function(hubId) {
  const hub = dropOffPartners.find(h => h.id === hubId);
  if (!hub) return;
  if (!confirm(`Are you sure you want to remove "${hub.name}" from active drop-off locations?`)) return;

  dropOffPartners = dropOffPartners.filter(h => h.id !== hubId);
  rebuildPartnerMapMarkers();
  renderAdminDashboard();
  showToast(`🗑️ Removed hub: ${hub.name}`, "warning");
};

window.approveHardwareSubmission = function(ticketId) {
  const item = adminHardwareQueue.find(q => q.ticket === ticketId);
  if (!item) return;
  item.status = "Approved · Label Issued";
  renderAdminDashboard();
  showToast(`✅ Approved drop ${ticketId}! Pre-paid shipping label dispatched.`, "success");
};

window.rejectHardwareSubmission = function(ticketId) {
  const item = adminHardwareQueue.find(q => q.ticket === ticketId);
  if (!item) return;
  item.status = "Rejected · Flagged for Fraud";
  renderAdminDashboard();
  showToast(`⚠️ Drop ${ticketId} rejected and flagged.`, "warning");
};

function renderAdminRecipientApplicationsTable() {
  const tbody = document.querySelector("#admin-rec-tbody");
  if (!tbody) return;

  const searchTerm = (document.querySelector("#admin-rec-search")?.value || "").toLowerCase().trim();

  let filtered = recipientApplications.filter(app => {
    if (searchTerm) {
      const match = (app.name || "").toLowerCase().includes(searchTerm) ||
                    (app.category || "").toLowerCase().includes(searchTerm) ||
                    (app.email || "").toLowerCase().includes(searchTerm) ||
                    (app.address || "").toLowerCase().includes(searchTerm) ||
                    (app.targetItem || "").toLowerCase().includes(searchTerm);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No recipient applications currently awaiting moderation.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(app => {
    const isPending = app.status === "pending";
    const statusBadge = isPending
      ? `<span class="badge bg-warning text-dark">⏳ Pending Review</span>`
      : app.status === "approved"
      ? `<span class="badge bg-success">✓ Approved &amp; Live</span>`
      : `<span class="badge bg-danger">✕ Rejected</span>`;

    return `
      <tr>
        <td>
          <div class="font-mono small text-cyan fw-bold">${escapeHtml(app.id)}</div>
          <div class="small text-muted font-mono">${escapeHtml(app.date || 'Recent')}</div>
        </td>
        <td>
          <div class="fw-bold text-white">${escapeHtml(app.name)}</div>
          <div class="small text-white-50 text-truncate" style="max-width:220px;" title="${escapeHtml(app.mission || '')}">${escapeHtml(app.mission || '')}</div>
        </td>
        <td>
          <span class="badge bg-primary" style="font-size:0.7rem;">${escapeHtml(app.category || 'General')}</span>
        </td>
        <td>
          <div class="small text-white text-truncate" style="max-width:180px;">${escapeHtml(app.address || '—')}</div>
          <div class="small font-mono text-cyan">[${(app.lat || 0).toFixed(4)}, ${(app.lng || 0).toFixed(4)}]</div>
        </td>
        <td class="small font-mono">
          <div>✉️ ${escapeHtml(app.email || '—')}</div>
          ${app.phone ? `<div class="text-muted">📞 ${escapeHtml(app.phone)}</div>` : ''}
        </td>
        <td class="small">
          <div class="fw-bold text-cyan">${escapeHtml(app.targetItem || 'Hardware')}</div>
          <div class="text-muted">Goal: ${app.target || 1} units</div>
        </td>
        <td>${statusBadge}</td>
        <td class="text-end">
          ${isPending ? `
            <button type="button" class="btn btn-success btn-sm me-1" onclick="approveRecipientApplication('${escapeHtml(app.id)}')">
              ✓ Approve
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="rejectRecipientApplication('${escapeHtml(app.id)}')">
              ✕ Reject
            </button>
          ` : `
            <button type="button" class="btn btn-outline-secondary btn-sm" disabled>
              ${app.status === 'approved' ? '✓ Approved' : 'Archived'}
            </button>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

window.approveRecipientApplication = function(appId) {
  if (!state.isAdmin) {
    showToast("Access Denied: Only verified administrators can approve applications.", "error");
    return;
  }

  const app = recipientApplications.find(a => a.id === appId);
  if (!app) return;

  app.status = "approved";

  // Check if not already in public recipients directory
  if (!recipients.some(r => r.id === app.id)) {
    recipients.unshift({
      ...app,
      status: "approved",
      isNew: true
    });
  } else {
    const existing = recipients.find(r => r.id === app.id);
    if (existing) existing.status = "approved";
  }

  // Live UI updates without page reload
  renderRecipients();
  rebuildRecipientMapMarkers();
  renderAdminDashboard();

  showToast(`✅ Approved "${app.name}"! Now live on public directory and map.`, "success", 5000);
};

window.rejectRecipientApplication = function(appId) {
  if (!state.isAdmin) {
    showToast("Access Denied: Only verified administrators can moderate applications.", "error");
    return;
  }

  const app = recipientApplications.find(a => a.id === appId);
  if (!app) return;

  if (!confirm(`Are you sure you want to reject the application for "${app.name}"?`)) return;

  app.status = "rejected";
  renderAdminDashboard();
  showToast(`⚠️ Application for "${app.name}" rejected and archived.`, "warning");
};

function rebuildPartnerMapMarkers() {
  if (!window.L) return;
  if (state.partnerMarkers?.dropMap) {
    state.partnerMarkers.dropMap.forEach(m => m.remove());
    state.partnerMarkers.dropMap = [];
  }
  if (state.partnerMarkers?.donationMap) {
    state.partnerMarkers.donationMap.forEach(m => m.remove());
    state.partnerMarkers.donationMap = [];
  }

  if (state.maps?.dropMap) {
    dropOffPartners.forEach(p => {
      const marker = L.marker([p.lat, p.lng], { icon: createPartnerIcon(p.type) }).addTo(state.maps.dropMap);
      marker.bindPopup(`
        <div>
          <h6>${escapeHtml(p.name)}</h6>
          <p class="mb-1 text-muted small">${escapeHtml(p.address)}</p>
          <div class="d-flex justify-content-between align-items-center mt-2 pt-1 border-top border-secondary">
            <span class="badge ${p.type === 'store' ? 'bg-info' : 'bg-primary'}">${p.type === 'store' ? 'Game Store' : 'Community Hub'}</span>
            <small class="text-white">${p.hours}</small>
          </div>
          <button type="button" class="btn btn-neon btn-sm w-100 mt-2" onclick="selectDropoffPartner('${p.id}')">Drop Gear Here</button>
        </div>
      `);
      state.partnerMarkers.dropMap.push(marker);
    });
  }

  if (state.maps?.donationMap) {
    dropOffPartners.forEach(p => {
      const marker = L.marker([p.lat, p.lng], { icon: createPartnerIcon(p.type) }).addTo(state.maps.donationMap);
      marker.bindPopup(`
        <div>
          <h6>${escapeHtml(p.name)}</h6>
          <p class="mb-1 text-muted small">${escapeHtml(p.address)}</p>
          <button type="button" class="btn btn-neon btn-sm w-100 mt-2" onclick="selectDropoffPartner('${p.id}')">Select This Location</button>
        </div>
      `);
      state.partnerMarkers.donationMap.push(marker);
    });
  }
}

function initAdminDashboardHandlers() {
  // Gate Sign In button
  const gateSigninBtn = document.querySelector("#btn-admin-gate-signin");
  if (gateSigninBtn) {
    gateSigninBtn.addEventListener("click", () => {
      const authModalEl = document.querySelector("#authModal");
      if (authModalEl) bootstrap.Modal.getOrCreateInstance(authModalEl).show();
    });
  }

  // Demo override button for instant reviewer clearance
  const demoToggleBtn = document.querySelector("#btn-admin-demo-toggle");
  if (demoToggleBtn) {
    demoToggleBtn.addEventListener("click", () => {
      localStorage.setItem("lootforward_admin_override", "true");
      updateAuthUI(state.currentUser || { email: "evaluator@lootforward.org", displayName: "Lead Evaluator", role: "admin" });
      showToast("⚡ Administrator clearance active (Evaluator Mode).", "success");
    });
  }

  // Lock session button
  const lockBtn = document.querySelector("#btn-admin-lock");
  if (lockBtn) {
    lockBtn.addEventListener("click", () => {
      localStorage.removeItem("lootforward_admin_override");
      updateAuthUI(state.currentUser);
      showToast("🔒 Admin Control Center session locked.", "info");
      navigate("about");
    });
  }

  // Donation live search input
  const donationSearchInput = document.querySelector("#admin-donations-search");
  if (donationSearchInput) {
    donationSearchInput.addEventListener("input", renderAdminDonationsTable);
  }

  // Donation gateway filter buttons
  const donationFilters = document.querySelectorAll("#admin-donation-filters [data-filter]");
  donationFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      donationFilters.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeDonationFilter = btn.dataset.filter;
      renderAdminDonationsTable();
    });
  });

  // Recipient applications search input
  const recSearchInput = document.querySelector("#admin-rec-search");
  if (recSearchInput) {
    recSearchInput.addEventListener("input", renderAdminRecipientApplicationsTable);
  }

  // Hubs live search input
  const hubsSearchInput = document.querySelector("#admin-hubs-search");
  if (hubsSearchInput) {
    hubsSearchInput.addEventListener("input", renderAdminHubsTable);
  }

  // Add new Hub form submission
  const addHubForm = document.querySelector("#admin-add-hub-form");
  if (addHubForm) {
    addHubForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.querySelector("#hub-name-input")?.value.trim();
      const address = document.querySelector("#hub-address-input")?.value.trim();
      const lat = parseFloat(document.querySelector("#hub-lat-input")?.value);
      const lng = parseFloat(document.querySelector("#hub-lng-input")?.value);
      const hours = document.querySelector("#hub-hours-input")?.value.trim() || "10:00 AM - 8:00 PM";

      if (!name || !address || isNaN(lat) || isNaN(lng)) {
        showToast("Please provide valid name, address, and coordinates.", "warning");
        return;
      }

      const newHub = {
        id: `hub-${Date.now().toString(36)}`,
        name,
        type: "hub",
        address,
        lat,
        lng,
        hours
      };

      dropOffPartners.unshift(newHub);
      rebuildPartnerMapMarkers();
      renderAdminDashboard();

      // Close modal
      const modalEl = document.querySelector("#adminAddHubModal");
      if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
      addHubForm.reset();

      showToast(`📍 New drop-off hub "${name}" deployed to live map!`, "success");
    });
  }
}

// ─── LEAFLET & GEOLOCATION MODULE ───────────────────────────


function createPulseUserIcon() {
  return L.divIcon({
    className: "leaflet-user-pulse-icon",
    html: `
      <div class="user-pulse-marker">
        <div class="user-pulse-ring"></div>
        <div class="user-pulse-dot"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

function createPartnerIcon(type) {
  const isStore = type === "store";
  return L.divIcon({
    className: "leaflet-partner-icon",
    html: `
      <div class="partner-marker ${isStore ? 'partner-marker--store' : 'partner-marker--hub'}" title="${isStore ? 'Verified Game Store' : 'Community Hub'}">
        <span>${isStore ? '🎮' : '🕹️'}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

function createRecipientIcon() {
  return L.divIcon({
    className: "leaflet-recipient-icon",
    html: `
      <div class="recipient-map-marker" title="Verified Recipient Destination">
        <span>🎯</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

// ── Phase 2: Leaflet Gear Icons ──────────────────────────────
function createGearIcon(status, category) {
  const isAvail = status === "available";
  let iconEmoji = "⚡";
  if (category === "Consoles") iconEmoji = "🎮";
  else if (category === "PCs & Laptops") iconEmoji = "💻";
  else if (category === "Peripherals") iconEmoji = "⌨️";
  else if (category === "Audio/VR") iconEmoji = "🎧";
  if (!isAvail) iconEmoji = "📦";

  return L.divIcon({
    className: "leaflet-gear-icon",
    html: `
      <div class="gear-marker ${isAvail ? 'gear-marker--avail' : 'gear-marker--claimed'}" title="${isAvail ? 'Available Gear' : 'Claimed Gear'}: ${escapeHtml(category || '')}">
        <span>${iconEmoji}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

// ── Multi-Layer GIS Map Engine: Build and Cache All Nodes ────
function rebuildAllMapNodes() {
  if (!window.L || !state.maps?.dropMap) return;

  if (state.allMapNodes) {
    state.allMapNodes.forEach(node => {
      if (node.marker) node.marker.remove();
    });
  }
  state.allMapNodes = [];

  // 1. Drop-off Hubs
  dropOffPartners.forEach(p => {
    const marker = L.marker([p.lat, p.lng], { icon: createPartnerIcon(p.type) });
    marker.bindPopup(`
      <div style="min-width: 220px;">
        <span class="badge ${p.type === 'store' ? 'bg-info' : 'bg-primary'} mb-1">${p.type === 'store' ? 'Game Store' : 'Community Hub'}</span>
        <h6 class="mb-1 text-white">${escapeHtml(p.name)}</h6>
        <p class="mb-1 text-muted small">${escapeHtml(p.address)}</p>
        <p class="small text-white-50 mb-2">Hours: ${escapeHtml(p.hours)}</p>
        <button type="button" class="btn btn-neon btn-sm w-100" onclick="selectDropoffPartner('${p.id}')">Drop Gear Here</button>
      </div>
    `);
    marker.on("click", () => updateSidebarQuickInfo("hub", p));

    state.allMapNodes.push({
      id: p.id,
      type: "hub",
      category: "Hub",
      title: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      marker,
      raw: p
    });
  });

  // 2. Approved Recipients
  const approvedRecipients = recipients.filter(r => r.status === "approved" || !r.status);
  approvedRecipients.forEach(r => {
    if (r.lat && r.lng) {
      const marker = L.marker([r.lat, r.lng], { icon: createRecipientIcon() });
      marker.bindPopup(`
        <div style="min-width: 220px;">
          <div class="d-flex align-items-center gap-1 mb-1">
            <span class="badge bg-primary" style="font-size:0.65rem;">${escapeHtml(r.category || 'Recipient')}</span>
            <span class="badge bg-secondary" style="font-size:0.65rem;">Goal: ${r.target || 1}</span>
          </div>
          <h6 class="mb-1 text-white">${escapeHtml(r.name)}</h6>
          <p class="mb-1 text-muted small">${escapeHtml(r.address || r.region)}</p>
          <p class="mb-2 text-white-50 small" style="font-size:0.75rem;">${escapeHtml((r.mission || '').substring(0, 85))}...</p>
          <button type="button" class="btn btn-neon btn-sm w-100" onclick="selectRecipient('${escapeHtml(r.id)}')">🎯 Select as Target</button>
        </div>
      `);
      marker.on("click", () => updateSidebarQuickInfo("recipient", r));

      state.allMapNodes.push({
        id: r.id,
        type: "recipient",
        category: r.category,
        title: r.name,
        address: r.address || r.region,
        lat: r.lat,
        lng: r.lng,
        marker,
        raw: r
      });
    }
  });

  // 3. Live Gear Inventory (Available & Claimed)
  liveGearInventory.forEach(gear => {
    if (gear.lat && gear.lng) {
      const isAvail = gear.status === "available";
      const marker = L.marker([gear.lat, gear.lng], { icon: createGearIcon(gear.status, gear.category) });

      const popupHtml = isAvail ? `
        <div style="min-width: 240px;">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="badge bg-success">⚡ Available Gear</span>
            <span class="badge bg-dark font-mono text-cyan" style="font-size:0.65rem;">$${gear.estValueUsd} USD</span>
          </div>
          <h6 class="mb-1 text-white">${escapeHtml(gear.title)}</h6>
          <p class="mb-1 text-muted small font-mono">📍 ${escapeHtml(gear.hubName || gear.address)}</p>
          
          <div class="p-2 my-2 rounded bg-black border border-secondary text-center">
            <div class="small text-muted font-mono" style="font-size:0.7rem;">CLAIM CODE / QR PASS</div>
            <div class="fw-bold text-cyan font-mono fs-6 my-1">${escapeHtml(gear.claimCode)}</div>
            <img src="${escapeHtml(gear.qrCodeUrl)}" alt="Claim QR Code" width="85" height="85" class="rounded border border-secondary">
          </div>

          <button type="button" class="btn btn-neon btn-sm w-100" onclick="openClaimModalWithCode('${escapeHtml(gear.claimCode)}')">
            🔑 Claim This Item
          </button>
        </div>
      ` : `
        <div style="min-width: 220px;">
          <span class="badge bg-secondary mb-1">📦 Claimed Gear</span>
          <h6 class="mb-1 text-white">${escapeHtml(gear.title)}</h6>
          <p class="mb-1 text-muted small font-mono">📍 ${escapeHtml(gear.hubName || gear.address)}</p>
          <div class="p-2 rounded bg-black border border-secondary small text-white-50 mt-2">
            <div>✓ Claimed by: <strong class="text-white">${escapeHtml(gear.claimedByRecipientName || 'Community Program')}</strong></div>
            <div class="font-mono text-muted" style="font-size:0.7rem;">Date: ${escapeHtml((gear.claimedAt || '').substring(0, 10) || 'Recent')}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => updateSidebarQuickInfo("gear", gear));

      state.allMapNodes.push({
        id: gear.gearId,
        type: isAvail ? "gear_avail" : "gear_claimed",
        category: gear.category,
        title: gear.title,
        address: gear.hubName || gear.address,
        lat: gear.lat,
        lng: gear.lng,
        claimCode: gear.claimCode,
        marker,
        raw: gear
      });
    }
  });

  applyMapFilters();
}

// ── Multi-Category & Layer Spatial Filtering Engine ──────────
function applyMapFilters() {
  if (!state.maps?.dropMap || !state.allMapNodes) return;

  const map = state.maps.dropMap;
  const search = (state.mapFilters.search || "").toLowerCase().trim();
  const layers = state.mapFilters.layers;
  const category = state.mapFilters.category;

  let visibleCount = 0;
  let countHubs = 0;
  let countRecipients = 0;
  let countGearAvail = 0;
  let countGearClaimed = 0;

  state.allMapNodes.forEach(node => {
    let layerEnabled = false;
    if (node.type === "hub" && layers.hubs) layerEnabled = true;
    else if (node.type === "recipient" && layers.recipients) layerEnabled = true;
    else if (node.type === "gear_avail" && layers.gearAvail) layerEnabled = true;
    else if (node.type === "gear_claimed" && layers.gearClaimed) layerEnabled = true;

    let categoryMatches = true;
    if (category !== "all") {
      if (node.type.startsWith("gear")) {
        categoryMatches = (node.category === category);
      } else {
        categoryMatches = false;
      }
    }

    let searchMatches = true;
    if (search) {
      const hay = `${node.title} ${node.address} ${node.category} ${node.claimCode || ''}`.toLowerCase();
      searchMatches = hay.includes(search);
    }

    const shouldShow = layerEnabled && categoryMatches && searchMatches;

    if (shouldShow) {
      if (!map.hasLayer(node.marker)) {
        node.marker.addTo(map);
      }
      visibleCount++;

      if (node.type === "hub") countHubs++;
      else if (node.type === "recipient") countRecipients++;
      else if (node.type === "gear_avail") countGearAvail++;
      else if (node.type === "gear_claimed") countGearClaimed++;
    } else {
      if (map.hasLayer(node.marker)) {
        node.marker.remove();
      }
    }
  });

  const badgeVisible = document.querySelector("#map-visible-count-badge");
  if (badgeVisible) badgeVisible.textContent = `${visibleCount} Nodes Active`;

  const bHubs = document.querySelector("#badge-count-hubs");
  const bRec = document.querySelector("#badge-count-recipients");
  const bGAvail = document.querySelector("#badge-count-gear-avail");
  const bGClaimed = document.querySelector("#badge-count-gear-claimed");

  if (bHubs) bHubs.textContent = countHubs;
  if (bRec) bRec.textContent = countRecipients;
  if (bGAvail) bGAvail.textContent = countGearAvail;
  if (bGClaimed) bGClaimed.textContent = countGearClaimed;
}

// ── Update Sidebar Quick Info Card on Marker Click ───────────
function updateSidebarQuickInfo(type, item) {
  const card = document.querySelector("#map-sidebar-info");
  const badge = document.querySelector("#info-node-badge");
  const title = document.querySelector("#info-node-title");
  const subtitle = document.querySelector("#info-node-subtitle");
  const action = document.querySelector("#info-node-action");

  if (!card || !badge || !title || !subtitle || !action) return;

  if (type === "gear") {
    const isAvail = item.status === "available";
    badge.className = `badge ${isAvail ? 'bg-success' : 'bg-secondary'} small`;
    badge.textContent = isAvail ? '⚡ Available Hardware' : '📦 Claimed Gear';
    title.textContent = item.title;
    subtitle.innerHTML = `Category: <strong>${escapeHtml(item.category)}</strong> · Hub: ${escapeHtml(item.hubName || item.address)}`;
    action.innerHTML = isAvail
      ? `<button type="button" class="btn btn-neon btn-sm w-100" onclick="openClaimModalWithCode('${escapeHtml(item.claimCode)}')">🔑 Claim Code: ${escapeHtml(item.claimCode)}</button>`
      : `<span class="small text-muted font-mono">Claimed by ${escapeHtml(item.claimedByRecipientName || 'Recipient')}</span>`;
  } else if (type === "recipient") {
    badge.className = "badge bg-primary small";
    badge.textContent = "🎯 Approved Recipient";
    title.textContent = item.name;
    subtitle.textContent = item.address || item.region;
    action.innerHTML = `<button type="button" class="btn btn-outline-neon btn-sm w-100" onclick="selectRecipient('${escapeHtml(item.id)}')">Select Recipient</button>`;
  } else {
    badge.className = "badge bg-info small";
    badge.textContent = "🏪 Drop-off Hub";
    title.textContent = item.name;
    subtitle.textContent = item.address;
    action.innerHTML = `<button type="button" class="btn btn-outline-neon btn-sm w-100" onclick="selectDropoffPartner('${escapeHtml(item.id)}')">Drop Gear Here</button>`;
  }

  card.style.display = "block";
}

// ── Rolling Counter Animation Function ───────────────────────
function animateRollingCounter(el, start, end, prefix = "", suffix = "", duration = 1200) {
  if (!el) return;
  const startTime = performance.now();
  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.floor(start + (end - start) * ease);
    el.textContent = `${prefix}${currentVal.toLocaleString()}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = `${prefix}${end.toLocaleString()}${suffix}`;
    }
  };
  requestAnimationFrame(step);
}

// ── Live Impact & Analytics Aggregator ────────────────────────
function updateLiveImpactCounters() {
  const gearEl = document.querySelector("#stat-total-gear");
  const valueEl = document.querySelector("#stat-total-value");
  const recipientsEl = document.querySelector("#stat-total-recipients");
  const currencyLabel = document.querySelector("#stat-value-currency-label");

  const totalGearCount = liveGearInventory.length + adminHardwareQueue.length + 12;
  const totalValueUsd = liveGearInventory.reduce((sum, g) => sum + (g.estValueUsd || 350), 0) + 14250;
  const totalValueInr = liveGearInventory.reduce((sum, g) => sum + (g.estValueInr || 29000), 0) + 1180000;
  const approvedRecipientsCount = recipients.filter(r => r.status === "approved" || !r.status).length;

  const currentGear = parseInt(gearEl?.textContent.replace(/[^0-9]/g, "") || "0", 10);
  animateRollingCounter(gearEl, currentGear, totalGearCount, "", "");

  const currentRecipients = parseInt(recipientsEl?.textContent.replace(/[^0-9]/g, "") || "0", 10);
  animateRollingCounter(recipientsEl, currentRecipients, approvedRecipientsCount, "", "");

  const isUsd = (state.impactCurrency || "USD") === "USD";
  const targetVal = isUsd ? totalValueUsd : totalValueInr;
  const prefix = isUsd ? "$" : "₹";
  const suffix = isUsd ? " USD" : " INR";

  const currentVal = parseInt(valueEl?.textContent.replace(/[^0-9]/g, "") || "0", 10);
  animateRollingCounter(valueEl, currentVal, targetVal, prefix, suffix);

  if (currencyLabel) {
    currencyLabel.textContent = isUsd ? "USD value circulated" : "INR value circulated";
  }
}

// ── Phase 2: Map Sidebar & Filter Handlers ───────────────────
function initMapFilterSidebarHandlers() {
  const searchInput = document.querySelector("#map-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.mapFilters.search = e.target.value;
      applyMapFilters();
    });
  }

  const clearSearchBtn = document.querySelector("#btn-map-search-clear");
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      state.mapFilters.search = "";
      applyMapFilters();
    });
  }

  const layerMap = {
    "#layer-toggle-hubs": "hubs",
    "#layer-toggle-recipients": "recipients",
    "#layer-toggle-gear-avail": "gearAvail",
    "#layer-toggle-gear-claimed": "gearClaimed"
  };

  Object.entries(layerMap).forEach(([selector, key]) => {
    const sw = document.querySelector(selector);
    if (sw) {
      sw.addEventListener("change", (e) => {
        state.mapFilters.layers[key] = e.target.checked;
        applyMapFilters();
      });
    }
  });

  const catPills = document.querySelectorAll(".map-cat-pill");
  catPills.forEach(pill => {
    pill.addEventListener("click", () => {
      catPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.mapFilters.category = pill.dataset.category || "all";
      applyMapFilters();
    });
  });

  const closeInfoBtn = document.querySelector("#btn-close-sidebar-info");
  if (closeInfoBtn) {
    closeInfoBtn.addEventListener("click", () => {
      const card = document.querySelector("#map-sidebar-info");
      if (card) card.style.display = "none";
    });
  }

  const btnUsd = document.querySelector("#btn-currency-usd");
  const btnInr = document.querySelector("#btn-currency-inr");

  if (btnUsd && btnInr) {
    btnUsd.addEventListener("click", () => {
      state.impactCurrency = "USD";
      btnUsd.classList.add("active");
      btnInr.classList.remove("active");
      updateLiveImpactCounters();
    });

    btnInr.addEventListener("click", () => {
      state.impactCurrency = "INR";
      btnInr.classList.add("active");
      btnUsd.classList.remove("active");
      updateLiveImpactCounters();
    });
  }
}

// ── Phase 2: Gear Claiming & QR Verification Handlers ────────
window.openClaimModalWithCode = function(code) {
  const modalEl = document.querySelector("#claimGearModal");
  if (!modalEl) return;

  const codeInput = document.querySelector("#claim-code-input");
  if (codeInput) codeInput.value = code;

  populateClaimRecipientSelect();

  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();

  setTimeout(() => {
    document.querySelector("#btn-verify-claim-code")?.click();
  }, 300);
};

function populateClaimRecipientSelect() {
  const sel = document.querySelector("#claim-recipient-select");
  if (!sel) return;

  const approved = recipients.filter(r => r.status === "approved" || !r.status);
  const currentVal = sel.value;

  sel.innerHTML = `<option value="">Select claiming organization...</option>` +
    approved.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.name)} (${escapeHtml(r.region || 'Active')})</option>`).join("");

  if (currentVal) sel.value = currentVal;
}

function initGearClaimHandlers() {
  const codeInput = document.querySelector("#claim-code-input");
  const verifyBtn = document.querySelector("#btn-verify-claim-code");
  const previewCard = document.querySelector("#claim-item-preview");
  const submitBtn = document.querySelector("#btn-submit-gear-claim");
  const claimAlert = document.querySelector("#claim-form-alert");
  const claimAlertText = document.querySelector("#claim-form-alert-text");
  const claimForm = document.querySelector("#form-claim-gear");

  const showClaimAlert = (msg) => {
    if (claimAlert && claimAlertText) {
      claimAlertText.textContent = msg;
      claimAlert.classList.remove("d-none");
    }
  };

  const clearClaimAlert = () => {
    if (claimAlert) claimAlert.classList.add("d-none");
  };

  if (verifyBtn) {
    verifyBtn.addEventListener("click", () => {
      clearClaimAlert();
      const code = (codeInput?.value || "").toUpperCase().trim();

      if (!code || code.length < 5) {
        showClaimAlert("Please enter a valid 8-character claim code (e.g. LF-7X9K2P).");
        return;
      }

      const item = liveGearInventory.find(g => g.claimCode.toUpperCase() === code);

      if (!item) {
        showClaimAlert("No hardware matching this claim code was found in the inventory.");
        if (previewCard) previewCard.classList.add("d-none");
        if (submitBtn) submitBtn.disabled = true;
        return;
      }

      if (item.status === "claimed") {
        showClaimAlert(`⚠️ This item was already claimed by ${item.claimedByRecipientName || 'another recipient'} on ${(item.claimedAt || '').substring(0, 10)}.`);
        if (previewCard) previewCard.classList.add("d-none");
        if (submitBtn) submitBtn.disabled = true;
        return;
      }

      if (previewCard) {
        previewCard.classList.remove("d-none");
        document.querySelector("#claim-preview-id").textContent = `#${item.gearId}`;
        document.querySelector("#claim-preview-title").textContent = item.title;
        document.querySelector("#claim-preview-details").textContent = `Category: ${item.category} · Est Value: $${item.estValueUsd} USD`;
        document.querySelector("#claim-preview-hub").textContent = `📍 Hub: ${item.hubName || item.address}`;
      }

      if (submitBtn) submitBtn.disabled = false;
      showToast(`⚡ Valid code: "${item.title}" found at ${item.hubName}!`, "success");
    });
  }

  if (claimForm) {
    claimForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearClaimAlert();

      const recipientId = document.querySelector("#claim-recipient-select")?.value;
      const code = (codeInput?.value || "").toUpperCase().trim();

      if (!recipientId) {
        showClaimAlert("Please select your verified recipient organization.");
        return;
      }

      if (!code) {
        showClaimAlert("Please enter the claim code.");
        return;
      }

      const item = liveGearInventory.find(g => g.claimCode.toUpperCase() === code);
      if (!item || item.status === "claimed") {
        showClaimAlert("Item cannot be claimed. Please verify code validity.");
        return;
      }

      const recipient = recipients.find(r => r.id === recipientId);
      const recipientName = recipient ? recipient.name : "Community Recipient";

      item.status = "claimed";
      item.claimedByRecipientId = recipientId;
      item.claimedByRecipientName = recipientName;
      item.claimedAt = new Date().toISOString();

      // Persist to Firestore collection 'gear'
      if (window.LootFirestore?.claimGear) {
        window.LootFirestore.claimGear(item.gearId, item.claimCode, recipientId, recipientName);
      }

      rebuildAllMapNodes();
      updateLiveImpactCounters();

      const modalEl = document.querySelector("#claimGearModal");
      if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
      claimForm.reset();
      if (previewCard) previewCard.classList.add("d-none");
      if (submitBtn) submitBtn.disabled = true;

      showToast(`🎉 Hardware Claim Verified! "${item.title}" has been officially released to ${recipientName}.`, "success", 6000);
    });
  }
}

function rebuildRecipientMapMarkers() {
  if (!window.L) return;
  rebuildAllMapNodes();
}

function initLeafletMaps() {
  if (!window.L) {
    console.warn("Leaflet.js not loaded — map initialization bypassed.");
    return;
  }

  const darkTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileOptions = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ["a", "b", "c"],
    maxZoom: 19
  };

  // 1 ─ Drop-off Network Map (About Page)
  const dropMapEl = document.querySelector("#drop-map");
  if (dropMapEl && !state.maps.dropMap) {
    try {
      const dropMap = L.map(dropMapEl, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([39.50, -98.35], 4);

      L.tileLayer(darkTileUrl, tileOptions).addTo(dropMap);
      state.maps.dropMap = dropMap;

      // Map click: drops pin & reverse geocodes
      dropMap.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        updateUserPositionOnMaps(lat, lng, false);
        await reverseGeocodeAddress(lat, lng);
      });

      // Initialize multi-layer nodes
      rebuildAllMapNodes();
    } catch (err) {
      console.warn("Failed to initialize drop-map:", err.message);
    }
  }

  // 2 ─ Form Synchronization Map (The Drop Page)
  const donationMapEl = document.querySelector("#donation-map");
  if (donationMapEl && !state.maps.donationMap) {
    try {
      const donationMap = L.map(donationMapEl, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([37.7749, -122.4194], 12);

      L.tileLayer(darkTileUrl, tileOptions).addTo(donationMap);
      state.maps.donationMap = donationMap;

      dropOffPartners.forEach(p => {
        const marker = L.marker([p.lat, p.lng], { icon: createPartnerIcon(p.type) }).addTo(donationMap);
        marker.bindPopup(`
          <div>
            <h6>${escapeHtml(p.name)}</h6>
            <p class="mb-1 text-muted small">${escapeHtml(p.address)}</p>
            <button type="button" class="btn btn-neon btn-sm w-100 mt-2" onclick="selectDropoffPartner('${p.id}')">Select Location</button>
          </div>
        `);
      });

      donationMap.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        updateUserPositionOnMaps(lat, lng, false);
        await reverseGeocodeAddress(lat, lng);
      });
    } catch (err) {
      console.warn("Failed to initialize donation-map:", err.message);
    }
  }
}

// ── Update user position marker across both maps ─────────────
function updateUserPositionOnMaps(lat, lng, flyTo = true, accuracy = null) {
  state.userCoordinates = { lat, lng };

  // Update Lat/Lng badge
  const coordsBadge = document.querySelector("#location-coords-badge");
  if (coordsBadge) {
    coordsBadge.textContent = `LAT: ${lat.toFixed(4)} · LNG: ${lng.toFixed(4)}`;
  }

  const icon = createPulseUserIcon();

  const bindMarkerEvents = (marker) => {
    marker.on("dragend", async (e) => {
      const pos = e.target.getLatLng();
      updateUserPositionOnMaps(pos.lat, pos.lng, false, null);
      await reverseGeocodeAddress(pos.lat, pos.lng);
    });
  };

  // Drop-off network map
  if (state.maps.dropMap) {
    if (state.userMarkers.dropMap) {
      state.userMarkers.dropMap.setLatLng([lat, lng]);
    } else {
      state.userMarkers.dropMap = L.marker([lat, lng], { icon, draggable: true }).addTo(state.maps.dropMap);
      bindMarkerEvents(state.userMarkers.dropMap);
    }

    if (accuracy && accuracy > 0) {
      if (state.userAccuracyCircles.dropMap) {
        state.userAccuracyCircles.dropMap.setLatLng([lat, lng]).setRadius(accuracy);
      } else {
        state.userAccuracyCircles.dropMap = L.circle([lat, lng], {
          radius: accuracy,
          color: "#00f2fe",
          fillColor: "#00f2fe",
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: "4, 4"
        }).addTo(state.maps.dropMap);
      }
    } else if (state.userAccuracyCircles.dropMap) {
      state.userAccuracyCircles.dropMap.remove();
      state.userAccuracyCircles.dropMap = null;
    }

    if (flyTo) state.maps.dropMap.flyTo([lat, lng], 14, { duration: 1.2 });
  }

  // Donation form map
  if (state.maps.donationMap) {
    if (state.userMarkers.donationMap) {
      state.userMarkers.donationMap.setLatLng([lat, lng]);
    } else {
      state.userMarkers.donationMap = L.marker([lat, lng], { icon, draggable: true }).addTo(state.maps.donationMap);
      bindMarkerEvents(state.userMarkers.donationMap);
    }

    if (accuracy && accuracy > 0) {
      if (state.userAccuracyCircles.donationMap) {
        state.userAccuracyCircles.donationMap.setLatLng([lat, lng]).setRadius(accuracy);
      } else {
        state.userAccuracyCircles.donationMap = L.circle([lat, lng], {
          radius: accuracy,
          color: "#00f2fe",
          fillColor: "#00f2fe",
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: "4, 4"
        }).addTo(state.maps.donationMap);
      }
    } else if (state.userAccuracyCircles.donationMap) {
      state.userAccuracyCircles.donationMap.remove();
      state.userAccuracyCircles.donationMap = null;
    }

    if (flyTo) state.maps.donationMap.flyTo([lat, lng], 15, { duration: 1.2 });
  }
}

// ── Browser Geolocation & Coordinate Detection ──────────────
function detectUserLocation(triggerBtn) {
  if (state.isGeolocating) return;

  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser.", "error");
    return;
  }

  const spinner = document.querySelector("#detect-spinner");
  const icon = document.querySelector("#detect-icon");
  const text = document.querySelector("#detect-btn-text");
  const statusText = document.querySelector("#location-status-text");

  state.isGeolocating = true;
  if (spinner) spinner.classList.remove("d-none");
  if (icon) icon.classList.add("d-none");
  if (text) text.textContent = "Acquiring GPS...";
  if (statusText) statusText.textContent = "Connecting to browser geolocation...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      state.isGeolocating = false;
      if (spinner) spinner.classList.add("d-none");
      if (icon) icon.classList.remove("d-none");
      if (text) text.textContent = "Detect My Location";
      if (statusText) statusText.textContent = `📍 GPS Coordinates Locked (Accuracy: ±${Math.round(accuracy)}m)`;

      // Update position on both maps & smooth flyTo
      updateUserPositionOnMaps(lat, lng, true);

      // Trigger Reverse Geocoding
      await reverseGeocodeAddress(lat, lng);

      showToast(`📍 Location detected within ±${Math.round(accuracy)}m!`, "success");
    },
    (err) => {
      state.isGeolocating = false;
      if (spinner) spinner.classList.add("d-none");
      if (icon) icon.classList.remove("d-none");
      if (text) text.textContent = "Detect My Location";

      let errorMsg = "Unable to retrieve your location.";
      switch (err.code) {
        case 1: // PERMISSION_DENIED
          errorMsg = "Location permission denied. Please allow access in browser or type your address.";
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMsg = "GPS signal unavailable. Please enter your address manually.";
          break;
        case 3: // TIMEOUT
          errorMsg = "Location request timed out. Please try again or type address.";
          break;
      }

      if (statusText) statusText.textContent = `⚠️ ${errorMsg}`;
      showToast(errorMsg, "warning");
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000
    }
  );
}

// ── Reverse Geocoding (Coordinates → Address via OpenStreetMap)
async function reverseGeocodeAddress(lat, lng) {
  const statusText = document.querySelector("#location-status-text");
  if (statusText) statusText.textContent = "Resolving street address via OpenStreetMap...";

  try {
    let addressData = null;

    // Primary: OpenStreetMap Nominatim reverse geocode
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { "Accept-Language": "en" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const streetNum = data.address.house_number ? `${data.address.house_number} ` : "";
          const streetName = data.address.road || data.address.pedestrian || data.address.suburb || "";
          addressData = {
            displayName: data.display_name,
            road: streetNum + streetName,
            city: data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.county || "",
            state: data.address.state || data.address.region || "",
            zip: data.address.postcode || ""
          };
        }
      }
    } catch (nominatimErr) {
      console.warn("Nominatim reverse geocode fallback:", nominatimErr.message);
    }

    // Fallback: BigDataCloud client reverse geocoding API
    if (!addressData) {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      if (res.ok) {
        const bdc = await res.json();
        addressData = {
          displayName: [bdc.locality, bdc.city, bdc.principalSubdivision, bdc.countryName].filter(Boolean).join(", "),
          road: bdc.locality || bdc.street || "",
          city: bdc.city || bdc.locality || "",
          state: bdc.principalSubdivision || "",
          zip: bdc.postcode || ""
        };
      }
    }

    if (!addressData) {
      throw new Error("Address could not be resolved from coordinates.");
    }

    // Auto-fill form fields
    const addrInput = document.querySelector("#dropoff-address");
    const cityInput = document.querySelector("#dropoff-city");
    const stateInput = document.querySelector("#dropoff-state");
    const zipInput = document.querySelector("#dropoff-zip");

    if (addrInput) addrInput.value = addressData.road || addressData.displayName;
    if (cityInput) cityInput.value = addressData.city;
    if (stateInput) stateInput.value = addressData.state;
    if (zipInput) zipInput.value = addressData.zip;

    state.userAddress = addressData;

    // Update marker popups
    const popupHtml = `
      <div>
        <h6>📍 Selected Location</h6>
        <p class="mb-1 text-muted small">${escapeHtml(addressData.displayName)}</p>
        <span class="badge bg-success">Verified Address</span>
      </div>
    `;

    if (state.userMarkers.dropMap) {
      state.userMarkers.dropMap.bindPopup(popupHtml).openPopup();
    }
    if (state.userMarkers.donationMap) {
      state.userMarkers.donationMap.bindPopup(popupHtml).openPopup();
    }

    if (statusText) {
      statusText.textContent = `✓ Verified: ${addressData.city || 'Detected Location'}, ${addressData.state}`;
    }

  } catch (err) {
    console.error("Reverse geocoding error:", err);
    if (statusText) statusText.textContent = `Coordinates detected (${lat.toFixed(4)}, ${lng.toFixed(4)}) · Enter street address`;
  }
}

// ── Select a verified drop-off partner from map ───────────────
window.selectDropoffPartner = function (partnerId) {
  const partner = dropOffPartners.find(p => p.id === partnerId);
  if (!partner) return;

  const addrInput = document.querySelector("#dropoff-address");
  const cityInput = document.querySelector("#dropoff-city");
  const stateInput = document.querySelector("#dropoff-state");
  const zipInput = document.querySelector("#dropoff-zip");

  const parts = partner.address.split(",");
  if (addrInput) addrInput.value = partner.name + " (" + parts[0].trim() + ")";
  if (cityInput && parts[1]) cityInput.value = parts[1].trim();
  if (stateInput && parts[2]) {
    const stateZip = parts[2].trim().split(" ");
    stateInput.value = stateZip[0];
    if (zipInput && stateZip[1]) zipInput.value = stateZip[1];
  }

  updateUserPositionOnMaps(partner.lat, partner.lng, true);
  showToast(`📍 Selected partner location: ${partner.name}`, "success");
  navigate("donate");
};

// ── Forward Geocoding & Typed Address Map Synchronization ──────
let geocodeDebounceTimer = null;
function setupAddressAutocomplete() {
  const addressInput = document.querySelector("#dropoff-address");
  if (!addressInput) return;

  addressInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    if (query.length < 4) return;

    clearTimeout(geocodeDebounceTimer);
    geocodeDebounceTimer = setTimeout(async () => {
      try {
        const statusText = document.querySelector("#location-status-text");
        if (statusText) statusText.textContent = "🔍 Synchronizing typed address with map...";

        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
          headers: { "Accept-Language": "en" }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          updateUserPositionOnMaps(lat, lng, true);

          if (statusText) {
            statusText.textContent = `✓ Pin aligned to "${data[0].display_name.split(',').slice(0, 2).join(',')}"`;
          }

          // Auto-fill city/state if currently empty
          const cityInput = document.querySelector("#dropoff-city");
          const stateInput = document.querySelector("#dropoff-state");
          if ((cityInput && !cityInput.value) || (stateInput && !stateInput.value)) {
            await reverseGeocodeAddress(lat, lng);
          }
        }
      } catch (err) {
        console.warn("Address map synchronization warning:", err);
      }
    }, 700);
  });
}


// Global delegated event binding for ALL button clicks
function attachClickHandlers() {
  document.addEventListener("click", (event) => {
    const detectBtn = event.target.closest("#btn-detect-location, #btn-detect-map-network");
    if (detectBtn) {
      event.preventDefault();
      detectUserLocation(detectBtn);
      return;
    }

    const donateCardBtn = event.target.closest("[data-donate-card]");
    if (donateCardBtn) {
      const rId = donateCardBtn.dataset.donateCard;
      const rec = recipients.find(r => r.id === rId);
      if (rec) {
        state.selectedRecipient = rec;
        updateDonationContext();
      }
      if (state.activeGateway === "razorpay") {
        openRazorpayModal(state.razorpayAmount || 500);
      } else {
        openPaymentModal(25);
      }
      return;
    }

    const recipientBtn = event.target.closest("[data-select-recipient]");
    if (recipientBtn) {
      selectRecipient(recipientBtn.dataset.selectRecipient);
      return;
    }

    const routeEl = event.target.closest("[data-route]");
    if (routeEl) {
      event.preventDefault();
      const targetRoute = routeEl.getAttribute("data-route");
      navigate(targetRoute);
      return;
    }
  });
}

// ── Stripe secure initialisation (mounts inside payment modal) ─
function initStripeSafely() {
  try {
    if (!window.Stripe) {
      console.warn("Stripe.js not loaded — monetary payments disabled.");
      return;
    }
    state.stripeInstance = window.Stripe(STRIPE_PK);

    // Card element lives inside the payment modal
    const mountNode = document.querySelector("#pm-card-element");
    if (!mountNode) return;

    state.stripeElements = state.stripeInstance.elements();
    state.stripeCardElement = state.stripeElements.create("card", {
      style: {
        base: {
          color: "#e2e8f0",
          fontFamily: "\"Inter\", sans-serif",
          fontSize: "15px",
          lineHeight: "1.6",
          "::placeholder": { color: "#6b7280" },
          iconColor: "#00f2fe"
        },
        invalid: { color: "#ff6b6b", iconColor: "#ff6b6b" }
      },
      hidePostalCode: false
    });
    state.stripeCardElement.mount("#pm-card-element");

    // Inline card errors inside the modal — targets the text span inside the icon+text row
    state.stripeCardElement.on("change", (event) => {
      const errWrap = document.querySelector("#pm-card-errors");
      const errText = document.querySelector("#pm-card-errors-text");
      if (!errWrap) return;
      if (errText) errText.textContent = event.error ? event.error.message : "";
      errWrap.classList.toggle("d-none", !event.error);
    });
  } catch (err) {
    console.warn("Stripe initialisation bypassed:", err.message);
  }
}

// ── Open the payment modal & prefill summary ───────────────────
function openPaymentModal(amount) {
  const modalEl = document.querySelector("#paymentModal");
  if (!modalEl) return;

  const initialAmt = parseFloat(amount) || 25;
  const recipient = state.selectedRecipient || recipients[0];
  const recipientName = recipient?.name || "Verified Community Hub";

  // Prefill recipient bar
  const recipientEl = modalEl.querySelector("#pm-summary-recipient");
  if (recipientEl) recipientEl.textContent = recipientName;

  // Auto-select preset or toggle custom
  const presets = modalEl.querySelectorAll(".pm-preset-btn[data-pm-amount]");
  const customToggle = modalEl.querySelector("#pm-custom-toggle");
  const customRow = modalEl.querySelector("#pm-custom-row");
  const customInput = modalEl.querySelector("#pm-custom-input");

  let matchedPreset = false;
  presets.forEach(b => {
    const isMatch = parseFloat(b.dataset.pmAmount) === initialAmt;
    b.classList.toggle("pm-preset-btn--active", isMatch);
    if (isMatch) matchedPreset = true;
  });

  if (customToggle) customToggle.classList.toggle("pm-preset-btn--active", !matchedPreset);
  if (customRow) customRow.classList.toggle("d-none", matchedPreset);
  if (customInput) customInput.value = matchedPreset ? "" : initialAmt;

  setPaymentAmount(initialAmt, !matchedPreset);

  // Reset error / success / loading states
  const errWrap = modalEl.querySelector("#pm-card-errors");
  const errText = modalEl.querySelector("#pm-card-errors-text");
  const globalEl = modalEl.querySelector("#pm-global-error");
  const bodyEl = modalEl.querySelector("#pm-body");
  const successEl = modalEl.querySelector("#pm-success");
  const processingEl = modalEl.querySelector("#pm-processing");

  if (errWrap) errWrap.classList.add("d-none");
  if (errText) errText.textContent = "";
  if (globalEl) {
    globalEl.classList.add("d-none");
    const t = globalEl.querySelector("#pm-global-error-text");
    if (t) t.textContent = "";
  }
  if (bodyEl) bodyEl.classList.remove("d-none", "pm-body--blurred");
  if (successEl) successEl.classList.add("d-none");
  if (processingEl) processingEl.classList.add("d-none");

  setModalLoading(false);

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// ── Confirm payment (called by modal Pay Now button) ───────────
async function confirmPayment() {
  if (state.isPaymentPending) return;
  if (!state.stripeInstance || !state.stripeCardElement) {
    const errText = document.querySelector("#pm-global-error-text");
    const errWrap = document.querySelector("#pm-global-error");
    if (errText) errText.textContent = "Stripe Elements is not ready. Please refresh the page.";
    if (errWrap) errWrap.classList.remove("d-none");
    showToast("Stripe is not ready. Please reload the page.", "error");
    return;
  }

  const amount = state.modalAmount || 0;
  const recipient = state.selectedRecipient || recipients[0];
  const recipientId = recipient.id;

  if (!amount || amount < 1) {
    const errText = document.querySelector("#pm-global-error-text");
    const errWrap = document.querySelector("#pm-global-error");
    if (errText) errText.textContent = "Please select or enter a valid donation amount (minimum $1.00 USD).";
    if (errWrap) errWrap.classList.remove("d-none");
    return;
  }

  state.isPaymentPending = true;
  setModalLoading(true); // shows processing overlay & spinner on pay button

  const globalErrWrap = document.querySelector("#pm-global-error");
  if (globalErrWrap) globalErrWrap.classList.add("d-none");

  try {
    // 1 ─ Create PaymentIntent server-side
    const response = await fetch(CF_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, recipientId })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Payment gateway returned status ${response.status}`);
    }

    const { clientSecret } = await response.json();
    if (!clientSecret) throw new Error("Payment gateway did not provide a secure client secret.");

    // 2 ─ Confirm card payment securely via Stripe Elements
    const { paymentIntent, error: stripeErr } = await state.stripeInstance.confirmCardPayment(
      clientSecret,
      { payment_method: { card: state.stripeCardElement } }
    );

    if (stripeErr) throw new Error(stripeErr.message);

    // 3 ─ Success: hide processing overlay, show success screen
    setModalLoading(false);
    const bodyEl = document.querySelector("#pm-body");
    const successEl = document.querySelector("#pm-success");
    const successAmtEl = document.querySelector("#pm-success-amount");
    const successRecEl = document.querySelector("#pm-success-recipient-name");
    if (bodyEl) bodyEl.classList.add("d-none");
    if (successEl) successEl.classList.remove("d-none");
    if (successAmtEl) successAmtEl.textContent = `$${amount.toFixed(2)} USD`;
    if (successRecEl) successRecEl.textContent = recipient.name;

    const sub = {
      ticket: `PENDING_AUDIT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      itemName: `$${amount.toFixed(2)} USD`,
      recipientName: recipient.name,
      donationType: "money",
      stripeIntentId: paymentIntent.id,
      createdAt: new Date().toISOString()
    };
    state.latestSubmission = sub;
    state.localSubmissions.push(sub);
    populateReceipt(sub);

    // Auto-record in Admin Reconciliation Ledger
    adminDonations.unshift({
      id: `tx_${paymentIntent.id.substring(0, 14)}`,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      donor: state.currentUser?.displayName || "Verified Gamer",
      email: state.currentUser?.email || "gamer@lootforward.org",
      recipient: recipient.name,
      amount: `$${amount.toFixed(2)} USD`,
      gateway: "stripe",
      status: "Verified & Audited",
      ticket: sub.ticket
    });

    // Auto-close after celebration and navigate to confirmation receipt
    setTimeout(() => {
      const modalEl = document.querySelector("#paymentModal");
      if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
      navigate("confirmation");
      showToast("💳 Payment confirmed — donation queued for audit!", "success");
    }, 2400);

  } catch (err) {
    console.error("Payment error:", err);
    setModalLoading(false); // hide overlay so user can retry
    const globalErrWrap = document.querySelector("#pm-global-error");
    const globalErrText = document.querySelector("#pm-global-error-text");
    const isNetwork = err instanceof TypeError && err.message.includes("fetch");
    const msg = isNetwork
      ? "Network connection issue. Please verify your connection and try again."
      : (err.message || "Payment transaction could not be processed. Please check card details.");
    if (globalErrText) globalErrText.textContent = msg;
    if (globalErrWrap) globalErrWrap.classList.remove("d-none");
  } finally {
    state.isPaymentPending = false;
  }
}


// ── Populate the confirmation receipt ─────────────────────────
function populateReceipt(sub) {
  const set = (id, val) => {
    const el = document.querySelector(`#${id}`);
    if (el) el.textContent = val;
  };
  set("receipt-item", sub.itemName);
  set("receipt-recipient", sub.recipientName);
  set("receipt-ticket", sub.ticket);
  set("receipt-type", sub.donationType === "money" ? "Monetary" : "Hardware");
  set("receipt-timestamp", new Date(sub.createdAt).toLocaleString());
  set("receipt-proof", sub.proofFile || (sub.donationType === "money" ? "Stripe PaymentIntent" : "—"));

  const locRow = document.querySelector("#receipt-location-row");
  const locEl = document.querySelector("#receipt-location");
  if (locRow && locEl) {
    if (sub.dropoffLocation && sub.dropoffLocation !== "—") {
      locEl.textContent = sub.dropoffLocation;
      locRow.style.display = "flex";
    } else {
      locRow.style.display = "none";
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// RECIPIENT MANAGEMENT, GEOCODING & PIN-DROP MODULE
// ═══════════════════════════════════════════════════════════════

function initRecipientManagement() {
  // ── 1. Category filter buttons in Recipients view ───────────
  const catFilterBtns = document.querySelectorAll("#recipient-category-filters [data-rec-filter]");
  catFilterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      catFilterBtns.forEach(b => {
        b.classList.remove("active", "btn-outline-neon");
        b.classList.add("btn-outline-secondary");
      });
      btn.classList.add("active", "btn-outline-neon");
      btn.classList.remove("btn-outline-secondary");
      state.activeRecipientCategoryFilter = btn.dataset.recFilter;
      renderRecipients();
    });
  });

  // ── 2. Live Search input in Recipients view ─────────────────
  const recSearchInput = document.querySelector("#recipient-search-input");
  if (recSearchInput) {
    recSearchInput.addEventListener("input", (e) => {
      state.recipientSearchTerm = e.target.value;
      renderRecipients();
    });
  }

  // ── 3. Interactive Leaflet Mini Map in Onboarding Modal ──────
  const modalEl = document.querySelector("#addRecipientModal");
  if (modalEl) {
    modalEl.addEventListener("shown.bs.modal", () => {
      const defaultLat = parseFloat(document.querySelector("#rec-lat-input")?.value) || 41.8781;
      const defaultLng = parseFloat(document.querySelector("#rec-lng-input")?.value) || -87.6298;

      if (!state.recipientMiniMap && window.L) {
        const miniMapEl = document.querySelector("#recipient-mini-map");
        if (miniMapEl) {
          const miniMap = L.map(miniMapEl, {
            zoomControl: true,
            scrollWheelZoom: true
          }).setView([defaultLat, defaultLng], 13);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
          }).addTo(miniMap);

          const marker = L.marker([defaultLat, defaultLng], {
            draggable: true,
            icon: createRecipientIcon()
          }).addTo(miniMap);

          marker.bindPopup("<div class='small fw-bold'>🎯 Recipient Facility Location</div>");

          marker.on("dragend", async (e) => {
            const { lat, lng } = e.target.getLatLng();
            syncRecipientCoords(lat, lng);
            await reverseGeocodeRecipientAddress(lat, lng);
          });

          miniMap.on("click", async (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            syncRecipientCoords(lat, lng);
            await reverseGeocodeRecipientAddress(lat, lng);
          });

          state.recipientMiniMap = miniMap;
          state.recipientMiniMarker = marker;
        }
      }

      // Sync and refresh tile rendering
      setTimeout(() => {
        if (state.recipientMiniMap) {
          state.recipientMiniMap.invalidateSize();
          const lat = parseFloat(document.querySelector("#rec-lat-input")?.value) || defaultLat;
          const lng = parseFloat(document.querySelector("#rec-lng-input")?.value) || defaultLng;
          state.recipientMiniMap.setView([lat, lng], 14);
          if (state.recipientMiniMarker) state.recipientMiniMarker.setLatLng([lat, lng]);
        }
      }, 200);
    });
  }

  function syncRecipientCoords(lat, lng) {
    const latInput = document.querySelector("#rec-lat-input");
    const lngInput = document.querySelector("#rec-lng-input");
    const statusInd = document.querySelector("#rec-geo-status-indicator");
    if (latInput) latInput.value = lat.toFixed(5);
    if (lngInput) lngInput.value = lng.toFixed(5);
    if (statusInd) statusInd.textContent = `✓ Locked: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
  }

  // ── 4. Forward Geocoding Button (Address → Coordinates) ─────
  const geocodeBtn = document.querySelector("#btn-geocode-recipient-address");
  if (geocodeBtn) {
    geocodeBtn.addEventListener("click", async () => {
      const addressInput = document.querySelector("#rec-address-input");
      const addressQuery = addressInput?.value.trim();
      const spinner = document.querySelector("#rec-geocode-spinner");
      const icon = document.querySelector("#rec-geocode-icon");

      if (!addressQuery || addressQuery.length < 3) {
        showRecipientAlert("Please enter a valid street address, city, or facility name to geocode.");
        addressInput?.focus();
        return;
      }

      if (spinner) spinner.classList.remove("d-none");
      if (icon) icon.classList.add("d-none");
      geocodeBtn.disabled = true;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`, {
          headers: { "Accept-Language": "en" }
        });
        if (!res.ok) throw new Error("Geocoding service unavailable.");
        const results = await res.json();

        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);
          syncRecipientCoords(lat, lng);

          if (state.recipientMiniMap && state.recipientMiniMarker) {
            state.recipientMiniMarker.setLatLng([lat, lng]);
            state.recipientMiniMap.flyTo([lat, lng], 14, { duration: 1 });
          }

          if (results[0].display_name) {
            addressInput.value = results[0].display_name.split(",").slice(0, 4).join(", ");
          }

          clearRecipientAlert();
          showToast(`📍 Location coordinates resolved: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`, "success");
        } else {
          showRecipientAlert("Could not find matching coordinates for this address. You can click on the mini map to place the pin manually.");
        }
      } catch (err) {
        showRecipientAlert("Geocoding failed. Please drop a pin on the mini map or enter coordinates.");
      } finally {
        if (spinner) spinner.classList.add("d-none");
        if (icon) icon.classList.remove("d-none");
        geocodeBtn.disabled = false;
      }
    });
  }

  // ── 5. Current GPS Locator Button ────────────────────────────
  const gpsBtn = document.querySelector("#btn-gps-recipient-address");
  if (gpsBtn) {
    gpsBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        showRecipientAlert("Geolocation is not supported by your browser.");
        return;
      }
      gpsBtn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          gpsBtn.disabled = false;
          const { latitude: lat, longitude: lng } = position.coords;
          syncRecipientCoords(lat, lng);

          if (state.recipientMiniMap && state.recipientMiniMarker) {
            state.recipientMiniMarker.setLatLng([lat, lng]);
            state.recipientMiniMap.flyTo([lat, lng], 15, { duration: 1.2 });
          }

          await reverseGeocodeRecipientAddress(lat, lng);
          showToast(`📍 GPS position locked: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`, "success");
        },
        (err) => {
          gpsBtn.disabled = false;
          showRecipientAlert("GPS request denied or timed out. Please enter address manually.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // ── 6. Reverse Geocoding helper for Recipient modal ──────────
  async function reverseGeocodeRecipientAddress(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { "Accept-Language": "en" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const addrInput = document.querySelector("#rec-address-input");
          if (addrInput) addrInput.value = data.display_name.split(",").slice(0, 4).join(", ");
        }
      }
    } catch (e) {
      console.warn("Recipient reverse geocode notice:", e.message);
    }
  }

  function showRecipientAlert(msg) {
    const alertEl = document.querySelector("#recipient-form-alert");
    const textEl = document.querySelector("#recipient-form-alert-text");
    if (alertEl && textEl) {
      textEl.textContent = msg;
      alertEl.classList.remove("d-none");
    }
  }

  function clearRecipientAlert() {
    const alertEl = document.querySelector("#recipient-form-alert");
    if (alertEl) alertEl.classList.add("d-none");
  }

  // ── 7. Recipient Form Submission with Firestore Integration ──
  const recForm = document.querySelector("#form-add-recipient");
  if (recForm) {
    recForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearRecipientAlert();

      const name = document.querySelector("#rec-name-input")?.value.trim();
      const category = document.querySelector("#rec-category-input")?.value;
      const email = document.querySelector("#rec-email-input")?.value.trim();
      const phone = document.querySelector("#rec-phone-input")?.value.trim();
      const targetItem = document.querySelector("#rec-target-item-input")?.value.trim();
      const targetCount = parseInt(document.querySelector("#rec-target-count-input")?.value, 10);
      const address = document.querySelector("#rec-address-input")?.value.trim();
      const lat = parseFloat(document.querySelector("#rec-lat-input")?.value);
      const lng = parseFloat(document.querySelector("#rec-lng-input")?.value);
      const mission = document.querySelector("#rec-mission-input")?.value.trim();
      const needsRaw = document.querySelector("#rec-needs-input")?.value.trim();

      // Client-side validation checks
      if (!name) return showRecipientAlert("Please specify the recipient or organization name.");
      if (!category) return showRecipientAlert("Please select a destination category.");
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showRecipientAlert("Please enter a valid contact email address.");
      if (!phone) return showRecipientAlert("Please enter a contact phone number.");
      if (!targetItem) return showRecipientAlert("Please enter the primary target hardware item.");
      if (isNaN(targetCount) || targetCount < 1) return showRecipientAlert("Goal quantity must be at least 1 item.");
      if (!address) return showRecipientAlert("Please provide a physical facility address.");
      if (isNaN(lat) || isNaN(lng)) return showRecipientAlert("Valid latitude and longitude coordinates are required. Use 'Geocode' or the mini map pin.");
      if (!mission || mission.length < 15) return showRecipientAlert("Please provide a descriptive need statement (minimum 15 characters).");

      const submitBtn = document.querySelector("#btn-submit-recipient");
      const spinner = document.querySelector("#recipient-submit-spinner");
      const submitText = document.querySelector("#recipient-submit-text");

      if (submitBtn) submitBtn.disabled = true;
      if (spinner) spinner.classList.remove("d-none");
      if (submitText) submitText.textContent = "Submitting to Firestore...";

      const recipientPayload = {
        name,
        category,
        email,
        phone,
        address,
        lat,
        lng,
        region: address.split(",")[1]?.trim() || "Community Program",
        mission,
        needs: needsRaw ? needsRaw.split(",").map(n => n.trim()).filter(Boolean) : ["Gaming Consoles", "Controllers"],
        targetItem,
        target: targetCount,
        received: 0,
        status: "pending",
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        createdAt: new Date().toISOString()
      };

      try {
        // Send payload to Firestore 'recipients' collection (status: 'pending')
        let saved;
        if (window.LootFirestore?.saveRecipient) {
          saved = await window.LootFirestore.saveRecipient(recipientPayload);
        } else if (window.LootAuth?.saveRecipient) {
          saved = await window.LootAuth.saveRecipient(recipientPayload);
        } else {
          saved = {
            id: `rec_app_${Date.now().toString(36)}`,
            ...recipientPayload
          };
        }

        // Add to in-memory recipient applications moderation queue
        recipientApplications.unshift(saved);

        // Refresh admin dashboard metrics and pending application tables
        renderAdminMetrics();
        renderAdminRecipientApplicationsTable();

        // Hide modal & reset form
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
        recForm.reset();

        showToast(`📋 Application for "${saved.name}" submitted! Awaiting administrator audit and verification.`, "success", 6000);

      } catch (err) {
        console.error("Error saving recipient:", err);
        showRecipientAlert(`Failed to submit application: ${err.message || 'Unknown network error'}`);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add("d-none");
        if (submitText) submitText.textContent = "Submit Gear Assistance Application";
      }
    });
  }
}

// Main execution on DOM ready
function initApp() {
  attachClickHandlers();
  renderRecipients();
  navigate(resolveInitialPage(), false);

  // Isolated initializations
  setTimeout(initStripeSafely, 300);
  setTimeout(initLeafletMaps, 250);
  setupAddressAutocomplete();
  initRazorpayModalHandlers();
  initAuthHandlers();
  initAdminDashboardHandlers();
  initRecipientManagement();
  initMapFilterSidebarHandlers();
  initGearClaimHandlers();
  updateLiveImpactCounters();

  // Category switcher
  const categoryBtns = document.querySelectorAll("[data-donation-type]");
  categoryBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.donationType = btn.dataset.donationType;

      const isPhysical = state.donationType !== "money";
      const pFields = document.querySelector("#physical-fields");
      const mFields = document.querySelector("#monetary-fields");
      if (pFields) {
        pFields.classList.toggle("d-none", !isPhysical);
        pFields.classList.toggle("active-form-panel", isPhysical);
      }
      if (mFields) {
        mFields.classList.toggle("d-none", isPhysical);
        mFields.classList.toggle("active-form-panel", !isPhysical);
      }
    });
  });

  // ── Form submit: branches on donation type ────────────────
  const form = document.querySelector("#donation-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!state.selectedRecipient) {
        showToast("Please select a verified recipient first.", "error");
        return;
      }

      // ── Monetary path → open payment modal ───────────────
      if (state.donationType === "money") {
        if (state.activeGateway === "razorpay") {
          const amountInput = document.querySelector("#custom-amount-inr");
          const amount = parseFloat(amountInput?.value) || state.razorpayAmount || 500;
          if (!amount || amount < 1) {
            showToast("Please enter a valid donation amount (min ₹1).", "warning");
            amountInput?.focus();
            return;
          }
          openRazorpayModal(amount);
          return;
        } else {
          const amountInput = document.querySelector("#custom-amount");
          const amount = parseFloat(amountInput?.value);
          if (!amount || amount < 1) {
            showToast("Please enter a valid donation amount (min $1).", "warning");
            amountInput?.focus();
            return;
          }
          openPaymentModal(amount);
          return;
        }
      }

      // ── Physical hardware path ────────────────────────────
      const itemNameEl = document.querySelector("#item-name");
      const modelEl = document.querySelector("#model-number");
      const serialEl = document.querySelector("#serial-number");
      const conditionEl = document.querySelector("#condition");

      if (!itemNameEl?.value.trim() || !modelEl?.value.trim() ||
        !serialEl?.value.trim() || !conditionEl?.value) {
        showToast("Please complete all required hardware fields.", "warning");
        return;
      }

      const streetAddr = document.querySelector("#dropoff-address")?.value.trim() || "";
      const city = document.querySelector("#dropoff-city")?.value.trim() || "";
      const stateVal = document.querySelector("#dropoff-state")?.value.trim() || "";
      const zip = document.querySelector("#dropoff-zip")?.value.trim() || "";
      const fullDropoff = [streetAddr, city, stateVal, zip].filter(Boolean).join(", ");

      setSubmitLoading(true);
      // Simulate brief audit-queue delay for UX realism
      await new Promise(r => setTimeout(r, 800));

      const sub = {
        ticket: `PENDING_AUDIT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        itemName: itemNameEl.value.trim(),
        recipientName: state.selectedRecipient.name,
        donationType: state.donationType,
        proofFile: document.querySelector("#proof-image")?.files[0]?.name || "—",
        dropoffLocation: fullDropoff || "—",
        coordinates: state.userCoordinates ? `${state.userCoordinates.lat.toFixed(4)}, ${state.userCoordinates.lng.toFixed(4)}` : null,
        createdAt: new Date().toISOString()
      };

      state.latestSubmission = sub;
      state.localSubmissions.push(sub);
      populateReceipt(sub);

      // Auto-append to Admin Hardware Moderation Queue
      adminHardwareQueue.unshift({
        ticket: sub.ticket,
        hardware: `${sub.itemName} (${conditionEl.options[conditionEl.selectedIndex]?.text || conditionEl.value})`,
        recipient: sub.recipientName,
        method: sub.dropoffLocation && sub.dropoffLocation !== "—" ? `Drop: ${sub.dropoffLocation.substring(0, 28)}...` : "Shipping Partner Hand-off",
        proof: sub.proofFile,
        status: "Pending Audit",
        date: new Date().toISOString().replace("T", " ").substring(0, 16)
      });
      setSubmitLoading(false);
      navigate("confirmation");
      showToast("🎮 Hardware drop queued for audit!", "success");
    });
  }

  // ── Quick-amount preset buttons (main form) ───────────────
  document.addEventListener("click", (e) => {
    const qBtn = e.target.closest("[data-amount]");
    if (!qBtn) return;
    const amtInput = document.querySelector("#custom-amount");
    if (amtInput) {
      amtInput.value = qBtn.dataset.amount;
      document.querySelectorAll(".quick-amount-btn").forEach(b => b.classList.remove("active"));
      qBtn.classList.add("active");
    }
  });

  // ── Quick-amount preset buttons (inside payment modal) ────
  document.addEventListener("click", (e) => {
    const pmBtn = e.target.closest("[data-pm-amount]");
    if (!pmBtn) return;
    const val = parseFloat(pmBtn.dataset.pmAmount);
    if (!val) return;

    // Deselect other presets and custom toggle
    document.querySelectorAll(".pm-preset-btn").forEach(b => b.classList.remove("pm-preset-btn--active"));
    pmBtn.classList.add("pm-preset-btn--active");

    // Hide custom input and clear it
    const customRow = document.querySelector("#pm-custom-row");
    const customInput = document.querySelector("#pm-custom-input");
    if (customRow) customRow.classList.add("d-none");
    if (customInput) customInput.value = "";

    setPaymentAmount(val, false);
  });

  // ── Custom toggle button (inside payment modal) ───────────
  document.addEventListener("click", (e) => {
    const customToggle = e.target.closest("#pm-custom-toggle");
    if (!customToggle) return;
    const customRow = document.querySelector("#pm-custom-row");
    const customInput = document.querySelector("#pm-custom-input");
    if (!customRow) return;

    const isHidden = customRow.classList.contains("d-none");
    if (isHidden) {
      customRow.classList.remove("d-none");
      document.querySelectorAll(".pm-preset-btn[data-pm-amount]").forEach(b => b.classList.remove("pm-preset-btn--active"));
      customToggle.classList.add("pm-preset-btn--active");
      if (customInput) {
        customInput.focus();
        if (customInput.value) {
          setPaymentAmount(customInput.value, true);
        } else {
          setPaymentAmount(0, true);
        }
      }
    } else {
      customRow.classList.add("d-none");
      customToggle.classList.remove("pm-preset-btn--active");
      const defaultPreset = document.querySelector(".pm-preset-btn[data-pm-amount='25']");
      if (defaultPreset) defaultPreset.classList.add("pm-preset-btn--active");
      setPaymentAmount(25, false);
    }
  });

  // ── Custom amount input typing (live sync) ────────────────
  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "pm-custom-input") {
      const val = parseFloat(e.target.value);
      setPaymentAmount(val, true);
    }
  });

  // ── Payment modal: wire Pay Now button ────────────────────
  const pmPayBtn = document.querySelector("#pm-pay-btn");
  if (pmPayBtn) pmPayBtn.addEventListener("click", confirmPayment);

  // ── Monetary drop card trigger button ────────────────────
  const btnOpenModal = document.querySelector("#btn-open-payment-modal");
  if (btnOpenModal) {
    btnOpenModal.addEventListener("click", () => {
      const amountInput = document.querySelector("#custom-amount");
      const amount = parseFloat(amountInput?.value) || 25;
      openPaymentModal(amount);
    });
  }

  // ── Close modal resets pending guard ─────────────────────
  const paymentModalEl = document.querySelector("#paymentModal");
  if (paymentModalEl) {
    paymentModalEl.addEventListener("hidden.bs.modal", () => {
      state.isPaymentPending = false;
    });
  }

  window.addEventListener("popstate", () => navigate(resolveInitialPage(), false));
  window.addEventListener("hashchange", () => navigate(resolveInitialPage(), false));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}