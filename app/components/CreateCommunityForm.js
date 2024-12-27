// tools/CreateCommunityForm.js
import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';

const CreateCommunityForm = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [image, setImage] = useState(null);
    const [type, setType] = useState('public');
    const [permissions, setPermissions] = useState({
        canPost: ['admin'],
        canComment: ['all'],
        canCreateSubCommunity: ['admin'],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({
            name,
            description,
            tags: tags.split(',').map(tag => tag.trim()),
            image,
            type,
            permissions,
        });
        alert('Passer à la page de paiement');
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose}>
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            <Dialog.Panel className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg">
                <h2 className="text-2xl font-semibold mb-4">Créer une Communauté</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Nom de la Communauté</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="border border-gray-300 rounded p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="border border-gray-300 rounded p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Tags (séparés par des virgules)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="border border-gray-300 rounded p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Image de Profil</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImage(e.target.files[0])}
                            className="border border-gray-300 rounded p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Type de Communauté</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="border border-gray-300 rounded p-2 w-full"
                        >
                            <option value="public">Public</option>
                            <option value="private">Privé</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Permissions</label>
                        <div className="flex flex-col">
                            <div>
                                <input
                                    type="checkbox"
                                    checked={permissions.canPost.includes('admin')}
                                    onChange={() =>
                                        setPermissions((prev) => ({
                                            ...prev,
                                            canPost: prev.canPost.includes('admin') ? [] : ['admin'],
                                        }))
                                    }
                                />
                                <label className="ml-2">Peut poster (Admin seulement)</label>
                            </div>
                            <div>
                                <input
                                    type="checkbox"
                                    checked={permissions.canComment.includes('all')}
                                    onChange={() =>
                                        setPermissions((prev) => ({
                                            ...prev,
                                            canComment: prev.canComment.includes('all') ? [] : ['all'],
                                        }))
                                    }
                                />
                                <label className="ml-2">Peut commenter (Tous)</label>
                            </div>
                            <div>
                                <input
                                    type="checkbox"
                                    checked={permissions.canCreateSubCommunity.includes('admin')}
                                    onChange={() =>
                                        setPermissions((prev) => ({
                                            ...prev,
                                            canCreateSubCommunity: prev.canCreateSubCommunity.includes('admin') ? [] : ['admin'],
                                        }))
                                    }
                                />
                                <label className="ml-2">Peut créer des sous-communautés (Admin seulement)</label>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Suivant</button>
                </form>
            </Dialog.Panel>
        </Dialog>
    );
};

export default CreateCommunityForm; // Exportation par défaut