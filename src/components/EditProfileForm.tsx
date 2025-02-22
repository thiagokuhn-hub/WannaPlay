import React, { useState, useRef, useEffect } from 'react';
import { PlayingSide, PadelCategory, BeachTennisCategory, Gender, Player, GameProposal, Availability } from '../types';
import Modal from './modals/Modal';
import CategoryTooltip from './tooltips/CategoryTooltip';
import PlayerHistory from './PlayerHistory';
import { Camera } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { resizeImage } from '../utils/imageUtils';

interface EditProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Player>) => void;
  currentUser: Player;
  games: GameProposal[];
  availabilities: Availability[];
  onViewGame: (game: GameProposal) => void;
  onRepublishGame?: (game: GameProposal) => void;
  onRepublishAvailability?: (availability: Availability, data: { duration: '7days' | '14days' }) => void;
  locations: Location[];
}

export default function EditProfileForm({ 
  isOpen, 
  onClose, 
  onSubmit,
  games,
  availabilities,
  onViewGame,
  onRepublishGame,
  onRepublishAvailability,
  locations
}: Omit<EditProfileFormProps, 'currentUser'>) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  
  // Add to state initialization
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    padelCategory: '',
    beachTennisCategory: '',
    tennisCategory: '', // Add this line
    playingSide: 'both' as PlayingSide,
    gender: 'male' as Gender,
    avatar: undefined as string | undefined,
    preferredSports: [] as Sport[],
  });

  // Update the useEffect to include preferredSports
  useEffect(() => {
    if (currentUser) {
      console.log('Current user data:', currentUser);
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        password: '',
        padelCategory: currentUser.padel_category || '',
        beachTennisCategory: currentUser.beach_tennis_category || '',
        tennisCategory: currentUser.tennis_category || '', // Add this line
        playingSide: currentUser.playing_side || 'both',
        gender: currentUser.gender || 'male',
        avatar: currentUser.avatar,
        preferredSports: currentUser.preferred_sports || ['padel', 'beach-tennis', 'tennis'],
      });
    }
  }, [currentUser]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const beachTennisCategories: BeachTennisCategory[] = [
    'INICIANTE',
    'CAT C',
    'CAT B',
    'CAT A',
    'PROFISSIONAL'
  ];

  const tennisCategories: TennisCategory[] = [
    '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0'
  ];

  // Add helper functions here, before handleFileChange
  const shouldShowPadelCategory = () => {
    return formData.preferredSports.includes('padel') || formData.preferredSports.length === 2;
  };

  const shouldShowBeachTennisCategory = () => {
    return formData.preferredSports.includes('beach-tennis') || formData.preferredSports.length === 2;
  };

  const shouldShowTennisCategory = () => {
    return formData.preferredSports.includes('tennis');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    // Check file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 3MB');
      return;
    }
  
    try {
      const resizedImage = await resizeImage(file);
      setFormData({ ...formData, avatar: resizedImage });
    } catch (err) {
      alert('Erro ao processar a imagem. Tente novamente.');
    }
  };

  const removePhoto = () => {
    setFormData({ ...formData, avatar: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add state for sports selection error
  const [sportSelectionError, setSportSelectionError] = useState(false);

  // Modify the handleSubmit function
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSportSelectionError(false);

    // Validate sports selection
    if (formData.preferredSports.length === 0) {
      setSportSelectionError(true);
      return;
    }

    const updatedData: Partial<Player> = {
      ...formData,
      preferred_sports: formData.preferredSports,
      ...(formData.password ? { password: formData.password } : {})
    };
    onSubmit(updatedData);
  };

  // Add this check before the return statement
  if (!currentUser) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Minha Conta"
    >
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Histórico
          </button>
        </nav>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                    setSportSelectionError(false);
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
                  checked={formData.preferredSports.length === 3} // Update to check for all three sports
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      preferredSports: e.target.checked 
                        ? ['padel', 'beach-tennis', 'tennis'] // Include tennis here
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
              Nova Senha (deixe em branco para manter a atual)
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Digite apenas se quiser alterar a senha"
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
          )}

          {/* Add after beach tennis category selection */}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      ) : (
        <PlayerHistory
          player={currentUser}
          games={games}
          availabilities={availabilities}
          onViewGame={onViewGame}
          onRepublishGame={onRepublishGame}
          onRepublishAvailability={onRepublishAvailability}
          locations={locations}
        />
      )}
    </Modal>
  );
}