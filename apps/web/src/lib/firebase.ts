import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "hush-crafts.firebaseapp.com",
  projectId: "hush-crafts",
  storageBucket: "hush-crafts.firebasestorage.app",
  messagingSenderId: "533816937760",
  appId: "1:533816937760:web:1ed17c3eea1bea515c9b45",
  measurementId: "G-H3YV6XLSFJ"
};

// Initialize Firebase only if it hasn't been initialized already (useful for Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize other services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Dedicated Admin App and Auth to separate admin session storage from client users
const adminApp = getApps().find(a => a.name === "admin") || initializeApp(firebaseConfig, "admin");
const adminAuth = getAuth(adminApp);

// Initialize Analytics safely on the client side
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics, adminAuth, firebaseConfig };
