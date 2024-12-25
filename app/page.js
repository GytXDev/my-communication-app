// app/page.js
"use client"  // Permet d'utiliser l'état client, hooks React, etc.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebaseConfig'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Si pas connecté, redirection vers /login
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Bienvenue sur la page d&apos;accueil futuriste !</h1>
    </div>
  )
}
