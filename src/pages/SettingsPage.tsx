import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { profileService } from '@/services/profileService'
import { Button } from '@/components/common/Button'
import { Input, Textarea } from '@/components/common/Input'
import { SkillTag } from '@/components/common/Badge'
import { Save, LogOut, RefreshCw, User, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

export const SettingsPage: React.FC = () => {
  const { profile, refreshProfile, signOut, resetDemoData, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setGithubUrl(profile.github_url || '')
      setPortfolioUrl(profile.portfolio_url || '')
      setWalletAddress(profile.wallet_address || '')
      setAvatarUrl(profile.avatar_url || '')
      setSkills(profile.skills || [])
    }
  }, [profile])

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      setIsSaving(true)
      const res = await profileService.updateProfile({
        id: profile.id,
        display_name: displayName,
        username,
        bio,
        github_url: githubUrl || undefined,
        portfolio_url: portfolioUrl || undefined,
        wallet_address: walletAddress || undefined,
        avatar_url: avatarUrl || undefined,
        skills
      })

      if (res.error) {
        toast.error(res.error.message || 'Failed to update profile')
        return
      }

      await refreshProfile()
      toast.success('Profile settings updated successfully!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating profile'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast.info('Signed out of Vaultwork')
    navigate('/login')
  }

  const handleResetData = () => {
    if (!confirm('Reset local sandbox data to the initial factory seed? All custom bounties will be restored.')) return
    resetDemoData()
    toast.success('Sandbox data reset to defaults!')
    navigate('/dashboard')
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#F4F5F1] font-display flex items-center gap-2">
            <User className="w-5 h-5 text-[#24D6B1]" />
            Profile & Account Settings
          </h2>
          <p className="text-xs text-[#8E9894]">
            Manage your public builder identity, skills, portfolio links, and cryptographic wallet address.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E9894] font-mono border-b border-[#232B28] pb-3">
              Public Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display Name *"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              <Input
                label="Username *"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <Input
              label="Avatar Image URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />

            <Textarea
              label="Biography"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell other builders about your background, favorite protocols, and domain expertise..."
            />

            {/* Skills */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9894]">
                Technical Skills & Specializations
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
                  placeholder="Add skill & press Enter..."
                  className="bg-transparent text-xs text-[#F4F5F1] placeholder-[#626D68] focus:outline-none flex-1 min-w-[140px] py-1 px-1"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E9894] font-mono border-b border-[#232B28] pb-3">
              Web3 & Developer Links
            </h3>

            <Input
              label="Connected Wallet Address (Escrow Payouts)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="font-mono text-xs"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="GitHub URL"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
              />

              <Input
                label="Portfolio / Website URL"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="submit"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleSignOut}
              leftIcon={<LogOut className="w-4 h-4 text-red-400" />}
              className="text-red-400 hover:bg-red-500/10"
            >
              Sign Out
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        {!isSupabaseConfigured && (
          <div className="rounded-2xl bg-[#141A18] border border-red-500/20 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Sandbox Environment Maintenance
                </h4>
                <p className="text-xs text-[#8E9894] mt-0.5">
                  Reset the local sandbox database back to the factory initial mock dataset.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={handleResetData}
              >
                Reset Sandbox
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
