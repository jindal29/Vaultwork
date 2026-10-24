import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { bountyService } from '@/services/bountyService'
import { applicationService } from '@/services/applicationService'
import { Bounty, Application } from '@/types/database'
import { useAuth } from '@/context/AuthContext'
import { StatusBadge, SkillTag } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ApplyModal } from '@/components/bounty/ApplyModal'
import { ApplicantCard } from '@/components/bounty/ApplicantCard'
import { formatCurrency, formatDate, formatDaysRemaining } from '@/lib/utils'
import { 
  ArrowLeft, 
  Clock, 
  Coins, 
  ExternalLink, 
  Users, 
  CheckCircle2, 
  Send, 
  Edit3, 
  Briefcase, 
  AlertCircle 
} from 'lucide-react'
import { GithubIcon } from '@/components/common/Icons'
import { toast } from 'sonner'

export const BountyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const b = await bountyService.getBountyById(id)
      setBounty(b)

      if (b) {
        // If current user is creator, fetch applicants
        if (user?.id === b.creator_id) {
          const apps = await applicationService.getBountyApplications(b.id)
          setApplications(apps)
        } else if (user?.id) {
          // Check if current user has already applied
          const userApps = await applicationService.getDeveloperApplications(user.id)
          const matched = userApps.some(a => a.bounty_id === b.id && a.status !== 'withdrawn')
          setHasApplied(matched)
        }
      }
    } catch (err) {
      console.error('Failed to load bounty detail:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id, user?.id])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#24D6B1] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!bounty) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#F4F5F1]">Bounty Not Found</h2>
        <p className="text-sm text-[#8E9894]">The requested bounty could not be found or has been removed.</p>
        <Link to="/bounties">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Bounties
          </Button>
        </Link>
      </div>
    )
  }

  const isCreator = user?.id === bounty.creator_id
  const isAssignedDeveloper = user?.id === bounty.assigned_developer_id
  const daysInfo = formatDaysRemaining(bounty.deadline)
  const canApply = !isCreator && bounty.status === 'open' && !daysInfo.isExpired && !hasApplied

  const handleAcceptApplicant = async (appId: string, devId: string) => {
    const res = await applicationService.acceptApplicantAndAssign(bounty.id, appId, devId)
    if (res.success) {
      toast.success('Developer assigned to bounty! Workroom is now open.')
      await loadData()
      navigate(`/work/${bounty.id}`)
    } else {
      toast.error(res.error?.message || 'Failed to assign developer')
    }
  }

  const handleRejectApplicant = async (appId: string) => {
    const res = await applicationService.updateApplicationStatus(appId, 'rejected')
    if (!res.error) {
      toast.info('Applicant proposal declined')
      await loadData()
    } else {
      toast.error(res.error.message || 'Failed to decline proposal')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/bounties"
          className="inline-flex items-center gap-1.5 text-xs text-[#8E9894] hover:text-[#24D6B1] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explore</span>
        </Link>
      </div>

      {/* Main Grid: Details + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols): Details, Specs, Creator */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Block */}
          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono font-medium text-[#24D6B1] px-2.5 py-1 rounded bg-[#24D6B1]/10 border border-[#24D6B1]/20">
                {bounty.category}
              </span>
              <StatusBadge status={bounty.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4F5F1] font-display tracking-tight leading-tight">
              {bounty.title}
            </h1>

            <p className="text-sm text-[#8E9894] leading-relaxed">
              {bounty.short_summary}
            </p>

            {/* Creator attribution */}
            <div className="pt-4 border-t border-[#232B28] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={bounty.creator?.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
                  alt={bounty.creator?.display_name || 'Creator'}
                  className="w-10 h-10 rounded-xl object-cover border border-[#283530]"
                />
                <div>
                  <span className="text-xs text-[#8E9894] block">Commissioned by</span>
                  <Link
                    to={`/profile/${bounty.creator_id}`}
                    className="text-sm font-bold text-[#F4F5F1] hover:text-[#24D6B1] transition-colors"
                  >
                    {bounty.creator?.display_name}
                  </Link>
                </div>
              </div>

              <span className="text-xs text-[#626D68] font-mono">
                Published {formatDate(bounty.created_at)}
              </span>
            </div>
          </div>

          {/* Full Description & Scope */}
          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-[#F4F5F1] font-display">
              Technical Scope & Objectives
            </h2>
            <div className="text-sm text-[#8E9894] leading-relaxed whitespace-pre-line space-y-4">
              {bounty.description}
            </div>

            {/* Deliverables & Acceptance Criteria */}
            <div className="pt-6 border-t border-[#232B28] space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#24D6B1]" />
                  Expected Deliverables
                </h3>
                <div className="p-4 rounded-xl bg-[#141A18] border border-[#232B28] text-xs text-[#8E9894] whitespace-pre-line leading-relaxed">
                  {bounty.deliverables}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#24D6B1]" />
                  Acceptance Criteria
                </h3>
                <div className="p-4 rounded-xl bg-[#141A18] border border-[#232B28] text-xs text-[#8E9894] whitespace-pre-line leading-relaxed">
                  {bounty.acceptance_criteria}
                </div>
              </div>
            </div>

            {/* Reference Repo */}
            {bounty.repo_url && (
              <div className="pt-4 border-t border-[#232B28] flex items-center justify-between text-xs">
                <span className="text-[#8E9894]">Reference Repository:</span>
                <a
                  href={bounty.repo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[#24D6B1] hover:underline font-mono"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>{bounty.repo_url.replace('https://github.com/', '')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Applicant Review Panel for Creator Only */}
          {isCreator && (
            <div className="rounded-2xl bg-[#161C1A] border border-[#283530] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#F4F5F1] font-display flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#24D6B1]" />
                    Applicant Proposals ({applications.length})
                  </h3>
                  <p className="text-xs text-[#8E9894] mt-0.5">
                    Review candidate proposals, verify track records and accept the lead developer.
                  </p>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8E9894] bg-[#191F1D] rounded-xl border border-[#25302C]">
                  No proposals submitted yet. Applications will appear here in real time.
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <ApplicantCard
                      key={app.id}
                      application={app}
                      isCreator={true}
                      onAccept={handleAcceptApplicant}
                      onReject={handleRejectApplicant}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Reward, Deadline, Actions */}
        <div className="space-y-6">
          {/* Action Box */}
          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#8E9894] block mb-1">
                Total Bounty Reward
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#F4F5F1] font-mono">
                  {formatCurrency(bounty.reward_amount, bounty.reward_currency)}
                </span>
              </div>
              <span className="text-[11px] text-[#24D6B1] flex items-center gap-1 mt-1 font-mono">
                <Coins className="w-3.5 h-3.5" />
                Guaranteed Escrow Payout
              </span>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#232B28] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8E9894]">Target Deadline:</span>
                <span className={`font-mono font-medium ${daysInfo.isUrgent ? 'text-amber-400' : 'text-[#F4F5F1]'}`}>
                  {formatDate(bounty.deadline)} ({daysInfo.text})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9894]">Applicants:</span>
                <span className="font-mono text-[#F4F5F1] font-medium">
                  {bounty.applications_count} developers
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 border-t border-[#232B28] space-y-3">
              {/* Creator controls */}
              {isCreator ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-[#141A18] border border-[#232B28] text-xs text-[#8E9894] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#24D6B1]" />
                    <span>You are the creator of this bounty</span>
                  </div>

                  <Link to={`/bounties/${bounty.id}/edit`} className="block">
                    <Button variant="secondary" size="sm" className="w-full" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                      Edit Bounty Details
                    </Button>
                  </Link>

                  {(bounty.status === 'in_progress' || bounty.status === 'in_review' || bounty.status === 'completed') && (
                    <Link to={`/work/${bounty.id}`} className="block">
                      <Button size="sm" className="w-full" leftIcon={<Briefcase className="w-3.5 h-3.5" />}>
                        Open Bounty Workroom
                      </Button>
                    </Link>
                  )}
                </div>
              ) : isAssignedDeveloper ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-[#24D6B1]/10 border border-[#24D6B1]/30 text-xs text-[#24D6B1] flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>You are the assigned developer!</span>
                  </div>
                  <Link to={`/work/${bounty.id}`} className="block">
                    <Button size="sm" className="w-full" leftIcon={<Briefcase className="w-3.5 h-3.5" />}>
                      Go to Workroom
                    </Button>
                  </Link>
                </div>
              ) : hasApplied ? (
                <div className="p-3 rounded-lg bg-[#141A18] border border-[#232B28] text-xs text-[#8E9894] text-center space-y-1">
                  <span className="font-semibold text-[#24D6B1] block">Proposal Under Review</span>
                  <p className="text-[11px] text-[#626D68]">You have already submitted an application to this bounty.</p>
                </div>
              ) : canApply ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    if (!user) {
                      toast.info('Please sign in or create an account to submit a proposal')
                      navigate('/login')
                    } else {
                      setApplyModalOpen(true)
                    }
                  }}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Apply to Bounty
                </Button>
              ) : (
                <div className="p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-xs text-[#8E9894] text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-zinc-500" />
                  <span>Applications are closed for this bounty.</span>
                </div>
              )}
            </div>
          </div>

          {/* Required Skills Card */}
          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E9894] font-mono">
              Required Technical Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {bounty.skills.map((skill) => (
                <SkillTag key={skill} skill={skill} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Proposal Modal */}
      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        bounty={bounty}
        onSuccess={loadData}
      />
    </div>
  )
}
