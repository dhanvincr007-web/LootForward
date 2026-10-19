// ============================================================
// LootForward — app.js (Bulletproof Routing & Error Safety)
// ============================================================

const DEMO_ADMIN_PASS = "LOOTFORWARD2026";

// ── Firebase Cloud Function endpoint ──────────────────────────
// Replace with your deployed Firebase function URL.
const CF_ENDPOINT = "https://us-central1-lootforward.cloudfunctions.net/createPaymentIntent";

// ── Stripe publishable key (safe to expose on client) ─────────
const STRIPE_PK = "pk_live_51URA1l7Rn2TQL42SVqBqgnle1sltjYUSJwJ0EeESONdcRffzIpcHpx6fyZIHJ61DUzJr8tL50wtRQl16RZZ9H82V00jsPCS11DE";

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

const dropOffPartners = [
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
  // Leaflet & Geolocation state
  maps: { dropMap: null, donationMap: null },
  userMarkers: { dropMap: null, donationMap: null },
  userCoordinates: null,
  userAddress: null,
  isGeolocating: false
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

          <div class="d-flex gap-2 mt-4">
            <button type="button" class="btn btn-outline-neon flex-fill"
                    data-select-recipient="${escapeHtml(r.id)}">
              Select Recipient
            </button>
            <button type="button" class="btn btn-neon flex-fill"
                    data-donate-card="${escapeHtml(r.id)}">
              💳 Donate $
            </button>
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

function initLeafletMaps() {
  if (!window.L) {
    console.warn("Leaflet.js not loaded — map initialization bypassed.");
    return;
  }

  const darkTileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const tileOptions = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
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

      // Add verified partner markers
      dropOffPartners.forEach(p => {
        const marker = L.marker([p.lat, p.lng], { icon: createPartnerIcon(p.type) }).addTo(dropMap);
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
      });

      // Map click: drops pin & reverse geocodes
      dropMap.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        updateUserPositionOnMaps(lat, lng, false);
        await reverseGeocodeAddress(lat, lng);
      });
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

      // Add partners to form map
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

      // Click to place custom pin and reverse geocode
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
function updateUserPositionOnMaps(lat, lng, flyTo = true) {
  state.userCoordinates = { lat, lng };

  // Update Lat/Lng badge
  const coordsBadge = document.querySelector("#location-coords-badge");
  if (coordsBadge) {
    coordsBadge.textContent = `LAT: ${lat.toFixed(4)} · LNG: ${lng.toFixed(4)}`;
  }

  const icon = createPulseUserIcon();

  // Drop-off network map
  if (state.maps.dropMap) {
    if (state.userMarkers.dropMap) {
      state.userMarkers.dropMap.setLatLng([lat, lng]);
    } else {
      state.userMarkers.dropMap = L.marker([lat, lng], { icon }).addTo(state.maps.dropMap);
    }
    if (flyTo) state.maps.dropMap.flyTo([lat, lng], 14, { duration: 1.2 });
  }

  // Donation form map
  if (state.maps.donationMap) {
    if (state.userMarkers.donationMap) {
      state.userMarkers.donationMap.setLatLng([lat, lng]);
    } else {
      state.userMarkers.donationMap = L.marker([lat, lng], { icon }).addTo(state.maps.donationMap);
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
      openPaymentModal(25);
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

// Main execution on DOM ready
function initApp() {
  attachClickHandlers();
  renderRecipients();
  navigate(resolveInitialPage(), false);

  // Isolated initializations
  setTimeout(initStripeSafely, 300);
  setTimeout(initLeafletMaps, 250);
  setupAddressAutocomplete();

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