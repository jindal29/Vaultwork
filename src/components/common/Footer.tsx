import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, MessageSquare, Terminal } from 'lucide-react'
import { GithubIcon, TwitterIcon } from './Icons'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0D1110] border-t border-[#232B28] pt-16 pb-12 text-sm text-[#8E9894]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#1E2623]">
          {/* Brand & Vision */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#191F1D] border border-[#25302C] flex items-center justify-center p-1">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <path d="M50 22L76 37V63L50 78L24 63V37L50 22Z" stroke="#24D6B1" strokeWidth="7" strokeLinejoin="round" />
                  <circle cx="50" cy="50" r="10" fill="#24D6B1" />
                </svg>
              </div>
              <span className="font-display font-bold text-lg text-[#F4F5F1] tracking-tight">
                VAULTWORK
              </span>
            </Link>
            <p className="text-xs text-[#8E9894] leading-relaxed">
              Work Worth Doing. Rewards Worth Earning. The premier Web3 bounty marketplace uniting visionaries and verified cryptographic builders.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#191F1D] border border-[#25302C] flex items-center justify-center text-[#8E9894] hover:text-[#24D6B1] hover:border-[#24D6B1]/40 transition-colors"
                aria-label="GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#191F1D] border border-[#25302C] flex items-center justify-center text-[#8E9894] hover:text-[#24D6B1] hover:border-[#24D6B1]/40 transition-colors"
                aria-label="Twitter / X"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#191F1D] border border-[#25302C] flex items-center justify-center text-[#8E9894] hover:text-[#24D6B1] hover:border-[#24D6B1]/40 transition-colors"
                aria-label="Discord"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Marketplace Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono">
              Marketplace
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/bounties" className="hover:text-[#24D6B1] transition-colors">
                  Explore Active Bounties
                </Link>
              </li>
              <li>
                <Link to="/bounties/new" className="hover:text-[#24D6B1] transition-colors">
                  Post a Bounty
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#24D6B1] transition-colors">
                  Creator Hub
                </Link>
              </li>
              <li>
                <Link to="/my-work" className="hover:text-[#24D6B1] transition-colors">
                  Developer Workrooms
                </Link>
              </li>
            </ul>
          </div>

          {/* Planned Protocol & Escrow */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono">
              Trust & Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-xs">
                <Shield className="w-3.5 h-3.5 text-[#24D6B1]" />
                <span>Planned Multi-Sig Escrow</span>
              </li>
              <li>
                <span className="text-[#626D68]">Milestone-based release vaults</span>
              </li>
              <li>
                <span className="text-[#626D68]">Arbitrum & Solana settlement specs</span>
              </li>
              <li>
                <span className="text-[#626D68]">Decentralized dispute resolution</span>
              </li>
            </ul>
          </div>

          {/* Escrow Disclaimer & Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F5F1] font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#24D6B1]" />
              System Status
            </h4>
            <div className="p-3 rounded-xl bg-[#141A18] border border-[#232B28] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E9894]">Protocol Relay:</span>
                <span className="text-[#24D6B1] font-mono font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#24D6B1] animate-pulse" />
                  Operational
                </span>
              </div>
              <p className="text-[11px] text-[#626D68] leading-normal">
                Notice: Testnet contracts and Supabase security rules are active. Smart contract on-chain escrow release is currently under phased protocol audit.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#626D68]">
          <p>© {new Date().getFullYear()} Vaultwork Protocol. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Non-custodial frontend</span>
            <span>•</span>
            <span>Built for Web3 builders</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
