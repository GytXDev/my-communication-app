// app/components/Sidebar.js
"use client"

import { FaUsers, FaRocketchat, FaUser, FaFolder } from 'react-icons/fa'

export default function Sidebar({ selectedMenu, onMenuSelect, userData }) {
    return (
        <div className="w-16 md:w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4">
            {/* Communauté */}
            <button
                onClick={() => onMenuSelect('communaute')}
                className={`
                  mb-6 p-2 rounded hover:bg-gray-100
                  ${selectedMenu === 'communaute' ? 'bg-gray-100' : ''}
                `}
            >
                <FaUsers
                    className={`mx-auto ${selectedMenu === 'communaute' ? 'text-purple-600' : 'text-gray-400'}`}
                    size={24}
                />
            </button>

            {/* Messages */}
            <button
                onClick={() => onMenuSelect('messages')}
                className={`
                  mb-6 p-2 rounded hover:bg-gray-100
                  ${selectedMenu === 'messages' ? 'bg-gray-100' : ''}
                `}
            >
                <FaRocketchat
                    className={`mx-auto ${selectedMenu === 'messages' ? 'text-purple-600' : 'text-gray-400'}`}
                    size={24}
                />
            </button>

            {/* Fichiers */}
            <button
                onClick={() => onMenuSelect('files')}
                className={`
                  mb-6 p-2 rounded hover:bg-gray-100
                  ${selectedMenu === 'files' ? 'bg-gray-100' : ''}
                `}
            >
                <FaFolder
                    className={`mx-auto ${selectedMenu === 'files' ? 'text-purple-600' : 'text-gray-400'}`}
                    size={24}
                />
            </button>

            {/* Espaceur */}
            <div className="flex-1" />

            {/* Profil (avatar ou icône) */}
            <button
                onClick={() => onMenuSelect('profile')}
                className="p-2 rounded hover:bg-gray-100"
            >
                {userData?.photoURL ? (
                    <img
                        src={userData.photoURL}
                        alt="Profil"
                        className="w-6 h-6 rounded-full object-cover"
                    />
                ) : (
                    <FaUser className="text-gray-400 hover:text-purple-600" size={24} />
                )}
            </button>
        </div>
    )
}
