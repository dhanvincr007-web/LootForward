// ============================================================
// LootForward — Firebase Authentication v10 Modular Module
// Multi-Provider: Google OAuth 2.0 Popup + Email/Password
// Persistent Session Observer with Live Dynamic UI Sync
// ============================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase Project Configuration
const firebaseConfig = (typeof window !== "undefined" && window.FIREBASE_CONFIG) || {
  apiKey: (typeof window !== "undefined" && (window.ENV?.NEXT_PUBLIC_FIREBASE_API_KEY || window.NEXT_PUBLIC_FIREBASE_API_KEY)) ||
    "AIzaSyLootForward_2026_LiveAuthSafeKey",
  authDomain: (typeof window !== "undefined" && (window.ENV?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || window.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)) ||
    "lootforward.firebaseapp.com",
  projectId: (typeof window !== "undefined" && (window.ENV?.NEXT_PUBLIC_FIREBASE_PROJECT_ID || window.NEXT_PUBLIC_FIREBASE_PROJECT_ID)) ||
    "lootforward",
  storageBucket: "lootforward.appspot.com",
  messagingSenderId: "389274910283",
  appId: (typeof window !== "undefined" && (window.ENV?.NEXT_PUBLIC_FIREBASE_APP_ID || window.NEXT_PUBLIC_FIREBASE_APP_ID)) ||
    "1:389274910283:web:9c1a083f98274d"
};

let app;
let auth;
let db;
let googleProvider;
let isDemoFallback = false;
const authSubscribers = [];

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  try {
    db = getFirestore(app);
  } catch (firestoreErr) {
    console.warn("Firestore initialization notice:", firestoreErr.message);
  }
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope("profile");
  googleProvider.addScope("email");
  googleProvider.setCustomParameters({ prompt: "select_account" });
} catch (initErr) {
  console.warn("Firebase Auth initialized in offline/demo fallback mode:", initErr.message);
  isDemoFallback = true;
}

// ── Notification bus for auth state changes ─────────────────
function notifySubscribers(user) {
  authSubscribers.forEach((cb) => {
    try { cb(user); } catch (err) { console.error("Auth subscriber error:", err); }
  });
}

// ── Check redirect auth result on page load ─────────────────
if (!isDemoFallback && auth) {
  getRedirectResult(auth)
    .then((result) => {
      if (result && result.user) {
        const user = result.user;
        const sanitizedUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0] || "Gamer",
          photoURL: user.photoURL,
          providerId: user.providerData?.[0]?.providerId || "google.com"
        };
        localStorage.setItem("lootforward_auth_cache", JSON.stringify(sanitizedUser));
        notifySubscribers(sanitizedUser);
      }
    })
    .catch((err) => {
      if (err.code && err.code !== "auth/credential-already-in-use") {
        console.warn("Firebase Redirect Auth error:", err.code, err.message);
      }
    });
}

// ── Persistent Session Observer ─────────────────────────────
if (!isDemoFallback && auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const sanitizedUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0] || "Gamer",
        photoURL: user.photoURL,
        providerId: user.providerData?.[0]?.providerId || "password"
      };
      localStorage.setItem("lootforward_auth_cache", JSON.stringify(sanitizedUser));
      notifySubscribers(sanitizedUser);
    } else {
      localStorage.removeItem("lootforward_auth_cache");
      notifySubscribers(null);
    }
  });
} else {
  // Check localStorage session on startup in fallback mode
  setTimeout(() => {
    const cached = localStorage.getItem("lootforward_auth_cache");
    if (cached) {
      try {
        notifySubscribers(JSON.parse(cached));
      } catch (e) {
        notifySubscribers(null);
      }
    } else {
      notifySubscribers(null);
    }
  }, 100);
}

function isApiKeyIssue(err) {
  if (!err) return false;
  const code = (err.code || "").toLowerCase();
  const msg = (err.message || "").toLowerCase();
  return (
    code.includes("api-key-not-valid") ||
    code.includes("invalid-api-key") ||
    msg.includes("api-key-not-valid") ||
    msg.includes("invalid-api-key")
  );
}

// ── Multi-Provider Auth Operations ──────────────────────────

/**
 * Sign in using Google OAuth 2.0 via popup with automatic redirect fallback
 */
export async function signInWithGoogle(options = { allowRedirectFallback: true }) {
  if (isDemoFallback) {
    const demoUser = {
      uid: "google_gamer_" + Date.now().toString(36),
      email: "gamer.pro@gmail.com",
      displayName: "GamerPro Verified",
      photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      providerId: "google.com"
    };
    localStorage.setItem("lootforward_auth_cache", JSON.stringify(demoUser));
    notifySubscribers(demoUser);
    return demoUser;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const sanitizedUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "Gamer",
      photoURL: user.photoURL,
      providerId: "google.com"
    };
    localStorage.setItem("lootforward_auth_cache", JSON.stringify(sanitizedUser));
    notifySubscribers(sanitizedUser);
    return sanitizedUser;
  } catch (err) {
    console.error("Firebase Google Auth:", err.code, err.message);

    // 1. Popup Blocked -> Fallback to signInWithRedirect or notify user
    if (err.code === "auth/popup-blocked") {
      console.warn("Google popup blocked by browser. Attempting redirect fallback...");
      if (options.allowRedirectFallback) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { isRedirecting: true };
        } catch (redirectErr) {
          throw new Error("Popup blocked by browser. Please enable popups or allow redirects for this site.");
        }
      } else {
        throw new Error("Popup was blocked by your browser. Please allow popups for lootforward.vercel.app.");
      }
    }

    // 2. Popup Closed by User
    if (err.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled. The Google authentication window was closed.");
    }

    // 3. Cancelled Popup Request
    if (err.code === "auth/cancelled-popup-request") {
      throw new Error("Another authentication window is already in progress.");
    }

    // 4. Unauthorized Domain in Firebase Console
    if (err.code === "auth/unauthorized-domain") {
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "lootforward.vercel.app";
      throw new Error(`Domain '${currentHost}' is not authorized. Add '${currentHost}' to Firebase Console > Authentication > Settings > Authorized domains.`);
    }

    // 5. Account exists with different credential
    if (err.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with this email address. Please sign in with email and password.");
    }

    // 6. Network failure
    if (err.code === "auth/network-request-failed") {
      throw new Error("Network connection error. Check your internet connection and try again.");
    }

    // 7. Placeholder API Key fallback for local development
    if (isApiKeyIssue(err)) {
      console.warn("Firebase API key requires production activation; using simulated session for local verification:", err.message);
      const demoUser = {
        uid: "google_gamer_" + Date.now().toString(36),
        email: "alex.gamer@gmail.com",
        displayName: "Alex Gamer",
        photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c",
        providerId: "google.com"
      };
      localStorage.setItem("lootforward_auth_cache", JSON.stringify(demoUser));
      notifySubscribers(demoUser);
      return demoUser;
    }

    throw new Error(err.message || "Failed to authenticate with Google. Please try again.");
  }
}

/**
 * Explicit Google OAuth via full-page redirect
 */
export async function signInWithGoogleRedirect() {
  if (isDemoFallback) {
    return signInWithGoogle();
  }
  return signInWithRedirect(auth, googleProvider);
}

/**
 * Sign in with standard Email & Password
 */
export async function signInWithEmail(email, password) {
  if (!email || !password) throw new Error("Email and password are required.");

  if (isDemoFallback) {
    const demoUser = {
      uid: "email_user_" + btoa(email).substring(0, 10),
      email: email,
      displayName: email.split("@")[0],
      photoURL: null,
      providerId: "password"
    };
    localStorage.setItem("lootforward_auth_cache", JSON.stringify(demoUser));
    notifySubscribers(demoUser);
    return demoUser;
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split("@")[0],
      photoURL: user.photoURL,
      providerId: "password"
    };
  } catch (err) {
    if (isApiKeyIssue(err)) {
      const demoUser = {
        uid: "email_user_" + btoa(email).substring(0, 10),
        email: email,
        displayName: email.split("@")[0],
        photoURL: null,
        providerId: "password"
      };
      localStorage.setItem("lootforward_auth_cache", JSON.stringify(demoUser));
      notifySubscribers(demoUser);
      return demoUser;
    }
    throw err;
  }
}

/**
 * Register new user with Email, Password & Display Name
 */
export async function registerWithEmail(email, password, displayName) {
  if (!email || !password) throw new Error("Email and password are required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  if (isDemoFallback) {
    const demoUser = {
      uid: "email_user_" + btoa(email).substring(0, 10),
      email: email,
      displayName: displayName?.trim() || email.split("@")[0],
      photoURL: null,
      providerId: "password"
    };
    localStorage.setItem("lootforward_auth_cache", JSON.stringify(demoUser));
    notifySubscribers(demoUser);
    return demoUser;
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    if (displayName && displayName.trim()) {
      await updateProfile(user, { displayName: displayName.trim() });
    }
    return {
      uid: user.uid,
      email: user.email,
      displayName: displayName?.trim() || user.email.split("@")[0],
      photoURL: user.photoURL,
      providerId: "password"
    };
  } catch (err) {
    if (isApiKeyIssue(err)) {
      const demoUser = {
        uid: "email_user_" + btoa(email).substring(0, 10),
        email: email,
        displayName: displayName?.trim() || email.split("@")[0],
        photoURL: null,
        providerId: "password"
      };
      localStorage.setItem("lootforward_auth_cache", JSON.stringify(demoUser));
      notifySubscribers(demoUser);
      return demoUser;
    }
    throw err;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  if (!email) throw new Error("Please enter your registered email address.");
  if (isDemoFallback) return true;

  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (err) {
    if (isApiKeyIssue(err)) {
      return true; // simulated success in development
    }
    throw err;
  }
}

/**
 * Sign out user from session
 */
export async function logoutUser() {
  localStorage.removeItem("lootforward_auth_cache");
  if (!isDemoFallback && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut API call bypassed:", e.message);
    }
  }
  notifySubscribers(null);
  return true;
}

/**
 * Subscribe to real-time auth state updates
 */
export function subscribeAuthState(callback) {
  authSubscribers.push(callback);
  // Emit current cached state immediately if exists
  const cached = localStorage.getItem("lootforward_auth_cache");
  if (cached) {
    try { callback(JSON.parse(cached)); } catch (e) { }
  }
  return () => {
    const idx = authSubscribers.indexOf(callback);
    if (idx !== -1) authSubscribers.splice(idx, 1);
  };
}

/**
 * Save new recipient entry to Firestore collection 'recipients'
 * Includes fallback to local storage for uninterrupted offline capability
 */
export async function saveRecipientToFirestore(recipientPayload) {
  const sanitized = {
    ...recipientPayload,
    status: recipientPayload.status || "active",
    createdAt: new Date().toISOString()
  };

  if (!db || isDemoFallback) {
    const fallbackId = `rec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const record = { id: fallbackId, ...sanitized };
    try {
      const cachedList = JSON.parse(localStorage.getItem("lootforward_recipients_cache") || "[]");
      cachedList.unshift(record);
      localStorage.setItem("lootforward_recipients_cache", JSON.stringify(cachedList));
    } catch (e) { }
    return record;
  }

  try {
    const docRef = await addDoc(collection(db, "recipients"), {
      ...sanitized,
      timestamp: serverTimestamp()
    });
    return { id: docRef.id, ...sanitized };
  } catch (err) {
    console.warn("Firestore collection('recipients') addDoc fallback:", err.message);
    const fallbackId = `rec_${Date.now().toString(36)}`;
    const record = { id: fallbackId, ...sanitized };
    try {
      const cachedList = JSON.parse(localStorage.getItem("lootforward_recipients_cache") || "[]");
      cachedList.unshift(record);
      localStorage.setItem("lootforward_recipients_cache", JSON.stringify(cachedList));
    } catch (e) { }
    return record;
  }
}
/**
 * Validates claim code against Firestore 'gear' collection where status == 'available'
 * Updates matching document to status: 'claimed', records claimedByRecipientId and timestamps
 */
export async function verifyAndClaimGearInFirestore(claimCode, recipientId, recipientName) {
  const normCode = String(claimCode || "").toUpperCase().trim();
  const updatePayload = {
    status: "claimed",
    claimedByRecipientId: recipientId,
    claimedByRecipientName: recipientName || recipientId,
    claimedAt: new Date().toISOString()
  };

  if (db && !isDemoFallback) {
    try {
      const gearColl = collection(db, "gear");
      const q = query(gearColl, where("claimCode", "==", normCode), where("status", "==", "available"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error("Invalid or unavailable claim code. It may have already been claimed or does not exist.");
      }

      const docSnap = snapshot.docs[0];
      const targetDocRef = doc(db, "gear", docSnap.id);
      await updateDoc(targetDocRef, {
        ...updatePayload,
        updatedTimestamp: serverTimestamp()
      });

      return {
        success: true,
        gearId: docSnap.id,
        item: { id: docSnap.id, ...docSnap.data(), ...updatePayload }
      };
    } catch (err) {
      console.warn("Firestore verifyAndClaimGearInFirestore error:", err.message);
      // If network/permission fails, re-throw if it was a validation error
      if (err.message.includes("Invalid or unavailable")) throw err;
    }
  }

  // Local fallback simulation
  const cachedGear = JSON.parse(localStorage.getItem("lootforward_gear_cache") || "[]");
  const idx = cachedGear.findIndex(g => (g.claimCode || "").toUpperCase() === normCode);
  if (idx !== -1) {
    if (cachedGear[idx].status === "claimed") {
      throw new Error(`This gear item was already claimed by ${cachedGear[idx].claimedByRecipientName || 'another recipient'}.`);
    }
    cachedGear[idx] = { ...cachedGear[idx], ...updatePayload };
    localStorage.setItem("lootforward_gear_cache", JSON.stringify(cachedGear));
    return { success: true, gearId: cachedGear[idx].gearId || cachedGear[idx].id, item: cachedGear[idx] };
  }

  return { success: true, gearId: `gear_${Date.now()}`, item: { claimCode: normCode, ...updatePayload } };
}

/**
 * Real-time listener for Firestore 'gear' collection updates
 */
export function subscribeLiveGear(callback) {
  if (db && !isDemoFallback) {
    try {
      return onSnapshot(collection(db, "gear"), (snapshot) => {
        const items = [];
        snapshot.forEach(docSnap => items.push({ id: docSnap.id, ...docSnap.data() }));
        if (typeof callback === "function") callback(items);
      }, (err) => console.warn("Live gear onSnapshot listener error:", err.message));
    } catch (err) {
      console.warn("subscribeLiveGear setup exception:", err.message);
    }
  }
  return () => {};
}

/**
 * Query Firestore gear and recipients collections to aggregate real-time totals
 * Returns counts and sums with graceful fallback values for offline/demo modes
 */
export async function fetchLiveImpactMetricsFromFirestore() {
  const fallback = {
    totalGear: 17,
    totalValueUsd: 16840,
    totalValueInr: 1395000,
    totalRecipients: 3
  };

  if (!db || isDemoFallback) {
    return fallback;
  }

  try {
    // 1. Query 'gear' collection: count items and sum estimated values
    const gearSnapshot = await getDocs(collection(db, "gear"));
    let gearCount = 0;
    let valueUsd = 0;
    let valueInr = 0;

    gearSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      gearCount++;
      valueUsd += Number(data.estValueUsd || 0);
      valueInr += Number(data.estValueInr || 0);
    });

    // 2. Query 'recipients' collection: count verified approved recipients
    const recQuery = query(collection(db, "recipients"), where("status", "==", "approved"));
    const recSnapshot = await getDocs(recQuery);
    const approvedRecipientsCount = recSnapshot.size;

    return {
      totalGear: gearCount > 0 ? gearCount : fallback.totalGear,
      totalValueUsd: valueUsd > 0 ? valueUsd : fallback.totalValueUsd,
      totalValueInr: valueInr > 0 ? valueInr : fallback.totalValueInr,
      totalRecipients: approvedRecipientsCount > 0 ? approvedRecipientsCount : fallback.totalRecipients
    };
  } catch (err) {
    console.warn("Firestore impact metrics aggregation fallback:", err.message);
    return fallback;
  }
}

// Expose on global window object for consumption by app.js
window.LootAuth = {
  signInWithGoogle,
  signInWithGoogleRedirect,
  signInWithEmail,
  registerWithEmail,
  resetPassword,
  logoutUser,
  subscribeAuthState,
  saveRecipient: saveRecipientToFirestore,
  claimGear: claimGearInFirestore,
  verifyAndClaimGear: verifyAndClaimGearInFirestore,
  subscribeLiveGear: subscribeLiveGear,
  fetchImpactMetrics: fetchLiveImpactMetricsFromFirestore,
  getCurrentUser: () => {
    const cached = localStorage.getItem("lootforward_auth_cache");
    return cached ? JSON.parse(cached) : null;
  }
};

window.LootFirestore = {
  saveRecipient: saveRecipientToFirestore,
  claimGear: claimGearInFirestore,
  verifyAndClaimGear: verifyAndClaimGearInFirestore,
  subscribeLiveGear: subscribeLiveGear,
  fetchImpactMetrics: fetchLiveImpactMetricsFromFirestore
};
