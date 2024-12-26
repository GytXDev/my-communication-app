// app/components/ProfilePanel.js
/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

import { auth, db, storage } from "@/lib/firebaseConfig"

// Icônes depuis lucide-react (ou React Icons)
import {
    Bell,
    HelpCircle,
    LogOut,
    Camera,
    Trash2,
    Edit,
    Loader2 // Spinner
} from "lucide-react"

// Emoji picker (v5 ou v6) : npm install emoji-mart @emoji-mart/data @emoji-mart/react
import { Picker } from 'emoji-mart'

// Exporte le composant principal
export default function ProfilePanel() {
    const router = useRouter()

    // États pour l'info utilisateur et le chargement
    const [loading, setLoading] = useState(true)
    const [userData, setUserData] = useState(null)

    // Édition du nom
    const [editingName, setEditingName] = useState(false)
    const [tempName, setTempName] = useState("")

    // Gestion du menu avatar (pour changer/supprimer la photo)
    const [showAvatarMenu, setShowAvatarMenu] = useState(false)
    const avatarMenuRef = useRef(null)

    // Référence vers l'input file caché (pour choisir une photo)
    const fileInputRef = useRef(null)

    // Indicateur d'action en cours (upload / save)
    const [isSaving, setIsSaving] = useState(false)

    // État pour afficher/masquer le Picker d’emojis
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    // Fermer le menu avatar si clic à l'extérieur
    useEffect(() => {
        function handleClickOutside(e) {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
                setShowAvatarMenu(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // Surveiller l'auth state + récupérer/créer doc Firestore
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid)
                const docSnap = await getDoc(docRef)

                if (docSnap.exists()) {
                    setUserData(docSnap.data())
                } else {
                    // Doc inexistant => création
                    const newUserData = {
                        displayName: user.displayName || "Utilisateur",
                        photoURL: user.photoURL || null,
                        createdAt: new Date().toISOString(),
                    }
                    await setDoc(docRef, newUserData)
                    setUserData(newUserData)
                }
            } else {
                setUserData(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Déconnexion
    const handleLogout = async () => {
        await signOut(auth)
        router.push("/login")
    }

    // Édition du Nom
    const handleEditName = () => {
        if (!userData) return
        setEditingName(true)
        setTempName(userData.displayName || "")
    }

    const handleSaveName = async () => {
        if (!userData) return
        setIsSaving(true)
        try {
            const docRef = doc(db, "users", auth.currentUser.uid)
            const updatedData = {
                ...userData,
                displayName: tempName || "Utilisateur",
            }
            // MAJ Firestore
            await setDoc(docRef, updatedData, { merge: true })
            // MAJ Auth
            await updateProfile(auth.currentUser, {
                displayName: tempName || "Utilisateur",
            })
            setUserData(updatedData)
            setEditingName(false)
        } finally {
            setIsSaving(false)
        }
    }

    // Menu avatar (changer/supprimer photo)
    const handleAvatarClick = () => {
        setShowAvatarMenu((prev) => !prev)
    }

    // Sélection d'un fichier (upload vers Storage)
    const handleChangePhoto = () => {
        fileInputRef.current.click()
    }

    const onFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        try {
            // Supprimer l'ancienne photo si elle existe
            if (userData?.photoURL) {
                const oldPhotoRef = ref(storage, userData.photoURL);
                await deleteObject(oldPhotoRef).catch((error) => {
                    console.warn("Erreur lors de la suppression de l'ancienne photo :", error.message);
                });
            }

            // Référence pour la nouvelle photo
            const newFileName = `profilePics/${auth.currentUser.uid}/${file.name}`;
            const storageRef = ref(storage, newFileName);

            // Téléverser la nouvelle photo
            await uploadBytes(storageRef, file);

            // Obtenir l'URL de la nouvelle photo
            const downloadURL = await getDownloadURL(storageRef);

            // Mettre à jour Firestore et Firebase Auth
            const docRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(docRef, { photoURL: downloadURL }, { merge: true });
            await updateProfile(auth.currentUser, { photoURL: downloadURL });

            // Mettre à jour l'état local
            setUserData((prev) => ({ ...prev, photoURL: downloadURL }));
            setShowAvatarMenu(false);
        } catch (error) {
            console.error("Erreur lors de l'upload de la nouvelle photo :", error.message);
        } finally {
            setIsSaving(false);
        }
    }

    const handleRemovePhoto = async () => {
        if (!userData?.photoURL) return;

        setIsSaving(true);
        try {
            // Supprimer la photo actuelle dans le Storage
            const photoRef = ref(storage, userData.photoURL);
            await deleteObject(photoRef).catch((error) => {
                console.warn("Erreur lors de la suppression de la photo :", error.message);
            });

            // Mettre à jour Firestore et Firebase Auth
            const docRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(docRef, { photoURL: null }, { merge: true });
            await updateProfile(auth.currentUser, { photoURL: null });

            // Mettre à jour l'état local
            setUserData((prev) => ({ ...prev, photoURL: null }));
            setShowAvatarMenu(false);
        } catch (error) {
            console.error("Erreur lors de la suppression de la photo :", error.message);
        } finally {
            setIsSaving(false);
        }
    }


    // === RENDER ===

    // 1) Shimmer effect si loading
    if (loading) {
        return (
            <div className="w-80 p-6 hidden md:block">
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    {/* Avatar skeleton */}
                    <div className="rounded-full bg-gray-200 h-32 w-32"></div>
                    {/* Nom skeleton */}
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    {/* 2-3 lignes */}
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
        )
    }

    // 2) Pas d'utilisateur
    if (!userData) {
        return (
            <div className="w-80 bg-white border-r border-gray-200 p-6 hidden md:block">
                <p className="text-gray-500">Aucun utilisateur connecté.</p>
            </div>
        )
    }

    // 3) Profil affiché
    return (
        <div className="w-80 bg-white border-r border-gray-200 p-6 hidden md:block relative">
            {/* Indicateur de sauvegarde */}
            {isSaving && (
                <div className="absolute top-2 right-2 text-gray-400 flex items-center gap-1">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">En cours...</span>
                </div>
            )}

            {/* Avatar + menu */}
            <div className="relative flex flex-col items-center mb-4">
                <img
                    onClick={handleAvatarClick}
                    src={userData.photoURL || "/images/avatar.jpeg"}
                    alt="User Avatar"
                    className="w-32 h-32 rounded-full object-cover mb-2 border border-gray-300 cursor-pointer"
                />

                {showAvatarMenu && (
                    <div
                        ref={avatarMenuRef}
                        className="absolute top-[140px] right-0 bg-white border border-gray-300 rounded shadow-md w-44 z-10"
                    >
                        <button
                            onClick={handleChangePhoto}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 w-full text-left"
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            <span>Changer photo</span>
                        </button>
                        <button
                            onClick={handleRemovePhoto}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span>Supprimer</span>
                        </button>
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={onFileChange}
                />
            </div>

            {/* Nom utilisateur + Emojis */}
            <div className="mb-4 text-center">
                {editingName ? (
                    <div className="flex flex-col items-center gap-2 justify-center mb-2 relative">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1"
                            />
                            {/* Bouton Emojis */}
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                className="bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded"
                            >
                                😀
                            </button>

                            {/* Bouton OK */}
                            <button
                                onClick={handleSaveName}
                                disabled={isSaving}
                                className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                <span>OK</span>
                            </button>
                        </div>

                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                            <div className="absolute top-full mt-2 bg-white border rounded shadow z-50">
                                <Picker
                                    set="apple"
                                    title="Choisir un émoji"
                                    onSelect={(emoji) => {
                                        // Insérer l’emoji dans tempName
                                        setTempName(tempName + emoji.native)
                                        setShowEmojiPicker(false)
                                    }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <h2 className="text-xl font-semibold">
                        {userData.displayName}
                        <button
                            onClick={handleEditName}
                            disabled={isSaving}
                            className="ml-2 text-blue-500 hover:underline align-middle text-sm"
                        >
                            <Edit className="inline-block w-4 h-4 mr-1" />
                            Éditer
                        </button>
                    </h2>
                )}
                <p className="text-xs text-gray-400 mt-1">
                    Ce nom sera visible par vos contacts.
                </p>
            </div>

            <hr className="mb-4" />

            {/* Bio / Description */}
            <div className="mb-4">
                <p className="text-sm text-gray-600">
                    {userData.description || "Aucune description pour le moment."}
                </p>
            </div>

            <hr className="mb-4" />

            {/* Menu Paramètres rapide */}
            <div className="space-y-2 mb-4">
                <button
                    onClick={() => alert("Gérer les notifications")}
                    disabled={isSaving}
                    className="flex items-center w-full px-3 py-2 rounded hover:bg-gray-100 text-left"
                >
                    <Bell className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">Notifications</span>
                </button>

                <button
                    onClick={() => alert("Centre d'aide")}
                    disabled={isSaving}
                    className="flex items-center w-full px-3 py-2 rounded hover:bg-gray-100 text-left"
                >
                    <HelpCircle className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">Aide</span>
                </button>
            </div>

            <hr className="my-4" />

            {/* Bouton Déconnexion */}
            <button
                onClick={handleLogout}
                disabled={isSaving}
                className="flex items-center w-full px-3 py-2 rounded text-red-600 hover:bg-red-100 text-left"
            >
                <LogOut className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Se déconnecter</span>
            </button>
        </div>
    )
}
