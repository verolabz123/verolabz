import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqwq7AqFi0nznMkD9P7x6skvH7wUvsmU0",
  authDomain: "verolabz-dbc48.firebaseapp.com",
  projectId: "verolabz-dbc48",
  storageBucket: "verolabz-dbc48.firebasestorage.app",
  messagingSenderId: "806413520348",
  appId: "1:806413520348:web:c1580d27d4ffe507429319",
  measurementId: "G-VPDYRKH2N7",
};

// Initialize Firebase (singleton pattern to prevent multiple initializations)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Analytics only works in browser environment
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }
}

export { app, auth, db, storage, analytics };
export default app;
