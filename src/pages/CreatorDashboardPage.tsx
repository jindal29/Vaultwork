import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { bountyService } from '@/services/bountyService'
import { applicationService } from '@/services/applicationService'
import { Bounty, Application } from '@/types/database'
import { StatusBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Layers, 
  Users, 
  CheckCircle2, 
  Briefcase, 
  Coins, 
  PlusCircle, 
  ArrowUpRight, 
  Eye, 
  Edit3, 
  Clock, 
  AlertCircle 
} from 'lucide-react'
import { toast } from 'sonner'

export const CreatorDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const myBounties = await bountyService.getCreatorBounties(user.id)
      setBounties(myBounties)

      // Fetch all applications across all my bounties
      const allApps: Application[] = []
      for (const b of myBounties) {
        const apps = await applicationService.getBountyApplications(b.id)
        allApps.push(...apps)
      }
      setApplications(allApps)
    } catch (err) {
      console.error('Failed to load creator dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  // Computed stats
  const totalCreated = bounties.length
  const openCount = bounties.filter(b => b.status === 'open').length
  const activeAssignments = bounties.filter(b => b.status === 'in_progress' || b.status === 'in_review').length
  const completedCount = bounties.filter(b => b.status === 'completed').length
  const totalApplicants = applications.length
  const totalSettledUSD = bounties
    .filter(b => b.status === 'completed')
    .reduce((acc, b) => acc + (b.reward_currency === 'USDC' || b.reward_currency === 'USDT' ? b.reward_amount : b.reward_amount * 3200), 0)

  const pendingApps = applications.filter(a => a.status === 'pending')

  const handleCloseBounty = async (bountyId: string) => {
    if (!confirm('Are you sure you want to close this bounty?')) return
    const updated = await bountyService.updateBountyStatus(bountyId, 'cancelled')
    if (updated) {
      toast.info('Bounty has been cancelled')
      loadData()
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#191F1D] border border-[#25302C] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8E9894]">
              <span className="font-medium uppercase tracking-wider">Total Created</span>
              <Layers className="w-4 h-4 text-[#24D6B1]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F4F5F1]">{totalCreated}</div>
            <div className="text-[11px] text-[#626D68]">{openCount} currently accepting proposals</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#191F1D] border border-[#25302C] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8E9894]">
              <span className="font-medium uppercase tracking-wider">Active Workrooms</span>
              <Briefcase className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F4F5F1]">{activeAssignments}</div>
            <div className="text-[11px] text-[#626D68]">In progress or under review</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#191F1D] border border-[#25302C] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8E9894]">
              <span className="font-medium uppercase tracking-wider">Total Applicants</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F4F5F1]">{totalApplicants}</div>
            <div className="text-[11px] text-[#626D68]">
              {pendingApps.length} pending your review
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#191F1D] border border-[#25302C] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8E9894]">
              <span className="font-medium uppercase tracking-wider">Completed & Paid</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F4F5F1]">{completedCount}</div>
            <div className="text-[11px] text-[#24D6B1] font-mono">
              ${totalSettledUSD.toLocaleString()} settled
            </div>
          </div>
        </div>

        {/* Pending Proposals Review Banner if any */}
        {pendingApps.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#1E2623] border border-[#24D6B1]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#24D6B1]/10 text-[#24D6B1] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F4F5F1]">
                  You have {pendingApps.length} proposal{pendingApps.length > 1 ? 's' : ''} awaiting review
                </h4>
                <p className="text-xs text-[#8E9894]">
                  Candidates are waiting for your assignment decision on your commissioned bounties.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingApps.slice(0, 2).map((app) => (
                <Link key={app.id} to={`/bounties/${app.bounty_id}`}>
                  <Button size="sm" variant="outline" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                    Review on Bounty
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bounties Management Table */}
        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] overflow-hidden space-y-4">
          <div className="p-6 border-b border-[#232B28] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#F4F5F1] font-display">
                Your Commissioned Bounties
              </h2>
              <p className="text-xs text-[#8E9894] mt-0.5">
                Manage live bounties, inspect proposals, and navigate to active milestone workrooms.
              </p>
            </div>
            <Link to="/bounties/new">
              <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Post New Bounty
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#8E9894]">Loading your bounties...</div>
          ) : bounties.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-sm text-[#8E9894]">You haven't posted any bounties yet.</p>
              <Link to="/bounties/new">
                <Button size="sm">Post Your First Bounty</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141A18] text-[#8E9894] uppercase tracking-wider font-mono text-[10px] border-b border-[#232B28]">
                  <tr>
                    <th className="py-3 px-6">Bounty Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Reward</th>
                    <th className="py-3 px-4">Applicants</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232B28]">
                  {bounties.map((bounty) => (
                    <tr key={bounty.id} className="hover:bg-[#1E2623]/60 transition-colors">
                      <td className="py-4 px-6 max-w-xs">
                        <Link
                          to={`/bounties/${bounty.id}`}
                          className="font-bold text-[#F4F5F1] hover:text-[#24D6B1] transition-colors line-clamp-1"
                        >
                          {bounty.title}
                        </Link>
                        <p className="text-[11px] text-[#8E9894] line-clamp-1 mt-0.5 font-mono">
                          {bounty.short_summary}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-[#8E9894]">
                        <span className="px-2 py-0.5 rounded bg-[#141A18] border border-[#25302C] text-[11px]">
                          {bounty.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-[#F4F5F1]">
                        {formatCurrency(bounty.reward_amount, bounty.reward_currency)}
                      </td>
                      <td className="py-4 px-4 font-mono text-[#8E9894]">
                        <Link to={`/bounties/${bounty.id}`} className="hover:underline text-[#24D6B1]">
                          {bounty.applications_count} proposal{bounty.applications_count === 1 ? '' : 's'}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={bounty.status} />
                      </td>
                      <td className="py-4 px-4 font-mono text-[#8E9894]">
                        {formatDate(bounty.deadline)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Workroom Link if in progress/review/completed */}
                          {(bounty.status === 'in_progress' || bounty.status === 'in_review' || bounty.status === 'completed') && (
                            <Link to={`/work/${bounty.id}`}>
                              <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" title="Open Workroom">
                                Workroom
                              </Button>
                            </Link>
                          )}

                          <Link to={`/bounties/${bounty.id}`}>
                            <button
                              className="p-1.5 rounded-lg bg-[#141A18] border border-[#25302C] text-[#8E9894] hover:text-[#F4F5F1] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>

                          <Link to={`/bounties/${bounty.id}/edit`}>
                            <button
                              className="p-1.5 rounded-lg bg-[#141A18] border border-[#25302C] text-[#8E9894] hover:text-[#F4F5F1] transition-colors"
                              title="Edit Bounty"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </Link>

                          {bounty.status === 'open' && (
                            <button
                              onClick={() => handleCloseBounty(bounty.id)}
                              className="text-xs text-red-400 hover:underline pl-1"
                              title="Cancel Bounty"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
