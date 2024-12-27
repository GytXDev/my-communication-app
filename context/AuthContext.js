// context/AuthContext.js
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Loading from "@/app/components/Loading";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // État d'erreur

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser);
      try {
        if (currentUser) {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          console.log("Firestore document fetched:", docSnap.exists());

          if (docSnap.exists()) {
            setUser(docSnap.data());
            console.log("User data set from Firestore:", docSnap.data());
          } else {
            const newUserData = {
              displayName: currentUser.displayName || "Utilisateur",
              photoURL: currentUser.photoURL || null,
              description: "",
              createdAt: new Date().toISOString(),
            };
            await setDoc(docRef, newUserData);
            setUser(newUserData);
            console.log("New user data created and set:", newUserData);
          }
        } else {
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
