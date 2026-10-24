import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LocalStore } from '../lib/storage'
import { Submission, SubmissionStatus } from '../types/database'
import { bountyService } from './bountyService'

export const submissionService = {
  async getSubmissions(bountyId: string): Promise<Submission[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          developer:profiles!developer_id(*)
        `)
        .eq('bounty_id', bountyId)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching submissions:', error)
        return []
      }
      return (data || []) as Submission[]
    }
    return LocalStore.getSubmissions(bountyId)
  },

  async createSubmission(payload: Omit<Submission, 'id' | 'created_at' | 'status'>): Promise<{ data: Submission | null; error: Error | null }> {
    if (isSupabaseConfigured) {
      // 1. Try atomic PostgreSQL RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('submit_bounty_deliverable', {
        p_bounty_id: payload.bounty_id,
        p_notes: payload.submission_notes,
        p_deliverable_urls: payload.deliverable_urls || [],
        p_github_pr_url: payload.github_pr_url || null
      })

      if (!rpcError) {
        const { data: subData } = await supabase
          .from('submissions')
          .select(`*, developer:profiles!developer_id(*)`)
          .eq('bounty_id', payload.bounty_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        return { data: subData as Submission, error: null }
      }

      console.warn('RPC submit_bounty_deliverable not available, using direct insert:', rpcError)

      // Direct insert fallback
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          ...payload,
          status: 'submitted'
        })
        .select(`
          *,
          developer:profiles!developer_id(*)
        `)
        .single()
      if (error) return { data: null, error }

      // Update bounty status to in_review
      await bountyService.updateBountyStatus(payload.bounty_id, 'in_review')

      return { data: data as Submission, error: null }
    }

    try {
      const created = LocalStore.createSubmission(payload)
      return { data: created, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  async reviewSubmission(
    submissionId: string, 
    bountyId: string, 
    status: SubmissionStatus, 
    feedback?: string
  ): Promise<{ data: Submission | null; error: Error | null }> {
    if (isSupabaseConfigured) {
      // 1. Try atomic PostgreSQL RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('review_bounty_submission', {
        p_submission_id: submissionId,
        p_bounty_id: bountyId,
        p_status: status,
        p_feedback: feedback || null
      })

      if (!rpcError) {
        const { data: subData } = await supabase
          .from('submissions')
          .select(`*, developer:profiles!developer_id(*)`)
          .eq('id', submissionId)
          .single()
        return { data: subData as Submission, error: null }
      }

      console.warn('RPC review_bounty_submission not available, using direct update:', rpcError)

      // Direct update fallback
      const { data, error } = await supabase
        .from('submissions')
        .update({
          status,
          feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select(`
          *,
          developer:profiles!developer_id(*)
        `)
        .single()
      if (error) return { data: null, error }

      // Update bounty status
      if (status === 'approved') {
        await bountyService.updateBountyStatus(bountyId, 'completed')
      } else if (status === 'revision_requested') {
        await bountyService.updateBountyStatus(bountyId, 'in_progress')
      }

      return { data: data as Submission, error: null }
    }

    const updated = LocalStore.updateSubmissionReview(submissionId, status, feedback)
    if (!updated) return { data: null, error: new Error('Submission not found') }
    return { data: updated, error: null }
  }
}
