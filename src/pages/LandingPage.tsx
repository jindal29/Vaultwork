import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { bountyService } from '@/services/bountyService'
import { Bounty } from '@/types/database'
import { BountyCard } from '@/components/bounty/BountyCard'
import { Button } from '@/components/common/Button'
import { BountyCardSkeleton } from '@/components/common/Skeleton'
import { 
  ArrowRight, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  CheckCircle2, 
  Coins, 
  Code2, 
  Cpu, 
  Sparkles,
  Lock,
  GitPullRequest,
  Check
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  const [featuredBounties, setFeaturedBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bountyService.getBounties({ status: 'open' })
      .then(bounties => {
        setFeaturedBounties(bounties.slice(0, 3))
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Reward Pool', value: '$840,000+', change: '+24% this month' },
    { label: 'Active Web3 Bounties', value: '42', change: 'EVM & Solana' },
    { label: 'Verified Builders', value: '1,280+', change: 'ZK, Rust, Solidity' },
    { label: 'Avg Settlement Time', value: '4.2 Days', change: 'Milestone verified' }
  ]

  const steps = [
    {
      num: '01',
      title: 'Define & Fund Bounty',
      desc: 'Creators specify scope, technical deliverables, deadline and reward in USDC, ETH, or SOL.',
      icon: Layers,
      detail: 'Clear acceptance criteria protect both parties prior to developer assignment.'
    },
    {
      num: '02',
      title: 'Review Proposals & Assign',
      desc: 'Developers submit technical approaches and timelines. Creators inspect track record and accept.',
      icon: Terminal,
      detail: 'Transparent applicant evaluation with zero spam and verified GitHub past work.'
    },
    {
      num: '03',
      title: 'Build in Dedicated Workroom',
      desc: 'Collaborate inside a private milestone workroom with GitHub PR tracking and direct feedback.',
      icon: GitPullRequest,
      detail: 'Iterative revision requests maintain high engineering standards.'
    },
    {
      num: '04',
      title: 'Approve & Release Payment',
      desc: 'Deliverables verified against acceptance criteria. Escrow reward unlocks automatically to builder.',
      icon: Coins,
      detail: 'Guaranteed cryptographic payouts directly into connected developer wallets.'
    }
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-radial-teal pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#191F1D] border border-[#24D6B1]/30 text-xs font-mono text-[#24D6B1] shadow-[0_0_20px_rgba(36,214,177,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Web3 Bounty Architecture</span>
            <span className="text-[#626D68]">•</span>
            <span className="text-[#F4F5F1]">v1.0 Live</span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4 max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F4F5F1] font-display leading-[1.08]">
              Work Worth Doing.{' '}
              <span className="vault-gradient-text block sm:inline">
                Rewards Worth Earning.
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-[#8E9894] max-w-2xl mx-auto leading-relaxed">
              Vaultwork connects decentralized protocols with elite smart contract, frontend, and ZK engineers through milestone-governed bounty workrooms.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
          >
            <Link to="/bounties">
              <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore Active Bounties
              </Button>
            </Link>
            <Link to="/bounties/new">
              <Button variant="secondary" size="lg" leftIcon={<Code2 className="w-4 h-4 text-[#24D6B1]" />}>
                Post a Bounty
              </Button>
            </Link>
          </motion.div>

          {/* Animated Bounty Lifecycle Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="pt-10 max-w-4xl mx-auto"
          >
            <div className="rounded-2xl bg-[#161C1A]/90 border border-[#25302C] p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#232B28]">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-[#24D6B1]/80" />
                  <span className="text-xs font-mono text-[#8E9894] ml-2">
                    vaultwork-protocol // lifecycle-state-machine.rs
                  </span>
                </div>
                <span className="text-xs font-mono text-[#24D6B1] bg-[#24D6B1]/10 px-2.5 py-0.5 rounded border border-[#24D6B1]/20">
                  Escrow Lock Guaranteed
                </span>
              </div>

              {/* Graphical Lifecycle Nodes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-[#191F1D] border border-[#25302C] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8E9894]">
                    <span className="font-mono">STATE 01</span>
                    <Lock className="w-3.5 h-3.5 text-[#24D6B1]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#F4F5F1]">Fund Escrow</h4>
                  <p className="text-[11px] text-[#8E9894]">Collateral deposited into vault before proposal window opens.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#191F1D] border border-[#25302C] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8E9894]">
                    <span className="font-mono">STATE 02</span>
                    <Terminal className="w-3.5 h-3.5 text-[#24D6B1]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#F4F5F1]">Assign Builder</h4>
                  <p className="text-[11px] text-[#8E9894]">Creator validates proposal & assigns single builder to workroom.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#191F1D] border border-[#24D6B1]/30 bg-[#24D6B1]/5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#24D6B1]">
                    <span className="font-mono">STATE 03</span>
                    <Cpu className="w-3.5 h-3.5 animate-pulse text-[#24D6B1]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#24D6B1]">Workroom PR</h4>
                  <p className="text-[11px] text-[#8E9894]">Milestone deliverables, code reviews, and iterative feedback.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#191F1D] border border-[#25302C] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8E9894]">
                    <span className="font-mono">STATE 04</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-bold text-[#F4F5F1]">Instant Payout</h4>
                  <p className="text-[11px] text-[#8E9894]">Acceptance criteria verified. Escrow releases directly to wallet.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="border-y border-[#232B28] bg-[#141A18]/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center sm:text-left space-y-1">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-[#F4F5F1]">
                  {stat.value}
                </span>
                <p className="text-xs font-medium text-[#8E9894] uppercase tracking-wider">
                  {stat.label}
                </p>
                <span className="text-[11px] font-mono text-[#24D6B1]">
                  {stat.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Bounties from Supabase / Local Store */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#24D6B1] block mb-1">
              Live Opportunities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F5F1] font-display">
              Featured Protocol Bounties
            </h2>
            <p className="text-sm text-[#8E9894] mt-1">
              Top rewarded tasks awaiting proposals from verified builders.
            </p>
          </div>
          <Link to="/bounties">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All 40+ Bounties
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BountyCardSkeleton />
            <BountyCardSkeleton />
            <BountyCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBounties.map(bounty => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#141A18]/50 border-t border-[#232B28]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#24D6B1]">
              The Collaboration Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F4F5F1] font-display">
              How Vaultwork Operates
            </h2>
            <p className="text-sm text-[#8E9894] leading-relaxed">
              Designed to eliminate ambiguity, payment uncertainty and unaligned development incentives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map(step => (
              <div
                key={step.num}
                className="rounded-xl bg-[#191F1D] border border-[#25302C] p-6 space-y-4 hover:border-[#24D6B1]/40 transition-colors"
              >
                <span className="text-2xl font-mono font-extrabold text-[#24D6B1]/40 block">
                  {step.num}
                </span>
                <h3 className="text-base font-bold text-[#F4F5F1] font-display">
                  {step.title}
                </h3>
                <p className="text-xs text-[#8E9894] leading-relaxed">
                  {step.desc}
                </p>
                <div className="pt-2 border-t border-[#232B28] text-[11px] text-[#626D68]">
                  {step.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Role Benefits for Creators & Developers */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#24D6B1]">
            Unified Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F4F5F1] font-display">
            One Account. Dual Roles.
          </h2>
          <p className="text-sm text-[#8E9894]">
            Every user on Vaultwork can commission specialized engineering and simultaneously build on other protocol bounties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Creators */}
          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#24D6B1]/10 border border-[#24D6B1]/30 text-[#24D6B1] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F4F5F1] font-display">For Project Creators</h3>
                <span className="text-xs text-[#8E9894]">DAOs, Protocol Founders, and Core Devs</span>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs text-[#8E9894]">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#24D6B1] shrink-0 mt-0.5" />
                <span><strong>No unsolicited pull requests:</strong> You select exactly one developer per bounty assignment.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#24D6B1] shrink-0 mt-0.5" />
                <span><strong>Milestone review workroom:</strong> Structured revisions and feedback ensure code satisfies strict security standards.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#24D6B1] shrink-0 mt-0.5" />
                <span><strong>Escrow certainty:</strong> Locked rewards signal financial commitment, attracting top-tier engineering talent.</span>
              </li>
            </ul>

            <Link to="/bounties/new" className="block pt-2">
              <Button variant="secondary" size="sm" className="w-full">
                Post Your First Bounty →
              </Button>
            </Link>
          </div>

          {/* For Developers */}
          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#24D6B1]/10 border border-[#24D6B1]/30 text-[#24D6B1] flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F4F5F1] font-display">For Builders & Engineers</h3>
                <span className="text-xs text-[#8E9894]">Solidity, Rust, React, and Security Auditors</span>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs text-[#8E9894]">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#24D6B1] shrink-0 mt-0.5" />
                <span><strong>Zero unpaid speculation:</strong> Submit proposals upfront and write code only after being formally assigned.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#24D6B1] shrink-0 mt-0.5" />
                <span><strong>Verifiable on-chain track record:</strong> Every completed bounty adds to your immutable builder portfolio.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#24D6B1] shrink-0 mt-0.5" />
                <span><strong>Prompt cryptocurrency payouts:</strong> Direct settlement in USDC, ETH or SOL upon milestone sign-off.</span>
              </li>
            </ul>

            <Link to="/bounties" className="block pt-2">
              <Button size="sm" className="w-full">
                Explore Available Bounties →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Planned Escrow Trust Section */}
      <section className="py-16 bg-[#131917] border-y border-[#232B28]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#191F1D] border border-[#25302C] text-[#24D6B1] mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F5F1] font-display">
              Trust, Security & Planned Multi-Sig Escrow
            </h2>
            <p className="text-xs sm:text-sm text-[#8E9894] leading-relaxed max-w-2xl mx-auto">
              Vaultwork is built with complete transparency. Our application logic currently enforces strict database permissions via PostgreSQL Row-Level Security, while our on-chain multi-sig smart contract escrow vaults are undergoing phased testnet deployment and security audits.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101413] border border-[#232B28] text-xs text-[#626D68] text-left max-w-xl mx-auto space-y-1 font-mono">
            <span className="text-[#24D6B1] block font-semibold">Integrity Protocol Notice:</span>
            <p>Smart contract on-chain escrow release is active on Sepolia & Arbitrum testnets. Production settlements are conducted in phased alignment with verified DAO signers.</p>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-5xl font-bold text-[#F4F5F1] font-display tracking-tight">
          Ready to Build the Future of Web3?
        </h2>
        <p className="text-sm text-[#8E9894] max-w-lg mx-auto">
          Join hundreds of protocols and elite developers building together on Vaultwork.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/signup">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Create Free Account
            </Button>
          </Link>
          <Link to="/bounties">
            <Button variant="secondary" size="lg">
              Browse Bounties
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
