import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService, AuthSession } from '../services/authService'
import { profileService } from '../services/profileService'
import { Profile } from '../types/database'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { LocalStore } from '../lib/storage'
import { DEMO_USER, MOCK_PROFILES } from '../lib/mockData'

interface AuthContextType {
  user: AuthSession['user']
  profile: Profile | null
  loading: boolean
  isSupabaseConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  switchDemoRole: (role: 'creator' | 'developer' | 'new_user') => void
  resetDemoData: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSession['user']>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSession = useCallback(async () => {
    try {
      setLoading(true)
      const session = await authService.getSession()
      setUser(session.user)
      setProfile(session.profile)
    } catch (err) {
      console.error('Failed to load auth session:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSession()

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata
          })
          const prof = await profileService.getProfile(session.user.id)
          setProfile(prof)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [loadSession])

  const signIn = async (email: string, password: string) => {
    const res = await authService.signIn(email, password)
    if (!res.error && res.profile) {
      setProfile(res.profile)
      setUser({
        id: res.profile.id,
        email,
        user_metadata: {
          username: res.profile.username,
          display_name: res.profile.display_name
        }
      })
    }
    return { error: res.error }
  }

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    const res = await authService.signUp(email, password, username, displayName)
    if (!res.error && res.profile) {
      setProfile(res.profile)
      setUser({
        id: res.profile.id,
        email,
        user_metadata: { username, display_name: displayName }
      })
    }
    return { error: res.error }
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user?.id) {
      const prof = await profileService.getProfile(user.id)
      if (prof) setProfile(prof)
    }
  }

  // Handy switch for demo mode testing
  const switchDemoRole = (role: 'creator' | 'developer' | 'new_user') => {
    if (isSupabaseConfigured) return

    let selected: Profile
    if (role === 'creator') {
      // Uniswap Labs
      selected = MOCK_PROFILES['creator-1']
    } else if (role === 'developer') {
      // Alex Vance
      selected = MOCK_PROFILES['dev-1']
    } else {
      // Satoshi Builder (dual-role active user)
      selected = DEMO_USER
    }

    LocalStore.setCurrentUser(selected)
    setProfile(selected)
    setUser({
      id: selected.id,
      email: `${selected.username}@vaultwork.xyz`,
      user_metadata: {
        username: selected.username,
        display_name: selected.display_name
      }
    })
  }

  const resetDemoData = () => {
    LocalStore.resetDemoData()
    setProfile(DEMO_USER)
    setUser({
      id: DEMO_USER.id,
      email: 'satoshi@vaultwork.xyz',
      user_metadata: {
        username: DEMO_USER.username,
        display_name: DEMO_USER.display_name
      }
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        switchDemoRole,
        resetDemoData
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
