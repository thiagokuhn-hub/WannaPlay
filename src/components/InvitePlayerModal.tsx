import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Player } from '../types';
import { supabase } from '../lib/supabase';
import Modal from './modals/Modal';

interface InvitePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (playerId: string) => void;
  currentUser: Player | null;
}

export default function InvitePlayerModal({
  isOpen,
  onClose,
  onInvite,
  currentUser
}: InvitePlayerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInvite = (player: Player) => {
    onInvite(player.id);
    alert(`${player.name} vai receber uma notificação do seu convite`);
    onClose();
  };

  // Update the query to include all needed fields
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }
  
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone, avatar')
        .ilike('name', `%${term}%`)
        .neq('id', currentUser?.id)
        .limit(5);
  
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Update the search results display
  {searchResults.map((player) => (
    <div
      key={player.id}
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        {player.avatar ? (
          <img
            src={player.avatar}
            alt={`Avatar de ${player.name}`}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {player.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <div className="font-medium">{player.name}</div>
          <div className="text-sm text-gray-500">{player.phone || player.email}</div>
        </div>
      </div>
      <button
        onClick={() => {
          onInvite(player.id);
          onClose();
        }}
        className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Convidar
      </button>
    </div>
  ))}
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convidar Jogador">
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Digite o nome do jogador..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>

        <div className="mt-4 space-y-2">
          {loading && <div className="text-center text-gray-500">Buscando...</div>}
          {!loading && searchResults.length === 0 && searchTerm.length >= 3 && (
            <div className="text-center text-gray-500">Nenhum jogador encontrado</div>
          )}
          {searchResults.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={`Avatar de ${player.name}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-gray-500">{player.phone || player.email}</div>
                </div>
              </div>
              <button
                onClick={() => handleInvite(player)}
                className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Convidar
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}