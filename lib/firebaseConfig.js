// lib/firebaseConfig.js

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from "firebase/storage";

// Votre configuration récupérée depuis la console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAP3LvnVBTOdphqPSjOVyngAun5z7D9uXY",
  authDomain: "gytx-lumina-f5cbc.firebaseapp.com",
  projectId: "gytx-lumina-f5cbc",
  storageBucket: "gytx-lumina-f5cbc.appspot.com",
  messagingSenderId: "859193616815",
  appId: "1:859193616815:web:821fbf539edbcde656e75a"
};

// Initialisation de l'app Firebase
const app = initializeApp(firebaseConfig)

// Authentification
const auth = getAuth(app)

// Firestore
const db = getFirestore(app)  // <-- Créez l'instance Firestore

// Storage 
const storage = getStorage(app);

// Exportez à la fois auth et db
export { auth, db, storage }
