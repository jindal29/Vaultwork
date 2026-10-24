import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import { Button } from './Button'
import { ConnectWalletModal } from './ConnectWalletModal'
import { notificationService } from '../../services/notificationService'
import { truncateAddress } from '../../lib/utils'
import { 
  Bell, 
  Wallet, 
  PlusCircle, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Layers, 
  Briefcase, 
  Compass, 
  ChevronDown 
} from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const { isConnected, address } = useWallet()
  const navigate = useNavigate()
  const location = useLocation()

  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user?.id) {
      notificationService.getNotifications(user.id).then(notifs => {
        setUnreadCount(notifs.filter(n => !n.read).length)
      })
    } else {
      setUnreadCount(0)
    }
  }, [user, location.pathname])

  // Close menus on route change
  useEffect(() => {
    setProfileDropdownOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname])

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#101413]/90 backdrop-blur-md border-b border-[#232B28]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-[#191F1D] border border-[#25302C] group-hover:border-[#24D6B1]/50 flex items-center justify-center p-1.5 transition-colors shadow-[0_0_15px_rgba(36,214,177,0.15)]">
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                <path d="M50 22L76 37V63L50 78L24 63V37L50 22Z" stroke="#24D6B1" strokeWidth="6" strokeLinejoin="round" />
                <path d="M50 22V50M76 37L50 50M24 37L50 50M50 50V78" stroke="#24D6B1" strokeWidth="5" strokeLinejoin="round" />
                <circle cx="50" cy="50" r="8" fill="#24D6B1" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-tight text-[#F4F5F1] group-hover:text-[#24D6B1] transition-colors">
                VAULTWORK
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#8E9894] uppercase -mt-1">
                Bounty Protocol
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/bounties"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/bounties')
                  ? 'text-[#24D6B1] bg-[#191F1D] border border-[#24D6B1]/20'
                  : 'text-[#8E9894] hover:text-[#F4F5F1] hover:bg-[#191F1D]'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore
            </Link>

            <a
              href="/#how-it-works"
              className="px-3 py-2 rounded-lg text-sm font-medium text-[#8E9894] hover:text-[#F4F5F1] hover:bg-[#191F1D] transition-colors"
            >
              How It Works
            </a>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/dashboard')
                      ? 'text-[#24D6B1] bg-[#191F1D] border border-[#24D6B1]/20'
                      : 'text-[#8E9894] hover:text-[#F4F5F1] hover:bg-[#191F1D]'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Creator Hub
                </Link>

                <Link
                  to="/my-work"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/my-work')
                      ? 'text-[#24D6B1] bg-[#191F1D] border border-[#24D6B1]/20'
                      : 'text-[#8E9894] hover:text-[#F4F5F1] hover:bg-[#191F1D]'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  My Work
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Wallet Button */}
            <button
              onClick={() => setWalletModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#191F1D] border border-[#25302C] hover:border-[#24D6B1]/40 text-xs font-mono font-medium text-[#F4F5F1] transition-all"
            >
              <Wallet className="w-3.5 h-3.5 text-[#24D6B1]" />
              {isConnected ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#24D6B1]" />
                  {truncateAddress(address || '')}
                </span>
              ) : (
                <span>Connect Wallet</span>
              )}
            </button>

            {user ? (
              <>
                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2.5 rounded-lg bg-[#191F1D] border border-[#25302C] hover:border-[#33423D] text-[#8E9894] hover:text-[#F4F5F1] transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#24D6B1] text-[#101413] text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Post Bounty CTA */}
                <Link to="/bounties/new">
                  <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Post Bounty
                  </Button>
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-[#191F1D] border border-[#25302C] hover:border-[#33423D] text-left focus:outline-none"
                  >
                    <img
                      src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={profile?.display_name || 'User'}
                      className="w-7 h-7 rounded-md object-cover border border-[#25302C]"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-[#8E9894]" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#191F1D] border border-[#26332E] shadow-2xl py-2 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-[#232B28]">
                        <p className="font-semibold text-[#F4F5F1] truncate">{profile?.display_name}</p>
                        <p className="text-[#8E9894] font-mono truncate">@{profile?.username}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to={`/profile/${profile?.id || user.id}`}
                          className="flex items-center gap-2.5 px-3 py-2 text-[#8E9894] hover:text-[#F4F5F1] hover:bg-[#202725]"
                        >
                          <User className="w-3.5 h-3.5" />
                          Public Profile
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center gap-2.5 px-3 py-2 text-[#8E9894] hover:text-[#F4F5F1] hover:bg-[#202725]"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Profile Settings
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-[#232B28]">
                        <button
                          onClick={() => {
                            signOut()
                            navigate('/login')
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-500/10 text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setWalletModalOpen(true)}
              className="p-2 rounded-lg bg-[#191F1D] border border-[#25302C] text-[#24D6B1]"
              aria-label="Wallet"
            >
              <Wallet className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#191F1D] border border-[#25302C] text-[#8E9894] hover:text-[#F4F5F1]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#161C1A] border-b border-[#232B28] px-4 py-4 space-y-3">
            <Link
              to="/bounties"
              className="block px-3 py-2 rounded-lg text-sm text-[#F4F5F1] hover:bg-[#1E2623]"
            >
              Explore Bounties
            </Link>
            <a
              href="/#how-it-works"
              className="block px-3 py-2 rounded-lg text-sm text-[#8E9894] hover:text-[#F4F5F1] hover:bg-[#1E2623]"
            >
              How It Works
            </a>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-lg text-sm text-[#F4F5F1] hover:bg-[#1E2623]"
                >
                  Creator Dashboard
                </Link>
                <Link
                  to="/my-work"
                  className="block px-3 py-2 rounded-lg text-sm text-[#F4F5F1] hover:bg-[#1E2623]"
                >
                  Developer Dashboard (My Work)
                </Link>
                <Link
                  to="/notifications"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#F4F5F1] hover:bg-[#1E2623]"
                >
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#24D6B1] text-[#101413] text-xs font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/bounties/new"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#24D6B1] hover:bg-[#1E2623]"
                >
                  + Post a Bounty
                </Link>
                <Link
                  to="/settings"
                  className="block px-3 py-2 rounded-lg text-sm text-[#8E9894] hover:text-[#F4F5F1]"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    signOut()
                    navigate('/login')
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" className="w-full">
                  <Button variant="secondary" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" className="w-full">
                  <Button size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Connect Wallet Modal */}
      <ConnectWalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  )
}
