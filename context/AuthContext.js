// context/AuthContext.js
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebaseConfig";
import Loading from "@/app/components/Loading";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // user final fusionné (Auth + Firestore)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser);

      try {
        if (currentUser) {
          // On utilise l'UID Firebase Auth pour récupérer/créer le doc Firestore
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          console.log("Firestore document fetched:", docSnap.exists());

          if (docSnap.exists()) {
            // Fusionner les champs du doc Firestore avec l'UID + email Auth
            const userDoc = docSnap.data();
            const mergedUser = {
              ...userDoc,
              uid: currentUser.uid,       // On ajoute l’UID (très important)
              email: currentUser.email,   // On récupère l’email
            };
            setUser(mergedUser);
            console.log("User data set from Firestore + merged:", mergedUser);
          } else {
            // Créer un nouveau doc Firestore si inexistant
            const newUserData = {
              displayName: currentUser.displayName || "Utilisateur",
              photoURL: currentUser.photoURL || null,
              description: "",
              createdAt: new Date().toISOString(),
              uid: currentUser.uid,       // Enregistrer aussi l'UID en base
              email: currentUser.email,   // Enregistrer l’email
            };
            await setDoc(docRef, newUserData);
            setUser(newUserData);
            console.log("New user data created and set:", newUserData);
          }
        } else {
          // currentUser est null => déconnexion
          setUser(null);
          console.log("User signed out");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des données utilisateur :", err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
        console.log("Loading state set to false");
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
