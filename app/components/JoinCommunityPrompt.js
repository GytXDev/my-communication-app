// app/components/JoinCommunityPrompt.js
"use client";

import React from "react";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { toast } from "react-hot-toast"; 

export default function JoinCommunityPrompt({ community, userUid, onJoined }) {
    // community = { id, name, image, description, tags, memberCount, members, ... }
    // userUid = l'UID de l’utilisateur courant
    // onJoined = callback vers le parent pour signaler qu'on a rejoint

    const handleJoin = async () => {
        if (!community?.id || !userUid) return;

        try {
            const communityRef = doc(db, "communities", community.id);
            await updateDoc(communityRef, {
                members: arrayUnion(userUid),
                memberCount: increment(1),
            });

            // Notification de succès
            toast.success(`Vous avez rejoint la communauté "${community.name}" avec succès !`);

            // Notifie le parent qu'on a rejoint
            onJoined?.();
        } catch (error) {
            console.error("Erreur lors de la jonction à la communauté:", error);
            toast.error("Impossible de rejoindre la communauté.");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="flex flex-col items-center justify-center p-6 max-w-xl w-full bg-white shadow-md rounded">
                {/* Image + Nom de la communauté */}
                <img
                    src={community.image || "/images/default_community.png"}
                    alt={community.name}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                />
                <h2 className="text-2xl font-bold mb-2">{community.name}</h2>
                <p className="text-gray-600 mb-4">{community.description}</p>

                {/* Affichage des tags (s’il y en a) */}
                {community.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {community.tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1 bg-gray-200 text-sm rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                <p className="text-gray-500 mb-6">
                    Membre(s) : {community.memberCount || 0}
                </p>

                <button
                    onClick={handleJoin}
                    className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
                >
                    Rejoindre la communauté
                </button>
            </div>
        </div>
    );

}
