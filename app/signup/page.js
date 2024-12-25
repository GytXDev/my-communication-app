// app/signup/page.js
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebaseConfig'

export default function SignupPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    const handleSignup = async (e) => {
        e.preventDefault()
        setError(null)

        try {
            await createUserWithEmailAndPassword(auth, email, password)
            router.push('/')
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <form onSubmit={handleSignup} className="bg-gray-800 p-6 rounded-md shadow-md w-full max-w-md">
                <h2 className="text-2xl mb-4 text-center text-white font-bold">
                    Inscription Futuriste
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
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded"
                >
                    Créer mon compte
                </button>

                <p className="text-gray-400 mt-6 text-center text-sm">
                    Déjà inscrit ?{" "}
                    <a className="text-blue-500 hover:underline" href="/login">
                        Connectez-vous
                    </a>
                </p>
            </form>
        </div>
    )
}
