import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LocalStore } from '../lib/storage'
import { Profile } from '../types/database'

export const profileService = {
  async getProfile(id: string): Promise<Profile | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return null
      return data as Profile
    }
    return LocalStore.getProfile(id)
  },

  async updateProfile(profile: Partial<Profile> & { id: string }): Promise<{ data: Profile | null; error: Error | null }> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()
      if (error) return { data: null, error }
      return { data: data as Profile, error: null }
    }

    const updated = LocalStore.updateProfile(profile)
    return { data: updated, error: null }
  }
}
