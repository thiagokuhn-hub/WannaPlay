import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void; // Add this new prop
}

export default function NotificationList({
  notifications,
  onMarkAsRead,
  onClearAll,
  onClose,
  onNotificationClick,
}: NotificationListProps) {
  const handleNotificationClick = (notification: Notification) => {
    onMarkAsRead(notification.id);
    onNotificationClick?.(notification);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 md:relative md:inset-auto max-h-[80vh] w-screen md:w-auto overflow-y-auto bg-white rounded-t-lg md:rounded-lg shadow-lg">
      <div className="sticky top-0 z-10 p-4 border-b bg-white flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notificações</h3>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-gray-500 hover:text-gray-700 p-2"
              title="Limpar todas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          Nenhuma notificação
        </div>
      ) : (
        <div className="divide-y w-full md:max-w-md">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
                <h4 className="font-medium text-gray-900 text-sm md:text-base">{notification.title}</h4>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatRelativeTime(new Date(notification.createdAt))}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 break-words">{notification.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}