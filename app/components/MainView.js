/* app/components/MainView.js */
"use client";

import React from "react";
import { FaLock } from "react-icons/fa";
import CreateCommunityForm from "./CreateCommunityForm"; // Importer le nouveau composant
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function MainView({
  selectedMenu,
  selectedCommunity,
  isCreateCommunityOpen,
  onCloseCreateCommunity,
  userUid, // Assurez-vous de passer l'UID de l'utilisateur authentifié
}) {
  const handleCreateCommunity = async (formData) => {
    try {
      // Ajouter la communauté à Firestore avec l'URL de l'image déjà téléversée
      const communityRef = await addDoc(collection(db, "communities"), {
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
        type: formData.type,
        image: formData.image, // Utiliser l'URL de l'image
        memberCount: 0,
        members: [],
        subCommunities: [],
        permissions: {
          canPost: formData.permissions.canPost ? ["admin"] : [],
          canComment: formData.permissions.canComment ? ["all"] : [],
          canCreateSubCommunity: formData.permissions.canCreateSubCommunity ? ["admin"] : [],
        },
        createdBy: userUid, // Utiliser l'UID réel de l'utilisateur
        status: "active",
        createdAt: serverTimestamp(),
      });

      // Fermer le formulaire de création
      onCloseCreateCommunity();
      alert("Communauté créée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la création de la communauté:", error);
      alert("Une erreur est survenue lors de la création de la communauté.");
    }
  };

  return (
    <div className="flex-1 p-4 relative">
      {/* S’il s’agit de l’onglet Communauté */}
      {selectedMenu === "communaute" && (
        <>
          {isCreateCommunityOpen ? (
            <CreateCommunityForm
              onClose={onCloseCreateCommunity}
              onCreate={handleCreateCommunity}
            />
          ) : selectedCommunity ? (
            <div>
              <h2 className="text-xl font-bold mb-2">
                Communauté #{selectedCommunity}
              </h2>
              <p>
                Contenu, posts, discussions… pour la communauté {selectedCommunity}.
              </p>
            </div>
          ) : (
            <div className="text-gray-500 flex flex-col items-center justify-center h-full">
              {/* Illustration : deux blocs left / right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                {/* Bloc de gauche */}
                <div className="bg-white rounded-md shadow p-6 text-black">
                  <h3 className="text-lg font-semibold mb-2">
                    Créez ou rejoignez une communauté
                  </h3>
                  <p className="text-sm">
                    Vous pouvez partager vos connaissances, poser des questions
                    et échanger avec des membres passionnés.
                  </p>
                </div>

                {/* Bloc de droite */}
                <div className="bg-white rounded-md shadow p-6 text-black">
                  <h3 className="text-lg font-semibold mb-2">
                    Personnalisez vos espaces
                  </h3>
                  <p className="text-sm">
                    Gérez vos préférences, ajoutez des catégories,
                    et organisez votre contenu selon vos besoins.
                  </p>
                </div>
              </div>

              {/* Icône + texte (sécurité / communauté) en dessous */}
              <div className="flex flex-col items-center mt-10">
                <FaLock className="text-gray-400 w-10 h-6" />
                <p className="text-gray-600 mt-2 text-center max-w-md">
                  Vos échanges sont sécurisés et protégés.
                  Nous veillons à ce que chaque communauté reste
                  un espace de confiance et de partage.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* S’il s’agit de l’onglet Messages */}
      {selectedMenu === "messages" && (
        <div className="text-gray-500 flex items-center justify-center h-full">
          <p>Ici s’afficheront vos messages (ou un composant de chat).</p>
        </div>
      )}

      {/* Vous pouvez ajouter d’autres conditions si vous avez plus de menus */}
    </div>
  );
}
