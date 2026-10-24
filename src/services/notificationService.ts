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
      if (error) return []
      return data as Notification[]
    }
    return LocalStore.getNotifications(userId)
  },

  async markAsRead(notificationId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
      return
    }
    LocalStore.markNotificationRead(notificationId)
  },

  async markAllAsRead(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
      return
    }
    LocalStore.markAllNotificationsRead(userId)
  }
}
