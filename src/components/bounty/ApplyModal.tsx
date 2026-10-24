import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Input, Textarea } from '../common/Input'
import { Bounty } from '../../types/database'
import { useAuth } from '../../context/AuthContext'
import { applicationService } from '../../services/applicationService'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react'

const applySchema = z.object({
  coverLetter: z.string().min(30, 'Cover letter must be at least 30 characters explaining your technical approach'),
  relevantExperience: z.string().min(20, 'Please describe relevant projects or expertise'),
  estimatedDays: z.coerce.number().min(1, 'Minimum delivery time is 1 day').max(90, 'Maximum is 90 days'),
  portfolioLink: z.string().url('Please provide a valid URL (GitHub or Portfolio)').optional().or(z.literal('')),
  supportingLinks: z.string().optional()
})

type ApplyFormValues = z.infer<typeof applySchema>

interface ApplyModalProps {
  isOpen: boolean
  onClose: () => void
  bounty: Bounty
  onSuccess?: () => void
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  isOpen,
  onClose,
  bounty,
  onSuccess
}) => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      coverLetter: '',
      relevantExperience: '',
      estimatedDays: 7,
      portfolioLink: '',
      supportingLinks: ''
    }
  })

  // Eligibility checks
  const isOwner = user?.id === bounty.creator_id
  const isClosed = bounty.status !== 'open'
  const isExpired = new Date(bounty.deadline).getTime() < Date.now()

  const onSubmit = async (values: ApplyFormValues) => {
    if (!user) {
      toast.error('Please sign in to submit a proposal')
      return
    }

    if (isOwner) {
      toast.error('You cannot apply to your own bounty')
      return
    }

    try {
      setIsSubmitting(true)

      const linksArray = values.supportingLinks
        ? values.supportingLinks.split('\n').map(l => l.trim()).filter(Boolean)
        : []

      const res = await applicationService.submitApplication({
        bounty_id: bounty.id,
        developer_id: user.id,
        cover_letter: values.coverLetter,
        relevant_experience: values.relevantExperience,
        estimated_delivery_days: values.estimatedDays,
        portfolio_link: values.portfolioLink || undefined,
        links: linksArray
      })

      if (res.error) {
        toast.error(res.error.message || 'Failed to submit proposal')
        return
      }

      setIsSubmitted(true)
      toast.success('Proposal submitted successfully!')
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error submitting proposal'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsSubmitted(false)
    reset()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSubmitted ? 'Proposal Submitted' : `Submit Proposal: ${bounty.title}`}
      description={
        isSubmitted
          ? 'Your application has been received by the creator. You will receive a notification upon review.'
          : 'Detail your implementation architecture, timeline and verified credentials.'
      }
      maxWidth="lg"
    >
      {isOwner ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>You are the creator of this bounty and cannot submit an application to yourself.</span>
        </div>
      ) : isClosed || isExpired ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>This bounty is currently closed or has passed its submission deadline.</span>
        </div>
      ) : isSubmitted ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#24D6B1]/10 border border-[#24D6B1]/30 text-[#24D6B1] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-[#F4F5F1] font-display">
            Application Dispatched to Creator
          </h4>
          <p className="text-xs text-[#8E9894] max-w-sm mx-auto">
            The creator will review your proposal. If selected, the bounty will transition into an active Workroom for milestone delivery.
          </p>
          <div className="pt-2">
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          {/* Cover Letter */}
          <Textarea
            label="Proposal & Technical Approach *"
            placeholder="Explain how you plan to implement the requirements, libraries you will use, and edge cases you will account for..."
            rows={4}
            error={errors.coverLetter?.message}
            {...register('coverLetter')}
          />

          {/* Relevant Experience */}
          <Textarea
            label="Relevant Past Work & Experience *"
            placeholder="List similar protocols, PRs, or contracts you have developed..."
            rows={2}
            error={errors.relevantExperience?.message}
            {...register('relevantExperience')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Delivery Days */}
            <Input
              type="number"
              label="Proposed Delivery Time (Days) *"
              placeholder="e.g. 7"
              error={errors.estimatedDays?.message}
              {...register('estimatedDays')}
            />

            {/* Portfolio Link */}
            <Input
              label="Primary GitHub or Portfolio Link"
              placeholder="https://github.com/your-username"
              error={errors.portfolioLink?.message}
              {...register('portfolioLink')}
            />
          </div>

          {/* Supporting Links */}
          <Textarea
            label="Additional Reference Links (Optional, 1 per line)"
            placeholder="https://etherscan.io/address/...\nhttps://github.com/..."
            rows={2}
            {...register('supportingLinks')}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232B28]">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit Proposal
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
