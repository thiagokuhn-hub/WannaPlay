import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Notification } from '../../types';
import NotificationList from './NotificationList';

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onClearAll: () => void;
}

export default function NotificationBell({ notifications, onMarkAsRead, onClearAll }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <NotificationList
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            onClearAll={onClearAll}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}