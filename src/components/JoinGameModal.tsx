import React, { useState } from 'react';
import { Player, SkillLevel, PlayingSide } from '../types';
import Modal from './modals/Modal';
import RegistrationPrompt from './RegistrationPrompt';

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (gameId: string, message: string) => Promise<void>;
  onRegisterPrompt: () => void;
  currentUser: Player | null;
  gameId: string;
}

export default function JoinGameModal({ 
  isOpen, 
  onClose, 
  onJoin,
  onRegisterPrompt,
  currentUser,
  gameId
}: JoinGameModalProps) {
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(!currentUser);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    skillLevel: currentUser?.skillLevel || 'intermediate' as SkillLevel,
    playingSide: currentUser?.playingSide || 'both' as PlayingSide,
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(gameId, formData.message);  // Fix: Use formData.message instead of message
  };

  if (!isOpen) return null;

  if (showRegistrationPrompt && !currentUser) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Criar uma conta?"
      >
        <RegistrationPrompt
          onClose={onClose}
          onRegister={() => {
            onRegisterPrompt();
            onClose();
          }}
          onContinue={() => setShowRegistrationPrompt(false)}
        />
      </Modal>
    );
  }

  if (currentUser) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Participar do Jogo"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem (opcional)
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Adicione uma mensagem para os outros jogadores..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Participar do Jogo"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nível
          </label>
          <select
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.skillLevel}
            onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value as SkillLevel })}
          >
            <option value="beginner">Iniciante</option>
            <option value="intermediate">Intermediário</option>
            <option value="advanced">Avançado</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lado Preferido
          </label>
          <select
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.playingSide}
            onChange={(e) => setFormData({ ...formData, playingSide: e.target.value as PlayingSide })}
          >
            <option value="left">Esquerdo</option>
            <option value="right">Direito</option>
            <option value="both">Ambos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensagem (opcional)
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Adicione uma mensagem para os outros jogadores..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </form>
    </Modal>
  );
}