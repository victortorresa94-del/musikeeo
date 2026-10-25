import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

// Producción (musikeeo.com). El entorno de pruebas (musikeeo-pruebas, docs/AGENTES.md) usa
// la misma app con su propio Firebase: basta con dar las VITE_FIREBASE_* en su despliegue.
const env = import.meta.env;
const firebaseConfig = env.VITE_FIREBASE_PROJECT_ID ? {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
} : {
    apiKey: "AIzaSyDTak4DoBdDDcQKqCS5bKVsDwAEYBs52RI",
    authDomain: "musikeeo-8e766.firebaseapp.com",
    projectId: "musikeeo-8e766",
    storageBucket: "musikeeo-8e766.firebasestorage.app",
    messagingSenderId: "992584484452",
    appId: "1:992584484452:web:7d9308a20b5d497c6d0171",
    measurementId: "G-SVHBBGXMX2"
};

/** true en el entorno de pruebas o con los emuladores: nunca en musikeeo.com */
export const esPruebas = env.VITE_ENTORNO === 'pruebas' || (env.DEV && env.VITE_EMULADORES === '1');

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

    // Pruebas en local (npm run dev con VITE_EMULADORES=1): Auth y Firestore de los
    // emuladores de Firebase, nunca los de producción. En el build de Vercel no existe.
    if (import.meta.env.DEV && import.meta.env.VITE_EMULADORES === '1') {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }

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
