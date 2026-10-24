import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { bountyService } from '@/services/bountyService'
import { Bounty, BountyCategory, RewardCurrency } from '@/types/database'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/common/Button'
import { Input, Textarea } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { SkillTag } from '@/components/common/Badge'
import { ArrowLeft, Save, AlertTriangle, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

const editBountySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  shortSummary: z.string().min(20, 'Provide a concise summary'),
  description: z.string().min(50, 'Scope must be at least 50 characters'),
  category: z.string().min(1, 'Select a category'),
  rewardAmount: z.coerce.number().min(50, 'Minimum reward is $50 equivalent'),
  rewardCurrency: z.string().min(1, 'Select a currency'),
  deadline: z.string().min(1, 'Deadline required'),
  deliverables: z.string().min(20, 'Deliverables required'),
  acceptanceCriteria: z.string().min(20, 'Acceptance criteria required'),
  repoUrl: z.string().url('Must be valid URL').optional().or(z.literal(''))
})

type EditFormValues = z.infer<typeof editBountySchema>

const CATEGORIES: BountyCategory[] = [
  'Smart Contracts',
  'Frontend / UI',
  'Fullstack',
  'Security / Audit',
  'Design / UX',
  'DeFi / Protocol',
  'DevOps / Infra'
]

const CURRENCIES: RewardCurrency[] = ['USDC', 'USDT', 'ETH', 'SOL']

export const EditBountyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EditFormValues>({
    resolver: zodResolver(editBountySchema)
  })

  useEffect(() => {
    if (!id) return
    setLoading(true)
    bountyService.getBountyById(id)
      .then((b) => {
        if (!b) return
        setBounty(b)
        setSkills(b.skills || [])
        reset({
          title: b.title,
          shortSummary: b.short_summary,
          description: b.description,
          category: b.category,
          rewardAmount: b.reward_amount,
          rewardCurrency: b.reward_currency,
          deadline: b.deadline ? new Date(b.deadline).toISOString().split('T')[0] : '',
          deliverables: b.deliverables,
          acceptanceCriteria: b.acceptance_criteria,
          repoUrl: b.repo_url || ''
        })
      })
      .finally(() => setLoading(false))
  }, [id, reset])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#24D6B1] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!bounty) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#F4F5F1]">Bounty Not Found</h2>
        <Link to="/bounties">
          <Button variant="secondary" size="sm">Back to Bounties</Button>
        </Link>
      </div>
    )
  }

  if (user?.id !== bounty.creator_id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-400">Unauthorized</h2>
        <p className="text-xs text-[#8E9894]">Only the creator of this bounty has permission to modify its specifications.</p>
        <Link to={`/bounties/${bounty.id}`}>
          <Button variant="secondary" size="sm">Return to Bounty</Button>
        </Link>
      </div>
    )
  }

  const isAssigned = Boolean(bounty.assigned_developer_id)

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = skillInput.trim().replace(/^,+|,+$/g, '')
      if (trimmed && !skills.includes(trimmed)) {
        setSkills([...skills, trimmed])
        setSkillInput('')
      }
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const onSubmit = async (values: EditFormValues) => {
    try {
      setIsSubmitting(true)
      const res = await bountyService.updateBounty(bounty.id, {
        title: values.title,
        short_summary: values.shortSummary,
        description: values.description,
        category: values.category as BountyCategory,
        skills,
        reward_amount: isAssigned ? bounty.reward_amount : values.rewardAmount,
        reward_currency: values.rewardCurrency as RewardCurrency,
        deadline: new Date(values.deadline).toISOString(),
        deliverables: values.deliverables,
        acceptance_criteria: values.acceptanceCriteria,
        repo_url: values.repoUrl || undefined
      })

      if (res.error) {
        toast.error(res.error.message || 'Failed to update bounty')
        return
      }

      toast.success('Bounty updated successfully!')
      navigate(`/bounties/${bounty.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating bounty'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      <div>
        <Link
          to={`/bounties/${bounty.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#8E9894] hover:text-[#24D6B1] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bounty Details</span>
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#F4F5F1] font-display">
          Edit Bounty Specifications
        </h1>
        <p className="text-sm text-[#8E9894]">
          Update scope, deliverables, or deadlines.
        </p>
      </div>

      {isAssigned && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <strong className="block font-semibold">Active Developer Assigned</strong>
            <p className="text-[#8E9894] leading-relaxed">
              A developer has been assigned to this workroom. The reward amount is locked in escrow and cannot be decreased. Scope modifications must be coordinated with the developer.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono border-b border-[#232B28] pb-3">
            Core Details
          </h2>

          <Input
            label="Bounty Title *"
            error={errors.title?.message}
            {...register('title')}
          />

          <Input
            label="One-line Summary *"
            error={errors.shortSummary?.message}
            {...register('shortSummary')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category *"
              options={CATEGORIES}
              error={errors.category?.message}
              {...register('category')}
            />

            <Input
              label="Reference Repository"
              error={errors.repoUrl?.message}
              {...register('repoUrl')}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9894]">
              Skills
            </label>
            <div className="flex flex-wrap gap-2 items-center p-3 rounded-lg bg-[#141A18] border border-[#25302C]">
              {skills.map(s => (
                <SkillTag key={s} skill={s} onRemove={() => handleRemoveSkill(s)} />
              ))}
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Type skill & press Enter..."
                className="bg-transparent text-xs text-[#F4F5F1] placeholder-[#626D68] focus:outline-none flex-1 min-w-[150px] py-1 px-1"
              />
            </div>
          </div>
        </div>

        {/* Detailed Scope */}
        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono border-b border-[#232B28] pb-3">
            Scope & Criteria
          </h2>

          <Textarea
            label="Full Technical Description *"
            rows={5}
            error={errors.description?.message}
            {...register('description')}
          />

          <Textarea
            label="Deliverables *"
            rows={3}
            error={errors.deliverables?.message}
            {...register('deliverables')}
          />

          <Textarea
            label="Acceptance Criteria *"
            rows={3}
            error={errors.acceptanceCriteria?.message}
            {...register('acceptanceCriteria')}
          />
        </div>

        {/* Reward & Deadline */}
        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono border-b border-[#232B28] pb-3">
            Financial Terms
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Reward Amount"
              disabled={isAssigned}
              error={errors.rewardAmount?.message}
              helperText={isAssigned ? 'Locked due to active developer assignment' : undefined}
              {...register('rewardAmount')}
            />

            <Select
              label="Currency"
              options={CURRENCIES}
              disabled={isAssigned}
              error={errors.rewardCurrency?.message}
              {...register('rewardCurrency')}
            />

            <Input
              type="date"
              label="Submission Deadline *"
              error={errors.deadline?.message}
              {...register('deadline')}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to={`/bounties/${bounty.id}`}>
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting} leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
