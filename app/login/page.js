// app/login/page.js
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../../lib/firebaseConfig'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      router.push('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <form onSubmit={handleLogin} className="bg-gray-800 p-6 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-2xl mb-4 text-center text-white font-bold">
          Connexion Futuriste
        </h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Adresse E-mail</label>
          <input
            type="email"
            className="w-full p-2 rounded focus:outline-none"
            placeholder="email@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Mot de Passe</label>
          <input
            type="password"
            className="w-full p-2 rounded focus:outline-none"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
        >
          Se Connecter
        </button>

        <div className="mt-4 flex items-center justify-center">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
          >
            Connexion avec Google
          </button>
        </div>

        <p className="text-gray-400 mt-6 text-center text-sm">
          Pas de compte ?{" "}
          <a className="text-blue-500 hover:underline" href="/signup">
            Inscrivez-vous
          </a>
        </p>
      </form>
    </div>
  )
}
