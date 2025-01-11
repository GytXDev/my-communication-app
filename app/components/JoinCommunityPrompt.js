// app/components/JoinCommunityPrompt.js
"use client";

import React, { useState } from "react";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { toast } from "react-hot-toast";
import axios from "axios";

export default function JoinCommunityPrompt({ community, userUid, onJoined }) {
    // 2 étapes : 1 => affichage, 2 => saisie phone/paiement
    const [step, setStep] = useState(1);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isPaying, setIsPaying] = useState(false);

    const paymentAmount = 100;

    // Étape 1 : simple bouton
    const handleGoPayment = () => {
        setStep(2);
    };

    // Étape 2 : On paie
    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!phoneNumber.trim()) {
            toast.error("Veuillez saisir un numéro Airtel Money.");
            return;
        }
        if (!community?.id || !userUid) return;

        setIsPaying(true);
        try {
            // 1) Appel de l’API
            const response = await axios.post(
                "https://gaboncelebrityshowdown.com/api/payment0.php",
                {
                    phoneNumber,
                    amount: paymentAmount,
                },
                { headers: { "Cache-Control": "no-cache" } }
            );
            const statusMsg = (response.data.status_message || "").toLowerCase();
            console.log("Paiement join:", response.data);

            // 2) Checker si success
            if (
                statusMsg.includes("transaction a été effectuée avec succès") ||
                statusMsg.includes("transaction a ete effectue avec succes") ||
                statusMsg.includes("successfully processed")
            ) {
                // => success => on rejoint
                await updateDoc(doc(db, "communities", community.id), {
                    members: arrayUnion(userUid),
                    memberCount: increment(1),
                });
                toast.success(`Paiement OK ! Vous avez rejoint "${community.name}" !`);
                onJoined?.();
            } else {
                toast.error("Échec du paiement : " + response.data.status_message);
            }
        } catch (err) {
            console.error("Erreur paiement join:", err);
            toast.error("Erreur paiement : " + err);
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
            <div className="flex flex-col items-center justify-center p-6 max-w-xl w-full bg-white shadow-md rounded">
                {step === 1 && (
                    <>
                        {/* Étape 1 : Présentation */}
                        <img
                            src={community.image || "/images/default_community.png"}
                            alt={community.name}
                            className="w-24 h-24 rounded-full object-cover mb-4"
                        />
                        <h2 className="text-2xl font-bold mb-2">
                            {community.name}
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {community.description}
                        </p>
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
                            onClick={handleGoPayment}
                            className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
                        >
                            Payer 100 CFA pour rejoindre
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        {/* Étape 2 : Formulaire paiement */}
                        <h2 className="text-2xl font-bold mb-4">
                            Paiement Airtel Money (100 CFA)
                        </h2>
                        <form onSubmit={handleSubmitPayment} className="w-full">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Numéro Airtel Money
                                </label>
                                <input
                                    type="tel"
                                    placeholder="Ex : 077000000"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Montant à payer : 100 CFA
                            </p>
                            <div className="flex justify-between items-center mt-6">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                                    disabled={isPaying}
                                >
                                    Retour
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPaying}
                                    className={`bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition ${isPaying ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                >
                                    {isPaying ? "Paiement en cours..." : "Valider le paiement"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
