"use client";

import React, { useState } from "react";
import axios from "axios";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "@/lib/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { getIdToken } from "firebase/auth";

export default function CreateCommunityForm({ onClose, onCreate }) {
    const [user, loadingAuth, errorAuth] = useAuthState(auth);

    // Données du formulaire
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

    // État d'affichage de l'image
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /**
     * Gestion des changements dans les champs du formulaire
     */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Gestion des permissions
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

        // Gestion du champ de tags
        if (name === "tagInput") {
            setFormData((prev) => ({ ...prev, tagInput: value }));
            return;
        }

        // Gestion de l'image
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

        // Pour tout autre champ
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /**
     * Ajout d'un tag
     */
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

    /**
     * Suppression d'un tag
     */
    const removeTag = (tagToRemove) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }));
    };

    /**
     * Soumission du formulaire (sans logique de paiement)
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loadingAuth) {
            setError("Chargement de l'état d'authentification...");
            return;
        }

        if (!user) {
            setError("Utilisateur non authentifié.");
            return;
        }

        // Vérifier que les champs obligatoires sont remplis
        if (!formData.name || !formData.description) {
            setError("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Téléverser l'image si elle existe
            let imageUrl = "";
            if (formData.image) {
                try {
                    // Utiliser user.uid comme identifiant du "dossier" de la communauté
                    const storageRef = ref(
                        storage,
                        `communities/${user.uid}/${formData.image.name}-${Date.now()}`
                    );
                    await uploadBytes(storageRef, formData.image);
                    imageUrl = await getDownloadURL(storageRef);
                } catch (uploadError) {
                    console.error("Erreur lors du téléversement de l'image:", uploadError);
                    setError("Erreur lors du téléversement de l'image.");
                    setLoading(false);
                    return;
                }
            }

            // On passe les données du formulaire et l'URL de l'image au parent
            onCreate({ ...formData, image: imageUrl });
            setLoading(false);

        } catch (err) {
            console.error(err);
            setError("Une erreur est survenue lors de la création de la communauté.");
            setLoading(false);
        }
    };

    if (loadingAuth) {
        return <p>Chargement...</p>;
    }

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Créer une communauté</h2>
            <p className="text-gray-600 text-center mb-8">
                Remplissez les informations nécessaires pour créer une nouvelle communauté.
            </p>

            <form onSubmit={handleSubmit}>
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

                {/* Image de profil */}
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
                                checked={formData.permissions.canCreateSubCommunity}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-purple-500"
                            />
                            <span>Créer des sous-communautés</span>
                        </label>
                    </div>
                </div>

                {/* Affichage des erreurs éventuelles */}
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
                        className={`bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition ${loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        disabled={loading}
                    >
                        {loading ? "En cours..." : "Créer la communauté"}
                    </button>
                </div>
            </form>
        </div>
    );
}
