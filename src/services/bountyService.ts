import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LocalStore } from '../lib/storage'
import { Bounty, BountyCategory, BountyStatus } from '../types/database'

export interface BountyFilterOptions {
  search?: string
  category?: BountyCategory | 'All'
  skills?: string[]
  minReward?: number
  maxReward?: number
  status?: BountyStatus | 'all'
  sortBy?: 'newest' | 'reward_desc' | 'deadline_asc'
}

export const bountyService = {
  async getBounties(filters: BountyFilterOptions = {}): Promise<Bounty[]> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('bounties')
        .select(`
          *,
          creator:profiles!creator_id(*),
          assigned_developer:profiles!assigned_developer_id(*)
        `)

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      } else {
        query = query.neq('status', 'draft')
      }

      if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category)
      }

      if (filters.minReward) {
        query = query.gte('reward_amount', filters.minReward)
      }

      if (filters.maxReward) {
        query = query.lte('reward_amount', filters.maxReward)
      }

      if (filters.sortBy === 'reward_desc') {
        query = query.order('reward_amount', { ascending: false })
      } else if (filters.sortBy === 'deadline_asc') {
        query = query.order('deadline', { ascending: true })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query
      if (error) {
        console.error('Supabase getBounties error:', error)
        return []
      }

      let results = (data || []) as Bounty[]

      // Client-side text search if provided
      if (filters.search) {
        const s = filters.search.toLowerCase()
        results = results.filter(b => 
          b.title.toLowerCase().includes(s) || 
          b.short_summary.toLowerCase().includes(s) || 
          b.skills.some(sk => sk.toLowerCase().includes(s))
        )
      }

      return results
    }

    // LocalStore fallback
    let list = LocalStore.getBounties()

    if (filters.status && filters.status !== 'all') {
      list = list.filter(b => b.status === filters.status)
    } else {
      list = list.filter(b => b.status !== 'draft')
    }

    if (filters.category && filters.category !== 'All') {
      list = list.filter(b => b.category === filters.category)
    }

    if (filters.skills && filters.skills.length > 0) {
      list = list.filter(b => filters.skills!.some(s => b.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase())))
    }

    if (filters.minReward) {
      list = list.filter(b => b.reward_amount >= filters.minReward!)
    }

    if (filters.maxReward) {
      list = list.filter(b => b.reward_amount <= filters.maxReward!)
    }

    if (filters.search) {
      const s = filters.search.toLowerCase()
      list = list.filter(b => 
        b.title.toLowerCase().includes(s) || 
        b.short_summary.toLowerCase().includes(s) || 
        b.skills.some(sk => sk.toLowerCase().includes(s))
      )
    }

    if (filters.sortBy === 'reward_desc') {
      list.sort((a, b) => b.reward_amount - a.reward_amount)
    } else if (filters.sortBy === 'deadline_asc') {
      list.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return list
  },

  async getBountyById(id: string): Promise<Bounty | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('bounties')
        .select(`
          *,
          creator:profiles!creator_id(*),
          assigned_developer:profiles!assigned_developer_id(*)
        `)
        .eq('id', id)
        .single()
      if (error) return null
      return data as Bounty
    }
    return LocalStore.getBounty(id)
  },

  async getCreatorBounties(creatorId: string): Promise<Bounty[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('bounties')
        .select(`
          *,
          creator:profiles!creator_id(*),
          assigned_developer:profiles!assigned_developer_id(*)
        `)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
      if (error) return []
      return data as Bounty[]
    }
    const all = LocalStore.getBounties()
    return all.filter(b => b.creator_id === creatorId)
  },

  async createBounty(bountyData: Omit<Bounty, 'id' | 'created_at' | 'applications_count'>): Promise<{ data: Bounty | null; error: Error | null }> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('bounties')
        .insert({
          ...bountyData,
          applications_count: 0
        })
        .select(`
          *,
          creator:profiles!creator_id(*)
        `)
        .single()
      if (error) return { data: null, error }
      return { data: data as Bounty, error: null }
    }

    const created = LocalStore.saveBounty(bountyData)
    return { data: created, error: null }
  },

  async updateBounty(id: string, bountyData: Partial<Bounty>): Promise<{ data: Bounty | null; error: Error | null }> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('bounties')
        .update({
          ...bountyData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          creator:profiles!creator_id(*),
          assigned_developer:profiles!assigned_developer_id(*)
        `)
        .single()
      if (error) return { data: null, error }
      return { data: data as Bounty, error: null }
    }

    const existing = LocalStore.getBounty(id)
    if (!existing) return { data: null, error: new Error('Bounty not found') }
    const updated = LocalStore.saveBounty({ ...existing, ...bountyData, id })
    return { data: updated, error: null }
  },

  async updateBountyStatus(id: string, status: BountyStatus, assignedDeveloperId?: string | null): Promise<Bounty | null> {
    if (isSupabaseConfigured) {
      const payload: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString()
      }
      if (assignedDeveloperId !== undefined) {
        payload.assigned_developer_id = assignedDeveloperId
      }
      const { data, error } = await supabase
        .from('bounties')
        .update(payload)
        .eq('id', id)
        .select(`
          *,
          creator:profiles!creator_id(*),
          assigned_developer:profiles!assigned_developer_id(*)
        `)
        .single()
      if (error) return null
      return data as Bounty
    }

    return LocalStore.updateBountyStatus(id, status, assignedDeveloperId)
  }
}
