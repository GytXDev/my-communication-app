// lib/firebaseConfig.js

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'  // <-- Pour Firestore

// Votre configuration récupérée depuis la console Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBM3yhTXZkWdiC6sRGkRDrGHBgu8QXxlTM',
  authDomain: 'community-8928e.firebaseapp.com',
  projectId: 'community-8928e',
  storageBucket: 'community-8928e.firebasestorage.app',
  messagingSenderId: '253431728823',
  appId: '1:253431728823:web:7a973db696e7ff42c39b32',
}

// Initialisation de l'app Firebase
const app = initializeApp(firebaseConfig)

// Authentification
const auth = getAuth(app)

// Firestore
const db = getFirestore(app)  // <-- Créez l'instance Firestore

// Exportez à la fois auth et db
export { auth, db }
