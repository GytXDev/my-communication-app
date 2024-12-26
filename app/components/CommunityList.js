// app/components/CommunityList.js
"use client"

import React from 'react'

export default function CommunityList({ show, selectedCommunity, onSelectCommunity }) {
  // On simule des données de communautés
  const communities = [
    { id: 1, name: 'React Lovers' },
    { id: 2, name: 'Next.js 13 Fans' },
    { id: 3, name: 'Firebase Enthusiasts' },
  ]

  if (!show) {
    // Si on n’est pas sur le menu "communauté", on peut masquer ce composant
    return null
  }

  const handleCreateCommunity = () => {
    alert('Fonctionnalité "Nouvelle communauté" à implémenter :)')
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-4 hidden md:block">
      <h2 className="text-lg font-bold mb-4">Communautés</h2>

      {/* Bouton : Nouvelle Communauté */}
      <div className="flex items-center mb-4">
        <button
          onClick={handleCreateCommunity}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Nouvelle communauté
        </button>
      </div>

      {/* Champ de recherche */}
      <input
        type="text"
        placeholder="Rechercher..."
        className="w-full mb-4 p-2 border rounded"
      />

      {/* Liste des communautés */}
      <ul>
        {communities.map((comm) => (
          <li key={comm.id}>
            <button
              onClick={() => onSelectCommunity(comm.id)}
              className={`block w-full text-left px-2 py-1 rounded mb-1
                ${
                  selectedCommunity === comm.id
                    ? 'bg-purple-100'
                    : 'hover:bg-gray-100'
                }
              `}
            >
              {comm.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
