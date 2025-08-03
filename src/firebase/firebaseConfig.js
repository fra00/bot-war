import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// La configurazione del tuo progetto Firebase.
// Per le versioni JS SDK v7.20.0 e successive, measurementId è opzionale.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Firebase Authentication e esportalo per l'uso nell'app
export const auth = getAuth(app);

// Inizializza Cloud Firestore e esportalo
export const db = getFirestore(app);

export default app; // Esporta anche l'app principale, potrebbe servire
