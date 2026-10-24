import React from 'react'
import { Link } from 'react-router-dom'
import { Bounty } from '../../types/database'
import { StatusBadge, SkillTag } from '../common/Badge'
import { formatCurrency, formatDaysRemaining } from '../../lib/utils'
import { Users, Clock, ArrowUpRight } from 'lucide-react'

export const BountyCard: React.FC<{ bounty: Bounty }> = ({ bounty }) => {
  const daysInfo = formatDaysRemaining(bounty.deadline)

  return (
    <Link
      to={`/bounties/${bounty.id}`}
      className="group block rounded-xl bg-[#191F1D] border border-[#25302C] hover:border-[#24D6B1]/50 p-6 transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),0_0_20px_rgba(36,214,177,0.06)] hover:-translate-y-0.5 relative overflow-hidden"
    >
      {/* Subtle top border highlight on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#24D6B1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header: Creator & Status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={bounty.creator?.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
            alt={bounty.creator?.display_name || 'Creator'}
            className="w-9 h-9 rounded-lg object-cover border border-[#283530] shrink-0"
          />
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#F4F5F1] block truncate group-hover:text-[#24D6B1] transition-colors">
              {bounty.creator?.display_name || 'Anonymous Creator'}
            </span>
            <span className="text-[11px] font-mono text-[#8E9894] block truncate">
              @{bounty.creator?.username || 'creator'}
            </span>
          </div>
        </div>

        <StatusBadge status={bounty.status} />
      </div>

      {/* Bounty Title & Summary */}
      <div className="space-y-2 mb-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-[#F4F5F1] group-hover:text-[#24D6B1] transition-colors line-clamp-2 font-display leading-snug">
            {bounty.title}
          </h3>
          <ArrowUpRight className="w-4 h-4 text-[#8E9894] group-hover:text-[#24D6B1] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1" />
        </div>
        <p className="text-xs text-[#8E9894] line-clamp-2 leading-relaxed">
          {bounty.short_summary}
        </p>
      </div>

      {/* Skills list */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <span className="text-[11px] font-medium text-[#24D6B1] px-2 py-0.5 rounded bg-[#24D6B1]/10 border border-[#24D6B1]/20">
          {bounty.category}
        </span>
        {bounty.skills.slice(0, 3).map((skill) => (
          <SkillTag key={skill} skill={skill} />
        ))}
        {bounty.skills.length > 3 && (
          <span className="text-[11px] text-[#626D68] self-center px-1 font-mono">
            +{bounty.skills.length - 3}
          </span>
        )}
      </div>

      {/* Footer: Reward & Meta */}
      <div className="pt-4 border-t border-[#232B28] flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9894] block">
            Reward Pool
          </span>
          <span className="text-base font-bold text-[#F4F5F1] font-mono group-hover:text-[#24D6B1] transition-colors">
            {formatCurrency(bounty.reward_amount, bounty.reward_currency)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#8E9894]">
          <span className="flex items-center gap-1 font-mono">
            <Users className="w-3.5 h-3.5 text-[#626D68]" />
            {bounty.applications_count}
          </span>
          <span
            className={`flex items-center gap-1 font-mono ${
              daysInfo.isUrgent ? 'text-amber-400 font-semibold' : 'text-[#8E9894]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {daysInfo.text}
          </span>
        </div>
      </div>
    </Link>
  )
}
