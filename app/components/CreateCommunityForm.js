// app/components/CreateCommunityForm.js
"use client";

import React, { useState } from "react";
import axios from "axios";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "@/lib/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-hot-toast";

export default function CreateCommunityForm({ onClose, onCreate }) {
    const [user, loadingAuth] = useAuthState(auth);

    // Étape du formulaire : 1 => infos, 2 => paiement
    const [step, setStep] = useState(1);

    // === ÉTAPE 1 : Données du formulaire ===
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        tags: [],
        tagInput: "",
        type: "public",
        image: null,
        permissions: {
            canPost: false,
            canComment: false,
            canCreateSubCommunity: false,
        },
    });
    const [imagePreview, setImagePreview] = useState(null);

    // === ÉTAPE 2 : Paiement ===
    const [paymentNumber, setPaymentNumber] = useState("");
    const [paymentAmount] = useState(100); // Montant fixe
    const [isPaying, setIsPaying] = useState(false);

    // --- Handlers étape 1 ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Permissions
        if (name.startsWith("permissions.")) {
            const permission = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [permission]: checked,
                },
            }));
            return;
        }

        // Tag input
        if (name === "tagInput") {
            setFormData((prev) => ({ ...prev, tagInput: value }));
            return;
        }

        // Image
        if (name === "image") {
            const file = e.target.files[0];
            setFormData((prev) => ({ ...prev, image: file }));
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setImagePreview(null);
            }
            return;
        }

        // Autres champs
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const addTag = () => {
        const tag = formData.tagInput.trim();
        if (tag && !formData.tags.includes(tag)) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tag],
                tagInput: "",
            }));
        }
    };

    const removeTag = (tag) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t) => t !== tag),
        }));
    };

    const handleSubmitStep1 = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.description) {
            toast.error("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        // Passer à l'étape 2 (paiement)
        setStep(2);
    };

    // --- Handlers étape 2 (paiement) ---
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        if (loadingAuth) {
            toast.error("Chargement de l'état d'authentification...");
            return;
        }
        if (!user) {
            toast.error("Utilisateur non authentifié.");
            return;
        }
        if (!paymentNumber) {
            toast.error("Veuillez saisir un numéro Airtel Money.");
            return;
        }

        setIsPaying(true);

        try {
            // 1) Appel API de paiement
            const response = await axios.post(
                "https://gaboncelebrityshowdown.com/api/payment0.php",
                {
                    phoneNumber: paymentNumber,
                    amount: paymentAmount,
                },
                { headers: { "Cache-Control": "no-cache" } }
            );

            const statusMsg = (response.data.status_message || "").toLowerCase();
            console.log("Réponse API paiement:", response.data);

            // 2) Vérifier si success
            if (
                statusMsg.includes("transaction a été effectuée avec succès") ||
                statusMsg.includes("transaction a ete effectue avec succes") ||
                statusMsg.includes("successfully processed")
            ) {
                // 3) upload image (si existe)
                let imageUrl = "";
                if (formData.image) {
                    try {
                        const storageRef = ref(
                            storage,
                            `communities/${user.uid}/${formData.image.name}-${Date.now()}`
                        );
                        await uploadBytes(storageRef, formData.image);
                        imageUrl = await getDownloadURL(storageRef);
                    } catch (uploadErr) {
                        console.error("Erreur upload image:", uploadErr);
                        toast.error("Erreur upload image.");
                        setIsPaying(false);
                        return;
                    }
                }

                // 4) OnCreate => passons tous les data
                onCreate({ ...formData, image: imageUrl });

                // 5) onClose => fermer le Form
                onClose();

                toast.success("Communauté créée avec succès !");
            } else {
                // Échec => message d’erreur
                toast.error("Échec du paiement : " + response.data.status_message);
            }
        } catch (err) {
            console.error("Erreur paiement:", err);
            toast.error("Erreur paiement : " + err);
        } finally {
            setIsPaying(false);
        }
    };

    if (loadingAuth) {
        return <p>Chargement Auth...</p>;
    }

    // --- Rendu final ---
    return (
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl mx-auto">
            {step === 1 && (
                <>
                    <h2 className="text-2xl font-bold text-center mb-6">
                        Créer une communauté
                    </h2>
                    <p className="text-gray-600 text-center mb-8">
                        Remplissez les informations nécessaires pour créer une nouvelle
                        communauté.
                    </p>
                    <form onSubmit={handleSubmitStep1}>
                        {/* Nom */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nom de la communauté
                            </label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Entrez le nom de votre communauté"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                placeholder="Ajoutez une description pour votre communauté"
                                rows="4"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            ></textarea>
                        </div>

                        {/* Tags */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tags
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    name="tagInput"
                                    placeholder="Ajouter un tag"
                                    value={formData.tagInput}
                                    onChange={handleChange}
                                    className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                                >
                                    Ajouter
                                </button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {formData.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="bg-gray-200 px-3 py-1 rounded-full text-sm flex items-center"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Type */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Type
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="public">Public</option>
                                <option value="private">Privé</option>
                            </select>
                        </div>

                        {/* Image */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Photo de profil
                            </label>
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            {imagePreview && (
                                <img
                                    src={imagePreview}
                                    alt="Prévisualisation"
                                    className="mt-4 w-32 h-32 object-cover rounded-full"
                                />
                            )}
                        </div>

                        {/* Permissions */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Permissions
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="permissions.canPost"
                                        checked={formData.permissions.canPost}
                                        onChange={handleChange}
                                        className="form-checkbox h-5 w-5 text-purple-500"
                                    />
                                    <span>Poster</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="permissions.canComment"
                                        checked={formData.permissions.canComment}
                                        onChange={handleChange}
                                        className="form-checkbox h-5 w-5 text-purple-500"
                                    />
                                    <span>Commenter</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="permissions.canCreateSubCommunity"
                                        checked={
                                            formData.permissions.canCreateSubCommunity
                                        }
                                        onChange={handleChange}
                                        className="form-checkbox h-5 w-5 text-purple-500"
                                    />
                                    <span>Créer sous-communautés</span>
                                </label>
                            </div>
                        </div>

                        {/* Boutons */}
                        <div className="flex justify-between items-center mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                            >
                                Étape suivante (paiement)
                            </button>
                        </div>
                    </form>
                </>
            )}

            {step === 2 && (
                <>
                    <h2 className="text-2xl font-bold text-center mb-6">
                        Paiement Airtel Money
                    </h2>
                    <p className="text-gray-600 text-center mb-8">
                        Veuillez renseigner votre numéro Airtel Money pour payer 100 CFA.
                    </p>
                    <form onSubmit={handlePaymentSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Numéro Airtel Money
                            </label>
                            <input
                                type="tel"
                                name="phoneAirtel"
                                placeholder="Ex : 077000000"
                                value={paymentNumber}
                                onChange={(e) => setPaymentNumber(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>

                        {/* Montant fixe */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Montant (CFA)
                            </label>
                            <input
                                type="number"
                                value={paymentAmount}
                                disabled
                                className="w-full p-3 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                        </div>

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
    );
}
