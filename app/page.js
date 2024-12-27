"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import CommunityList from "./components/CommunityList";
import ProfilePanel from "./components/ProfilePanel";
import MainView from "./components/MainView";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedMenu, setSelectedMenu] = useState("communaute");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [isCreateCommunityOpen, setCreateCommunityOpen] = useState(false);

  const handleCloseCreateCommunity = () => {
    setCreateCommunityOpen(false); // Désactiver le mode création
  };

  const handleCreateCommunity = () => {
    setCreateCommunityOpen(true);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login"); // Rediriger si non authentifié
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-black">
      {/* Barre latérale */}
      <Sidebar
        selectedMenu={selectedMenu}
        onMenuSelect={setSelectedMenu}
        userData={user}
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
