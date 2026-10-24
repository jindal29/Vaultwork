import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LocalStore } from '../lib/storage'
import { Application, ApplicationStatus } from '../types/database'
import { bountyService } from './bountyService'

export const applicationService = {
  async getBountyApplications(bountyId: string): Promise<Application[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          developer:profiles!developer_id(*)
        `)
        .eq('bounty_id', bountyId)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching bounty applications:', error)
        return []
      }
      return (data || []) as Application[]
    }
    return LocalStore.getApplications(bountyId)
  },

  async getDeveloperApplications(developerId: string): Promise<Application[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          bounty:bounties!bounty_id(
            *,
            creator:profiles!creator_id(*)
          )
        `)
        .eq('developer_id', developerId)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching developer applications:', error)
        return []
      }
      return (data || []) as Application[]
    }
    return LocalStore.getDeveloperApplications(developerId)
  },

  async submitApplication(payload: Omit<Application, 'id' | 'created_at' | 'status'>): Promise<{ data: Application | null; error: Error | null }> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          ...payload,
          status: 'pending'
        })
        .select(`
          *,
          developer:profiles!developer_id(*)
        `)
        .single()
      if (error) return { data: null, error }
      return { data: data as Application, error: null }
    }

    try {
      const created = LocalStore.submitApplication(payload)
      return { data: created, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<{ data: Application | null; error: Error | null }> {
    if (isSupabaseConfigured) {
      if (status === 'withdrawn') {
        const { error: rpcError } = await supabase.rpc('withdraw_bounty_application', {
          p_application_id: applicationId
        })
        if (!rpcError) {
          const { data } = await supabase
            .from('applications')
            .select('*, developer:profiles!developer_id(*)')
            .eq('id', applicationId)
            .single()
          return { data: data as Application, error: null }
        }
      }

      const { data, error } = await supabase
        .from('applications')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select(`
          *,
          developer:profiles!developer_id(*)
        `)
        .single()
      if (error) return { data: null, error }
      return { data: data as Application, error: null }
    }

    const updated = LocalStore.updateApplicationStatus(applicationId, status)
    if (!updated) return { data: null, error: new Error('Application not found') }
    return { data: updated, error: null }
  },

  async acceptApplicantAndAssign(bountyId: string, applicationId: string, developerId: string): Promise<{ success: boolean; error?: Error }> {
    if (isSupabaseConfigured) {
      // 1. Invoke atomic PostgreSQL RPC transaction with FOR UPDATE row locking
      const { data, error } = await supabase.rpc('select_bounty_developer', {
        p_bounty_id: bountyId,
        p_application_id: applicationId
      })

      if (error) {
        console.warn('RPC select_bounty_developer error, attempting direct transaction fallback:', error)
        // Fallback for manual or client transactions
        try {
          await this.updateApplicationStatus(applicationId, 'accepted')
          await bountyService.updateBountyStatus(bountyId, 'in_progress', developerId)
          return { success: true }
        } catch (fallbackErr) {
          return { success: false, error: new Error(error.message) }
        }
      }

      return { success: true }
    }

    try {
      LocalStore.selectDeveloper(bountyId, applicationId, developerId)
      return { success: true }
    } catch (err) {
      return { success: false, error: err as Error }
    }
  }
}
