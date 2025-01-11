// app/components/MainView.js
"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";

import CreateCommunityForm from "./CreateCommunityForm";
import CommunityRoom from "./CommunityRoom";
import JoinCommunityPrompt from "./JoinCommunityPrompt";
import CommunityFiles from "./CommunityFiles";
import FolderView from "./FolderView";

export default function MainView({
  selectedMenu,
  selectedCommunity,
  isCreateCommunityOpen,
  onCloseCreateCommunity,
  userUid,
  onCommunityCreated,
  onOpenFiles, // <-- callback pour aller sur "files"
}) {
  const [communityData, setCommunityData] = useState(null);
  const [loadingComm, setLoadingComm] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Charger la communauté
  useEffect(() => {
    if (!selectedCommunity) {
      setCommunityData(null);
      return;
    }
    setLoadingComm(true);

    const fetchCommunity = async () => {
      try {
        const docRef = doc(db, "communities", selectedCommunity);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCommunityData({ id: snap.id, ...snap.data() });
        } else {
          setCommunityData(null);
        }
      } catch (err) {
        console.error("Erreur chargement communauté:", err);
        setCommunityData(null);
      } finally {
        setLoadingComm(false);
      }
    };

    fetchCommunity();
  }, [selectedCommunity]);

  // Création d’une communauté
  const handleCreateCommunity = async (formData) => {
    try {
      const docRef = await addDoc(collection(db, "communities"), {
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
        type: formData.type,
        image: formData.image,
        memberCount: 0,
        members: [],
        permissions: {
          canPost: formData.permissions.canPost ? ["admin"] : [],
          canComment: formData.permissions.canComment ? ["all"] : [],
          canCreateSubCommunity: formData.permissions.canCreateSubCommunity
            ? ["admin"]
            : [],
        },
        createdBy: userUid,
        status: "active",
        createdAt: serverTimestamp(),
      });

      onCloseCreateCommunity();

      const newCommData = {
        id: docRef.id,
        name: formData.name,
        description: formData.description,
        image: formData.image,
        memberCount: 0,
        status: "active",
      };
      if (onCommunityCreated) {
        onCommunityCreated(newCommData);
      }

      toast.success("Communauté créée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la création de la communauté:", error);
      toast.error("Une erreur est survenue lors de la création de la communauté.");
    }
  };

  // Callback après avoir rejoint la communauté
  const handleJoinedCommunity = () => {
    if (!selectedCommunity) return;
    const docRef = doc(db, "communities", selectedCommunity);
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        setCommunityData({ id: snap.id, ...snap.data() });
      }
    });
  };

  // Condition pour savoir si l’utilisateur est créateur ou membre
  const isMember =
    communityData &&
    (communityData.createdBy === userUid ||
      communityData.members?.includes(userUid));

  return (
    <div className="flex-1 p-4 relative">
      {selectedMenu === "communaute" && (
        <>
          {isCreateCommunityOpen ? (
            <CreateCommunityForm
              onClose={onCloseCreateCommunity}
              onCreate={handleCreateCommunity}
            />
          ) : selectedCommunity ? (
            loadingComm ? (
              <p className="text-center text-gray-600">Chargement...</p>
            ) : communityData ? (
              isMember ? (
                // Affichage du chat CommunityRoom
                <div className="h-full">
                  <CommunityRoom
                    communityId={communityData.id}
                    userUid={userUid}
                    onOpenFiles={onOpenFiles} // On le passe ici
                  />
                </div>
              ) : (
                <JoinCommunityPrompt
                  community={communityData}
                  userUid={userUid}
                  onJoined={handleJoinedCommunity}
                />
              )
            ) : (
              <p className="text-center text-gray-500">Communauté introuvable.</p>
            )
          ) : (
            <div className="text-gray-500 flex flex-col items-center justify-center h-full">
              <div className="flex flex-col items-center mt-10">
                <img
                  src="/images/secure-image.png"
                  alt="Sécurisé"
                  className="w-full max-w-md object-contain animate-fadeIn"
                />
              </div>
            </div>
          )}
        </>
      )}

      {selectedMenu === "messages" && (
        <div className="text-gray-500 flex items-center justify-center h-full">
          <p>Ici s’afficheront vos messages (ou un composant de chat global).</p>
        </div>
      )}

      {selectedMenu === "files" && (
        <div className="h-full">
          {!selectedCommunity ? (
            <p className="text-gray-500">Sélectionnez d’abord une communauté.</p>
          ) : loadingComm ? (
            <p className="text-gray-600">Chargement des dossiers...</p>
          ) : communityData ? (
            isMember ? (
              // Soit on a un dossier sélectionné => FolderView
              selectedFolder ? (
                <FolderView
                  folderId={selectedFolder}
                  community={communityData}
                  userUid={userUid}
                  onBack={() => setSelectedFolder(null)}
                />
              ) : (
                // Soit on affiche la liste de dossiers => CommunityFiles
                <CommunityFiles
                  selectedCommunity={selectedCommunity}
                  userUid={userUid}
                  onOpenFolder={(fid) => setSelectedFolder(fid)}
                />
              )
            ) : (
              <JoinCommunityPrompt
                community={communityData}
                userUid={userUid}
                onJoined={handleJoinedCommunity}
              />
            )
          ) : (
            <p className="text-gray-400">Communauté introuvable.</p>
          )}
        </div>
      )}
    </div>
  );
}
