// app/components/MainView.js
"use client";

import React from "react";
import { FaLock } from "react-icons/fa";

export default function MainView({ selectedMenu, selectedCommunity, isCreateCommunityOpen, onCloseCreateCommunity }) {
    return (
        <div className="flex-1 p-4 relative">
            {/* S’il s’agit de l’onglet Communauté */}
            {selectedMenu === "communaute" && (
                <>
                    {isCreateCommunityOpen ? (
                        <div className="text-center">
                            <h2 className="text-xl font-bold mb-4">Créer une communauté</h2>
                            <p>Remplissez les informations nécessaires pour créer une nouvelle communauté.</p>
                            <button
                                onClick={onCloseCreateCommunity}
                                className="mt-4 bg-gray-300 px-4 py-2 rounded-md"
                            >
                                Annuler
                            </button>
                        </div>
                    ) : selectedCommunity ? (
                        <div>
                            <h2 className="text-xl font-bold mb-2">
                                Communauté #{selectedCommunity}
                            </h2>
                            <p>Contenu, posts, discussions… pour la communauté {selectedCommunity}.</p>
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
