import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyDTak4DoBdDDcQKqCS5bKVsDwAEYBs52RI",
    authDomain: "musikeeo-8e766.firebaseapp.com",
    projectId: "musikeeo-8e766",
    storageBucket: "musikeeo-8e766.firebasestorage.app",
    messagingSenderId: "992584484452",
    appId: "1:992584484452:web:7d9308a20b5d497c6d0171",
    measurementId: "G-SVHBBGXMX2"
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

    // ENABLE OFFLINE PERSISTENCE
    // This fixes "Client is offline" errors and allows the app to work without network.
    try {
        enableIndexedDbPersistence(db)
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    // Multiple tabs open, persistence can only be enabled in one tab at a a time.
                    console.warn("Firestore validation failed: Multiple tabs open.");
                } else if (err.code === 'unimplemented') {
                    // The current browser does not support all of the features required to enable persistence
                    console.warn("Firestore validation failed: Browser not supported.");
                }
            });
    } catch (e) {
        console.warn("Could not enable persistence:", e);
    }

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
