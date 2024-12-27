// app/page.js
"use client"
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig"; // Assurez-vous d'importer votre configuration Firebase
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Sidebar from "./components/Sidebar";
import CommunityList from "./components/CommunityList";
import ProfilePanel from "./components/ProfilePanel";
import MainView from "./components/MainView";

export default function HomePage() {
  const [selectedMenu, setSelectedMenu] = useState("communaute");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [isCreateCommunityOpen, setCreateCommunityOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  

  const handleCloseCreateCommunity = () => {
    setCreateCommunityOpen(false); // Désactiver le mode création
  };

  const handleCreateCommunity = () => {
    setCreateCommunityOpen(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          const newUserData = {
            displayName: user.displayName || "Utilisateur",
            photoURL: user.photoURL || null,
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, newUserData);
          setUserData(newUserData);
        }
      } else {
        setUserData(null); // Utilisateur non authentifié
      }
    });

    return () => unsubscribe(); // Nettoyage de l'abonnement
  }, []);


  return (
    <div className="flex min-h-screen bg-gray-50 text-black">
      {/* Barre latérale */}
      <Sidebar
        selectedMenu={selectedMenu}
        onMenuSelect={setSelectedMenu}
        userData={userData}
      />

      {/* Afficher CommunityList ou ProfilePanel */}
      {selectedMenu === "profile" ? (
        <ProfilePanel />
      ) : (
        <CommunityList
          show={selectedMenu === "communaute"}
          selectedCommunity={selectedCommunity}
          onSelectCommunity={setSelectedCommunity}
          onCreateCommunity={handleCreateCommunity} // Passer la fonction ici
        />
      )}

      {/* Le MainView avec le formulaire de création */}
      <MainView
        selectedMenu={selectedMenu}
        selectedCommunity={selectedCommunity}
        isCreateCommunityOpen={isCreateCommunityOpen} 
        onCloseCreateCommunity={handleCloseCreateCommunity} 
      />
    </div>
  );
}