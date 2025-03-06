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
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
    
      if (error) throw error;
    
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Modify the fetch notifications function to only get non-hidden ones
  const fetchNotifications = async (userId: string) => {
    try {
      // First, check if the hidden column exists
      const { data: columnInfo, error: columnError } = await supabase
        .from('notifications')
        .select('hidden')
        .limit(1);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Only filter by hidden if the column exists
      if (columnInfo && columnInfo.length > 0 && 'hidden' in columnInfo[0]) {
        query = query.eq('hidden', false);
      }
      
      const { data, error } = await query;

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