import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc'; // Add this import

import Modal from './modals/Modal';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; password: string }) => void;
  onRegisterClick: () => void;  // Changed from onSwitchToRegister
}

export default function LoginForm({ isOpen, onClose, onSubmit, onRegisterClick }: LoginFormProps) {
  const { signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login com Google');
    } finally {
      setGoogleLoading(false);
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
        
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {googleLoading ? (
            <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></span>
          ) : (
            <FcGoogle className="w-5 h-5" />
          )}
          {googleLoading ? 'Entrando...' : 'Entrar com Google'}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou</span>
          </div>
        </div>

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

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={onRegisterClick}
              className="text-blue-600 hover:text-blue-800"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </form>
    </Modal>
  );
}