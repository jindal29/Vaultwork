import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { SupabaseSetupModal } from './SupabaseSetupModal'
import { Database, ShieldCheck, Sparkles } from 'lucide-react'

export const SupabaseBanner: React.FC = () => {
  const { isSupabaseConfigured } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="w-full bg-[#131917] border-b border-[#232B28] px-4 py-1.5 text-xs text-[#8E9894] flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <span className="flex items-center gap-1.5 text-[#24D6B1]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Supabase Live DB Connected</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Local Sandbox Mode (Persistent DB)</span>
              </span>
            )}
            <span className="text-[#626D68] hidden sm:inline">•</span>
            <span className="hidden sm:inline text-[#626D68]">
              {isSupabaseConfigured
                ? 'All queries enforce PostgreSQL Row-Level Security'
                : 'Full marketplace functionality active without external backend requirements'}
            </span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 text-[#24D6B1] hover:underline focus:outline-none"
          >
            <Database className="w-3 h-3" />
            <span>Database Config</span>
            <Sparkles className="w-3 h-3 text-amber-300 ml-0.5" />
          </button>
        </div>
      </div>

      <SupabaseSetupModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
