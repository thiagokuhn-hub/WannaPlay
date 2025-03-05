import React, { useState, useEffect } from 'react';
import { Player, Category, PlayingSide, Gender } from '../types';
import Modal from './modals/Modal';
import CategoryTooltip from './tooltips/CategoryTooltip';
import { supabase } from '../lib/supabase';  // Add this import
import { Search } from 'lucide-react';

interface AddPlayerDirectlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (player: Omit<Player, 'id' | 'email' | 'password'>) => void;
  gameId: string;  // Add this prop
  currentUser: Player | null;  // Add this prop
}

const initialFormState = {
  name: '',
  phone: '',
  category: undefined as Category | undefined,
  playingSide: undefined as PlayingSide | undefined,
  gender: undefined as Gender | undefined,
};

export default function AddPlayerDirectlyModal({
  isOpen,
  onClose,
  onSubmit,
  gameId,
  currentUser
}: AddPlayerDirectlyModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
    }
  }, [isOpen]);

  const handleSearch = async (searchTerm: string) => {
    setFormData({ ...formData, name: searchTerm });
    
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlayer = (player: Player) => {
    setFormData({
      name: player.name,
      phone: player.phone || '',
      category: player.padel_category || player.beach_tennis_category,
      playingSide: player.playing_side as PlayingSide,
      gender: player.gender as Gender,
    });
    // Store the selected player's ID
    setSelectedPlayerId(player.id);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedPlayerId) {
        // Add player to game
        const { data: gamePlayer, error: gamePlayerError } = await supabase
          .from('game_players')
          .insert([{
            game_id: gameId,
            player_id: selectedPlayerId,
            is_temporary: false
          }])
          .select()
          .single();
    
        if (gamePlayerError) throw gamePlayerError;
    
        // Send notification using RPC function instead of direct insert
        // Send notification using RPC function with all required fields
        const { error: notificationError } = await supabase
          .rpc('create_notification', {
            p_user_id: selectedPlayerId,
            p_type: 'game_joined',
            p_game_id: gameId,
            p_title: 'Novo Jogo',  // Adding required title field
            p_message: `${currentUser?.name} adicionou você a um jogo.`
          });
    
        if (notificationError) throw notificationError;
    
        onSubmit({
          ...formData,
          id: selectedPlayerId,
          isTemporary: false
        });
      } else {
        // Handle temporary player creation as before
        const { data: tempPlayer, error: tempPlayerError } = await supabase
          .from('temporary_players')
          .insert([{
            name: formData.name,
            phone: formData.phone || null,
            gender: formData.gender || null,
            category: formData.category || null,
            playing_side: formData.playingSide || null,
            created_by: currentUser?.id || null,
            game_id: gameId
          }])
          .select()
          .single();

        if (tempPlayerError) throw tempPlayerError;

        onSubmit({
          ...formData,
          id: tempPlayer.id,
          isTemporary: true
        });
      }

      setFormData(initialFormState);
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Erro ao adicionar jogador. Tente novamente.');
    }
  };

  const handleClose = () => {
    setFormData(initialFormState); // Reset form when closing
    onClose();
  };

  const handleSearchIconClick = () => {
    setShowSearchModal(true);
    if (formData.name) {
      handleSearch(formData.name);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Jogador"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Jogador *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.name}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Digite o nome do jogador"
            />
            <button
              type="button"
              onClick={handleSearchIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search Results Dropdown */}
          {(searchResults.length > 0 || showSearchModal) && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="px-4 py-2 text-gray-500">Pesquisando...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => {
                      handleSelectPlayer(player);
                      setShowSearchModal(false);
                    }}
                  >
                    {player.avatar && (
                      <img
                        src={player.avatar}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>{player.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">
                  Digite pelo menos 3 letras para pesquisar
                </div>
              )}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">* Campo obrigatório</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone (Whatsapp) - Opcional
          </label>
          <input
            type="tel"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gênero - Opcional
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.gender || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              gender: e.target.value ? e.target.value as Gender : undefined 
            })}
          >
            <option value="">Selecione o gênero</option>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
          </select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Categoria - Opcional
            </label>
            <CategoryTooltip />
          </div>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.category || ''}
            onChange={(e) => setFormData({
              ...formData,
              category: e.target.value as Category
            })}
            placeholder="Digite a categoria do jogador"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lado Preferido - Opcional
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.playingSide || ''}
            onChange={(e) => setFormData({
              ...formData,
              playingSide: e.target.value ? e.target.value as PlayingSide : undefined
            })}
          >
            <option value="">Selecione o lado</option>
            <option value="left">Esquerdo</option>
            <option value="right">Direito</option>
            <option value="both">Ambos</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Adicionar Jogador
          </button>
        </div>
      </form>
    </Modal>
  );
}