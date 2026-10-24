import React from 'react'
import { BountyCategory, BountyStatus } from '../../types/database'
import { BountyFilterOptions } from '../../services/bountyService'
import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react'

const CATEGORIES: (BountyCategory | 'All')[] = [
  'All',
  'Smart Contracts',
  'Frontend / UI',
  'Fullstack',
  'Security / Audit',
  'Design / UX',
  'DeFi / Protocol',
  'DevOps / Infra'
]

const STATUSES: { value: BountyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'completed', label: 'Completed' }
]

interface BountyFiltersProps {
  filters: BountyFilterOptions
  onChange: (filters: BountyFilterOptions) => void
  totalCount: number
}

export const BountyFilters: React.FC<BountyFiltersProps> = ({
  filters,
  onChange,
  totalCount
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const handleCategorySelect = (cat: BountyCategory | 'All') => {
    onChange({ ...filters, category: cat })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value })
  }

  const handleClearSearch = () => {
    onChange({ ...filters, search: '' })
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, sortBy: e.target.value as BountyFilterOptions['sortBy'] })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, status: e.target.value as BountyFilterOptions['status'] })
  }

  const handleMinReward = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined
    onChange({ ...filters, minReward: val })
  }

  const handleMaxReward = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined
    onChange({ ...filters, maxReward: val })
  }

  const hasActiveFilters = Boolean(
    filters.search || 
    (filters.category && filters.category !== 'All') || 
    (filters.status && filters.status !== 'all') || 
    filters.minReward || 
    filters.maxReward
  )

  const handleReset = () => {
    onChange({
      search: '',
      category: 'All',
      status: 'all',
      sortBy: 'newest',
      minReward: undefined,
      maxReward: undefined
    })
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Primary search & sort bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8E9894] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Search by keywords, title, skills (e.g. Solidity, React, ZK)..."
            className="w-full bg-[#191F1D] border border-[#25302C] rounded-xl pl-10 pr-9 py-2.5 text-sm text-[#F4F5F1] placeholder-[#626D68] focus:outline-none focus:border-[#24D6B1] focus:ring-1 focus:ring-[#24D6B1]/40 transition-colors"
          />
          {filters.search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8E9894] hover:text-[#F4F5F1]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Advanced toggle */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={filters.sortBy || 'newest'}
              onChange={handleSortChange}
              className="appearance-none bg-[#191F1D] border border-[#25302C] text-xs font-medium text-[#F4F5F1] py-2.5 pl-8 pr-8 rounded-xl focus:outline-none focus:border-[#24D6B1] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="reward_desc">Highest Reward</option>
              <option value="deadline_asc">Nearest Deadline</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8E9894] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'bg-[#24D6B1]/10 border-[#24D6B1]/40 text-[#24D6B1]'
                : 'bg-[#191F1D] border-[#25302C] text-[#8E9894] hover:text-[#F4F5F1]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {CATEGORIES.map((cat) => {
          const isSelected = (!filters.category && cat === 'All') || filters.category === cat
          return (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#24D6B1] text-[#101413] border-[#24D6B1] font-semibold shadow-[0_0_15px_rgba(36,214,177,0.2)]'
                  : 'bg-[#191F1D] text-[#8E9894] border-[#25302C] hover:text-[#F4F5F1] hover:border-[#33423D]'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Advanced Filter Panel */}
      {showAdvanced && (
        <div className="p-4 rounded-xl bg-[#161C1A] border border-[#232B28] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9894] mb-1.5">
                Bounty Status
              </label>
              <select
                value={filters.status || 'all'}
                onChange={handleStatusChange}
                className="w-full bg-[#191F1D] border border-[#25302C] text-xs text-[#F4F5F1] p-2.5 rounded-lg focus:outline-none focus:border-[#24D6B1]"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9894] mb-1.5">
                Min Reward (USDC)
              </label>
              <input
                type="number"
                value={filters.minReward ?? ''}
                onChange={handleMinReward}
                placeholder="e.g. 1000"
                className="w-full bg-[#191F1D] border border-[#25302C] text-xs text-[#F4F5F1] p-2.5 rounded-lg focus:outline-none focus:border-[#24D6B1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9894] mb-1.5">
                Max Reward (USDC)
              </label>
              <input
                type="number"
                value={filters.maxReward ?? ''}
                onChange={handleMaxReward}
                placeholder="e.g. 20000"
                className="w-full bg-[#191F1D] border border-[#25302C] text-xs text-[#F4F5F1] p-2.5 rounded-lg focus:outline-none focus:border-[#24D6B1]"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end pt-2 border-t border-[#232B28]">
              <button
                onClick={handleReset}
                className="text-xs text-red-400 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Reset all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count bar */}
      <div className="flex items-center justify-between text-xs text-[#8E9894] pt-1">
        <span>Showing <strong className="text-[#F4F5F1]">{totalCount}</strong> bounties</span>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-[#24D6B1] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
