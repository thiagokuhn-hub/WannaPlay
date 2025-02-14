import React, { ReactNode } from 'react';
import { LogIn, User } from 'lucide-react';
import { GiTennisBall } from 'react-icons/gi';
import { Player, Notification } from '../types';
import NotificationBell from './notifications/NotificationBell';
import { useAuth } from '../hooks/useAuth';
import { formatDisplayName } from '../utils/nameUtils';

interface HeaderProps {
  user: Player | null;  // Add this back
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onEditProfile: () => void;
  onLogoutClick: () => void;
  notifications: Notification[];
  onMarkNotificationAsRead: (notificationId: string) => void;
  onClearAllNotifications: () => void;
  onAdminPanelClick: () => void;
}

export default function Header({
  user,  // Add this back
  onLoginClick,
  onRegisterClick,
  onEditProfile,
  onLogoutClick,
  notifications,
  onMarkNotificationAsRead,
  onClearAllNotifications,
  onAdminPanelClick
}: HeaderProps) {
  // Remove the useAuth hook since we're getting user from props
  // const { user } = useAuth();

  const handleLogoClick = () => {
    window.location.href = '/'; // Navigate to home page
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80"
              onClick={handleLogoClick}
            >
              <GiTennisBall className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                QueroJogar
              </h1>
            </div>
            {user?.is_admin && (
              <button
                onClick={onAdminPanelClick}
                className="bg-blue-100 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-200"
              >
                Painel Admin
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <NotificationBell
                  notifications={notifications}
                  onMarkAsRead={onMarkNotificationAsRead}
                  onClearAll={onClearAllNotifications}
                />
                <button
                  onClick={onEditProfile}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  {user.avatar ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <GiTennisBall className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <span>{formatDisplayName(user.name)}</span>
                </button>
                <button
                  onClick={onLogoutClick}
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
            {/* Remove the duplicate admin panel button here */}
          </div>
        </div>
      </div>
    </header>
);
}