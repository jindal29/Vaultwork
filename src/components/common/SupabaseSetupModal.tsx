import React, { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { useAuth } from '../../context/AuthContext'
import { Database, Copy, Check, ExternalLink, RefreshCw, KeyRound, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

export const SupabaseSetupModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { isSupabaseConfigured, profile, switchDemoRole, resetDemoData } = useAuth()
  const [copied, setCopied] = useState(false)

  const copyEnvSnippet = () => {
    const text = `VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOi...`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Environment variables template copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    resetDemoData()
    toast.success('Demo environment reset to initial seed state.')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase Integration & Sandbox Guide"
      description="Vaultwork connects with your live Supabase database or runs in an interactive high-fidelity local sandbox."
      maxWidth="xl"
    >
      <div className="space-y-6 text-sm">
        {/* Status Box */}
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          isSupabaseConfigured 
            ? 'bg-[#24D6B1]/10 border-[#24D6B1]/30 text-[#24D6B1]' 
            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
        }`}>
          <Database className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">
              {isSupabaseConfigured 
                ? 'Supabase Connected & Active' 
                : 'Interactive Sandbox Mode Active (No Keys Detected)'}
            </h4>
            <p className="text-xs text-[#8E9894] leading-relaxed">
              {isSupabaseConfigured
                ? 'Your application is reading and writing live data from your configured Supabase PostgreSQL instance with Row-Level Security.'
                : 'All features (bounty creation, proposal submission, applicant selection, workroom submission, and approval) work with persistent local state.'}
            </p>
          </div>
        </div>

        {/* How to Connect Real Supabase */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F5F1] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#24D6B1]" />
            Connect Your Live Supabase Backend
          </h4>
          <ol className="space-y-2.5 text-xs text-[#8E9894] list-decimal list-inside bg-[#141A18] p-4 rounded-xl border border-[#232B28]">
            <li>
              Create a free project at{' '}
              <a 
                href="https://supabase.com" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[#24D6B1] underline inline-flex items-center gap-1"
              >
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              Run the complete schema provided in <code className="text-[#24D6B1] font-mono">supabase/schema.sql</code> in your Supabase SQL Editor.
            </li>
            <li>
              Create a <code className="text-[#24D6B1] font-mono">.env</code> file in the project root with your credentials:
            </li>
          </ol>

          <div className="relative bg-[#101413] border border-[#232B28] rounded-xl p-3.5 font-mono text-xs text-[#8E9894]">
            <pre className="text-[#24D6B1]">
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
            </pre>
            <button
              onClick={copyEnvSnippet}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#191F1D] text-[#8E9894] hover:text-[#F4F5F1] border border-[#25302C] transition-colors"
              title="Copy snippet"
            >
              {copied ? <Check className="w-4 h-4 text-[#24D6B1]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Demo Role Switcher */}
        {!isSupabaseConfigured && (
          <div className="p-4 rounded-xl bg-[#191F1D] border border-[#25302C] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F4F5F1] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#24D6B1]" />
                Switch Sandbox Persona (For Testing)
              </span>
              <span className="text-xs text-[#8E9894]">Active: <strong className="text-[#24D6B1]">{profile?.display_name}</strong></span>
            </div>
            <p className="text-xs text-[#8E9894]">
              Instantly toggle your active role to test both sides of the marketplace:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={profile?.id === 'creator-1' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => { switchDemoRole('creator'); toast.success('Switched to Creator (Uniswap Labs)'); }}
              >
                Creator (Uniswap)
              </Button>
              <Button
                variant={profile?.id === 'dev-1' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => { switchDemoRole('developer'); toast.success('Switched to Developer (Alex Vance)'); }}
              >
                Builder (Alex Vance)
              </Button>
              <Button
                variant={profile?.id === '00000000-0000-0000-0000-000000000001' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => { switchDemoRole('new_user'); toast.success('Switched to Dual-Role (Satoshi Builder)'); }}
              >
                Dual Role (Satoshi)
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {!isSupabaseConfigured && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={handleReset}
            >
              Reset Sandbox Data
            </Button>
          )}
          <Button onClick={onClose} className="ml-auto">
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  )
}
