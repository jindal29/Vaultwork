import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type LoginFormValues = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const { user, signIn, switchDemoRole, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const redirectPath = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate, redirectPath])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const { error } = await signIn(values.email, values.password)
      if (error) {
        setAuthError(error.message)
        toast.error(error.message)
      } else {
        toast.success('Successfully authenticated!')
        navigate(redirectPath, { replace: true })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setAuthError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Quick fill demo credentials
  const fillDemo = (role: 'creator' | 'developer' | 'new_user') => {
    switchDemoRole(role)
    if (role === 'creator') {
      setValue('email', 'uniswap@vaultwork.xyz')
      setValue('password', 'secretpassword123')
    } else if (role === 'developer') {
      setValue('email', 'alex@vaultwork.xyz')
      setValue('password', 'secretpassword123')
    } else {
      setValue('email', 'satoshi@vaultwork.xyz')
      setValue('password', 'secretpassword123')
    }
    toast.success(`Quick demo persona active!`)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-9 h-9 rounded-xl bg-[#191F1D] border border-[#25302C] group-hover:border-[#24D6B1]/50 flex items-center justify-center p-1.5 transition-colors">
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                <path d="M50 22L76 37V63L50 78L24 63V37L50 22Z" stroke="#24D6B1" strokeWidth="6" strokeLinejoin="round" />
                <circle cx="50" cy="50" r="8" fill="#24D6B1" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-[#F4F5F1]">
              VAULTWORK
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F5F1] font-display">
            Sign in to your Account
          </h1>
          <p className="text-xs text-[#8E9894]">
            Access your creator bounties and developer workrooms.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6 shadow-2xl">
          {authError && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address *"
              type="email"
              placeholder="you@domain.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1">
              <Input
                label="Password *"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-[#F4F5F1] focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#24D6B1] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Switcher if in sandbox mode */}
          {!isSupabaseConfigured && (
            <div className="pt-4 border-t border-[#232B28] space-y-2 text-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E9894] flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-[#24D6B1]" />
                1-Click Sandbox Test Personas
              </span>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemo('creator')}
                  className="p-2 rounded-lg bg-[#141A18] border border-[#25302C] hover:border-[#24D6B1]/40 text-[#8E9894] hover:text-[#24D6B1] text-[11px] transition-colors"
                >
                  Creator (DAO)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('developer')}
                  className="p-2 rounded-lg bg-[#141A18] border border-[#25302C] hover:border-[#24D6B1]/40 text-[#8E9894] hover:text-[#24D6B1] text-[11px] transition-colors"
                >
                  Developer (Alex)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('new_user')}
                  className="p-2 rounded-lg bg-[#141A18] border border-[#25302C] hover:border-[#24D6B1]/40 text-[#8E9894] hover:text-[#24D6B1] text-[11px] transition-colors"
                >
                  Dual-Role (Satoshi)
                </button>
              </div>
            </div>
          )}

          <div className="text-center pt-2 text-xs text-[#8E9894]">
            Don't have an account yet?{' '}
            <Link to="/signup" className="text-[#24D6B1] font-semibold hover:underline">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
