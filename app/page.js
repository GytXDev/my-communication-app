"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import CommunityList from "./components/CommunityList";
import ProfilePanel from "./components/ProfilePanel";
import MainView from "./components/MainView";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [communities, setCommunities] = useState([]);

  const [selectedMenu, setSelectedMenu] = useState("communaute");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [isCreateCommunityOpen, setCreateCommunityOpen] = useState(false);

  const handleCloseCreateCommunity = () => {
    setCreateCommunityOpen(false);
  };

  const handleCreateCommunity = () => {
    setCreateCommunityOpen(true);
  };

  const handleCommunityCreated = (newCommunity) => {
    setCommunities((prev) => [...prev, newCommunity]);
  };

  // Fonction pour accéder à l'espace fichiers
  function handleOpenFiles() {
    setSelectedMenu("files");
  }

  // Redirection si non authentifié
  useEffect(() => {
    console.log("HomePage -> user:", user);
    console.log("HomePage -> loading:", loading);
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Pendant le chargement ou s'il n'y a pas (encore) d'utilisateur, on n'affiche rien
  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-black">
      {/* Barre latérale */}
      <Sidebar
        selectedMenu={selectedMenu}
        onMenuSelect={setSelectedMenu}
        userData={user}
      />

      {/* Affichage de ProfilePanel ou de la liste des communautés */}
      {selectedMenu === "profile" ? (
        <ProfilePanel />
      ) : (
        <CommunityList
          communities={communities}
          show={selectedMenu === "communaute"}
          selectedCommunity={selectedCommunity}
          onSelectCommunity={setSelectedCommunity}
          onCreateCommunity={handleCreateCommunity}
        />
      )}

      {/* MainView */}
      <MainView
        selectedMenu={selectedMenu}
        selectedCommunity={selectedCommunity}
        isCreateCommunityOpen={isCreateCommunityOpen}
        onCloseCreateCommunity={handleCloseCreateCommunity}
        onCommunityCreated={handleCommunityCreated}
        onOpenFiles={handleOpenFiles}
        userUid={user.uid}
      />
    </div>
  );
}
