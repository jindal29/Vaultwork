import React from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: (SelectOption | string)[]
  error?: string
  helperText?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  className,
  label,
  options,
  error,
  helperText,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-[#8E9894]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full appearance-none rounded-lg bg-[#191F1D] border border-[#25302C] px-3.5 py-2.5 pr-10 text-sm text-[#F4F5F1] transition-all duration-150 cursor-pointer',
            'focus:outline-none focus:border-[#24D6B1] focus:ring-1 focus:ring-[#24D6B1]/40',
            error && 'border-red-500/50 focus:border-red-500',
            className
          )}
          {...props}
        >
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value
            const text = typeof opt === 'string' ? opt : opt.label
            return (
              <option key={val} value={val} className="bg-[#191F1D] text-[#F4F5F1]">
                {text}
              </option>
            )
          })}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8E9894]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#626D68] mt-1">{helperText}</p>}
    </div>
  )
})

Select.displayName = 'Select'
