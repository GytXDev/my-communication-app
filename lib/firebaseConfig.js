// lib/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAP3LvnVBTOdphqPSjOVyngAun5z7D9uXY",
  authDomain: "gytx-lumina-f5cbc.firebaseapp.com",
  projectId: "gytx-lumina-f5cbc",
  storageBucket: "gytx-lumina-f5cbc.appspot.com",
  messagingSenderId: "859193616815",
  appId: "1:859193616815:web:821fbf539edbcde656e75a",
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services Firebase
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
