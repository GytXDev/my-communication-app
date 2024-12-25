// lib/firebaseConfig.js

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Votre configuration récupérée depuis la console Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBM3yhTXZkWdiC6sRGkRDrGHBgu8QXxlTM',
  authDomain: 'XXX.firebaseapp.com',
  projectId: 'community-8928e',
  storageBucket: 'XXX.appspot.com',
  messagingSenderId: 'XXX',
  appId: '253431728823',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export { auth }
