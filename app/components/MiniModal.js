// app/components/MiniModal.js
"use client";
import React from "react";

export default function MiniModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
                <h2 className="text-lg font-bold mb-2">{title}</h2>
                <p className="text-sm text-gray-600 mb-4">{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1 border rounded"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}
