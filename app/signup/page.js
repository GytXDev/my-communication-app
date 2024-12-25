/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'  // <-- Import Firestore
import { auth, db } from '../../lib/firebaseConfig' // <-- Import db

export default function SignupPage() {
  const router = useRouter()

  // Champs du formulaire
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Gestion des erreurs
  const [error, setError] = useState(null)

  // États de chargement séparés
  const [isLoadingEmail, setIsLoadingEmail] = useState(false)
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false)

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // S'il est déjà connecté, on le redirige vers /
        router.push('/')
      }
    })
    return () => unsubscribe()
  }, [router])

  // Timer pour fermer automatiquement la snackbar d'erreur
  useEffect(() => {
    let timer
    if (error) {
      timer = setTimeout(() => {
        setError(null)
      }, 3000) // 3 secondes
    }
    return () => clearTimeout(timer)
  }, [error])

  // ----------------------------------------------------
  // Fonction pour créer ou mettre à jour le document user
  // ----------------------------------------------------
  const createUserDoc = async (user) => {
    // user : objet renvoyé par createUserWithEmailAndPassword ou signInWithPopup
    const { uid, email } = user
    const userData = {
      email,
      createdAt: new Date().toISOString(),
    }
    // On enregistre/merge le document dans Firestore
    await setDoc(doc(db, 'users', uid), userData, { merge: true })
  }

  // Gestion de la création de compte par Email/Mot de passe
  const handleSignup = async (e) => {
    e.preventDefault()
    setError(null)

    // Vérifier la correspondance des mots de passe
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoadingEmail(true) // Spinner pour l'inscription Email
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      // Créer ou mettre à jour le doc Firestore
      await createUserDoc(userCredential.user)
      router.push('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingEmail(false)
    }
  }

  // Gestion de l'inscription via Google
  const handleGoogleSignup = async () => {
    setError(null)
    setIsLoadingGoogle(true) // Spinner pour l'inscription Google

    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      // Créer ou mettre à jour le doc Firestore
      await createUserDoc(userCredential.user)
      router.push('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingGoogle(false)
    }
  }

  return (
    <div
      className="relative flex flex-col 
           md:flex-row-reverse
           min-h-screen w-screen bg-gray-50 text-black font-[400]"
    >
      {/* SNACKBAR d'erreur, fixée en bas de l'écran */}
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-md z-50">
          {error}
        </div>
      )}

      {/* Colonne DROITE (inversée sur md+) : 2 "blobs" animés */}
      <div className="relative hidden md:flex md:w-1/2 items-center justify-center animate-fadeIn">
        <div className="flex flex-row items-center justify-center space-x-[-2rem]">
          {/* Blob 1 */}
          <div className="relative w-80 h-80 bg-purple-300 opacity-80 animate-blob rounded-[40%] flex items-center justify-center z-10">
            <div className="text-center p-4 text-black">
              <h3 className="text-lg font-bold mb-2">Rejoignez-nous</h3>
              <p className="text-sm">
                Créez un compte pour bénéficier de toutes nos fonctionnalités.
              </p>
            </div>
          </div>

          {/* Blob 2 */}
          <div className="relative w-80 h-80 bg-pink-300 opacity-80 animate-blob animation-delay-2000 rounded-[40%] flex items-center justify-center z-10">
            <div className="text-center p-4 text-black">
              <h3 className="text-lg font-bold mb-2">Communauté</h3>
              <p className="text-sm">
                Échangez avec des professionnels et des amis dans un espace unique.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne GAUCHE (sur md+) : Formulaire centré verticalement */}
      <div className="flex flex-col justify-center items-center md:w-1/2 min-h-screen px-8 py-10">
        <form
          onSubmit={handleSignup}
          className="bg-white text-black p-6 rounded-md shadow-md w-full max-w-md animate-fadeIn"
        >
          <h2 className="text-2xl mb-4 text-center font-bold uppercase tracking-wider text-purple-600 font-[700]">
            Inscription
          </h2>

          {/* Champ E-mail */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Adresse E-mail
            </label>
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
            <label className="block text-sm font-medium mb-1">
              Mot de Passe
            </label>
            <input
              type="password"
              className="w-full p-2 rounded focus:outline-none border border-gray-300"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Champ Confirmation de Mot de Passe */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Confirmer le Mot de Passe
            </label>
            <input
              type="password"
              className="w-full p-2 rounded focus:outline-none border border-gray-300"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Bouton Inscription (Email) */}
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l2-2-2-2V0..."
                  />
                </svg>
                <span>Inscription...</span>
              </div>
            ) : (
              'Créer mon compte'
            )}
          </button>

          {/* Bouton Google avec icône */}
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={handleGoogleSignup}
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l2-2-2-2V0..."
                    />
                  </svg>
                  <span>Inscription...</span>
                </div>
              ) : (
                <>
                  <img
                    src="/icons/google-symbol.png"
                    alt="Google Icon"
                    className="w-5 h-5 object-contain"
                  />
                  <span>S&apos;inscrire avec Google</span>
                </>
              )}
            </button>
          </div>

          <p className="text-gray-500 mt-6 text-center text-sm">
            Déjà inscrit ?{' '}
            <a className="text-blue-600 hover:underline" href="/login">
              Connectez-vous
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
