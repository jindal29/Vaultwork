import React from 'react'
import { BountyStatus } from '../../types/database'
import { Check, Clock, Eye, Sparkles } from 'lucide-react'

export const WorkroomTimeline: React.FC<{ status: BountyStatus }> = ({ status }) => {
  const steps = [
    { id: 'open', label: 'Bounty Funded', desc: 'Requirements defined' },
    { id: 'in_progress', label: 'Developer Assigned', desc: 'Work underway' },
    { id: 'in_review', label: 'In Review', desc: 'Deliverables submitted' },
    { id: 'completed', label: 'Approved & Completed', desc: 'Escrow released' }
  ]

  const getStepIndex = (s: BountyStatus) => {
    switch (s) {
      case 'open':
        return 0
      case 'in_progress':
        return 1
      case 'in_review':
        return 2
      case 'completed':
        return 3
      default:
        return 0
    }
  }

  const currentIdx = getStepIndex(status)

  return (
    <div className="w-full py-4">
      <div className="grid grid-cols-4 gap-2 relative">
        {/* Connecting bar */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#25302C] -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-[#24D6B1] -z-0 transition-all duration-500"
          style={{ width: `${(currentIdx / 3) * 88}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < currentIdx || (idx === 3 && status === 'completed')
          const isCurrent = idx === currentIdx && status !== 'completed'

          return (
            <div key={step.id} className="flex flex-col items-center text-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isDone
                    ? 'bg-[#24D6B1] text-[#101413] shadow-[0_0_12px_rgba(36,214,177,0.4)]'
                    : isCurrent
                    ? 'bg-[#191F1D] border-2 border-[#24D6B1] text-[#24D6B1] ring-4 ring-[#24D6B1]/20'
                    : 'bg-[#191F1D] border border-[#25302C] text-[#626D68]'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrent ? (
                  idx === 2 ? <Eye className="w-4 h-4 animate-pulse" /> : <Clock className="w-4 h-4 animate-spin text-[#24D6B1]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <div className="mt-2.5 space-y-0.5">
                <p
                  className={`text-xs font-medium ${
                    isDone || isCurrent ? 'text-[#F4F5F1]' : 'text-[#626D68]'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-[#8E9894] hidden sm:block">
                  {step.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      {status === 'completed' && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>All milestone requirements fulfilled and approved! Escrow payment settled.</span>
        </div>
      )}
    </div>
  )
}
