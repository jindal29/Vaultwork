import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { bountyService } from '@/services/bountyService'
import { BountyCategory, RewardCurrency } from '@/types/database'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/common/Button'
import { Input, Textarea } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { SkillTag } from '@/components/common/Badge'
import { ArrowLeft, Plus, Sparkles, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const bountySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(120, 'Title too long'),
  shortSummary: z.string().min(20, 'Provide a concise summary of at least 20 characters').max(200, 'Max 200 characters'),
  description: z.string().min(50, 'Detailed technical scope must be at least 50 characters'),
  category: z.string().min(1, 'Please select a category'),
  rewardAmount: z.coerce.number().min(50, 'Minimum reward is $50 equivalent'),
  rewardCurrency: z.string().min(1, 'Please select a currency'),
  deadline: z.string().min(1, 'Please specify a deadline date'),
  deliverables: z.string().min(20, 'Please list explicit deliverables (code, tests, PRs)'),
  acceptanceCriteria: z.string().min(20, 'Please state measurable acceptance criteria'),
  repoUrl: z.string().url('Must be a valid URL').optional().or(z.literal(''))
})

type BountyFormValues = z.infer<typeof bountySchema>

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

export const CreateBountyPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [skills, setSkills] = useState<string[]>(['Solidity', 'Foundry', 'TypeScript'])
  const [skillInput, setSkillInput] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BountyFormValues>({
    resolver: zodResolver(bountySchema),
    defaultValues: {
      title: '',
      shortSummary: '',
      description: '',
      category: 'Smart Contracts',
      rewardAmount: 2500,
      rewardCurrency: 'USDC',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliverables: '- GitHub Pull Request\n- Full test coverage with Foundry/Hardhat\n- Documentation and verification notes',
      acceptanceCriteria: '- All automated CI tests pass\n- Zero high/medium Slither security warnings\n- Code adheres to style guide',
      repoUrl: ''
    }
  })

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

  const onSubmit = async (values: BountyFormValues, isDraft: boolean = false) => {
    if (!user) {
      toast.error('Please sign in to publish a bounty')
      navigate('/login')
      return
    }

    if (skills.length === 0) {
      toast.error('Please add at least one technical skill tag')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await bountyService.createBounty({
        creator_id: user.id,
        title: values.title,
        short_summary: values.shortSummary,
        description: values.description,
        category: values.category as BountyCategory,
        skills,
        reward_amount: values.rewardAmount,
        reward_currency: values.rewardCurrency as RewardCurrency,
        deadline: new Date(values.deadline).toISOString(),
        deliverables: values.deliverables,
        acceptance_criteria: values.acceptanceCriteria,
        repo_url: values.repoUrl || undefined,
        status: isDraft ? 'draft' : 'open',
        assigned_developer_id: null
      })

      if (res.error) {
        toast.error(res.error.message || 'Failed to create bounty')
        return
      }

      toast.success(isDraft ? 'Bounty saved as draft!' : 'Bounty published successfully!')
      navigate(`/bounties/${res.data?.id || ''}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating bounty'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/bounties"
          className="inline-flex items-center gap-1.5 text-xs text-[#8E9894] hover:text-[#24D6B1] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explore</span>
        </Link>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-mono font-medium text-[#24D6B1] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Create Commission
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#F4F5F1] font-display">
          Post a Protocol Bounty
        </h1>
        <p className="text-sm text-[#8E9894] leading-relaxed">
          Define your project scope, deliverables, and lock in the bounty reward. Developers will review the specification and submit implementation proposals.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono border-b border-[#232B28] pb-3">
            1. Core Overview
          </h2>

          <Input
            label="Bounty Title *"
            placeholder="e.g. Uniswap V4 Custom Dynamic Volatility Fee Hook"
            error={errors.title?.message}
            {...register('title')}
          />

          <Input
            label="One-line Summary *"
            placeholder="e.g. Architect a production-ready v4 Hook implementing TWAP-based volatility surge pricing."
            error={errors.shortSummary?.message}
            helperText="Appears on search result cards and explore feed."
            {...register('shortSummary')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Primary Category *"
              options={CATEGORIES}
              error={errors.category?.message}
              {...register('category')}
            />

            <Input
              label="Reference Repository (Optional)"
              placeholder="https://github.com/org/repo"
              error={errors.repoUrl?.message}
              {...register('repoUrl')}
            />
          </div>

          {/* Skills Tag Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9894]">
              Required Technical Skills *
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
                placeholder="Type skill & press Enter (e.g. Circom, Rust, Next.js)..."
                className="bg-transparent text-xs text-[#F4F5F1] placeholder-[#626D68] focus:outline-none flex-1 min-w-[180px] py-1 px-1"
              />
            </div>
            <p className="text-[11px] text-[#626D68]">Press Enter or comma to add a skill tag.</p>
          </div>
        </div>

        {/* Detailed Scope */}
        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono border-b border-[#232B28] pb-3">
            2. Scope & Acceptance Standards
          </h2>

          <Textarea
            label="Full Technical Description *"
            placeholder="Outline context, architecture, mathematical formulas, or background information..."
            rows={6}
            error={errors.description?.message}
            {...register('description')}
          />

          <Textarea
            label="Deliverables *"
            placeholder="- GitHub PR with full Foundry test suite&#10;- Deployment scripts on Arbitrum Sepolia&#10;- Written architecture overview"
            rows={4}
            error={errors.deliverables?.message}
            {...register('deliverables')}
          />

          <Textarea
            label="Acceptance Criteria *"
            placeholder="- 100% test branch coverage&#10;- Slither security scan zero High/Medium warnings&#10;- Adherence to gas budget"
            rows={4}
            error={errors.acceptanceCriteria?.message}
            {...register('acceptanceCriteria')}
          />
        </div>

        {/* Reward & Timeline */}
        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono border-b border-[#232B28] pb-3">
            3. Reward Pool & Deadline
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Reward Amount *"
              placeholder="e.g. 5000"
              error={errors.rewardAmount?.message}
              {...register('rewardAmount')}
            />

            <Select
              label="Currency *"
              options={CURRENCIES}
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

          <div className="p-4 rounded-xl bg-[#141A18] border border-[#232B28] text-xs text-[#8E9894] flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#24D6B1] shrink-0 mt-0.5" />
            <p>
              By publishing, you commit to depositing the reward into escrow upon assigning a developer. Funds remain locked until acceptance criteria are verified or mutual cancellation occurs.
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSubmit((data) => onSubmit(data, true))}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>

          <Button
            type="submit"
            isLoading={isSubmitting}
            rightIcon={<Check className="w-4 h-4" />}
          >
            Publish Bounty
          </Button>
        </div>
      </form>
    </div>
  )
}
