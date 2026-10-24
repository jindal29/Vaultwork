import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const signupSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-z0-9_]+$/, 'Username must be lowercase alphanumeric with underscores only'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type SignupFormValues = z.infer<typeof signupSchema>

export const SignupPage: React.FC = () => {
  const { signUp, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema)
  })

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const { error } = await signUp(
        values.email,
        values.password,
        values.username.toLowerCase(),
        values.displayName
      )

      if (error) {
        setAuthError(error.message)
        toast.error(error.message)
      } else {
        toast.success(
          isSupabaseConfigured
            ? 'Account created! Please check your email to confirm registration.'
            : 'Welcome to Vaultwork! Your sandbox builder profile is active.'
        )
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setAuthError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
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
            Create Your Builder Account
          </h1>
          <p className="text-xs text-[#8E9894]">
            One account unlocks both commissioning bounties and applying as an engineer.
          </p>
        </div>

        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-6 shadow-2xl">
          {authError && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display Name *"
                placeholder="Alex Vance"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.displayName?.message}
                {...register('displayName')}
              />

              <Input
                label="Username *"
                placeholder="alex_zk"
                error={errors.username?.message}
                {...register('username')}
              />
            </div>

            <Input
              label="Email Address *"
              type="email"
              placeholder="alex@domain.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password *"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
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
              helperText="Must be at least 8 characters long"
              {...register('password')}
            />

            <Button
              type="submit"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          <div className="text-center pt-2 text-xs text-[#8E9894]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#24D6B1] font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
