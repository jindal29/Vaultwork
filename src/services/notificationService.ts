import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LocalStore } from '../lib/storage'
import { Notification } from '../types/database'

export const notificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }
      return (data || []) as Notification[]
    }
    return LocalStore.getNotifications(userId)
  },

  async markAsRead(notificationId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
      if (error) console.error('Error marking notification as read:', error)
      return
    }
    LocalStore.markNotificationRead(notificationId)
  },

  async markAllAsRead(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
      if (error) console.error('Error marking all notifications as read:', error)
      return
    }
    LocalStore.markAllNotificationsRead(userId)
  },

  subscribeToNotifications(userId: string, onNewNotification: (notification: Notification) => void) {
    if (!isSupabaseConfigured) return () => {}

    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            onNewNotification(payload.new as Notification)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}
