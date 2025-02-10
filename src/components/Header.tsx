import React, { ReactNode } from 'react';
import { LogIn, User } from 'lucide-react';
import { GiTennisBall } from 'react-icons/gi';
import { Player, Notification } from '../types';
import NotificationBell from './notifications/NotificationBell';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  currentUser: Player | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
  notifications: Notification[];
  onMarkNotificationAsRead: (notificationId: string) => void;
  onClearAllNotifications: () => void;
  children?: ReactNode; // Adicionar suporte para children
}

export default function Header({
  currentUser,
  onLoginClick,
  onLogout,
  onEditProfile,
  notifications,
  onMarkNotificationAsRead,
  onClearAllNotifications,
  children
}: HeaderProps) {
  const { user } = useAuth();
  const displayUser = user || currentUser;

  const handleLogoClick = () => {
    window.location.href = '/'; // Navigate to home page
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80"
            onClick={handleLogoClick}
          >
            <GiTennisBall className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              QueroJogar
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {displayUser ? (
              <div className="flex items-center gap-4">
                <NotificationBell
                  notifications={notifications}
                  onMarkAsRead={onMarkNotificationAsRead}
                  onClearAll={onClearAllNotifications}
                />
                {children}
                <button
                  onClick={() => onEditProfile()} // Make sure this is being called
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  {displayUser.avatar ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img
                        src={displayUser.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <GiTennisBall className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <span>{displayUser.name}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <LogIn className="w-5 h-5" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}