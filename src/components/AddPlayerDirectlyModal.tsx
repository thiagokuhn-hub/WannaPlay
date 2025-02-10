import React, { useState, useEffect } from 'react';
import { Player, Category, PlayingSide, Gender } from '../types';
import Modal from './modals/Modal';
import CategoryTooltip from './tooltips/CategoryTooltip';
import { supabase } from '../lib/supabase';  // Add this import

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

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Insert into temporary_players first
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

      if (tempPlayerError) {
        console.error('Error creating temporary player:', tempPlayerError);
        throw tempPlayerError;
      }

      // Call onSubmit with the created player data
      onSubmit({
        ...formData,
        id: tempPlayer.id,
        isTemporary: true
      });

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Jogador"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Jogador *
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Digite o nome do jogador"
          />
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
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.category || ''}
            onChange={(e) => setFormData({
              ...formData,
              category: e.target.value ? e.target.value as Category : undefined
            })}
          >
            <option value="">Selecione a categoria</option>
            <option value="CAT 1">CAT 1</option>
            <option value="CAT 2">CAT 2</option>
            <option value="CAT 3">CAT 3</option>
            <option value="CAT 4">CAT 4</option>
            <option value="CAT 5">CAT 5</option>
            <option value="CAT 6">CAT 6</option>
          </select>
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