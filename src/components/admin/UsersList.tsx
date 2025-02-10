import React, { useState } from 'react';
import { Ban, UserCheck, Search } from 'lucide-react';
import { Player } from '../../types';
import Modal from '../modals/Modal';

interface UsersListProps {
  users: Player[];
  onBlockUser: (userId: string) => void;
  onUnblockUser: (userId: string) => void;
}

export default function UsersList({ users, onBlockUser, onUnblockUser }: UsersListProps) {
  const [userFilter, setUserFilter] = useState('');
  const [showConfirmation, setShowConfirmation] = useState<{
    type: 'block' | 'unblock';
    user: Player;
  } | null>(null);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userFilter.toLowerCase()) ||
    user.email.toLowerCase().includes(userFilter.toLowerCase())
  );

  const handleAction = () => {
    if (!showConfirmation) return;

    if (showConfirmation.type === 'block') {
      onBlockUser(showConfirmation.user.id);
    } else {
      onUnblockUser(showConfirmation.user.id);
    }

    setShowConfirmation(null);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar usuários..."
            className="w-full max-w-md px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    {user.blocked && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Bloqueado
                      </span>
                    )}
                    {user.isAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-600">{user.phone}</p>
                  {user.blocked && user.blockedAt && (
                    <p className="text-xs text-gray-500">
                      Bloqueado em: {new Date(user.blockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {!user.isAdmin && (
                  <button
                    onClick={() => setShowConfirmation({
                      type: user.blocked ? 'unblock' : 'block',
                      user
                    })}
                    className={`p-2 rounded-lg transition-colors ${
                      user.blocked
                        ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                    }`}
                    title={user.blocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
                  >
                    {user.blocked ? <UserCheck className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {userFilter ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </div>
          )}
        </div>
      </div>

      {showConfirmation && (
        <Modal
          isOpen={true}
          onClose={() => setShowConfirmation(null)}
          title={`${showConfirmation.type === 'block' ? 'Bloquear' : 'Desbloquear'} Usuário`}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              {showConfirmation.type === 'block'
                ? `Tem certeza que deseja bloquear ${showConfirmation.user.name}? O usuário não poderá registrar disponibilidades, propor jogos ou participar de jogos.`
                : `Tem certeza que deseja desbloquear ${showConfirmation.user.name}?`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleAction}
                className={`px-4 py-2 text-white rounded-lg ${
                  showConfirmation.type === 'block'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {showConfirmation.type === 'block' ? 'Bloquear' : 'Desbloquear'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}