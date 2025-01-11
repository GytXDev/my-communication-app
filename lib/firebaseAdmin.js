// lib/firebaseAdmin.js

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Configuration Firebase Admin (Remplacez les valeurs par les vôtres)
const adminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined,
  }),
};

// Initialiser Firebase Admin uniquement si ce n'est pas déjà fait
if (!getApps().length) {
  initializeApp(adminConfig);
}

const adminAuth = getAuth();

export { adminAuth };
