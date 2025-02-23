import React, { useState, useEffect } from 'react';
import { Sport, Location, WeekDay, TimeSlot, Player, SkillLevel, PlayingSide, Availability, AvailabilityDuration, Gender } from '../types';
import { generateTimeOptions } from '../utils/timeUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Plus, X, Search } from 'lucide-react';
import SkillLevelTooltip from './tooltips/SkillLevelTooltip';
import LocationInfoTooltip from './tooltips/LocationInfoTooltip';
import { supabase } from '../lib/supabase';

interface AvailabilityFormProps {
  onSubmit: (data: {
    player?: Player;
    sports: Sport[];
    locations: string[];
    timeSlots: TimeSlot[];
    notes?: string;
    duration: AvailabilityDuration;
    groups?: string[]; // Add groups support
  }) => void;
  onClose: () => void;
  currentUser: Player | null;
  initialData?: Availability | null;
  availableLocations: Location[];
}

export default function AvailabilityForm({ onSubmit, onClose, currentUser, initialData, availableLocations = [] }: AvailabilityFormProps) {
  // Add this console.log to debug
  console.log('Available locations:', availableLocations);

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    skillLevel: currentUser?.skillLevel || 'intermediate' as SkillLevel,
    playingSide: currentUser?.playingSide || 'both' as PlayingSide,
    gender: currentUser?.gender || 'male' as Gender,
    sports: [] as Sport[],
    locations: [] as string[],
    timeSlots: [] as TimeSlot[],
    notes: '',
    duration: '7days' as AvailabilityDuration,
    padelCategory: currentUser?.padelCategory,
    beachTennisCategory: currentUser?.beachTennisCategory,
  });

  const [locationStartIndex, setLocationStartIndex] = useState(0);
  const [error, setError] = useState('');
  const [showCategoryWarning, setShowCategoryWarning] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [currentSlot, setCurrentSlot] = useState({
    day: 'monday' as WeekDay,
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.player.name,
        phone: initialData.player.phone,
        skillLevel: initialData.player.skillLevel,
        playingSide: initialData.player.playingSide,
        gender: initialData.player.gender,
        sports: initialData.sports,
        locations: initialData.locations,
        timeSlots: initialData.timeSlots,
        notes: initialData.notes || '',
        duration: initialData.duration,
        padelCategory: initialData.player.padelCategory,
        beachTennisCategory: initialData.player.beachTennisCategory,
      });
    }
  }, [initialData]);

  const showNextLocations = () => {
    if (locationStartIndex + 3 < availableLocations.length) {
      setLocationStartIndex(prev => prev + 3);
    }
  };

  const showPreviousLocations = () => {
    if (locationStartIndex > 0) {
      setLocationStartIndex(prev => Math.max(0, prev - 3));
    }
  };

  const visibleLocations = availableLocations.slice(locationStartIndex, locationStartIndex + 3);

  const weekDayLabels: Record<WeekDay, string> = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const handleSportToggle = (sport: Sport) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  const handleLocationToggle = (locationId: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(locationId)
        ? prev.locations.filter(id => id !== locationId)
        : [...prev.locations, locationId]
    }));
  };

  const addTimeSlot = () => {
    if (currentSlot.startTime && currentSlot.endTime && currentSlot.startTime < currentSlot.endTime) {
      setFormData(prev => ({
        ...prev,
        timeSlots: [...prev.timeSlots, { ...currentSlot }]
      }));
      setCurrentSlot({
        day: 'monday',
        startTime: '',
        endTime: '',
      });
      setShowTimeSlotModal(false);
    }
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    console.log('Validating form with data:', {
      sports: formData.sports,
      locations: formData.locations,
      timeSlots: formData.timeSlots
    });

    if (!formData.sports.length) {
      setError('Selecione pelo menos um esporte');
      return false;
    }
    if (!formData.locations.length) {
      setError('Selecione pelo menos uma localização');
      return false;
    }
    if (!formData.timeSlots.length) {
      setError('Adicione pelo menos um horário');
      return false;
    }

    // Only check categories if user is logged in
    if (currentUser) {
      const hasPadel = formData.sports.includes('padel');
      const hasBeachTennis = formData.sports.includes('beach-tennis');

      console.log('Checking categories:', {
        hasPadel,
        hasBeachTennis,
        userPadelCategory: currentUser?.padelCategory,
        userBeachTennisCategory: currentUser?.beachTennisCategory
      });

      // Show warning only if the sport is selected AND the user doesn't have the category
      if ((hasPadel && currentUser?.padelCategory === null) || 
          (hasBeachTennis && currentUser?.beachTennisCategory === null)) {
        setShowCategoryWarning(true);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowCategoryWarning(false);

    if (!validateForm()) {
      return;
    }

    try {
      // Just prepare and pass the data to parent
      const submitData = {
        sports: formData.sports,
        locations: formData.locations,
        timeSlots: formData.timeSlots,
        notes: formData.notes,
        duration: formData.duration,
        player: currentUser || {
          id: Date.now().toString(),
          name: formData.name,
          phone: formData.phone,
          email: '',
          password: '',
          skillLevel: formData.skillLevel,
          playingSide: formData.playingSide,
          gender: formData.gender,
          padelCategory: formData.padelCategory,
          beachTennisCategory: formData.beachTennisCategory,
        },
        groups: selectedGroups.map(group => group.group_id), // Include selected groups
      };

      onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error in form submission:', error);
      setError('Erro ao salvar disponibilidade. Tente novamente.');
    }
  };

  const handleContinueWithoutCategory = () => {
    setShowCategoryWarning(false);
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  // Add this with other state declarations
  const [isPublic, setIsPublic] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [searchGroupTerm, setSearchGroupTerm] = useState('');
  const [searchGroupResults, setSearchGroupResults] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);

  // Add this function with other function declarations
  // Update the handleGroupModalOpen function
  const handleGroupModalOpen = () => {
    if (!currentUser) {
      setIsPublic(true);
      return;
    }

    setIsPublic(false); // Set to false when opening group modal
    setShowGroupModal(true);
    fetchUserGroups();
  };

  // Update the effect that monitors selectedGroups
  useEffect(() => {
    // Only switch to public if we're in group mode and no groups are selected
    // AND there are no groups in userGroups (user's groups)
    if (!isPublic && selectedGroups.length === 0 && userGroups.length === 0) {
      setIsPublic(true);
    }
  }, [selectedGroups, isPublic, userGroups]);

  // Update the modal close handler
  const handleCloseGroupModal = () => {
    // Switch to public if no groups are actually selected
    if (selectedGroups.length === 0) {
      setIsPublic(true);
    }
    setShowGroupModal(false);
  };

  // Also update the useEffect to remove the userGroups check since we only care about selected groups
  useEffect(() => {
    // Only switch to public if we're in group mode and no groups are selected
    if (!isPublic && selectedGroups.length === 0) {
      setIsPublic(true);
    }
  }, [selectedGroups, isPublic]);

  // Add this function to fetch user groups
  // Update the fetchUserGroups function to handle the group structure correctly
  const fetchUserGroups = async () => {
    if (!currentUser) return;
    
    try {
      const { data: groups, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups (
            id,
            name,
            avatar,
            is_public
          )
        `)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      if (groups) {
        const formattedGroups = groups.map(g => ({
          group_id: g.group_id,
          name: g.groups?.name || 'Unknown Group',
          avatar: g.groups?.avatar,
          is_public: g.groups?.is_public
        }));
        setUserGroups(formattedGroups);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  };

  const [groupRequestStatus, setGroupRequestStatus] = useState<{ [key: string]: boolean }>({});

    // Update the handleJoinGroup function to include avatar
    const handleJoinGroup = async (group: any) => {
      if (group.is_public) {
        // For public groups, create a properly formatted group object
        const formattedGroup = {
          group_id: group.id,
          name: group.name,
          avatar: group.avatar // Include avatar in the formatted group
        };
        
        // Rest of the function remains the same
        if (currentUser) {
          try {
            await supabase
              .from('group_members')
              .insert({
                user_id: currentUser.id,
                group_id: group.id
              });
            
            // Fetch updated user groups after successful insertion
            await fetchUserGroups();
            
            // Add to selected groups after successful database update
            handleGroupToggle(formattedGroup);
            setIsPublic(false); // Ensure we stay in group mode
          } catch (error) {
            console.error('Error adding user to group:', error);
          }
        }
      } else {
        // Request to join private group
        setGroupRequestStatus(prev => ({ ...prev, [group.id]: true }));
        alert('Uma solicitação de aprovação foi enviada para o administrador do grupo.');
        
        // Check if there are any selected groups, if not switch to public
        if (selectedGroups.length === 0) {
          setIsPublic(true);
        }
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
            .select('id, name, is_public, avatar') // Include avatar in the select
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


  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Add sports selection section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modalidades (selecione uma ou mais)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSportToggle('tennis')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.sports.includes('tennis')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tênis
            </button>
            <button
              type="button"
              onClick={() => handleSportToggle('padel')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.sports.includes('padel')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Padel
            </button>
            <button
              type="button"
              onClick={() => handleSportToggle('beach-tennis')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.sports.includes('beach-tennis')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Beach Tennis
            </button>
          </div>
        </div>

        {/* Rest of the form fields */}
        {!currentUser && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nível
                </label>
                <SkillLevelTooltip />
              </div>
              <select
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.playingSide}
                onChange={(e) => setFormData({ ...formData, playingSide: e.target.value as PlayingSide })}
              >
                <option value="left">Esquerdo</option>
                <option value="right">Direito</option>
                <option value="both">Ambos</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duração da Disponibilidade
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="duration"
                value="7days"
                checked={formData.duration === '7days'}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value as AvailabilityDuration })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">7 dias</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="duration"
                value="14days"
                checked={formData.duration === '14days'}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value as AvailabilityDuration })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">14 dias</span>
            </label>
          </div>
        </div>

        
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Disponibilidade
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
              <span className="text-sm text-gray-700 ml-2">Pública</span>
            </label>
            <label 
              className="flex items-center cursor-pointer"
              onClick={handleGroupModalOpen}
            >
              <input
                type="radio"
                name="visibility"
                checked={!isPublic}
                onChange={() => {}} // Add empty onChange to prevent React warning
                className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:blue-500"
              />
              <span className="text-sm text-gray-700 ml-2">
                Grupos {selectedGroups.length > 0 && `(${selectedGroups.length})`}
              </span>
            </label>
          </div>
        </div>

        <div>
          
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
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Horários que estou disponível para marcar um jogo:
            </label>
            <button
              type="button"
              onClick={() => setShowTimeSlotModal(true)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4" />
              Adicionar Horário
            </button>
          </div>

          <div className="space-y-2">
            {formData.timeSlots.map((slot, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg group"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="font-medium text-gray-900">{weekDayLabels[slot.day]}</span>
                    <span className="text-gray-600 ml-2">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeTimeSlot(index)}
                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {formData.timeSlots.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-500">
                Nenhum horário adicionado
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Adicione informações relevantes sobre sua disponibilidade..."
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {initialData ? 'Salvar Alterações' : 'Salvar Disponibilidade'}
          </button>
        </div>
      </form>

      {/* Move modals outside the form */}
      {showTimeSlotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Adicionar Horário</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dia da Semana
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={currentSlot.day}
                  onChange={(e) => setCurrentSlot({
                    ...currentSlot,
                    day: e.target.value as WeekDay
                  })}
                >
                  {Object.entries(weekDayLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Início
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={currentSlot.startTime}
                    onChange={(e) => setCurrentSlot({
                      ...currentSlot,
                      startTime: e.target.value
                    })}
                  >
                    <option value="">Selecione</option>
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Término
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={currentSlot.endTime}
                    onChange={(e) => setCurrentSlot({
                      ...currentSlot,
                      endTime: e.target.value
                    })}
                  >
                    <option value="">Selecione</option>
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTimeSlotModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={addTimeSlot}
                  disabled={!currentSlot.startTime || !currentSlot.endTime}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Selecione Grupos</h3>
              <button
                onClick={handleCloseGroupModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
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

              {userGroups.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Meus Grupos</h4>
                  <div className="space-y-2">
                   
                    {userGroups.map((group) => (
                      // Update the display in "Meus Grupos" section
                      <button
                        key={group.group_id}
                        onClick={() => handleGroupToggle(group)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 ${
                          selectedGroups.some(g => g.group_id === group.group_id) ? 'bg-blue-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={group.avatar || '/default-group.png'}
                            alt={group.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex items-center gap-2">
                            <span>{group.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              group.is_public 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {group.is_public ? 'Público' : 'Privado'}
                            </span>
                          </div>
                        </div>
                        <span className="text-blue-600">
                          {selectedGroups.some(g => g.group_id === group.group_id) ? 'Selecionado' : 'Selecionar'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchGroupResults.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Resultados da Pesquisa</h4>
                  <div className="space-y-2">
                    {searchGroupResults.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleJoinGroup(group)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={group.avatar || '/default-group.png'}
                            alt={group.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex items-center gap-2">
                            <span>{group.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              group.is_public 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {group.is_public ? 'Público' : 'Privado'}
                            </span>
                          </div>
                        </div>
                        <span className="text-blue-600">
                          {group.is_public 
                            ? (selectedGroups.some(g => g.group_id === group.id) ? 'Selecionado' : 'Entrar')
                            : (groupRequestStatus[group.id] ? 'Solicitado' : 'Entrar')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {userGroups.length === 0 && searchGroupResults.length === 0 && searchGroupTerm.length < 3 && (
                <p className="text-center text-gray-500 py-4">
                  Digite pelo menos 3 caracteres para pesquisar grupos
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showCategoryWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Categoria não selecionada</h3>
            <p className="text-gray-600 mb-4">
              É importante selecionar uma categoria para que outros jogadores saibam seu nível. 
              Você pode atualizar sua categoria no seu perfil.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCategoryWarning(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Voltar
              </button>
              <button
                onClick={handleContinueWithoutCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continuar sem categoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}