import React, { useEffect, useState, useTransition } from 'react'
import { bountyService, BountyFilterOptions } from '@/services/bountyService'
import { Bounty } from '@/types/database'
import { BountyCard } from '@/components/bounty/BountyCard'
import { BountyFilters } from '@/components/bounty/BountyFilters'
import { BountyCardSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchX, Sparkles } from 'lucide-react'

export const ExploreBountiesPage: React.FC = () => {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  const [filters, setFilters] = useState<BountyFilterOptions>({
    search: '',
    category: 'All',
    status: 'all',
    sortBy: 'newest'
  })

  useEffect(() => {
    setLoading(true)
    bountyService.getBounties(filters)
      .then((data) => {
        startTransition(() => {
          setBounties(data)
        })
      })
      .catch((err) => console.error('Failed to load bounties:', err))
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Page Header */}
      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-[#24D6B1]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Decentralized Discovery</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F5F1] font-display">
          Explore Protocol Bounties
        </h1>
        <p className="text-sm text-[#8E9894] max-w-2xl leading-relaxed">
          Discover verified opportunities across Smart Contracts, Zero Knowledge, DeFi Protocols, and Web3 Frontend. Apply with your proposal to be assigned to an active Workroom.
        </p>
      </div>

      {/* Filters & Search */}
      <BountyFilters
        filters={filters}
        onChange={setFilters}
        totalCount={bounties.length}
      />

      {/* Bounty Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <BountyCardSkeleton key={i} />
          ))}
        </div>
      ) : bounties.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No bounties match your filters"
          description="Try broadening your search keywords, adjusting the reward range, or clearing category restrictions."
          actionLabel="Clear All Filters"
          onAction={() =>
            setFilters({
              search: '',
              category: 'All',
              status: 'all',
              sortBy: 'newest'
            })
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      )}
    </div>
  )
}
