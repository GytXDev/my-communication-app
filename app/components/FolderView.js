"use client";

import React, { useEffect, useState } from "react";
import {
    doc,
    collection,
    onSnapshot,
    addDoc,
    serverTimestamp,
    deleteDoc
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { db, storage } from "@/lib/firebaseConfig";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { FaArrowLeft, FaUpload, FaTrash, FaFolder } from "react-icons/fa";
import MiniModal from "./MiniModal";

/**
 * @param {string} folderId - dossier courant
 * @param {Object} community
 * @param {string} userUid
 * @param {function} onBack
 *
 * On y affiche:
 *  - Sous-dossiers => parentId = folderId
 *  - Fichiers => collection "files"
 * On affiche aussi date de création (createdAt).
 */
export default function FolderView({ folderId, community, userUid, onBack }) {
    const [folderData, setFolderData] = useState(null);
    const [subFolders, setSubFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [fileToUpload, setFileToUpload] = useState(null);

    // Pour la suppression d’un fichier
    const [fileToDelete, setFileToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Pour création de sous-dossier
    const [showCreateSubfolder, setShowCreateSubfolder] = useState(false);
    const [subfolderName, setSubfolderName] = useState("");

    useEffect(() => {
        if (!folderId || !community) return;

        // Charger la data du folder
        const folderRef = doc(db, "communities", community.id, "folders", folderId);
        const unsubFolder = onSnapshot(folderRef, (snap) => {
            if (snap.exists()) {
                setFolderData({ id: snap.id, ...snap.data() });
            } else {
                setFolderData(null);
            }
            setLoading(false);
        });

        // Sous-dossiers
        const subfoldersRef = collection(db, "communities", community.id, "folders");
        const unsubSub = onSnapshot(subfoldersRef, (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const children = list.filter((f) => f.parentId === folderId);
            setSubFolders(children);
        });

        // Fichiers
        const filesRef = collection(db, "communities", community.id, "folders", folderId, "files");
        const unsubFiles = onSnapshot(filesRef, (snap) => {
            const fl = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setFiles(fl);
        });

        return () => {
            unsubFolder();
            unsubSub();
            unsubFiles();
        };
    }, [folderId, community]);

    if (!folderId || !community) {
        return <p className="text-gray-400">Dossier introuvable.</p>;
    }
    if (loading) {
        return <p className="text-gray-400">Chargement du dossier...</p>;
    }
    if (!folderData) {
        return <p className="text-gray-400">Ce dossier n’existe pas ou a été supprimé.</p>;
    }

    // Vérifier accès
    let hasAccess = false;
    if (folderData.access === "everyone") {
        hasAccess = true;
    } else if (folderData.members?.includes(userUid)) {
        hasAccess = true;
    }
    // On peut affiner (ex: le créateur, un admin, etc.)

    const handleChooseFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFileToUpload(f);
    };

    const handleUploadFile = async () => {
        if (!fileToUpload) return;
        if (!hasAccess) {
            toast.error("Vous n’avez pas accès à l’upload.");
            return;
        }
        try {
            const filePath = `communities/${community.id}/folders/${folderId}/${Date.now()}-${fileToUpload.name}`;
            const r = ref(storage, filePath);
            await uploadBytes(r, fileToUpload);
            const dlUrl = await getDownloadURL(r);

            // Ajouter doc
            const filesRef = collection(db, "communities", community.id, "folders", folderId, "files");
            await addDoc(filesRef, {
                name: fileToUpload.name,
                url: dlUrl,
                storagePath: filePath,
                createdAt: serverTimestamp(),
                createdBy: userUid,
            });
            toast.success("Fichier uploadé !");
            setFileToUpload(null);
        } catch (err) {
            console.error("Err upload file:", err);
            toast.error("Échec d’upload.");
        }
    };

    // Supprimer un fichier => mini modal
    const askDeleteFile = (f) => {
        setFileToDelete(f);
        setShowDeleteModal(true);
    };
    const confirmDeleteFile = async () => {
        if (!fileToDelete) return;
        try {
            if (fileToDelete.storagePath) {
                const sr = ref(storage, fileToDelete.storagePath);
                await deleteObject(sr).catch((err) => console.warn(err));
            }
            await deleteDoc(
                doc(db, "communities", community.id, "folders", folderId, "files", fileToDelete.id)
            );
            toast.success("Fichier supprimé.");
        } catch (err) {
            console.error("Err suppr fichier:", err);
            toast.error("Impossible de supprimer.");
        }
        setFileToDelete(null);
        setShowDeleteModal(false);
    };
    const cancelDeleteFile = () => {
        setFileToDelete(null);
        setShowDeleteModal(false);
    };

    // Créer un sous-dossier
    const handleCreateSubfolder = async () => {
        if (!subfolderName.trim()) {
            toast.error("Nom du sous-dossier vide.");
            return;
        }
        try {
            const folderRef = collection(db, "communities", community.id, "folders");
            await addDoc(folderRef, {
                name: subfolderName.trim(),
                parentId: folderData.id,
                access: folderData.access,
                members: folderData.members || [],
                createdBy: userUid,
                createdAt: serverTimestamp(),
            });
            toast.success("Sous-dossier créé !");
            setShowCreateSubfolder(false);
            setSubfolderName("");
        } catch (err) {
            console.error("Err create subfolder:", err);
            toast.error("Impossible de créer le sous-dossier.");
        }
    };

    // Date de création du dossier courant
    let folderCreatedDate = "";
    if (folderData.createdAt?.toDate) {
        folderCreatedDate = dayjs(folderData.createdAt.toDate()).format("DD/MM/YYYY HH:mm");
    }

    return (
        <div className="h-full flex flex-col">
            {/* Entête */}
            <div className="flex items-center justify-between mb-4 bg-gray-100 p-3 border-b">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onBack}
                            className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
                        >
                            <FaArrowLeft />
                            Retour
                        </button>
                        <h2 className="text-lg font-bold">{folderData.name}</h2>
                    </div>
                    {/* Date de création du dossier */}
                    {folderCreatedDate && (
                        <p className="text-xs text-gray-400 mt-1">
                            Créé le {folderCreatedDate}
                        </p>
                    )}
                </div>
                <p className="text-sm text-gray-500">
                    Accès : {folderData.access === "everyone"
                        ? "Tous les membres"
                        : `${folderData.members?.length || 0} membre(s)`}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Sous-dossiers */}
                {subFolders.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Sous-dossiers</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {subFolders.map((sf) => {
                                let sfDate = "";
                                if (sf.createdAt?.toDate) {
                                    sfDate = dayjs(sf.createdAt.toDate()).format("DD/MM/YYYY HH:mm");
                                }
                                return (
                                    <div
                                        key={sf.id}
                                        className="bg-white border rounded p-3 shadow-sm flex flex-col hover:shadow-md transition"
                                    >
                                        <div className="flex items-center">
                                            <FaFolder className="text-gray-400 mr-2" size={24} />
                                            <span className="font-semibold text-gray-700">{sf.name}</span>
                                        </div>
                                        {sfDate && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Créé le {sfDate}
                                            </p>
                                        )}

                                        <button
                                            onClick={() => onBack() /* ou un handleOpenFolder(sf.id) pour naviguer plus loin */}
                                            className="mt-auto text-blue-600 text-sm hover:underline"
                                        >
                                            Ouvrir
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Fichiers */}
                <h3 className="font-semibold mb-2">Fichiers</h3>
                {files.length === 0 ? (
                    <p className="text-gray-400">Aucun fichier dans ce dossier.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {files.map((f) => {
                            const canDelete = f.createdBy === userUid;
                            let fileCreatedDate = "";
                            if (f.createdAt?.toDate) {
                                fileCreatedDate = dayjs(f.createdAt.toDate()).format("DD/MM/YYYY HH:mm");
                            }

                            return (
                                <div
                                    key={f.id}
                                    className="p-3 border rounded bg-gray-50 shadow-sm flex flex-col hover:shadow-md transition"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{f.name}</p>
                                        {fileCreatedDate && (
                                            <p className="text-xs text-gray-400">
                                                Mis en ligne le {fileCreatedDate}
                                            </p>
                                        )}
                                        <a
                                            href={f.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-500 hover:underline text-sm"
                                        >
                                            Ouvrir / Télécharger
                                        </a>
                                    </div>
                                    {hasAccess && canDelete && (
                                        <button
                                            onClick={() => askDeleteFile(f)}
                                            className="mt-2 text-red-500 hover:text-red-700 self-end"
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Upload de fichier */}
                {hasAccess && (
                    <div className="mt-6">
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="uploadFile"
                                className="px-3 py-1 bg-blue-100 text-blue-600 rounded cursor-pointer hover:bg-blue-200 flex items-center gap-1 transition"
                            >
                                <FaUpload />
                                Choisir un fichier
                            </label>
                            <input
                                id="uploadFile"
                                type="file"
                                className="hidden"
                                onChange={handleChooseFile}
                            />
                            {fileToUpload && <span className="text-sm">{fileToUpload.name}</span>}
                            {fileToUpload && (
                                <button
                                    onClick={handleUploadFile}
                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Envoyer
                                </button>
                            )}
                        </div>

                        {/* Créer un sous-dossier */}
                        <div className="mt-4">
                            {!showCreateSubfolder ? (
                                <button
                                    onClick={() => setShowCreateSubfolder(true)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                                >
                                    <FaFolder />
                                    Nouveau sous-dossier
                                </button>
                            ) : (
                                <div className="mt-2 bg-gray-50 p-3 border rounded shadow-sm">
                                    <label className="block text-sm mb-1">Nom du sous-dossier</label>
                                    <input
                                        type="text"
                                        className="border p-2 w-full mb-2"
                                        value={subfolderName}
                                        onChange={(e) => setSubfolderName(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateSubfolder}
                                            className="px-3 py-1 bg-green-500 text-white rounded"
                                        >
                                            Créer
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowCreateSubfolder(false);
                                                setSubfolderName("");
                                            }}
                                            className="px-3 py-1 border rounded"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mini modal de suppr fichier */}
            {showDeleteModal && fileToDelete && (
                <MiniModal
                    title="Supprimer le fichier"
                    message={`Voulez-vous vraiment supprimer "${fileToDelete.name}" ?`}
                    onConfirm={confirmDeleteFile}
                    onCancel={cancelDeleteFile}
                />
            )}
        </div>
    );
}
