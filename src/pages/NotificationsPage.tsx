import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { notificationService } from '@/services/notificationService'
import { Notification } from '@/types/database'
import { Button } from '@/components/common/Button'
import { formatTimeAgo } from '@/lib/utils'
import { 
  Bell, 
  CheckCheck, 
  ArrowRight, 
  Briefcase, 
  Coins, 
  RotateCcw, 
  UserCheck, 
  Sparkles 
} from 'lucide-react'
import { toast } from 'sonner'

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await notificationService.getNotifications(user.id)
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user?.id])

  const handleMarkAsRead = async (notifId: string) => {
    await notificationService.markAsRead(notifId)
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    await notificationService.markAllAsRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'bounty_completed':
        return <Coins className="w-5 h-5 text-[#24D6B1]" />
      case 'application_accepted':
        return <UserCheck className="w-5 h-5 text-emerald-400" />
      case 'work_submitted':
        return <Briefcase className="w-5 h-5 text-sky-400" />
      case 'revision_requested':
        return <RotateCcw className="w-5 h-5 text-amber-400" />
      default:
        return <Bell className="w-5 h-5 text-[#8E9894]" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#F4F5F1] font-display flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#24D6B1]" />
              Notifications Center {unreadCount > 0 && `(${unreadCount} unread)`}
            </h2>
            <p className="text-xs text-[#8E9894] mt-0.5">
              Real-time events regarding your proposals, developer selection, and milestone approvals.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#8E9894]">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#191F1D] border border-[#25302C] text-center space-y-2">
            <Sparkles className="w-8 h-8 text-[#8E9894] mx-auto opacity-50" />
            <h3 className="text-base font-bold text-[#F4F5F1]">No notifications yet</h3>
            <p className="text-xs text-[#8E9894]">
              You will receive alerts when developers apply to your bounties or creators review your work.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#191F1D] border border-[#25302C] divide-y divide-[#232B28] overflow-hidden">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                  !notif.read ? 'bg-[#1E2623]/70' : 'hover:bg-[#1E2623]/30'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#141A18] border border-[#232B28] flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#F4F5F1] font-display">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#24D6B1]" />
                      )}
                    </div>
                    <p className="text-xs text-[#8E9894] leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[11px] font-mono text-[#626D68] block pt-1">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={notif.link}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <Button size="sm" variant="outline" className="h-8 text-xs px-3" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View
                    </Button>
                  </Link>

                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-2 text-[#8E9894] hover:text-[#F4F5F1] text-xs"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
