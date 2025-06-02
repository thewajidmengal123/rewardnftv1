"use client"

import { useState, useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserProfile } from "@/types/firebase"

export function useFirebaseUser(walletAddress: string | null) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!walletAddress) {
      setUser(null)
      setLoading(false)
      return
    }

    const userRef = doc(db, "users", walletAddress)

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          setUser({ id: doc.id, ...doc.data() } as UserProfile)
        } else {
          setUser(null)
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("Error listening to user:", err)
        setError(err.message)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [walletAddress])

  return { user, loading, error }
}
