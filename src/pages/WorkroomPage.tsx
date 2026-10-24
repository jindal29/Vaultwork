import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { bountyService } from '@/services/bountyService'
import { submissionService } from '@/services/submissionService'
import { Bounty, Submission } from '@/types/database'
import { WorkroomTimeline } from '@/components/bounty/WorkroomTimeline'
import { StatusBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input, Textarea } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { formatCurrency, formatDate, formatTimeAgo } from '@/lib/utils'
import confetti from 'canvas-confetti'
import { 
  ArrowLeft, 
  GitPullRequest, 
  CheckCircle2, 
  RotateCcw, 
  ExternalLink, 
  Coins, 
  AlertCircle, 
  Send, 
  Sparkles,
  FileCode,
  ShieldCheck,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'

export const WorkroomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  // Deliverable form state
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [githubPrUrl, setGithubPrUrl] = useState('')
  const [deliverableUrls, setDeliverableUrls] = useState('')
  const [isSubmittingWork, setIsSubmittingWork] = useState(false)

  // Revision request modal state
  const [revisionModalOpen, setRevisionModalOpen] = useState(false)
  const [revisionFeedback, setRevisionFeedback] = useState('')
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)
  const [isProcessingReview, setIsProcessingReview] = useState(false)

  const loadWorkroom = async () => {
    if (!id) return
    setLoading(true)
    try {
      const b = await bountyService.getBountyById(id)
      setBounty(b)
      if (b) {
        const subs = await submissionService.getSubmissions(b.id)
        setSubmissions(subs)
      }
    } catch (err) {
      console.error('Failed to load workroom:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkroom()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#24D6B1] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!bounty) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#F4F5F1]">Workroom Not Found</h2>
        <Link to="/my-work">
          <Button variant="secondary" size="sm">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const isCreator = user?.id === bounty.creator_id
  const isAssignedDev = user?.id === bounty.assigned_developer_id

  // Permission check: only creator or assigned dev can view workroom
  if (!isCreator && !isAssignedDev) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#F4F5F1]">Private Milestone Workroom</h2>
        <p className="text-sm text-[#8E9894] max-w-md mx-auto">
          Workrooms are strictly restricted to the bounty creator ({bounty.creator?.display_name}) and the assigned developer ({bounty.assigned_developer?.display_name || 'Assigned Builder'}).
        </p>
        <Link to={`/bounties/${bounty.id}`}>
          <Button variant="secondary" size="sm">View Public Bounty Page</Button>
        </Link>
      </div>
    )
  }

  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submissionNotes.trim()) {
      toast.error('Please include submission notes explaining what was completed')
      return
    }

    try {
      setIsSubmittingWork(true)
      const urls = deliverableUrls
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean)

      const res = await submissionService.createSubmission({
        bounty_id: bounty.id,
        developer_id: user!.id,
        submission_notes: submissionNotes,
        deliverable_urls: urls,
        github_pr_url: githubPrUrl.trim() || undefined
      })

      if (res.error) {
        toast.error(res.error.message || 'Failed to submit deliverables')
        return
      }

      toast.success('Deliverables submitted for creator review!')
      setSubmissionNotes('')
      setGithubPrUrl('')
      setDeliverableUrls('')
      await loadWorkroom()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error submitting deliverables'
      toast.error(message)
    } finally {
      setIsSubmittingWork(false)
    }
  }

  const handleApproveWork = async (submissionId: string) => {
    if (!confirm('Are you sure you want to approve this work and release the bounty escrow payment?')) return

    try {
      setIsProcessingReview(true)
      const res = await submissionService.reviewSubmission(
        submissionId,
        bounty.id,
        'approved',
        'Verified and approved. Deliverables fulfill all acceptance criteria.'
      )

      if (res.error) {
        toast.error(res.error.message || 'Failed to approve submission')
        return
      }

      // Celebratory Confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#24D6B1', '#1EC09E', '#F4F5F1', '#4ade80']
      })

      toast.success('Bounty completed! Escrow funds released to developer.')
      await loadWorkroom()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error approving submission'
      toast.error(message)
    } finally {
      setIsProcessingReview(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!selectedSubId || !revisionFeedback.trim()) {
      toast.error('Please provide clear feedback explaining required revisions')
      return
    }

    try {
      setIsProcessingReview(true)
      const res = await submissionService.reviewSubmission(
        selectedSubId,
        bounty.id,
        'revision_requested',
        revisionFeedback
      )

      if (res.error) {
        toast.error(res.error.message || 'Failed to request revision')
        return
      }

      toast.info('Revision requested. Developer has been notified.')
      setRevisionModalOpen(false)
      setRevisionFeedback('')
      setSelectedSubId(null)
      await loadWorkroom()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error requesting revision'
      toast.error(message)
    } finally {
      setIsProcessingReview(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* Top Breadcrumb & Link */}
      <div className="flex items-center justify-between">
        <Link
          to={`/bounties/${bounty.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#8E9894] hover:text-[#24D6B1] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bounty Public Specification</span>
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge status={bounty.status} />
          <span className="text-xs font-mono font-bold text-[#F4F5F1]">
            {formatCurrency(bounty.reward_amount, bounty.reward_currency)}
          </span>
        </div>
      </div>

      {/* Workspace Header */}
      <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232B28] pb-6">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[#24D6B1] uppercase tracking-wider block">
              Active Milestone Workroom // ID: {bounty.id.slice(0, 12)}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F5F1] font-display">
              {bounty.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#141A18] border border-[#232B28] text-right">
              <span className="text-[10px] text-[#8E9894] uppercase tracking-wider block">Target Deadline</span>
              <span className="text-xs font-mono font-medium text-[#F4F5F1]">{formatDate(bounty.deadline)}</span>
            </div>
          </div>
        </div>

        {/* Milestone Lifecycle Timeline */}
        <WorkroomTimeline status={bounty.status} />

        {/* Collaborators strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#232B28] text-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141A18] border border-[#232B28]">
            <img
              src={bounty.creator?.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
              alt={bounty.creator?.display_name || 'Creator'}
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#8E9894] block">Creator (Escrow Depositor)</span>
              <strong className="text-[#F4F5F1]">{bounty.creator?.display_name}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141A18] border border-[#232B28]">
            <img
              src={bounty.assigned_developer?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={bounty.assigned_developer?.display_name || 'Developer'}
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#8E9894] block">Assigned Builder</span>
              <strong className="text-[#24D6B1]">{bounty.assigned_developer?.display_name}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body: Submissions History & Submit Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols): Submissions, PRs, Revisions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-[#F4F5F1] font-display flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-[#24D6B1]" />
            Deliverables & Code Reviews ({submissions.length})
          </h2>

          {submissions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#191F1D] border border-[#25302C] text-center space-y-2">
              <FileCode className="w-8 h-8 text-[#8E9894] mx-auto opacity-50" />
              <p className="text-sm font-semibold text-[#F4F5F1]">No deliverables submitted yet</p>
              <p className="text-xs text-[#8E9894]">
                The developer will submit pull requests, contracts, and demo links here when ready for review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub, idx) => {
                const isApproved = sub.status === 'approved'
                const isRevisionRequested = sub.status === 'revision_requested'

                return (
                  <div
                    key={sub.id}
                    className={`rounded-2xl bg-[#191F1D] border p-6 space-y-4 ${
                      isApproved
                        ? 'border-emerald-500/40 bg-emerald-950/10'
                        : isRevisionRequested
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : 'border-[#25302C]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#F4F5F1]">
                            Iteration #{submissions.length - idx}
                          </span>
                          <span className="text-[11px] text-[#8E9894] font-mono">
                            {formatTimeAgo(sub.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-[#8E9894] mt-0.5">
                          Submitted by {sub.developer?.display_name || 'Builder'}
                        </p>
                      </div>

                      <div>
                        {isApproved && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        )}
                        {isRevisionRequested && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5" />
                            Revision Requested
                          </span>
                        )}
                        {sub.status === 'submitted' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Awaiting Creator Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="p-4 rounded-xl bg-[#141A18] border border-[#232B28] text-xs text-[#F4F5F1] whitespace-pre-line leading-relaxed">
                      {sub.submission_notes}
                    </div>

                    {/* PR Link & Deliverable URLs */}
                    {(sub.github_pr_url || (sub.deliverable_urls && sub.deliverable_urls.length > 0)) && (
                      <div className="flex flex-wrap gap-2 text-xs pt-1">
                        {sub.github_pr_url && (
                          <a
                            href={sub.github_pr_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141A18] border border-[#25302C] text-[#24D6B1] hover:border-[#24D6B1]/40 font-mono"
                          >
                            <GitPullRequest className="w-3.5 h-3.5" />
                            <span>GitHub Pull Request</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {sub.deliverable_urls?.map((url, uidx) => (
                          <a
                            key={uidx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141A18] border border-[#25302C] text-[#F4F5F1] hover:text-[#24D6B1] font-mono"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#8E9894]" />
                            <span>{url.replace(/^https?:\/\//, '').slice(0, 30)}...</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Feedback if any */}
                    {sub.feedback && (
                      <div className="p-4 rounded-xl bg-[#141A18] border border-amber-500/20 text-xs text-[#8E9894] space-y-1">
                        <span className="font-semibold text-amber-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Creator Feedback / Review Note
                        </span>
                        <p className="text-[#F4F5F1] leading-relaxed whitespace-pre-line">
                          {sub.feedback}
                        </p>
                      </div>
                    )}

                    {/* Creator Actions on this submission */}
                    {isCreator && sub.status === 'submitted' && (
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232B28]">
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={isProcessingReview}
                          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                          onClick={() => {
                            setSelectedSubId(sub.id)
                            setRevisionModalOpen(true)
                          }}
                          className="text-amber-400 hover:bg-amber-500/10"
                        >
                          Request Revisions
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isProcessingReview}
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                          onClick={() => handleApproveWork(sub.id)}
                        >
                          Approve & Release Payment
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Submit New Deliverables Form (Assigned Dev Only) */}
          {isAssignedDev && bounty.status !== 'completed' && (
            <div className="rounded-2xl bg-[#191F1D] border border-[#24D6B1]/30 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#24D6B1]" />
                <h3 className="text-base font-bold text-[#F4F5F1] font-display">
                  Submit Deliverable for Creator Review
                </h3>
              </div>
              <p className="text-xs text-[#8E9894]">
                Provide your code repository, pull request, demo links, and documentation notes.
              </p>

              <form onSubmit={handleDeliverableSubmit} className="space-y-4">
                <Textarea
                  label="Submission Notes & Changelog *"
                  placeholder="Explain what has been completed, test suites executed, or specific instructions for the creator..."
                  rows={4}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="GitHub Pull Request URL"
                    placeholder="https://github.com/org/repo/pull/42"
                    value={githubPrUrl}
                    onChange={(e) => setGithubPrUrl(e.target.value)}
                  />

                  <Input
                    label="Demo / Deployment URL"
                    placeholder="https://preview.vercel.app"
                    value={deliverableUrls}
                    onChange={(e) => setDeliverableUrls(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isSubmittingWork}
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Submit Deliverable
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Acceptance Criteria & Guidelines */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E9894] font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#24D6B1]" />
              Acceptance Criteria
            </h3>
            <div className="p-3.5 rounded-xl bg-[#141A18] border border-[#232B28] text-xs text-[#8E9894] whitespace-pre-line leading-relaxed">
              {bounty.acceptance_criteria}
            </div>
          </div>

          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E9894] font-mono flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#24D6B1]" />
              Escrow Payout Terms
            </h3>
            <p className="text-xs text-[#8E9894] leading-relaxed">
              Upon final creator approval, <strong>{formatCurrency(bounty.reward_amount, bounty.reward_currency)}</strong> will be credited directly to the assigned developer's connected wallet address.
            </p>
            <div className="p-3 rounded-lg bg-[#141A18] border border-[#232B28] text-[11px] text-[#626D68] font-mono">
              Status: {bounty.status === 'completed' ? 'RELEASED' : 'LOCKED IN ESCROW'}
            </div>
          </div>
        </div>
      </div>

      {/* Revision Request Modal */}
      <Modal
        isOpen={revisionModalOpen}
        onClose={() => setRevisionModalOpen(false)}
        title="Request Revisions from Developer"
        description="Provide specific, actionable feedback explaining what needs modification before final acceptance."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <Textarea
            label="Feedback & Required Changes *"
            placeholder="e.g. Please add unit tests for edge case X, fix lint warnings in contract Y..."
            rows={4}
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232B28]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevisionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              isLoading={isProcessingReview}
              onClick={handleRequestRevision}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Submit Revision Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
