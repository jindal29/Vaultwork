import React from 'react'
import { cn } from '../../lib/utils'
import { BountyStatus, ApplicationStatus } from '../../types/database'

interface BadgeProps {
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'teal' | 'outline' | 'surface'
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant = 'default'
}) => {
  const variants = {
    default: 'bg-[#1E2623] text-[#8E9894] border-[#25302C]',
    teal: 'bg-[#24D6B1]/10 text-[#24D6B1] border-[#24D6B1]/30',
    outline: 'bg-transparent text-[#8E9894] border-[#25302C]',
    surface: 'bg-[#191F1D] text-[#F4F5F1] border-[#2A3632]'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border transition-colors',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export const StatusBadge: React.FC<{ status: BountyStatus; className?: string }> = ({ status, className }) => {
  switch (status) {
    case 'open':
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#24D6B1]/10 text-[#24D6B1] border border-[#24D6B1]/30', className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#24D6B1] animate-pulse" />
          Open for Applications
        </span>
      )
    case 'in_progress':
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30', className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          In Progress
        </span>
      )
    case 'in_review':
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30', className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          Under Review
        </span>
      )
    case 'completed':
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30', className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Completed & Paid
        </span>
      )
    case 'draft':
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700', className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          Draft
        </span>
      )
    case 'cancelled':
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30', className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Cancelled
        </span>
      )
    default:
      return null
  }
}

export const ApplicationStatusBadge: React.FC<{ status: ApplicationStatus; className?: string }> = ({ status, className }) => {
  switch (status) {
    case 'pending':
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20', className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Pending Review
        </span>
      )
    case 'accepted':
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#24D6B1]/10 text-[#24D6B1] border border-[#24D6B1]/30', className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#24D6B1]" />
          Accepted / Assigned
        </span>
      )
    case 'rejected':
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20', className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Declined
        </span>
      )
    case 'withdrawn':
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700', className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          Withdrawn
        </span>
      )
    default:
      return null
  }
}

export const SkillTag: React.FC<{ skill: string; className?: string; onRemove?: () => void }> = ({ skill, className, onRemove }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-[#191F1D] text-[#8E9894] border border-[#25302C] hover:border-[#33423D] hover:text-[#F4F5F1] transition-colors',
        className
      )}
    >
      <span>{skill}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-red-400 focus:outline-none"
        >
          ×
        </button>
      )}
    </span>
  )
}
