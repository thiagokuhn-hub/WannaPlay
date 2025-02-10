import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export default function NotificationList({
  notifications,
  onMarkAsRead,
  onClearAll,
  onClose,
}: NotificationListProps) {
  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notificações</h3>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-gray-500 hover:text-gray-700"
              title="Limpar todas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => onMarkAsRead(notification.id)}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(new Date(notification.createdAt))}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}