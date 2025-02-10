import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import Modal from './modals/Modal';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; password: string }) => void;
  onRegisterClick: () => void;  // Changed from onSwitchToRegister
}

export default function LoginForm({ isOpen, onClose, onSubmit, onRegisterClick }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await onSubmit(formData);  // Use the onSubmit prop instead of signIn directly
      setFormData({ email: '', password: '' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Entrar"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="text-center">
          
          <button
            type="button"
            onClick={onRegisterClick}  // Changed from onSwitchToRegister
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Não tem uma conta? Cadastre-se
          </button>
        </div>
      </form>
    </Modal>
  );
}