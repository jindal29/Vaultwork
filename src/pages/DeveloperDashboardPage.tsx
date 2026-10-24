import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { applicationService } from '@/services/applicationService'
import { bountyService } from '@/services/bountyService'
import { Application, Bounty, ApplicationStatus } from '@/types/database'
import { ApplicationStatusBadge, StatusBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { formatCurrency, formatDate, formatDaysRemaining, formatTimeAgo } from '@/lib/utils'
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Send, 
  Coins, 
  ArrowRight, 
  GitPullRequest, 
  FileText, 
  ExternalLink 
} from 'lucide-react'
import { toast } from 'sonner'

export const DeveloperDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [activeBounties, setActiveBounties] = useState<Bounty[]>([])
  const [completedBounties, setCompletedBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('all')

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. My applications
      const apps = await applicationService.getDeveloperApplications(user.id)
      setApplications(apps)

      // 2. All bounties where I am the assigned developer
      const allBounties = await bountyService.getBounties({ status: 'all' })
      const assigned = allBounties.filter(b => b.assigned_developer_id === user.id)

      setActiveBounties(assigned.filter(b => b.status === 'in_progress' || b.status === 'in_review'))
      setCompletedBounties(assigned.filter(b => b.status === 'completed'))
    } catch (err) {
      console.error('Failed to load developer dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const handleWithdraw = async (appId: string) => {
    if (!confirm('Are you sure you want to withdraw your proposal?')) return
    const res = await applicationService.updateApplicationStatus(appId, 'withdrawn')
    if (res.data) {
      toast.info('Proposal withdrawn')
      loadData()
    }
  }

  const filteredApps = activeTab === 'all'
    ? applications
    : applications.filter(a => a.status === activeTab)

  const totalEarned = completedBounties.reduce((sum, b) => {
    return sum + (b.reward_currency === 'USDC' || b.reward_currency === 'USDT' ? b.reward_amount : b.reward_amount * 3200)
  }, 0)

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#191F1D] border border-[#25302C] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8E9894]">
              <span className="font-medium uppercase tracking-wider">Active Workrooms</span>
              <GitPullRequest className="w-4 h-4 text-[#24D6B1]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F4F5F1]">{activeBounties.length}</div>
            <div className="text-[11px] text-[#24D6B1]">Currently assigned to you</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#191F1D] border border-[#25302C] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8E9894]">
              <span className="font-medium uppercase tracking-wider">Submitted Proposals</span>
              <Send className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F4F5F1]">{applications.length}</div>
            <div className="text-[11px] text-[#626D68]">
              {applications.filter(a => a.status === 'pending').length} pending review
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#191F1D] border border-[#25302C] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8E9894]">
              <span className="font-medium uppercase tracking-wider">Completed Bounties</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F4F5F1]">{completedBounties.length}</div>
            <div className="text-[11px] text-emerald-400 font-mono">100% verified delivery</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#191F1D] border border-[#25302C] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8E9894]">
              <span className="font-medium uppercase tracking-wider">Total Earned</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F4F5F1]">
              ${totalEarned.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#626D68]">Escrow released</div>
          </div>
        </div>

        {/* Assigned Bounties / Active Workrooms Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#F4F5F1] font-display flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#24D6B1]" />
                Active Workrooms & Assignments ({activeBounties.length})
              </h2>
              <p className="text-xs text-[#8E9894] mt-0.5">
                Bounties where you have been formally accepted. Submit your deliverables and review creator feedback.
              </p>
            </div>
          </div>

          {activeBounties.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#191F1D] border border-[#25302C] text-center space-y-3">
              <p className="text-xs text-[#8E9894]">You do not have any active assignments right now.</p>
              <Link to="/bounties">
                <Button size="sm">Browse & Apply to Bounties</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBounties.map((b) => {
                const days = formatDaysRemaining(b.deadline)
                return (
                  <div
                    key={b.id}
                    className="p-6 rounded-2xl bg-[#191F1D] border border-[#24D6B1]/30 hover:border-[#24D6B1] transition-all space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#24D6B1]/10 text-[#24D6B1] border border-[#24D6B1]/20">
                        {b.category}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#F4F5F1] line-clamp-1 font-display">
                        {b.title}
                      </h3>
                      <p className="text-xs text-[#8E9894] line-clamp-2 mt-1">
                        {b.short_summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#232B28] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#8E9894] uppercase tracking-wider block">Reward</span>
                        <span className="text-sm font-bold font-mono text-[#F4F5F1]">
                          {formatCurrency(b.reward_amount, b.reward_currency)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#8E9894] uppercase tracking-wider block">Deadline</span>
                        <span className={`font-mono font-medium ${days.isUrgent ? 'text-amber-400' : 'text-[#8E9894]'}`}>
                          {days.text}
                        </span>
                      </div>
                    </div>

                    <Link to={`/work/${b.id}`} className="block pt-1">
                      <Button size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Open Workroom Workspace
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Proposals & Applications History Section */}
        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] overflow-hidden space-y-4">
          <div className="p-6 border-b border-[#232B28] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#F4F5F1] font-display">
                Your Submitted Proposals ({applications.length})
              </h2>
              <p className="text-xs text-[#8E9894] mt-0.5">
                Track status changes, acceptance notifications, and past proposal records.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#141A18] p-1 rounded-xl border border-[#232B28] text-xs">
              {(['all', 'pending', 'accepted', 'rejected', 'withdrawn'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'bg-[#24D6B1] text-[#101413] font-semibold'
                      : 'text-[#8E9894] hover:text-[#F4F5F1]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#8E9894]">Loading proposals...</div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8E9894]">
              No proposals found in this category.
            </div>
          ) : (
            <div className="divide-y divide-[#232B28]">
              {filteredApps.map((app) => (
                <div key={app.id} className="p-6 hover:bg-[#1E2623]/40 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <Link
                        to={`/bounties/${app.bounty_id}`}
                        className="font-bold text-[#F4F5F1] hover:text-[#24D6B1] transition-colors text-sm line-clamp-1"
                      >
                        {app.bounty?.title || 'Bounty #' + app.bounty_id.slice(0, 8)}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-[#8E9894]">
                        <span>Commissioned by <strong>{app.bounty?.creator?.display_name || 'Creator'}</strong></span>
                        <span>•</span>
                        <span className="font-mono">{formatTimeAgo(app.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <ApplicationStatusBadge status={app.status} />
                      {app.status === 'accepted' && (
                        <Link to={`/work/${app.bounty_id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Workroom →
                          </Button>
                        </Link>
                      )}
                      {app.status === 'pending' && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#8E9894] line-clamp-2 bg-[#141A18] p-3 rounded-lg border border-[#232B28]">
                    "{app.cover_letter}"
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#626D68] pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#24D6B1]" />
                      Proposed: {app.estimated_delivery_days} days
                    </span>
                    {app.portfolio_link && (
                      <a
                        href={app.portfolio_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#24D6B1] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Submitted Link</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
