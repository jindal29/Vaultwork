import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LocalStore } from '../lib/storage'
import { Profile } from '../types/database'
import { DEMO_USER } from '../lib/mockData'

export interface AuthSession {
  user: {
    id: string
    email: string
    user_metadata?: {
      username?: string
      display_name?: string
    }
  } | null
  profile: Profile | null
}

export const authService = {
  async getSession(): Promise<AuthSession> {
    if (isSupabaseConfigured) {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session?.user) {
        return { user: null, profile: null }
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      return {
        user: {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        },
        profile: profile as Profile || null,
      }
    }

    // Demo / Local storage mode
    const currentUser = LocalStore.getCurrentUser()
    if (!currentUser) return { user: null, profile: null }

    return {
      user: {
        id: currentUser.id,
        email: 'builder@vaultwork.xyz',
        user_metadata: {
          username: currentUser.username,
          display_name: currentUser.display_name,
        }
      },
      profile: currentUser,
    }
  },

  async signUp(email: string, password: string, username: string, displayName: string): Promise<{ error: Error | null; profile?: Profile }> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
          }
        }
      })
      if (error) return { error }

      let profile: Profile | null = null
      if (data.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        profile = prof
      }

      return { error: null, profile: profile || undefined }
    }

    // Demo Mode: create local profile
    const newId = 'user-' + Date.now()
    const newProfile: Profile = {
      id: newId,
      username,
      display_name: displayName,
      bio: 'New Vaultwork builder & bounty creator.',
      skills: ['TypeScript', 'Solidity'],
      created_at: new Date().toISOString(),
      bounties_completed: 0,
      total_earned_usd: 0,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`
    }
    LocalStore.updateProfile(newProfile)
    LocalStore.setCurrentUser(newProfile)
    return { error: null, profile: newProfile }
  },

  async signIn(email: string, password: string): Promise<{ error: Error | null; profile?: Profile }> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) return { error }

      let profile: Profile | null = null
      if (data.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        profile = prof
      }
      return { error: null, profile: profile || undefined }
    }

    // Demo Mode: sign in as default demo user or existing stored user
    const user = LocalStore.getCurrentUser() || DEMO_USER
    LocalStore.setCurrentUser(user)
    return { error: null, profile: user }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    } else {
      LocalStore.setCurrentUser(null)
    }
  },

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    }
    // Demo mode: simulated success
    await new Promise(r => setTimeout(r, 600))
    return { error: null }
  },

  async updatePassword(password: string): Promise<{ error: Error | null }> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password })
      return { error }
    }
    // Demo mode: simulated success
    await new Promise(r => setTimeout(r, 600))
    return { error: null }
  }
}
