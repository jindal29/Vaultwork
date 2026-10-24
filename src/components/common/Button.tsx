import React from 'react'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 select-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24D6B1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101413] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]'

  const variants = {
    primary: 'bg-[#24D6B1] text-[#101413] font-semibold hover:bg-[#1EC09E] shadow-[0_0_20px_rgba(36,214,177,0.25)] hover:shadow-[0_0_25px_rgba(36,214,177,0.4)]',
    secondary: 'bg-[#191F1D] text-[#F4F5F1] border border-[#25302C] hover:bg-[#202725] hover:border-[#33423D]',
    outline: 'border border-[#24D6B1]/40 text-[#24D6B1] bg-transparent hover:bg-[#24D6B1]/10 hover:border-[#24D6B1]',
    ghost: 'text-[#8E9894] hover:text-[#F4F5F1] hover:bg-[#191F1D]',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-md',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 rounded-xl font-semibold'
  }

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
})

Button.displayName = 'Button'
