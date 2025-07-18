// useAuth.ts - Custom Hook für User Authentication

import { useState, useEffect } from 'react'
import { getCurrentUser, getCurrentSession, onAuthStateChange } from '../SupaBaseClients'
import type { User } from '../Timeline/types'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  session: any
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    let mounted = true

    // Initial User laden
    async function getInitialUser() {
      try {
        setLoading(true)
        setError(null)
        
        // Session laden
        const currentSession = await getCurrentSession()
        if (mounted) {
          setSession(currentSession)
        }
        
        // User laden (nur wenn Session existiert)
        if (currentSession?.user) {
          const currentUser = await getCurrentUser()
          if (mounted) {
            setUser(currentUser)
          }
        } else {
          if (mounted) {
            setUser(null)
          }
        }
      } catch (err) {
        console.error('Error loading user:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Fehler beim Laden des Users')
          setUser(null)
          setSession(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialUser()

    // Auth State Changes lauschen
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (mounted) {
        setSession(session)
        
        if (session?.user) {
          setUser(session.user)
          setError(null)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    })

    // Cleanup
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    session
  }
}