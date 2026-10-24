import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../common/Button'
import { Layers, Briefcase, Bell, Settings, PlusCircle, UserCheck } from 'lucide-react'

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const { profile } = useAuth()

  const navItems = [
    {
      label: 'Creator Hub',
      path: '/dashboard',
      icon: Layers,
      description: 'Bounties created & applicant review'
    },
    {
      label: 'Developer Hub (My Work)',
      path: '/my-work',
      icon: Briefcase,
      description: 'Proposals, assignments & submissions'
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      description: 'Review alerts & status updates'
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      description: 'Profile & preferences'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#232B28] mb-8">
        <div className="flex items-center gap-4">
          <img
            src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={profile?.display_name || 'Builder'}
            className="w-14 h-14 rounded-xl object-cover border-2 border-[#283530] shadow-lg shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#F4F5F1] font-display">
                {profile?.display_name || 'Builder'}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#24D6B1]/10 text-[#24D6B1] border border-[#24D6B1]/20 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Dual Role Account
              </span>
            </div>
            <p className="text-xs text-[#8E9894] font-mono mt-0.5">
              @{profile?.username} • {profile?.skills?.slice(0, 3).join(', ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/bounties/new">
            <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Post a Bounty
            </Button>
          </Link>
          <Link to={`/profile/${profile?.id}`}>
            <Button variant="secondary" size="sm">
              View Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#232B28] pb-px mb-8 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-[#24D6B1] text-[#24D6B1] bg-[#191F1D]/60 rounded-t-lg'
                  : 'border-transparent text-[#8E9894] hover:text-[#F4F5F1] hover:border-[#33423D]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Dashboard Body */}
      {children}
    </div>
  )
}
