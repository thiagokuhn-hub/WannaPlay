import React, { useState, useEffect } from 'react';  // Add useEffect to the imports
import { 
  Sport, 
  Location, 
  GameProposal, 
  PadelCategory, 
  BeachTennisCategory, 
  Player, 
  GameGender, 
  TennisCategory, 
} from '../types';
import { generateTimeOptions } from '../utils/timeUtils';
import { toLocalISOString, normalizeDate } from '../utils/dateUtils';
import { validateTimes, formatTimeForSelect } from '../utils/formValidation';
import CategorySelector from './game/CategorySelector';
import LocationSelector from './game/LocationSelector';
import LocationInfoTooltip from './tooltips/LocationInfoTooltip';
import CategoryTooltip from './tooltips/CategoryTooltip';
import { X, Search } from 'lucide-react';  // Add this import
import { supabase } from '../lib/supabase';

const padelCategories: PadelCategory[] = ['CAT 1', 'CAT 2', 'CAT 3', 'CAT 4', 'CAT 5', 'CAT 6'];
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

interface GameProposalFormProps {
  onSubmit: (data: {
    sport: Sport;
    locations: string[];
    date: string;
    startTime: string;
    endTime: string;
    description: string;
    requiredCategories: (PadelCategory | BeachTennisCategory | TennisCategory)[];
    gender: GameGender;
    maxPlayers: number;
    is_public: boolean;  // Add this field
    groups?: string[];   // Add this field
  }) => void;
  onClose: () => void;
  initialData?: Partial<GameProposal>;
  isEditing?: boolean;
  currentUser: Player | null;
  availableLocations: Location[];
}

export default function GameProposalForm({ 
  onSubmit, 
  onClose, 
  initialData, 
  isEditing, 
  currentUser,
  availableLocations = []
}: GameProposalFormProps) {
  // Add this console.log to debug the incoming data
  console.log('Initial Data:', {
    initialData,
    startTime: initialData?.startTime,
    endTime: initialData?.endTime,
    start_time: initialData?.start_time,
    end_time: initialData?.end_time
  });

  // Move all state declarations to the top
  const [formData, setFormData] = useState({
    sport: initialData?.sport || 'padel' as Sport,
    locations: initialData?.locations || [] as string[],
    date: initialData?.date ? toLocalISOString(new Date(initialData.date)) : '',
    startTime: formatTimeForSelect(initialData?.start_time || initialData?.startTime || ''),
    endTime: formatTimeForSelect(initialData?.end_time || initialData?.endTime || ''),
    description: initialData?.description || '',
    requiredCategories: initialData?.requiredCategories || [] as (PadelCategory | BeachTennisCategory | TennisCategory)[],
    gender: initialData?.gender || 'male' as GameGender,
    maxPlayers: initialData?.maxPlayers || 4,
  });

  // Add these state declarations before any function that uses them
  const [isPublic, setIsPublic] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [searchGroupTerm, setSearchGroupTerm] = useState('');
  const [searchGroupResults, setSearchGroupResults] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [groupRequestStatus, setGroupRequestStatus] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState('');
  const timeOptions = generateTimeOptions();

  // Add useEffect to fetch game groups when editing
  useEffect(() => {
    const fetchGameGroups = async () => {
      if (isEditing && initialData?.id) {
        try {
          // Fetch game groups
          const { data: gameGroups, error: groupsError } = await supabase
            .from('game_groups')
            .select(`
              group_id,
              groups (
                id,
                name,
                avatar,
                is_public,
                city,
                state
              )
            `)
            .eq('game_id', initialData.id);

          if (groupsError) throw groupsError;

          if (gameGroups && gameGroups.length > 0) {
            const formattedGroups = gameGroups.map(gg => ({
              group_id: gg.groups?.id,
              name: gg.groups?.name || 'Unknown Group',
              avatar: gg.groups?.avatar,
              is_public: gg.groups?.is_public,
              city: gg.groups?.city,
              state: gg.groups?.state
            }));
            
            setSelectedGroups(formattedGroups);
            setIsPublic(false); // If there are groups, the game is private
          } else {
            setIsPublic(initialData.is_public ?? true);
          }
        } catch (error) {
          console.error('Error fetching game groups:', error);
        }
      }
    };

    fetchGameGroups();
  }, [isEditing, initialData]);

  useEffect(() => {
    if (initialData && isEditing) {
      setFormData(prev => ({
        ...prev,
        startTime: formatTimeForSelect(initialData.start_time || initialData.startTime || prev.startTime),
        endTime: formatTimeForSelect(initialData.end_time || initialData.endTime || prev.endTime)
      }));
    }
  }, [initialData, isEditing]);

  const handleLocationToggle = (locationId: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(locationId)
        ? prev.locations.filter(id => id !== locationId)
        : [...prev.locations, locationId]
    }));
    setError('');
  };

  const handleCategoryToggle = (category: PadelCategory | BeachTennisCategory | TennisCategory) => {
    setFormData(prev => ({
      ...prev,
      requiredCategories: prev.requiredCategories.includes(category)
        ? prev.requiredCategories.filter(c => c !== category)
        : [...prev.requiredCategories, category]
    }));
    setError('');
  };

  const handleSportChange = (sport: Sport) => {
    setFormData(prev => ({
      ...prev,
      sport,
      requiredCategories: []
    }));
    setError('');
  };


  const handleGroupModalOpen = () => {
    if (!currentUser) {
      setIsPublic(true);
      return;
    }
  
    setIsPublic(false);
    setShowGroupModal(true);
    fetchUserGroups();
  };
  
  const handleCloseGroupModal = () => {
    if (selectedGroups.length === 0) {
      setIsPublic(true);
    }
    setShowGroupModal(false);
  };
  
  const fetchUserGroups = async () => {
    if (!currentUser) return;
    
    try {
      const { data: groups, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          groups (
            id,
            name,
            avatar,
            is_public,
            city,
            state
          )
        `)
        .eq('user_id', currentUser.id);
  
      if (error) throw error;
  
      if (groups) {
        const formattedGroups = groups.map(g => ({
          group_id: g.group_id,
          name: g.groups?.name || 'Unknown Group',
          avatar: g.groups?.avatar,
          is_public: g.groups?.is_public,
          role: g.role,
          city: g.groups?.city,
          state: g.groups?.state
        }));
        setUserGroups(formattedGroups);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  };
  
  const handleJoinGroup = async (group: any) => {
    try {
      if (group.is_public) {
        const formattedGroup = {
          group_id: group.id,
          name: group.name,
          avatar: group.avatar
        };
        
        if (currentUser) {
          await supabase
            .from('group_members')
            .insert({
              user_id: currentUser.id,
              group_id: group.id,
              role: 'member'
            });
          
          await fetchUserGroups();
          handleGroupToggle(formattedGroup);
          setIsPublic(false);
        }
      } else {
        const { error } = await supabase
          .from('group_members')
          .insert({
            user_id: currentUser.id,
            group_id: group.id,
            role: 'pending'
          });
        
        if (error) throw error;
        
        setGroupRequestStatus(prev => ({ ...prev, [group.id]: true }));
        alert('Uma solicitação de aprovação foi enviada para o administrador do grupo.');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Erro ao solicitar entrada no grupo. Tente novamente.');
    }
  };
  
  const handleSearchGroups = async (term: string) => {
    setSearchGroupTerm(term);
    if (term.length < 3) {
      setSearchGroupResults([]);
      return;
    }
  
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, is_public, avatar, city, state')
        .ilike('name', `%${term}%`)
        .limit(5);
  
      if (error) throw error;
      setSearchGroupResults(data || []);
    } catch (error) {
      console.error('Error searching groups:', error);
    }
  };
  
  const handleGroupToggle = (group: Group) => {
    setSelectedGroups(prev => 
      prev.some(g => g.group_id === group.group_id)
        ? prev.filter(g => g.group_id !== group.group_id)
        : [...prev, group]
    );
  };

  const validateForm = () => {
    if (formData.locations.length === 0) {
      setError('Selecione pelo menos uma localização');
      return false;
    }
    if (formData.requiredCategories.length === 0) {
      setError('Selecione pelo menos uma categoria');
      return false;
    }
    if (!validateTimes(formData.startTime, formData.endTime)) {
      setError('O horário de término deve ser depois do horário de início');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      
    if (!validateForm()) {
      return;
    }

    try {
      const normalizedDate = normalizeDate(formData.date);
      const gameData = {
        sport: formData.sport,
        date: normalizedDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        description: formData.description,
        gender: formData.gender,
        max_players: formData.maxPlayers,
        required_categories: formData.requiredCategories,
        location_id: formData.locations.length > 0 ? formData.locations[0] : null,
        locations: formData.locations,
        is_public: isPublic,
      };

      let gameId;
      
      if (isEditing && initialData?.id) {
        // Update existing game
        const { error: updateError } = await supabase
          .from('games')
          .update({
            ...gameData,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id);
      
      if (updateError) throw updateError;
      gameId = initialData.id;
    } else {
      // Create new game
      const { data: newGame, error: insertError } = await supabase
        .from('games')
        .insert({
          ...gameData,
          created_by: currentUser?.id
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      gameId = newGame.id;

      if (currentUser) {
        await supabase
          .from('game_players')
          .insert({
            game_id: gameId,
            player_id: currentUser.id,
            joined_at: new Date().toISOString(),
            is_temporary: false
          });
      }
    }
    
    // Handle group associations
    if (gameId) {
      // Remove existing group associations if switching to public
      if (isPublic) {
        await supabase
          .from('game_groups')
          .delete()
          .eq('game_id', gameId);
        setSelectedGroups([]); // Clear selected groups when game is public
      } else if (selectedGroups.length > 0) {
        const groupAssociations = selectedGroups.map(group => ({
          game_id: gameId,
          group_id: group.group_id
        }));
    
        const { error: groupError } = await supabase
          .from('game_groups')
          .insert(groupAssociations);
    
        if (groupError) throw groupError;
      }
    }
    
    onSubmit({
      ...formData,
      date: normalizedDate,
      is_public: isPublic,
    });
  } catch (error) {
    console.error('Error in form submission:', error);
    setError('Erro ao criar o jogo. Tente novamente.');
  }
};

  useEffect(() => {
    if (!isPublic && selectedGroups.length === 0) {
      setIsPublic(true);
    }
  }, [selectedGroups, isPublic]);
  

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Esporte
        </label>
        <div className="flex flex-wrap gap-2">
          {(['padel', 'beach-tennis', 'tennis'] as Sport[]).map((sportOption) => (
            <button
              key={sportOption}
              type="button"
              onClick={() => handleSportChange(sportOption)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.sport === sportOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sportOption === 'padel' ? 'Padel' : sportOption === 'beach-tennis' ? 'Beach Tennis' : 'Tênis'}
            </button>
          ))}
        </div>
      </div>

      <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Tipo de Jogo
  </label>
  <div className="flex gap-4">
    <label className="flex items-center cursor-pointer">
      <input
        type="radio"
        name="visibility"
        checked={isPublic}
        onChange={() => {
          setIsPublic(true);
          setShowGroupModal(false);
        }}
        className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:blue-500"
      />
      <span className="text-sm text-gray-700 ml-2">Público</span>
    </label>
    <label 
      className="flex items-center cursor-pointer"
      onClick={handleGroupModalOpen}
    >
      <input
        type="radio"
        name="visibility"
        checked={!isPublic}
        onChange={() => {}}
        className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:blue-500"
      />
      <span className="text-sm text-gray-700 ml-2">
        Grupos {selectedGroups.length > 0 && `(${selectedGroups.length})`}
      </span>
    </label>
  </div>
</div>



      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Jogo
        </label>
        <div className="flex flex-wrap gap-2">
          {(['mixed', 'male', 'female'] as GameGender[]).map((genderOption) => (
            <button
              key={genderOption}
              type="button"
              onClick={() => setFormData({ ...formData, gender: genderOption })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.gender === genderOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {genderOption === 'mixed' ? 'Misto' : genderOption === 'male' ? 'Masculino' : 'Feminino'}
            </button>
          ))}
        </div>
      </div>

      {/* Add this new section for max players */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de Jogadores
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, maxPlayers: 4 })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              formData.maxPlayers === 4
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            4 jogadores
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, maxPlayers: 8 })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              formData.maxPlayers === 8
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            4+ jogadores
          </button>
        </div>
      </div>

      
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Locais (selecione um ou mais)
          </label>
          <LocationInfoTooltip locations={availableLocations} />
        </div>
        <div className="relative">
          <div className="overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex gap-2 min-w-min">
              {availableLocations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => handleLocationToggle(location.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    formData.locations.includes(location.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Categorias Permitidas (selecione uma ou mais)
          </label>
          <CategoryTooltip />
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.sport === 'padel' && padelCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryToggle(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.requiredCategories.includes(category)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
          {formData.sport === 'beach-tennis' && beachTennisCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryToggle(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.requiredCategories.includes(category)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
          {formData.sport === 'tennis' && tennisCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryToggle(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.requiredCategories.includes(category)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data e Horário
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <input
                    type="date"
                    required
                    min={toLocalISOString(new Date())}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:bg-gray-100"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
    
                <div className="relative">
                  <select
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-colors hover:bg-gray-100"
                    value={formData.startTime}
                    onChange={(e) => {
                      const newTime = e.target.value;
                      if (validateTimes(newTime, formData.endTime)) {
                        setFormData({ ...formData, startTime: newTime });
                      }
                    }}
                  >
                    <option value="">Início</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
    
                <div className="relative">
                  <select
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-colors hover:bg-gray-100"
                    value={formData.endTime}
                    onChange={(e) => {
                      const newTime = e.target.value;
                      if (validateTimes(formData.startTime, newTime)) {
                        setFormData({ ...formData, endTime: newTime });
                      }
                    }}
                  >
                    <option value="">Término</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Informações Adicionais
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Adicione informações importantes sobre o jogo..."
          />
        </div>
      </div>

      {showGroupModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Selecionar Grupos</h3>
        <button
          onClick={handleCloseGroupModal}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchGroupTerm}
          onChange={(e) => handleSearchGroups(e.target.value)}
          placeholder="Pesquisar grupos..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>

      {searchGroupResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Resultados da Pesquisa</h4>
          {searchGroupResults.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <img
                  src={group.avatar || '/default-group.png'}
                  alt={group.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <span className="font-medium">{group.name}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{group.is_public ? 'Público' : 'Privado'}</span>
                    {group.city && <span>• {group.city}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  await handleJoinGroup(group);
                  setGroupRequestStatus(prev => ({ ...prev, [group.id]: true }));
                }}
                className={`text-blue-600 hover:text-blue-800 ${
                  groupRequestStatus[group.id] ? 'disabled' : ''
                }`}
                disabled={groupRequestStatus[group.id]}
              >
                {group.is_public ? 'Entrar' : groupRequestStatus[group.id] ? 'Aguardando aprovação' : 'Solicitar'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {userGroups.map((group) => (
          <div
            key={group.group_id}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <img
                src={group.avatar || '/default-group.png'}
                alt={group.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <span className="font-medium">{group.name}</span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{group.is_public ? 'Público' : 'Privado'}</span>
                  {group.city && <span>• {group.city}</span>}
                </div>
                {group.role === 'pending' && (
                  <span className="text-xs text-yellow-600 block">
                    Aguardando aprovação
                  </span>
                )}
              </div>
            </div>
            {group.role !== 'pending' && (
              <button
                type="button"
                onClick={() => handleGroupToggle(group)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedGroups.some(g => g.group_id === group.group_id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedGroups.some(g => g.group_id === group.group_id)
                  ? 'Selecionado'
                  : 'Selecionar'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCloseGroupModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Concluir
        </button>
      </div>
    </div>
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
          {isEditing ? 'Salvar Alterações' : 'Propor Jogo'}
        </button>
      </div>
    </form>
  );
}