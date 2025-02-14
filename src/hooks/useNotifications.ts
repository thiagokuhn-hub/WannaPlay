import { useState } from 'react';
import { Notification } from '../types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    setNotifications,
    handleMarkNotificationAsRead,
    handleClearAllNotifications
  };
}