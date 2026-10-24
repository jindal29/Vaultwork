import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USDC'): string {
  if (currency === 'ETH' || currency === 'SOL') {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })} ${currency}`
  }
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d)
  } catch {
    return dateString
  }
}

export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return formatDate(dateString)
  } catch {
    return dateString
  }
}

export function formatDaysRemaining(deadlineString: string): { text: string; isUrgent: boolean; isExpired: boolean } {
  try {
    const deadline = new Date(deadlineString).getTime()
    const now = new Date().getTime()
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { text: 'Expired', isUrgent: false, isExpired: true }
    }
    if (diffDays === 0) {
      return { text: 'Due today', isUrgent: true, isExpired: false }
    }
    if (diffDays === 1) {
      return { text: '1 day left', isUrgent: true, isExpired: false }
    }
    if (diffDays <= 3) {
      return { text: `${diffDays} days left`, isUrgent: true, isExpired: false }
    }
    return { text: `${diffDays} days left`, isUrgent: false, isExpired: false }
  } catch {
    return { text: 'Date TBD', isUrgent: false, isExpired: false }
  }
}

export function truncateAddress(address?: string): string {
  if (!address) return ''
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
