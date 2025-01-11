// app/components/CommunityRoom.js
"use client";

import React, { useEffect, useState, useRef } from "react";
import {
    doc,
    getDoc,
    collection,
    onSnapshot,
    addDoc,
    serverTimestamp,
    deleteDoc,
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import { toast } from "react-hot-toast";

import { db, storage } from "@/lib/firebaseConfig";
import dayjs from "@/utils/dayjsConfig";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";

// Icônes
import {
    FiMoreHorizontal,
    FiMic,
    FiSend,
    FiImage,
    FiPaperclip,
    FiTrash2,
    FiStopCircle,
    FiShare2,
    FiCheck,
    FiDownload,
} from "react-icons/fi";

// Configuration dayjs
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

// === Regex pour détecter des liens
const urlRegex = /(https?:\/\/[^\s]+)/gi;

/**
 * Transforme le texte en HTML en détectant les liens.
 * @param {string} text 
 * @returns {string} texte HTML
 */
function parseLinks(text) {
    // Remplace toute URL par un lien HTML
    return text.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6;">${url}</a>`;
    });
}

/**
 * @param {string} communityId - ID de la communauté
 * @param {string} userUid - UID de l'utilisateur
 * @param {string} userName
 * @param {string} userPhoto
 */
export default function CommunityRoom({
    communityId,
    userUid,
    userName,
    userPhoto,
    onOpenFiles,
}) {
    const [community, setCommunity] = useState(null);
    const [messagesByDate, setMessagesByDate] = useState({});
    const [inputMsg, setInputMsg] = useState("");
    const [showActions, setShowActions] = useState(false);
    const [confirmQuit, setConfirmQuit] = useState(false);


    // Enregistrement audio
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);

    // Aperçu avant envoi (image/vidéo/fichier)
    const [pendingFiles, setPendingFiles] = useState([]);
    const [pendingCaption, setPendingCaption] = useState("");

    const bottomRef = useRef(null);

    // 1) Charger infos communauté
    useEffect(() => {
        if (!communityId) return;
        const docRef = doc(db, "communities", communityId);
        getDoc(docRef).then((snap) => {
            if (snap.exists()) {
                setCommunity({ id: snap.id, ...snap.data() });
            } else {
                console.warn("Communauté introuvable.");
            }
        });
    }, [communityId]);

    // 2) Écouter en temps réel
    useEffect(() => {
        if (!communityId) return;

        const messagesRef = collection(db, "communities", communityId, "messages");
        const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
            const raw = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            raw.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
            const grouped = {};
            raw.forEach((m) => {
                const d = m.createdAt?.toDate();
                const key = d ? dayjs(d).format("YYYY-MM-DD") : "inconnu";
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(m);
            });
            setMessagesByDate(grouped);
        });

        return () => unsubscribe();
    }, [communityId]);

    // 3) Auto-scroll en bas
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messagesByDate]);

    // 4) Envoyer message text OU audio
    const handleSendMessage = async () => {
        if (!inputMsg.trim()) {
            // audio
            if (!isRecording) {
                startRecording();
            } else {
                stopRecording();
            }
            return;
        }

        try {
            const userData = await fetchUserData();
            await addMessageToFirestore({
                type: "text",
                content: inputMsg.trim(),
                senderName: userData.displayName || userName || "Inconnu",
                senderPhoto: userData.photoURL || userPhoto || "",
            });
            setInputMsg("");
        } catch (err) {
            console.error("Erreur msg texte:", err);
            toast.error("Échec envoi message texte");
        }
    };

    // util
    const fetchUserData = async () => {
        const snap = await getDoc(doc(db, "users", userUid));
        return snap.exists() ? snap.data() : {};
    };

    const addMessageToFirestore = async ({
        type,
        content,
        storagePath,
        fileName,
        images,
        senderName,
        senderPhoto,
        caption,
    }) => {
        const refMsg = collection(db, "communities", communityId, "messages");
        await addDoc(refMsg, {
            type,
            content: content || null,
            images: images || null,
            storagePath: storagePath || null,
            fileName: fileName || null,
            caption: caption || "",
            senderId: userUid,
            senderName,
            senderPhoto,
            createdAt: serverTimestamp(),
        });
    };

    // 5) Audio start/stop
    const startRecording = async () => {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            toast.error("Audio non supporté.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            setAudioChunks([]);
            setIsRecording(true);
            recorder.start();

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    setAudioChunks((prev) => [...prev, e.data]);
                }
            };
            recorder.onstop = handleRecordingStop;
        } catch (err) {
            console.error("Err accès micro:", err);
            toast.error("Impossible d'accéder au micro.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleRecordingStop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const localURL = URL.createObjectURL(blob);
        setAudioURL(localURL);
    };

    const confirmAudioSend = async () => {
        if (!audioURL) return;
        try {
            const blob = new Blob(audioChunks, { type: "audio/webm" });
            if (blob.size > 10 * 1024 * 1024) {
                toast.error("Audio > 10MB");
                cancelAudio();
                return;
            }
            const userData = await fetchUserData();
            const fileName = `audio-${Date.now()}.webm`;
            const path = `communities/${communityId}/${fileName}`;
            const r = ref(storage, path);
            await uploadBytes(r, blob);
            const dlUrl = await getDownloadURL(r);
            await addMessageToFirestore({
                type: "audio",
                content: dlUrl,
                storagePath: path,
                senderName: userData.displayName || userName || "Inconnu",
                senderPhoto: userData.photoURL || userPhoto || "",
            });
        } catch (err) {
            console.error("Err envoi audio:", err);
            toast.error("Échec envoi audio");
        } finally {
            cancelAudio();
        }
    };
    const cancelAudio = () => {
        setAudioURL(null);
        setAudioChunks([]);
    };

    // 6) Sélection multiple d'images
    const handleChooseImages = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // On va stocker toutes les images dans "pendingFiles" 
        // + un type "multi-image" si plus d'une, sinon "image".
        // Mais on va faire un seul message "multi-image" si >1
        // Aperçus...
        const arr = [];
        for (let file of files) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`Fichier ${file.name} dépasse 10MB`);
                continue;
            }
            const previewURL = URL.createObjectURL(file);
            arr.push({ file, previewURL, type: "image" });
        }

        setPendingFiles(arr);
        setPendingCaption("");
    };

    // 7) Choix d’un fichier (simple)
    const handleChooseFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Le fichier dépasse 10MB");
            return;
        }
        const previewURL = file.name;
        setPendingFiles([{ file, previewURL, type: "file" }]);
        setPendingCaption("");
    };

    // 8) Envoyer images multiples
    const confirmFileSend = async () => {
        if (!pendingFiles || pendingFiles.length === 0) return;

        try {
            const userData = await fetchUserData();
            // cas "multi-image" => on upload tout & on stocke un array d'URLs
            if (pendingFiles.length > 1 && pendingFiles.every(f => f.type === "image")) {
                // multi-image
                const imageUrls = [];
                for (const pf of pendingFiles) {
                    const filePath = `communities/${communityId}/${Date.now()}-${pf.file.name}`;
                    const storageRef_ = ref(storage, filePath);
                    await uploadBytes(storageRef_, pf.file);
                    const dlUrl = await getDownloadURL(storageRef_);
                    imageUrls.push(dlUrl);
                }
                await addMessageToFirestore({
                    type: "multi-image",  // on distingue si c'est un tableau
                    images: imageUrls,
                    caption: pendingCaption.trim(),
                    senderName: userData.displayName || userName || "Inconnu",
                    senderPhoto: userData.photoURL || userPhoto || "",
                });
            }
            else if (pendingFiles.length === 1) {
                // single => on check si c'est "image" ou "file"
                const { file, type } = pendingFiles[0];
                const filePath = `communities/${communityId}/${Date.now()}-${file.name}`;
                const storageRef_ = ref(storage, filePath);
                await uploadBytes(storageRef_, file);
                const dlUrl = await getDownloadURL(storageRef_);

                if (type === "image") {
                    // image unique
                    await addMessageToFirestore({
                        type: "image",
                        content: dlUrl,
                        storagePath: filePath,
                        fileName: file.name,
                        caption: pendingCaption.trim(),
                        senderName: userData.displayName || userName || "Inconnu",
                        senderPhoto: userData.photoURL || userPhoto || "",
                    });
                } else {
                    // file
                    await addMessageToFirestore({
                        type: "file",
                        content: dlUrl,
                        storagePath: filePath,
                        fileName: file.name,
                        caption: pendingCaption.trim(),
                        senderName: userData.displayName || userName || "Inconnu",
                        senderPhoto: userData.photoURL || userPhoto || "",
                    });
                }
            }
        } catch (err) {
            console.error("Err upload multiple image/file:", err);
            toast.error("Échec envoi du fichier/ des images.");
        } finally {
            for (const pf of pendingFiles) {
                if (pf.previewURL) {
                    URL.revokeObjectURL(pf.previewURL);
                }
            }
            setPendingFiles([]);
            setPendingCaption("");
        }
    };

    const cancelFile = () => {
        for (const pf of pendingFiles) {
            if (pf.previewURL) {
                URL.revokeObjectURL(pf.previewURL);
            }
        }
        setPendingFiles([]);
        setPendingCaption("");
    };

    // 9) format date
    const formatDateHeader = (dateStr) => {
        const date = dayjs(dateStr, "YYYY-MM-DD");
        const now = dayjs();
        if (date.isSame(now, "day")) return "Aujourd’hui";
        if (date.isSame(now.subtract(1, "day"), "day")) return "Hier";
        return date.format("DD MMMM YYYY");
    };

    // 10) Affichage avant chargement
    if (!community) {
        return <div className="p-4 text-gray-500">Chargement de la communauté...</div>;
    }
    // === Gérer le menu d’actions sur l’icône "..." ===
    const toggleActions = () => {
        setShowActions(!showActions);
    };

    // 10) Logique "Espace fichier"
    function handleOpenFilesClick() {
        setShowActions(false);
        if (onOpenFiles) {
            onOpenFiles(); // <-- plus d'erreur : c’est la fonction de page.js
        } else {
            toast.success("Accès à l'espace Fichier… (callback non défini)");
        }
    }

    // 11) Logique "Quitter la communauté"
    const handleQuitClick = () => {
        setShowActions(false);
        setConfirmQuit(true); // on affiche la mini-modal
    };

    const confirmQuitCommunity = async () => {
        if (!community?.id || !community.members?.includes(userUid)) {
            setConfirmQuit(false);
            return;
        }
        try {
            // Retirer le userUid de community.members
            const commRef = doc(db, "communities", community.id);
            await updateDoc(commRef, {
                members: arrayRemove(userUid),
                memberCount: (community.memberCount || 1) - 1,
            });
            toast.success("Vous avez quitté la communauté.");
        } catch (err) {
            console.error("Err quit community:", err);
            toast.error("Impossible de quitter la communauté.");
        } finally {
            setConfirmQuit(false);
        }
    };

    const cancelQuitCommunity = () => {
        setConfirmQuit(false);
    };

    // 12) Logique "Partager la communauté"
    const handleShareCommunity = () => {
        setShowActions(false);
        // exemple : copier un lien d’invitation
        const shareLink = window.location.origin + `/invite/${community.id}`;
        navigator.clipboard.writeText(shareLink)
            .then(() => {
                toast.success("Lien de la communauté copié !");
            })
            .catch(() => {
                toast.error("Impossible de copier le lien");
            });
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Barre supérieure */}
            <header className="flex items-center justify-between p-4 bg-gray-200 border-b">
                <div className="flex items-center gap-4">
                    <img
                        src={community.image || "/images/default_community.png"}
                        alt={community.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <h2 className="text-lg font-semibold">{community.name}</h2>
                        <span className="text-sm text-gray-600">
                            {community.memberCount || 0} membre(s)
                        </span>
                    </div>
                </div>
                {/* Bouton pour ouvrir/fermer le menu */}
                <button
                    onClick={toggleActions}
                    className="p-2 hover:bg-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Options"
                >
                    <FiMoreHorizontal className="text-gray-600" size={20} />
                </button>

                {/* Menu déroulant */}
                {showActions && (
                    <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-56 animate-fadeIn">
                        <button
                            onClick={handleOpenFilesClick}
                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                        >
                            <FiPaperclip size={16} className="text-blue-500" />
                            <span>Espace fichier</span>
                        </button>
                        <button
                            onClick={handleShareCommunity}
                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <FiShare2 size={16} className="text-green-500" />
                            <span>Partager la communauté</span>
                        </button>
                        <button
                            onClick={handleQuitClick}
                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-100 rounded-b-lg"
                        >
                            <FiTrash2 size={16} className="text-red-500" />
                            <span>Quitter la communauté</span>
                        </button>
                    </div>
                )}
            </header>

            {/* Zone messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
                {Object.keys(messagesByDate).length === 0 ? (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        <p>
                            Aucun message pour le moment.<br />
                            Soyez le premier à envoyer un message !
                        </p>
                    </div>
                ) : (
                    Object.keys(messagesByDate).map((dateStr) => {
                        const dayMessages = messagesByDate[dateStr];
                        return (
                            <div key={dateStr}>
                                <div className="my-4 text-center text-sm text-gray-500">
                                    {formatDateHeader(dateStr)}
                                </div>
                                {dayMessages.map((m) => {
                                    const isMine = m.senderId === userUid;
                                    return (
                                        <MessageBubble
                                            key={m.id}
                                            community={community}
                                            userUid={userUid}
                                            message={m}
                                            isMine={isMine}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Preview modal (audio ou multi-file) */}
            {(audioURL || pendingFiles.length > 0) && (
                <PreviewModal
                    audioURL={audioURL}
                    onAudioConfirm={confirmAudioSend}
                    onAudioCancel={cancelAudio}
                    pendingFiles={pendingFiles}
                    pendingCaption={pendingCaption}
                    setPendingCaption={setPendingCaption}
                    onFileConfirm={confirmFileSend}
                    onFileCancel={cancelFile}
                />
            )}

            {/* MiniModal pour confirmer “Quitter la communauté” */}
            {confirmQuit && (
                <MiniModal
                    title="Quitter la communauté"
                    message={`Voulez-vous vraiment quitter "${community.name}" ?`}
                    onConfirm={confirmQuitCommunity}
                    onCancel={cancelQuitCommunity}
                />
            )}

            {/* Barre inférieure */}
            <footer className="px-4 py-3 bg-gray-100 border-t flex items-center justify-between">
                <button
                    onClick={handleSendMessage}
                    className="p-2 text-gray-600 hover:text-gray-800"
                >
                    {inputMsg.trim() === "" && !isRecording ? (
                        <FiMic className="w-5 h-5" />
                    ) : inputMsg.trim() === "" && isRecording ? (
                        <FiStopCircle className="w-5 h-5 text-red-500" />
                    ) : (
                        <FiSend className="w-5 h-5" />
                    )}
                </button>

                <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 mx-2 focus:outline-none"
                    placeholder={
                        isRecording ? "Enregistrement en cours..." : "Saisissez votre message..."
                    }
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    disabled={isRecording}
                />

                {/* Icône multi-image */}
                <label
                    htmlFor="imageInput"
                    className="p-2 text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                    <FiImage className="w-5 h-5" />
                </label>
                <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    multiple // On autorise plusieurs
                    className="hidden"
                    onChange={handleChooseImages}
                />

                {/* Icône fichier */}
                <label
                    htmlFor="fileInput"
                    className="p-2 text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                    <FiPaperclip className="w-5 h-5" />
                </label>
                <input
                    id="fileInput"
                    type="file"
                    className="hidden"
                    onChange={handleChooseFile}
                />
            </footer>
        </div>
    );
}

/** 
 * Aperçu modal (audio ou multi-images/fichiers) 
 */
function PreviewModal({
    audioURL,
    onAudioConfirm,
    onAudioCancel,
    pendingFiles,
    pendingCaption,
    setPendingCaption,
    onFileConfirm,
    onFileCancel,
}) {
    return (
        <div className="absolute bottom-20 left-0 right-0 mx-auto w-full max-w-md p-4 bg-white border border-gray-300 shadow-md rounded flex flex-col items-center z-50">

            {audioURL && pendingFiles.length === 0 && (
                <div className="flex items-center w-full mb-2">
                    <audio controls className="flex-1 border border-gray-200 rounded p-1">
                        <source src={audioURL} type="audio/webm" />
                        Votre navigateur ne supporte pas l'audio.
                    </audio>
                    <button
                        className="p-2 ml-2 text-red-500 hover:bg-red-100 rounded-full"
                        onClick={onAudioCancel}
                    >
                        <FiTrash2 className="w-5 h-5" />
                    </button>
                </div>
            )}

            {pendingFiles.length > 0 && (
                <div className="flex flex-col w-full mb-4">
                    {/* Liste d’aperçus */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {pendingFiles.map((pf, idx) => {
                            if (pf.type === "image") {
                                return (
                                    <img
                                        key={idx}
                                        src={pf.previewURL}
                                        alt="preview"
                                        className="max-h-24 object-cover border rounded"
                                    />
                                );
                            }
                            else if (pf.type === "file") {
                                return (
                                    <div key={idx} className="flex items-center justify-center text-gray-600 border rounded p-2 text-sm">
                                        <FiPaperclip className="mr-1" />
                                        {pf.previewURL}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>

                    {/* Légende */}
                    <input
                        type="text"
                        placeholder="Ajouter une légende..."
                        className="rounded-full w-full px-4 py-2 text-gray-700 bg-gray-100 focus:ring-2  focus:outline-none"
                        value={pendingCaption}
                        onChange={(e) => setPendingCaption(e.target.value)}
                    />

                    {/* Bouton annuler */}
                    <div className="flex justify-end mt-2">
                        <button
                            className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                            onClick={onFileCancel}
                        >
                            <FiTrash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Boutons OK */}
            <div className="flex gap-3">
                {audioURL && pendingFiles.length === 0 && (
                    <button
                        onClick={onAudioConfirm}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                    >
                        <FiCheck /> Envoyer
                    </button>
                )}
                {pendingFiles.length > 0 && (
                    <button
                        onClick={onFileConfirm}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                    >
                        <FiCheck /> Envoyer
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Bulle de message
 */
function MessageBubble({ community, userUid, message, isMine }) {
    const {
        id,
        type,
        content,
        images,     // Pour "multi-image"
        storagePath,
        fileName,
        caption,
        senderName,
        senderPhoto,
        createdAt,
    } = message;

    // 1) date/heure
    let timeLabel = "";
    if (createdAt?.toDate) {
        timeLabel = dayjs(createdAt.toDate()).format("HH:mm");
    }

    // 2) condition suppression
    const canDelete =
        isMine ||
        community?.createdBy === userUid ||
        (community?.admins && community.admins.includes(userUid));

    // 3) handleDelete
    const handleDelete = async () => {
        try {
            // si on a un storagePath => suppr
            // mais si c'est multi-image => on n'a pas un storagePath unique
            // => Cf. plus loin
            if (storagePath) {
                const storageRef = ref(storage, storagePath);
                await deleteObject(storageRef).catch((err) => {
                    console.warn("Erreur suppr storage:", err);
                });
            }
            await deleteDoc(doc(db, "communities", community.id, "messages", id));
            toast.success("Message supprimé");
        } catch (err) {
            console.error("Err suppr message:", err);
            toast.error("Impossible de supprimer.");
        }
    };

    // Alignement
    const bubbleClass = isMine
        ? "bg-blue-500 text-white self-end"
        : "bg-gray-100 text-gray-800 self-start";

    const bubbleStyles = isMine
        ? "rounded-tl-lg rounded-br-3xl rounded-bl-3xl shadow-md"
        : "rounded-tr-lg rounded-bl-3xl rounded-br-3xl shadow-md";

    const trashPositionClass = isMine
        ? "absolute -top-2 -left-7"
        : "absolute -top-2 -right-7";

    // 4) Rendu du contenu
    let messageContent = null;
    if (type === "text") {
        // On parse les liens
        const safeHtml = parseLinks(content);
        messageContent = (
            <p
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
        );
    } else if (type === "image") {
        messageContent = (
            <img
                src={content}
                alt="img"
                className="max-w-xs rounded-lg cursor-pointer"
                onClick={() => window.open(content, "_blank")}
            />
        );
    } else if (type === "video") {
        messageContent = (
            <video
                src={content}
                controls
                className="max-w-xs rounded-lg cursor-pointer"
            />
        );
    } else if (type === "audio") {
        messageContent = (
            <audio controls className="mt-1">
                <source src={content} type="audio/webm" />
                Pas supporté
            </audio>
        );
    } else if (type === "file") {
        const displayName = fileName || "Document";
        messageContent = (
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{displayName}</span>
                <a
                    href={content}
                    download={displayName}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    target="_blank"
                    rel="noreferrer"
                >
                    <FiDownload />
                </a>
            </div>
        );
    } else if (type === "multi-image") {
        // Tableau d'URLs
        messageContent = (
            <div className="grid grid-cols-2 gap-2">
                {images?.map((url, idx) => (
                    <img
                        key={idx}
                        src={url}
                        alt={`multi-${idx}`}
                        className="max-h-40 object-cover rounded cursor-pointer"
                        onClick={() => window.open(url, "_blank")}
                    />
                ))}
            </div>
        );
    } else {
        messageContent = <em>Type {type} non géré</em>;
    }

    return (
        <div
            className="flex flex-col mb-4 group"
            style={{ alignItems: isMine ? "flex-end" : "flex-start" }}
        >
            {!isMine && (
                <div className="flex items-center mb-1">
                    {senderPhoto && (
                        <img
                            src={senderPhoto}
                            alt={senderName || "User"}
                            className="w-8 h-8 rounded-full mr-2 object-cover shadow-sm"
                        />
                    )}
                    <span className="text-sm text-gray-600">{senderName}</span>
                </div>
            )}

            <div className="relative">
                <div className={`px-4 py-2 max-w-md ${bubbleClass} ${bubbleStyles}`}>
                    {messageContent}
                    {/* Légende */}
                    {caption && caption.trim() !== "" && (
                        <p className="mt-2 italic text-sm">
                            {caption}
                        </p>
                    )}
                    <span className="block text-xs mt-2 opacity-70 text-right">
                        {timeLabel}
                    </span>
                </div>

                {canDelete && (
                    <button
                        onClick={handleDelete}
                        className={`${trashPositionClass} text-gray-400 hover:text-red-600 hidden group-hover:block`}
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

// --------------  Composant MiniModal --------------
function MiniModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
                <h2 className="text-lg font-bold mb-2">{title}</h2>
                <p className="text-sm text-gray-600 mb-4">{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1 border rounded text-sm"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                    >
                        Quitter
                    </button>
                </div>
            </div>
        </div>
    );
}