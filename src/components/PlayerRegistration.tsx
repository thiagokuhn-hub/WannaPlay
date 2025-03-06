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
    tennisCategory?: TennisCategory;  // Add this field
    playingSide: PlayingSide;
    gender: Gender;
    avatar?: string;
    cep: string;
  }) => void;
  onSwitchToLogin: () => void;
}

// Update initialFormState
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
  preferredSports: ['padel', 'beach-tennis', 'tennis'] as Sport[], // Add this line
};

// Add Tennis categories constant
const tennisCategories: TennisCategory[] = [
  '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0'
];

// Add helper function for tennis category
export default function PlayerRegistration({ isOpen, onClose, onSwitchToLogin }: PlayerRegistrationProps) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  const [showCategoryWarning, setShowCategoryWarning] = useState(false);
  const [showCepWarning, setShowCepWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define the helper functions inside the component
  const shouldShowPadelCategory = () => {
    return formData.preferredSports.includes('padel');
  };

  const shouldShowBeachTennisCategory = () => {
    return formData.preferredSports.includes('beach-tennis');
  };

  const shouldShowTennisCategory = () => {
    return formData.preferredSports.includes('tennis');
  };

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

  // Add error state for sports selection
  const [sportSelectionError, setSportSelectionError] = useState(false);

  // Modify the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSportSelectionError(false);
    
    // Validate sports selection
    if (formData.preferredSports.length === 0) {
      setSportSelectionError(true);
      return;
    }
    
    // Rest of the validation and submission logic
    
    // Validate CEP
    if (formData.cep && !formData.cep.startsWith('9')) {
      setShowCepWarning(true);
      return;
    }
    
    // Show category warning if no category is selected
    if (!formData.padelCategory && !formData.beachTennisCategory && !showCategoryWarning) {
      setShowCategoryWarning(true);
      return;
    }
    
    // Create submission data without empty categories
    const submissionData = {
      ...formData,
      beachTennisCategory: formData.beachTennisCategory || undefined,
      padelCategory: formData.padelCategory || undefined,
      tennisCategory: formData.tennisCategory || undefined
    };
    
    setLoading(true);
    try {
      await signUp(submissionData);
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
      <Modal isOpen={isOpen} onClose={handleClose} title="Cadastro de Jogador">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modalidades que quero jogar
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.preferredSports.includes('padel')}
                  onChange={(e) => {
                    const newSports = e.target.checked
                      ? [...formData.preferredSports, 'padel']
                      : formData.preferredSports.filter(s => s !== 'padel');
                    setFormData({ ...formData, preferredSports: newSports });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Padel</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.preferredSports.includes('beach-tennis')}
                  onChange={(e) => {
                    const newSports = e.target.checked
                      ? [...formData.preferredSports, 'beach-tennis']
                      : formData.preferredSports.filter(s => s !== 'beach-tennis');
                    setFormData({ ...formData, preferredSports: newSports });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Beach Tennis</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.preferredSports.includes('tennis')}
                  onChange={(e) => {
                    const newSports = e.target.checked
                      ? [...formData.preferredSports, 'tennis']
                      : formData.preferredSports.filter(s => s !== 'tennis');
                    setFormData({ ...formData, preferredSports: newSports });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Tênis</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.preferredSports.length === 3}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      preferredSports: e.target.checked 
                        ? ['padel', 'beach-tennis', 'tennis']
                        : []
                    });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Todas as modalidades</span>
              </label>
            </div>
            {sportSelectionError && (
              <p className="mt-2 text-sm text-red-600">
                Selecione pelo menos uma modalidade
              </p>
            )}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gênero
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Masculino</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Feminino</span>
              </label>
            </div>
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

          {shouldShowPadelCategory() && (
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
          )}

          {shouldShowBeachTennisCategory() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria Beach Tennis (Opcional)
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.beachTennisCategory || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    beachTennisCategory: value === '' ? undefined : value as BeachTennisCategory
                  });
                }}
              >
                <option value="">Selecione a categoria (opcional)</option>
                {beachTennisCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {shouldShowTennisCategory() && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Categoria Tênis (Opcional)
                </label>
                <CategoryTooltip />
              </div>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.tennisCategory || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  tennisCategory: e.target.value ? e.target.value as TennisCategory : undefined
                })}
              >
                <option value="">Selecione a categoria (opcional)</option>
                {tennisCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lado Preferido
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="playingSide"
                  value="left"
                  checked={formData.playingSide === 'left'}
                  onChange={(e) => setFormData({ ...formData, playingSide: e.target.value as PlayingSide })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Esquerdo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="playingSide"
                  value="right"
                  checked={formData.playingSide === 'right'}
                  onChange={(e) => setFormData({ ...formData, playingSide: e.target.value as PlayingSide })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Direito</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="playingSide"
                  value="both"
                  checked={formData.playingSide === 'both'}
                  onChange={(e) => setFormData({ ...formData, playingSide: e.target.value as PlayingSide })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Ambos</span>
              </label>
            </div>
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
      {/* Add the category warning modal */}
      <Modal
        isOpen={showCategoryWarning}
        onClose={() => setShowCategoryWarning(false)}
        title="Atenção"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Você não selecionou nenhuma categoria. Tem certeza que deseja continuar?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCategoryWarning(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Voltar
            </button>
            <button
              onClick={() => {
                setShowCategoryWarning(false);
                handleSubmit({ preventDefault: () => {} } as React.FormEvent);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continuar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}