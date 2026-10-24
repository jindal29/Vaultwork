import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LocalStore } from '../lib/storage'
import { Assignment } from '../types/database'

export const assignmentService = {
  async getAssignmentByBountyId(bountyId: string): Promise<Assignment | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          developer:profiles!developer_id(*),
          bounty:bounties!bounty_id(*)
        `)
        .eq('bounty_id', bountyId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching assignment for bounty:', error)
        return null
      }
      return data as Assignment | null
    }

    // LocalStore fallback
    const bounty = LocalStore.getBounty(bountyId)
    if (!bounty || !bounty.assigned_developer_id) return null

    const profiles = LocalStore.getProfiles()
    return {
      id: 'assign-' + bounty.id,
      bounty_id: bounty.id,
      developer_id: bounty.assigned_developer_id,
      status: bounty.status === 'completed' ? 'completed' : 'active',
      assigned_at: bounty.created_at,
      created_at: bounty.created_at,
      developer: profiles[bounty.assigned_developer_id] || undefined,
      bounty: bounty
    }
  },

  async getDeveloperAssignments(developerId: string): Promise<Assignment[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          bounty:bounties!bounty_id(
            *,
            creator:profiles!creator_id(*)
          )
        `)
        .eq('developer_id', developerId)
        .order('assigned_at', { ascending: false })

      if (error) {
        console.error('Error fetching developer assignments:', error)
        return []
      }
      return data as Assignment[]
    }

    const bounties = LocalStore.getBounties()
    const myAssigned = bounties.filter(b => b.assigned_developer_id === developerId)
    const profiles = LocalStore.getProfiles()

    return myAssigned.map(b => ({
      id: 'assign-' + b.id,
      bounty_id: b.id,
      developer_id: developerId,
      status: b.status === 'completed' ? 'completed' : 'active',
      assigned_at: b.created_at,
      created_at: b.created_at,
      developer: profiles[developerId] || undefined,
      bounty: b
    }))
  }
}
