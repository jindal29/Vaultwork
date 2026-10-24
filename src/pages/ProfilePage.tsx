import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { profileService } from '@/services/profileService'
import { bountyService } from '@/services/bountyService'
import { Profile, Bounty } from '@/types/database'
import { useAuth } from '@/context/AuthContext'
import { SkillTag } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { BountyCard } from '@/components/bounty/BountyCard'
import { truncateAddress } from '@/lib/utils'
import { 
  ExternalLink, 
  Wallet, 
  CheckCircle2, 
  Briefcase, 
  Coins, 
  Edit3, 
  Layers 
} from 'lucide-react'
import { GithubIcon } from '@/components/common/Icons'

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user, profile: authProfile } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [createdBounties, setCreatedBounties] = useState<Bounty[]>([])
  const [completedBounties, setCompletedBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'completed' | 'created'>('completed')

  const profileId = id || user?.id

  useEffect(() => {
    if (!profileId) return
    setLoading(true)

    profileService.getProfile(profileId)
      .then(async (prof) => {
        setProfile(prof)
        if (prof) {
          const allBounties = await bountyService.getBounties({ status: 'all' })
          setCreatedBounties(allBounties.filter(b => b.creator_id === prof.id))
          setCompletedBounties(allBounties.filter(b => b.assigned_developer_id === prof.id && b.status === 'completed'))
        }
      })
      .finally(() => setLoading(false))
  }, [profileId])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#24D6B1] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#F4F5F1]">Profile Not Found</h2>
        <Link to="/bounties">
          <Button variant="secondary" size="sm">Explore Bounties</Button>
        </Link>
      </div>
    )
  }

  const isOwner = user?.id === profile.id

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* Profile Header Card */}
      <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={profile.display_name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#283530] shadow-xl"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold text-[#F4F5F1] font-display">
                  {profile.display_name}
                </h1>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#24D6B1]/10 text-[#24D6B1] border border-[#24D6B1]/20">
                  Verified Builder
                </span>
              </div>
              <p className="text-xs font-mono text-[#8E9894]">@{profile.username}</p>
              <p className="text-xs text-[#8E9894] max-w-xl leading-relaxed pt-1">
                {profile.bio || 'Cryptographic architect and decentralized bounty contributor.'}
              </p>
            </div>
          </div>

          {isOwner && (
            <Link to="/settings" className="shrink-0">
              <Button variant="secondary" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                Edit Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Links & Details Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#232B28] text-xs">
          <div className="flex flex-wrap items-center gap-4 text-[#8E9894]">
            {profile.wallet_address && (
              <span className="flex items-center gap-1.5 font-mono text-[#F4F5F1] bg-[#141A18] px-2.5 py-1 rounded-lg border border-[#232B28]">
                <Wallet className="w-3.5 h-3.5 text-[#24D6B1]" />
                {truncateAddress(profile.wallet_address)}
              </span>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#24D6B1] hover:underline"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {profile.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#24D6B1] hover:underline"
              >
                <span>Portfolio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-[#8E9894]">
              Completed: <strong className="text-[#24D6B1]">{completedBounties.length || profile.bounties_completed || 0}</strong>
            </span>
            <span className="text-[#8E9894]">
              Commissioned: <strong className="text-[#F4F5F1]">{createdBounties.length}</strong>
            </span>
          </div>
        </div>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5">
            {profile.skills.map(s => (
              <SkillTag key={s} skill={s} />
            ))}
          </div>
        )}
      </div>

      {/* Tabs: Completed vs Commissioned Bounties */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-[#232B28] pb-px">
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'border-[#24D6B1] text-[#24D6B1]'
                : 'border-transparent text-[#8E9894] hover:text-[#F4F5F1]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed Work ({completedBounties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('created')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'created'
                ? 'border-[#24D6B1] text-[#24D6B1]'
                : 'border-transparent text-[#8E9894] hover:text-[#F4F5F1]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Commissioned Bounties ({createdBounties.length})</span>
          </button>
        </div>

        {activeTab === 'completed' ? (
          completedBounties.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8E9894] bg-[#191F1D] rounded-2xl border border-[#25302C]">
              No completed bounties on record yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedBounties.map(b => (
                <BountyCard key={b.id} bounty={b} />
              ))}
            </div>
          )
        ) : (
          createdBounties.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8E9894] bg-[#191F1D] rounded-2xl border border-[#25302C]">
              No bounties posted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdBounties.map(b => (
                <BountyCard key={b.id} bounty={b} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
