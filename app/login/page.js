/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth'

// Import Firestore
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebaseConfig'

export default function LoginPage() {
  const router = useRouter()

  // États pour le formulaire
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Gestion de l'erreur
  const [error, setError] = useState(null)

  // Deux spinners (Email vs Google)
  const [isLoadingEmail, setIsLoadingEmail] = useState(false)
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false)

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push('/')
    })
    return () => unsubscribe()
  }, [router])

  // Timer pour fermer automatiquement la snackbar après 3s
  useEffect(() => {
    let timer
    if (error) {
      timer = setTimeout(() => {
        setError(null)
      }, 3000) // 3 secondes
    }
    return () => clearTimeout(timer)
  }, [error])

  // ----------------------------------------
  // Mise à jour/Création du doc Firestore
  // ----------------------------------------
  const updateUserDoc = async (user) => {
    const { uid, email } = user
    // Ex: on enregistre la date de la dernière connexion
    const data = {
      email,
      lastLogin: new Date().toISOString(),
    }
    // On fusionne (merge) pour ne pas écraser d'autres champs
    await setDoc(doc(db, 'users', uid), data, { merge: true })
  }

  // Handler pour la connexion Email/Mot de Passe
  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoadingEmail(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      // Mettre à jour Firestore
      await updateUserDoc(userCredential.user)
      router.push('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingEmail(false)
    }
  }

  // Handler pour la connexion via Google
  const handleGoogleLogin = async () => {
    setError(null)
    setIsLoadingGoogle(true)

    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      // Mettre à jour Firestore
      await updateUserDoc(userCredential.user)
      router.push('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingGoogle(false)
    }
  }

  return (
    <div className="relative flex flex-col md:flex-row min-h-screen w-screen bg-gray-50 text-black font-[400]">
      {/* SNACKBAR d'erreur, fixée en bas de l'écran */}
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-md z-50">
          {error}
        </div>
      )}

      {/* Colonne GAUCHE : 2 "blobs" animés côte à côte */}
      <div className="relative hidden md:flex md:w-1/2 items-center justify-center animate-fadeIn">
        <div className="flex flex-row items-center justify-center space-x-[-2rem]">
          {/* Blob 1 */}
          <div className="relative w-80 h-80 bg-purple-300 opacity-80 animate-blob rounded-[40%] flex items-center justify-center z-10">
            <div className="text-center p-4 text-black">
              <h3 className="text-lg font-bold mb-2">Notre Plateforme</h3>
              <p className="text-sm">
                Partagez en temps réel et stockez vos fichiers en toute sécurité.
              </p>
            </div>
          </div>

          {/* Blob 2 */}
          <div className="relative w-80 h-80 bg-pink-300 opacity-80 animate-blob animation-delay-2000 rounded-[40%] flex items-center justify-center z-10">
            <div className="text-center p-4 text-black">
              <h3 className="text-lg font-bold mb-2">Communauté</h3>
              <p className="text-sm">
                Rejoignez une communauté de professionnels et d’amis dans un espace hybride.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne DROITE : Formulaire */}
      <div className="flex flex-col justify-center items-center md:w-1/2 min-h-screen px-8 py-10">
        <form
          onSubmit={handleLogin}
          className="bg-white text-black p-6 rounded-md shadow-md w-full max-w-md animate-fadeIn"
        >
          <h2 className="text-2xl mb-4 text-center font-bold uppercase tracking-wider text-purple-600 font-[700]">
            Connexion
          </h2>

          {/* Champ Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Adresse E-mail</label>
            <input
              type="email"
              className="w-full p-2 rounded focus:outline-none border border-gray-300"
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Champ Mot de Passe */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Mot de Passe</label>
            <input
              type="password"
              className="w-full p-2 rounded focus:outline-none border border-gray-300"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Bouton de soumission Email/Password */}
          <button
            type="submit"
            disabled={isLoadingEmail}
            className={`w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-transform transform hover:scale-105
              ${isLoadingEmail && 'opacity-70 cursor-not-allowed'}
            `}
          >
            {isLoadingEmail ? (
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l2-2-2-2V0a10 10 0 100 20v-4l-2 2 2 2v4a10 10 0 01-10-10z"
                  ></path>
                </svg>
                <span>Connexion...</span>
              </div>
            ) : (
              'Se Connecter'
            )}
          </button>

          {/* Bouton Google */}
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoadingGoogle}
              className={`flex items-center space-x-2 bg-white hover:bg-gray-200 text-gray-800 p-2 rounded transition-transform transform hover:scale-105
                ${isLoadingGoogle && 'opacity-70 cursor-not-allowed'}
              `}
            >
              {isLoadingGoogle ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5 text-gray-800"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l2-2-2-2V0a10 10 0 100 20v-4l-2 2 2 2v4a10 10 0 01-10-10z"
                    ></path>
                  </svg>
                  <span>Connexion...</span>
                </div>
              ) : (
                <>
                  <img
                    src="/icons/google-symbol.png"
                    alt="Google Icon"
                    className="w-5 h-5 object-contain"
                  />
                  <span>Connexion avec Google</span>
                </>
              )}
            </button>
          </div>

          <p className="text-gray-500 mt-6 text-center text-sm">
            Pas de compte ?{' '}
            <a className="text-blue-600 hover:underline" href="/signup">
              Inscrivez-vous
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
