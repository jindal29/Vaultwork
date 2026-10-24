export type BountyStatus = 'draft' | 'open' | 'in_progress' | 'in_review' | 'completed' | 'cancelled'

export type BountyCategory = 
  | 'Smart Contracts' 
  | 'Frontend / UI' 
  | 'Fullstack' 
  | 'Security / Audit' 
  | 'Design / UX' 
  | 'DeFi / Protocol' 
  | 'DevOps / Infra'

export type RewardCurrency = 'USDC' | 'USDT' | 'ETH' | 'SOL'

export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  bio?: string
  skills: string[]
  github_url?: string
  portfolio_url?: string
  wallet_address?: string
  created_at: string
  updated_at?: string
  bounties_completed?: number
  total_earned_usd?: number
}

export interface Bounty {
  id: string
  creator_id: string
  title: string
  short_summary: string
  description: string
  category: BountyCategory
  skills: string[]
  reward_amount: number
  reward_currency: RewardCurrency
  deadline: string
  deliverables: string
  acceptance_criteria: string
  repo_url?: string
  status: BountyStatus
  assigned_developer_id?: string | null
  applications_count: number
  created_at: string
  updated_at?: string
  creator?: Profile
  assigned_developer?: Profile
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface Application {
  id: string
  bounty_id: string
  developer_id: string
  cover_letter: string
  relevant_experience: string
  estimated_delivery_days: number
  portfolio_link?: string
  links: string[]
  status: ApplicationStatus
  created_at: string
  updated_at?: string
  bounty?: Bounty
  developer?: Profile
}

export type SubmissionStatus = 'submitted' | 'revision_requested' | 'approved'

export interface Submission {
  id: string
  bounty_id: string
  developer_id: string
  submission_notes: string
  deliverable_urls: string[]
  github_pr_url?: string
  status: SubmissionStatus
  feedback?: string | null
  created_at: string
  updated_at?: string
  developer?: Profile
}

export type NotificationType = 
  | 'application_received' 
  | 'application_accepted' 
  | 'application_rejected' 
  | 'work_submitted' 
  | 'revision_requested' 
  | 'bounty_completed'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  link: string
  read: boolean
  created_at: string
}
