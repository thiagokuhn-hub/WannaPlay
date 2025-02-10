import React, { useState, useEffect, useRef } from 'react';
import { PlayingSide, PadelCategory, BeachTennisCategory, Gender } from '../types';
import { UserPlus2, Camera, X } from 'lucide-react';
import Modal from './modals/Modal';
import CategoryTooltip from './tooltips/CategoryTooltip';
import { useAuth } from '../hooks/useAuth';
import { resizeImage } from '../utils/imageUtils';

interface PlayerRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    phone: string;
    email: string;
    password: string;
    padelCategory?: PadelCategory;
    beachTennisCategory?: BeachTennisCategory;
    playingSide: PlayingSide;
    gender: Gender;
    avatar?: string;
    cep: string;
  }) => void;
  onSwitchToLogin: () => void;
}

const initialFormState = {
  name: '',
  phone: '',
  email: '',
  password: '',
  padelCategory: undefined as PadelCategory | undefined,
  beachTennisCategory: undefined as BeachTennisCategory | undefined,
  playingSide: 'both' as PlayingSide,
  gender: 'male' as Gender,
  avatar: undefined as string | undefined,
  cep: '',
};

export default function PlayerRegistration({ isOpen, onClose, onSwitchToLogin }: PlayerRegistrationProps) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  const [showCategoryWarning, setShowCategoryWarning] = useState(false);
  const [showCepWarning, setShowCepWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setShowCategoryWarning(false);
      setShowCepWarning(false);
      setError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setFormData(initialFormState);
    setShowCategoryWarning(false);
    setShowCepWarning(false);
    setError(null);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    // Check file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 3MB');
      return;
    }
  
    try {
      const resizedImage = await resizeImage(file);
      setFormData({ ...formData, avatar: resizedImage });
    } catch (err) {
      setError('Erro ao processar a imagem. Tente novamente.');
    }
  };

  const removePhoto = () => {
    setFormData({ ...formData, avatar: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 8) {
      value = value.slice(0, 8);
    }
    
    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5);
    }
    
    setFormData({ ...formData, cep: value });
  };

  const beachTennisCategories: BeachTennisCategory[] = [
    'INICIANTE',
    'CAT C',
    'CAT B',
    'CAT A',
    'PROFISSIONAL'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate CEP
    if (formData.cep && !formData.cep.startsWith('9')) {
      setShowCepWarning(true);
      return;
    }
    
    // Check if at least one category is selected
    if (!formData.padelCategory && !formData.beachTennisCategory) {
      setShowCategoryWarning(true);
      return;
    }

    setLoading(true);
    try {
      await signUp(formData);
      setFormData(initialFormState);
      onClose();
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Cadastro de Jogador"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 ${
                formData.avatar ? 'bg-gray-100' : 'bg-gray-50'
              }`}>
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera className="w-8 h-8" />
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="mt-2 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {formData.avatar ? 'Alterar foto' : 'Adicionar foto'}
                </button>
                
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
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
              Gênero
            </label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
            >
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (necessário para resetar a senha)
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone (Whatsapp)
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
              CEP
            </label>
            <input
              type="text"
              required
              maxLength={9}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.cep}
              onChange={handleCepChange}
              placeholder="99999-999"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Categoria Padel (Opcional)
              </label>
              <CategoryTooltip />
            </div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.padelCategory || ''}
              onChange={(e) => setFormData({
                ...formData,
                padelCategory: e.target.value ? e.target.value as PadelCategory : undefined
              })}
            >
              <option value="">Selecione a categoria (opcional)</option>
              <option value="CAT 1">CAT 1</option>
              <option value="CAT 2">CAT 2</option>
              <option value="CAT 3">CAT 3</option>
              <option value="CAT 4">CAT 4</option>
              <option value="CAT 5">CAT 5</option>
              <option value="CAT 6">CAT 6</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria Beach Tennis (Opcional)
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.beachTennisCategory || ''}
              onChange={(e) => setFormData({
                ...formData,
                beachTennisCategory: e.target.value ? e.target.value as BeachTennisCategory : undefined
              })}
            >
              <option value="">Selecione a categoria (opcional)</option>
              {beachTennisCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lado Preferido
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.playingSide}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  playingSide: e.target.value as PlayingSide,
                })
              }
            >
              <option value="left">Esquerdo</option>
              <option value="right">Direito</option>
              <option value="both">Ambos</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Já tem uma conta? Entre aqui
            </button>
          </div>
        </form>
      </Modal>
      {/* ... warning modals ... */}
    </>
  );
}