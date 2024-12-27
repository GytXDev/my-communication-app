/* eslint-disable @next/next/no-img-element */
// app/components/CommunityList.js
"use client";

import React, { useEffect, useState } from 'react';
import { FaSearch, FaLongArrowAltLeft } from 'react-icons/fa';
import { db } from '@/lib/firebaseConfig'; 
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function CommunityList({ show, selectedCommunity, onSelectCommunity, onCreateCommunity }) {
  const [searchText, setSearchText] = useState("");
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    const fetchCommunities = async () => {
      // Filtrer pour n'afficher que les communautés actives
      const communitiesCollection = collection(db, "communities");
      const q = query(communitiesCollection, where("status", "==", "active"));
      const communitiesSnapshot = await getDocs(q);
      const communitiesList = communitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCommunities(communitiesList);
    };

    fetchCommunities();
  }, []);

  if (!show) {
    return null;
  }

  const handleCreateCommunity = () => {
    onCreateCommunity(); // Appelle la fonction passée via les props
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  // Filtrer les communautés selon le texte de recherche
  const filteredCommunities = communities.filter((comm) =>
    comm.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-4 hidden md:block">
      <h2 className="text-2xl font-semibold mb-4">Communautés</h2>

      <div className="flex items-center mb-4">
        <button
          onClick={handleCreateCommunity}
          className="flex items-center px-4 py-2 rounded-md transition duration-200"
        >
          <span className="bg-purple-500 text-white px-2 py-1 rounded-l-md shadow-md hover:bg-purple-600 transition duration-200">
            👥
          </span>
          <span className="ml-2 text-gray-800 text-lg">Nouvelle communauté</span>
        </button>
      </div>

      {/* Champ de recherche */}
      <div className="relative mb-4">
        {searchText ? (
          <FaLongArrowAltLeft
            onClick={handleClearSearch}
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 cursor-pointer transition-transform duration-200"
          />
        ) : (
          <FaSearch className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 transition-transform duration-200" />
        )}
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full p-2 pl-10 border border-gray-300 rounded-md transition duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-300 hover:border-blue-300"
        />
      </div>

      {/* Liste des communautés */}
      {filteredCommunities.length === 0 ? (
        <div className="text-center text-gray-500 mt-4">
          <p>Aucune communauté disponible.</p>
          <p>Créez-en une pour commencer à interagir !</p>
        </div>
      ) : (
        <ul>
          {filteredCommunities.map((comm) => (
            <li key={comm.id}>
              <button
                onClick={() => onSelectCommunity(comm.id)}
                className={`block w-full text-left px-2 py-1 rounded mb-1 ${
                  selectedCommunity === comm.id
                    ? "bg-purple-100"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <img
                    src={comm.image}
                    alt={comm.name}
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <div className="flex-1">
                    <span className="font-semibold">{comm.name}</span>
                    <div className="text-sm text-gray-500">
                      {comm.memberCount} membre{comm.memberCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
