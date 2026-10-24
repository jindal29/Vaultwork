import React from 'react'
import { Button } from './Button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionIcon?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#141A18] border border-[#232B28] my-4">
      <div className="w-14 h-14 rounded-2xl bg-[#191F1D] border border-[#283530] flex items-center justify-center text-[#24D6B1] mb-4 shadow-[0_0_20px_rgba(36,214,177,0.1)]">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-[#F4F5F1] font-display">{title}</h3>
      <p className="text-sm text-[#8E9894] max-w-md mt-1.5 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} rightIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
