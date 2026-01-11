import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Safety check for missing environment variables
const isConfigValid = Object.values(firebaseConfig).every(value => !!value);

if (!isConfigValid) {
    console.warn(
        "%c[Firebase Warning] Missing environment variables. Authentication and Database features will not work.",
        "color: orange; font-weight: bold;"
    );
    console.table(firebaseConfig);
}

// Initialize Firebase only if not already initialized
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
} catch (error) {
    console.error("Firebase initialization failed:", error);
    // Provide dummy objects to prevent app crash on import
    // This allows the UI to render even if Firebase is broken
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    storage = {} as FirebaseStorage;
    functions = {} as Functions;
}

export { app, auth, db, storage, functions };
