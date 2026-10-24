import React from 'react'
import { cn } from '../../lib/utils'

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[#1F2724]/80 border border-[#25302C]/40',
        className
      )}
    />
  )
}

export const BountyCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl bg-[#191F1D] border border-[#25302C] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-3.5" />
            <Skeleton className="w-20 h-2.5" />
          </div>
        </div>
        <Skeleton className="w-24 h-6 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-4/5 h-5" />
        <Skeleton className="w-full h-3.5" />
        <Skeleton className="w-3/4 h-3.5" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-16 h-5 rounded-md" />
        <Skeleton className="w-20 h-5 rounded-md" />
        <Skeleton className="w-16 h-5 rounded-md" />
      </div>
      <div className="pt-4 border-t border-[#232B28] flex items-center justify-between">
        <Skeleton className="w-24 h-5" />
        <Skeleton className="w-28 h-8 rounded-lg" />
      </div>
    </div>
  )
}
