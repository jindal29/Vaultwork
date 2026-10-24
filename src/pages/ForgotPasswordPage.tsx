import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '@/services/authService'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      const res = await authService.resetPassword(email)
      if (res.error) {
        toast.error(res.error.message)
      } else {
        setSubmitted(true)
        toast.success('Password reset instructions sent!')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F5F1] font-display">
            Reset Password
          </h1>
          <p className="text-xs text-[#8E9894]">
            Enter your email to receive a secure password reset link.
          </p>
        </div>

        <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] p-6 sm:p-8 space-y-5 shadow-2xl">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#24D6B1]/10 text-[#24D6B1] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-[#8E9894] leading-relaxed">
                If an account exists for <strong className="text-[#F4F5F1]">{email}</strong>, a reset email with recovery instructions has been sent.
              </p>
              <Link to="/login" className="block pt-2">
                <Button size="sm" variant="secondary" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address *"
                type="email"
                placeholder="you@domain.com"
                leftIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                size="md"
                className="w-full"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#8E9894] hover:text-[#24D6B1]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
