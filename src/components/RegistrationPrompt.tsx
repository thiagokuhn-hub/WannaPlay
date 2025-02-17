import React from 'react';
import { UserPlus } from 'lucide-react';
import Modal from './modals/Modal';

interface RegistrationPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
  onLogin: () => void;  // Add this prop
  message?: string;
}

export default function RegistrationPrompt({
  isOpen,
  onClose,
  onRegister,
  onLogin,  // Add this prop
  message = "Para acessar todos os recursos do aplicativo, é necessário criar uma conta."
}: RegistrationPromptProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar uma conta"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-blue-600" />
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Ao criar uma conta, você terá acesso a:
          </p>

          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Propor jogos e convidar outros jogadores
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Participar de jogos existentes
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Gerenciar suas disponibilidades
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Receber notificações sobre seus jogos
            </li>
          </ul>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Agora não
            </button>
            <button
              onClick={onLogin}
              className="px-4 py-2 text-blue-600 hover:text-blue-700"
            >
              Fazer login
            </button>
            <button
              onClick={onRegister}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Criar conta
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}