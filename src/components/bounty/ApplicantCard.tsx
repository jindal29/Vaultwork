import React, { useState } from 'react'
import { Application } from '../../types/database'
import { ApplicationStatusBadge } from '../common/Badge'
import { Button } from '../common/Button'
import { formatTimeAgo } from '../../lib/utils'
import { ExternalLink, Check, X, Clock, Briefcase } from 'lucide-react'
import { GithubIcon } from '../common/Icons'

interface ApplicantCardProps {
  application: Application
  isCreator: boolean
  onAccept?: (applicationId: string, developerId: string) => Promise<void>
  onReject?: (applicationId: string) => Promise<void>
}

export const ApplicantCard: React.FC<ApplicantCardProps> = ({
  application,
  isCreator,
  onAccept,
  onReject
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const dev = application.developer

  const handleAccept = async () => {
    if (!onAccept || !dev) return
    setIsProcessing(true)
    try {
      await onAccept(application.id, dev.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!onReject) return
    setIsProcessing(true)
    try {
      await onReject(application.id)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="rounded-xl bg-[#191F1D] border border-[#25302C] p-5 space-y-4">
      {/* Developer Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={dev?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={dev?.display_name || 'Developer'}
            className="w-10 h-10 rounded-lg object-cover border border-[#283530]"
          />
          <div>
            <h4 className="text-sm font-bold text-[#F4F5F1] font-display flex items-center gap-2">
              {dev?.display_name || 'Applicant'}
              {dev?.bounties_completed !== undefined && dev.bounties_completed > 0 && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#24D6B1]/10 text-[#24D6B1] border border-[#24D6B1]/20">
                  {dev.bounties_completed} completed
                </span>
              )}
            </h4>
            <span className="text-xs font-mono text-[#8E9894]">@{dev?.username || 'developer'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ApplicationStatusBadge status={application.status} />
          <span className="text-[11px] text-[#626D68] font-mono hidden sm:inline">
            {formatTimeAgo(application.created_at)}
          </span>
        </div>
      </div>

      {/* Cover Letter & Proposal */}
      <div className="space-y-2 text-xs">
        <div className="p-3.5 rounded-lg bg-[#141A18] border border-[#232B28] space-y-2">
          <span className="font-semibold text-[#8E9894] uppercase tracking-wider text-[10px] block">
            Technical Proposal
          </span>
          <p className="text-[#F4F5F1] leading-relaxed whitespace-pre-line">
            {application.cover_letter}
          </p>
        </div>

        {application.relevant_experience && (
          <div className="p-3 rounded-lg bg-[#141A18]/60 border border-[#232B28]/60 text-xs">
            <span className="font-semibold text-[#8E9894] uppercase tracking-wider text-[10px] block mb-1">
              Relevant Experience
            </span>
            <p className="text-[#8E9894] leading-relaxed">
              {application.relevant_experience}
            </p>
          </div>
        )}
      </div>

      {/* Meta & Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#232B28] text-xs">
        <div className="flex items-center gap-4 text-[#8E9894]">
          <span className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-[#24D6B1]" />
            Proposed: {application.estimated_delivery_days} days
          </span>
          {application.portfolio_link && (
            <a
              href={application.portfolio_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[#24D6B1] hover:underline"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Portfolio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Creator Decision Controls */}
        {isCreator && application.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              isLoading={isProcessing}
              leftIcon={<X className="w-3.5 h-3.5 text-red-400" />}
              onClick={handleReject}
              className="text-red-400 hover:bg-red-500/10"
            >
              Decline
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isProcessing}
              leftIcon={<Check className="w-3.5 h-3.5" />}
              onClick={handleAccept}
            >
              Accept & Assign
            </Button>
          </div>
        )}

        {application.status === 'accepted' && (
          <span className="text-xs text-[#24D6B1] font-medium flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            Selected Developer for Workroom
          </span>
        )}
      </div>
    </div>
  )
}
