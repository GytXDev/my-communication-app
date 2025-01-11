// app/components/CommunityFiles.js
"use client";

import React, { useEffect, useState } from "react";
import {
    doc,
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { toast } from "react-hot-toast";
import { FaPlus, FaSearch, FaTrash, FaEdit, FaFolder } from "react-icons/fa";
import { getDocs } from "firebase/firestore";
import dayjs from "dayjs";
import MiniModal from "./MiniModal";

/**
 * @param {string} selectedCommunity
 * @param {string} userUid
 * @param {function} onOpenFolder - callback(folderId)
 * 
 * Affiche la liste de dossiers “racine” (où parentId=null). 
 * On peut créer, modifier, supprimer (si autorisé).
 * On affiche la date de création de chaque dossier (folder.createdAt).
 */
export default function CommunityFiles({
    selectedCommunity,
    userUid,
    onOpenFolder,
}) {
    const [communityData, setCommunityData] = useState(null);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [accessType, setAccessType] = useState("everyone");
    const [searchText, setSearchText] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);

    const [editingFolder, setEditingFolder] = useState(null);

    // Gérer la mini-modal pour la suppression
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);

    // Liste complète de users (pour “selectedMembers”)
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        // Charger tous les utilisateurs depuis Firestore
        getDocs(collection(db, "users")).then((snap) => {
            const arr = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
            setAllUsers(arr);
        });
    }, []);

    // Filtrer les allUsers pour la recherche
    const filteredUsers = allUsers.filter((u) =>
        (u.displayName || u.uid).toLowerCase().includes(searchText.toLowerCase())
    );

    // Charger la communauté et ses folders
    useEffect(() => {
        if (!selectedCommunity) {
            setCommunityData(null);
            setFolders([]);
            return;
        }
        // Charger la communauté
        const docRef = doc(db, "communities", selectedCommunity);
        const unsubComm = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                setCommunityData({ id: snap.id, ...snap.data() });
            } else {
                setCommunityData(null);
            }
        });

        // Charger les folders
        const foldersRef = collection(db, "communities", selectedCommunity, "folders");
        const unsubFolders = onSnapshot(foldersRef, (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setFolders(list);
            setLoading(false);
        });

        return () => {
            unsubComm();
            unsubFolders();
        };
    }, [selectedCommunity]);

    if (!selectedCommunity) {
        return <div className="text-gray-400">Aucune communauté sélectionnée.</div>;
    }
    if (loading) {
        return <div className="text-gray-400">Chargement des dossiers...</div>;
    }
    if (!communityData) {
        return <div className="text-gray-400">Communauté introuvable.</div>;
    }

    // Seul le créateur ou “selectedMembers” peuvent modifier
    const isCreator = communityData.createdBy === userUid;

    // Filtrer => dossiers racine
    const rootFolders = folders.filter((f) => !f.parentId);

    // Création d’un dossier
    const handleCreateFolder = async () => {
        if (!folderName.trim()) {
            toast.error("Le nom de dossier est vide");
            return;
        }
        try {
            const foldersRef = collection(db, "communities", selectedCommunity, "folders");
            const newFolderDoc = {
                name: folderName.trim(),
                createdAt: serverTimestamp(),
                createdBy: userUid,
                parentId: null,
            };
            if (accessType === "everyone") {
                newFolderDoc.access = "everyone";
                newFolderDoc.members = [];
            } else {
                newFolderDoc.access = "selected";
                newFolderDoc.members = selectedMembers.map((m) => m.uid);
            }
            const result = await addDoc(foldersRef, newFolderDoc);
            // doc ID => result.id

            // Message dans la communauté si tout le monde y a accès
            if (accessType === "everyone") {
                const msgRef = collection(db, "communities", selectedCommunity, "messages");
                await addDoc(msgRef, {
                    type: "text",
                    content: `Dossier “${folderName.trim()}” créé et accessible à tous.`,
                    senderId: userUid,
                    senderName: "System",
                    senderPhoto: "",
                    createdAt: serverTimestamp(),
                });
            }

            toast.success("Dossier créé avec succès !");
            setShowCreateFolder(false);
            setFolderName("");
            setAccessType("everyone");
            setSelectedMembers([]);
        } catch (err) {
            console.error("Err creation folder:", err);
            toast.error("Impossible de créer le dossier.");
        }
    };

    // Supprimer un dossier => mini modal
    const askDeleteFolder = (folder) => {
        setFolderToDelete(folder);
        setShowDeleteModal(true);
    };
    const confirmDeleteFolder = async () => {
        if (!folderToDelete) return;
        try {
            await deleteDoc(doc(db, "communities", selectedCommunity, "folders", folderToDelete.id));
            toast.success("Dossier supprimé !");
        } catch (err) {
            console.error("Err suppr folder:", err);
            toast.error("Impossible de supprimer le dossier.");
        }
        setFolderToDelete(null);
        setShowDeleteModal(false);
    };
    const cancelDeleteFolder = () => {
        setFolderToDelete(null);
        setShowDeleteModal(false);
    };

    // Modifier l’accès d’un dossier
    const handleEditFolder = (folder) => {
        setEditingFolder(folder);
        setFolderName(folder.name);

        if (folder.access === "everyone") {
            setAccessType("everyone");
            setSelectedMembers([]);
        } else {
            setAccessType("selected");
            const m = allUsers.filter((u) => folder.members?.includes(u.uid));
            setSelectedMembers(m);
        }
        setShowCreateFolder(false);
    };
    const handleSaveFolder = async () => {
        if (!editingFolder) return;
        try {
            const folderRef = doc(db, "communities", selectedCommunity, "folders", editingFolder.id);
            const updateData = {
                name: folderName.trim()
            };
            if (accessType === "everyone") {
                updateData.access = "everyone";
                updateData.members = [];
            } else {
                updateData.access = "selected";
                updateData.members = selectedMembers.map((m) => m.uid);
            }
            await updateDoc(folderRef, updateData);
            toast.success("Dossier mis à jour !");
            setEditingFolder(null);
            setFolderName("");
            setAccessType("everyone");
            setSelectedMembers([]);
        } catch (err) {
            console.error("Err update folder:", err);
            toast.error("Impossible de modifier le dossier.");
        }
    };

    // Toggle un user dans la liste selectedMembers
    const toggleMember = (userObj) => {
        if (selectedMembers.some((m) => m.uid === userObj.uid)) {
            setSelectedMembers(selectedMembers.filter((m) => m.uid !== userObj.uid));
        } else {
            setSelectedMembers([...selectedMembers, userObj]);
        }
    };

    const handleOpenFolder = (fid) => {
        onOpenFolder(fid);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Entête “Windows Explorer style” */}
            <header className="flex items-center justify-between p-3 bg-gray-100 border-b">
                <div>
                    <h2 className="text-xl font-bold mb-1">{communityData.name}</h2>
                    <p className="text-sm text-gray-500">Dossiers & fichiers (racine)</p>
                </div>
                <div>
                    {communityData.image && (
                        <img
                            src={communityData.image}
                            alt={communityData.name}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    )}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
                {rootFolders.length === 0 ? (
                    <p className="mb-4 text-gray-600">
                        Aucun dossier n’a encore été créé.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {rootFolders.map((folder) => {
                            const canEdit =
                                folder.createdBy === userUid ||
                                (folder.members && folder.members.includes(userUid));

                            // On formate la date de création (folder.createdAt)
                            let createdDate = "";
                            if (folder.createdAt?.toDate) {
                                createdDate = dayjs(folder.createdAt.toDate()).format("DD/MM/YYYY HH:mm");
                            }

                            return (
                                <div
                                    key={folder.id}
                                    className="bg-white border rounded p-3 shadow-sm flex flex-col hover:shadow-md transition"
                                >
                                    <div className="flex items-center mb-2">
                                        <FaFolder className="text-gray-400 mr-2" size={28} />
                                        <span className="font-semibold text-gray-700">{folder.name}</span>
                                    </div>
                                    {/* Date de création */}
                                    {createdDate && (
                                        <p className="text-xs text-gray-400 mb-2">
                                            Créé le {createdDate}
                                        </p>
                                    )}

                                    <p className="text-sm text-gray-500 mb-2">
                                        {folder.access === "everyone"
                                            ? "Accès: Tout le monde"
                                            : `Accès: ${folder.members?.length} membre(s)`}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between">
                                        <button
                                            onClick={() => handleOpenFolder(folder.id)}
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            Ouvrir
                                        </button>
                                        {canEdit && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditFolder(folder)}
                                                    className="text-blue-500 hover:text-blue-800"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => askDeleteFolder(folder)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Créer un nouveau dossier */}
                {isCreator && !editingFolder && (
                    <button
                        onClick={() => {
                            setShowCreateFolder(!showCreateFolder);
                            setFolderName("");
                            setAccessType("everyone");
                            setSelectedMembers([]);
                        }}
                        className="flex items-center bg-blue-600 text-white px-3 py-2 rounded shadow hover:bg-blue-700 mt-4"
                    >
                        <FaPlus className="mr-2" />
                        Nouveau dossier
                    </button>
                )}

                {/* Formulaire de création / modification */}
                {(showCreateFolder || editingFolder) && (
                    <div className="mt-4 p-3 border rounded bg-gray-50">
                        <div className="mb-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Nom du dossier
                            </label>
                            <input
                                type="text"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none"
                            />
                        </div>

                        <div className="mb-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Accès
                            </label>
                            <select
                                value={accessType}
                                onChange={(e) => setAccessType(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="everyone">Tout le monde</option>
                                <option value="selected">Membres sélectionnés</option>
                            </select>
                        </div>

                        {accessType === "selected" && (
                            <div className="border p-2 rounded mb-2">
                                <div className="flex items-center mb-2 gap-2">
                                    <FaSearch className="text-gray-400" />
                                    <input
                                        type="text"
                                        className="flex-1 border border-gray-300 rounded px-2 py-1"
                                        placeholder="Rechercher un membre..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />
                                </div>
                                <div className="max-h-32 overflow-y-auto">
                                    {filteredUsers.length === 0 ? (
                                        <p className="text-sm text-gray-400">Aucun membre trouvé</p>
                                    ) : (
                                        filteredUsers.map((u) => (
                                            <label
                                                key={u.uid}
                                                className="flex items-center gap-2 mb-1 text-sm cursor-pointer hover:bg-gray-100 px-1 py-1 rounded transition"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMembers.some((m) => m.uid === u.uid)}
                                                    onChange={() => {
                                                        if (selectedMembers.some((m) => m.uid === u.uid)) {
                                                            setSelectedMembers(selectedMembers.filter((m) => m.uid !== u.uid));
                                                        } else {
                                                            setSelectedMembers([...selectedMembers, u]);
                                                        }
                                                    }}
                                                />
                                                <span>{u.displayName || u.uid}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => {
                                    setEditingFolder(null);
                                    setShowCreateFolder(false);
                                    setFolderName("");
                                    setAccessType("everyone");
                                    setSelectedMembers([]);
                                }}
                                className="px-3 py-1 border rounded text-sm"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={editingFolder ? handleSaveFolder : handleCreateFolder}
                                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                            >
                                {editingFolder ? "Enregistrer" : "Créer"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mini modal de suppression */}
            {showDeleteModal && folderToDelete && (
                <MiniModal
                    title="Supprimer le dossier"
                    message={`Voulez-vous vraiment supprimer le dossier "${folderToDelete.name}" ?`}
                    onConfirm={confirmDeleteFolder}
                    onCancel={cancelDeleteFolder}
                />
            )}
        </div>
    );
}
