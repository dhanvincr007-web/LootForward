// ============================================================
// LootForward — app.js (Firefox & Non-Module Bulletproof Version)
// ============================================================

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

const state = {
  currentPage: "about",
  donationType: "console",
  selectedRecipient: null,
  latestSubmission: null,
  imageHash: null,
  adminUnlocked: false,
  localSubmissions: []
};

const PAGE_IDS = ["about", "donate", "recipients", "tracking", "confirmation", "admin"];

// Helper: Escape HTML
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Router
function navigate(page, updateHash = true) {
  if (!PAGE_IDS.includes(page)) page = "about";
  state.currentPage = page;

  const pages = document.querySelectorAll(".page-view");
  pages.forEach((view) => {
    view.classList.toggle("active-page", view.dataset.page === page);
  });

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

function renderRecipients() {
  const grid = document.querySelector("#recipient-cards-container");
  if (!grid) return;

  grid.innerHTML = recipients.map((r) => {
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

function showToast(message, type = "info") {
  const container = document.querySelector("#toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `alert alert-${type === "error" ? "danger" : type} py-2 px-3 m-2`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Leaflet Map Initialization
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

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  renderRecipients();
  navigate(resolveInitialPage(), false);
  setTimeout(initDropOffMap, 500);

  // Global click routing
  document.addEventListener("click", (event) => {
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
      if (pFields) pFields.classList.toggle("d-none", !isPhysical);
      if (mFields) mFields.classList.toggle("d-none", isPhysical);
    });
  });

  // Form submit handler
  const form = document.querySelector("#donation-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!state.selectedRecipient) {
        showToast("Please select a verified recipient first.", "error");
        return;
      }

      const sub = {
        ticket: `PENDING_AUDIT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        itemName: state.donationType === "money" ? "$25.00 USD" : (document.querySelector("#item-name")?.value || "Hardware Item"),
        recipientName: state.selectedRecipient.name,
        donationType: state.donationType,
        createdAt: new Date().toISOString()
      };

      state.latestSubmission = sub;
      state.localSubmissions.push(sub);

      // Render Confirmation values
      const itemEl = document.querySelector("#receipt-item");
      const recEl = document.querySelector("#receipt-recipient");
      const tickEl = document.querySelector("#receipt-ticket");

      if (itemEl) itemEl.textContent = sub.itemName;
      if (recEl) recEl.textContent = sub.recipientName;
      if (tickEl) tickEl.textContent = sub.ticket;

      navigate("confirmation");
      showToast("🎮 Contribution submitted for audit!", "success");
    });
  }

  // Window back/forward support
  window.addEventListener("popstate", () => navigate(resolveInitialPage(), false));
  window.addEventListener("hashchange", () => navigate(resolveInitialPage(), false));
});