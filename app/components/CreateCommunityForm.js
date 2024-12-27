/* eslint-disable @next/next/no-img-element */
// app/components/CreateCommunityForm.js
"use client";

import React, { useState } from "react";
import { FaLock } from "react-icons/fa";
import axios from "axios";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebaseConfig";

export default function CreateCommunityForm({ onClose, onCreate }) {
    const [step, setStep] = useState(1);
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
    const [paymentData, setPaymentData] = useState({
        method: "Airtel Money",
        airtelNumber: "",
        cardDetails: {
            number: "",
            expiry: "",
            cvv: "",
        },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Gestion des changements dans les champs du formulaire
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith("permissions.")) {
            const permission = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [permission]: checked,
                },
            }));
        } else if (name === "tagInput") {
            setFormData((prev) => ({ ...prev, tagInput: value }));
        } else if (name === "image") {
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
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Ajouter un tag
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

    // Supprimer un tag
    const removeTag = (tagToRemove) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }));
    };

    // Gestion de la soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) {
            // Valider les champs du formulaire
            if (!formData.name || !formData.description) {
                setError("Veuillez remplir tous les champs obligatoires.");
                return;
            }
            // Passer à l'étape suivante (paiement)
            setStep(2);
            setError("");
        } else if (step === 2) {
            // Valider les informations de paiement
            if (paymentData.method === "Airtel Money" && !paymentData.airtelNumber) {
                setError("Veuillez entrer votre numéro Airtel Money.");
                return;
            }
            if (paymentData.method === "Carte Bancaire") {
                setError("Le paiement par Carte Bancaire est en attente de maintenance.");
                return;
            }
            // Implémenter la logique de paiement ici
            setLoading(true);
            try {
                if (paymentData.method === "Airtel Money") {
                    // Appeler l'API de paiement Airtel Money
                    const response = await axios.post("https://darkslateblue-marten-437171.hostingersite.com/", {
                        numero: paymentData.airtelNumber,
                        amount: 1000, // Montant fixe de 1000 CFA
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.data.status_message === "Transaction a ete effectue avec succes" ||
                        response.data.status_message === "Your transaction has been successfully processed") {
                        // Paiement réussi
                        // Téléverser l'image si elle existe
                        let imageUrl = "";
                        if (formData.image) {
                            const storageRef = ref(storage, `communities/${formData.image.name}-${Date.now()}`);
                            await uploadBytes(storageRef, formData.image);
                            imageUrl = await getDownloadURL(storageRef);
                        }

                        // Appeler la fonction onCreate avec les données du formulaire et l'URL de l'image
                        onCreate({ ...formData, image: imageUrl });
                        setLoading(false);
                    } else {
                        // Identifier le type de message
                        const messageType = identifyMessageType(response.data.status_message);
                        switch (messageType) {
                            case "InvalidPinLength":
                                setError("Longueur de PIN invalide.");
                                break;
                            case "InsufficientBalance":
                                setError("Solde insuffisant.");
                                break;
                            case "IncorrectPin":
                                setError("PIN incorrect.");
                                break;
                            case "CancelledTransaction":
                                setError("Transaction annulée avec succès.");
                                break;
                            case "UnableToGetTransactionStatus":
                                setError("Impossible d'obtenir le statut de la transaction. Veuillez réessayer.");
                                break;
                            default:
                                setError("Erreur inconnue lors du paiement.");
                        }
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Une erreur est survenue lors du paiement.");
                setLoading(false);
            }
        }
    };

    // Fonction pour identifier le type de message de réponse
    const identifyMessageType = (message) => {
        if (message.includes('invalid PIN length')) {
            return "InvalidPinLength";
        } else if (message.includes('Solde insuffisant')) {
            return "InsufficientBalance";
        } else if (message.includes('incorrect four digit PIN')) {
            return "IncorrectPin";
        } else if (message.includes('Transaction a ete effectue avec succes') ||
                   message.includes('Your transaction has been successfully processed')) {
            return "SuccessfulTransaction";
        } else if (message.includes('transaction a ete annulee avec succes')) {
            return "CancelledTransaction";
        } else if (message.includes('Impossible d\'obtenir le statut de la transaction après plusieurs tentatives')) {
            return "UnableToGetTransactionStatus";
        } else {
            return "Other";
        }
    };

    // Gestion de la sélection du mode de paiement
    const handlePaymentMethodChange = (e) => {
        setPaymentData((prev) => ({ ...prev, method: e.target.value }));
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Créer une communauté</h2>
            <p className="text-gray-600 text-center mb-8">
                Remplissez les informations nécessaires pour créer une nouvelle communauté.
            </p>

            <form onSubmit={handleSubmit}>
                {step === 1 && (
                    <>
                        {/* Nom de la communauté */}
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
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
                            {/* Liste des tags */}
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

                        {/* Type de communauté */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
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

                        {/* Image de profil */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Photo de profil</label>
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Permissions</label>
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
                                        checked={formData.permissions.canCreateSubCommunity}
                                        onChange={handleChange}
                                        className="form-checkbox h-5 w-5 text-purple-500"
                                    />
                                    <span>Créer des sous-communautés</span>
                                </label>
                            </div>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        {/* Méthode de paiement */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Méthode de paiement</label>
                            <select
                                name="paymentMethod"
                                value={paymentData.method}
                                onChange={handlePaymentMethodChange}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="Airtel Money">Airtel Money</option>
                                <option value="Carte Bancaire">Carte Bancaire</option>
                            </select>
                        </div>

                        {paymentData.method === "Airtel Money" && (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Numéro Airtel Money
                                </label>
                                <input
                                    type="text"
                                    name="airtelNumber"
                                    placeholder="Exemple: 074001209"
                                    value={paymentData.airtelNumber}
                                    onChange={(e) =>
                                        setPaymentData((prev) => ({
                                            ...prev,
                                            airtelNumber: e.target.value,
                                        }))
                                    }
                                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        )}

                        {paymentData.method === "Carte Bancaire" && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Numéro de carte
                                    </label>
                                    <input
                                        type="text"
                                        name="cardNumber"
                                        placeholder="1234 5678 9012 3456"
                                        value={paymentData.cardDetails.number}
                                        onChange={(e) =>
                                            setPaymentData((prev) => ({
                                                ...prev,
                                                cardDetails: {
                                                    ...prev.cardDetails,
                                                    number: e.target.value,
                                                },
                                            }))
                                        }
                                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="mb-4 flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Date d&apos;expiration
                                        </label>
                                        <input
                                            type="text"
                                            name="expiry"
                                            placeholder="MM/AA"
                                            value={paymentData.cardDetails.expiry}
                                            onChange={(e) =>
                                                setPaymentData((prev) => ({
                                                    ...prev,
                                                    cardDetails: {
                                                        ...prev.cardDetails,
                                                        expiry: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            CVV
                                        </label>
                                        <input
                                            type="text"
                                            name="cvv"
                                            placeholder="123"
                                            value={paymentData.cardDetails.cvv}
                                            onChange={(e) =>
                                                setPaymentData((prev) => ({
                                                    ...prev,
                                                    cardDetails: {
                                                        ...prev.cardDetails,
                                                        cvv: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {error && <p className="text-red-500 mb-4">{error}</p>}

                {/* Boutons */}
                <div className="flex justify-between items-center mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className={`bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition ${
                            loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={loading}
                    >
                        {loading ? "En cours..." : step === 1 ? "Suivant" : "Valider le paiement"}
                    </button>
                </div>
            </form>
        </div>
    );
}
