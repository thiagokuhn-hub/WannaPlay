import { useState } from 'react';
import { supabase } from '../lib/supabase'; // Add this import
import { Notification } from '../types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleClearAllNotifications = async (userId: string) => {
    try {
      // Update all notifications to be hidden instead of just marking as read
      const { error } = await supabase
        .from('notifications')
        .update({ hidden: true })
        .eq('user_id', userId)
        .eq('hidden', false);

      if (error) throw error;

      // Update local state to remove hidden notifications
      setNotifications(prev =>
        prev.filter(notification => !notification.hidden)
      );
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Modify the fetch notifications function to only get non-hidden ones
  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  return {
    notifications,
    setNotifications,
    handleMarkNotificationAsRead,
    handleClearAllNotifications,
    fetchNotifications
  };
}