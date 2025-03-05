import React, { useState, useEffect } from 'react';
import { Sport, Location, WeekDay, TimeSlot, Player, SkillLevel, PlayingSide, Availability, AvailabilityDuration, Gender } from '../types';
import { generateTimeOptions } from '../utils/timeUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Plus, X, Search } from 'lucide-react';
import SkillLevelTooltip from './tooltips/SkillLevelTooltip';
import LocationInfoTooltip from './tooltips/LocationInfoTooltip';
import { supabase } from '../lib/supabase';
import { useGroupManagement } from './groups/useGroupManagement'; // Ensure this is imported

interface AvailabilityFormProps {
  onSubmit: (data: {
    player?: Player;
    sports: Sport[];
    locations: string[];
    timeSlots: TimeSlot[];
    notes?: string;
    duration: AvailabilityDuration;
    is_public: boolean;
    groups?: string[];  // Add this field
  }) => void;
  onClose: () => void;
  currentUser: Player | null;
  initialData?: Availability | null;
  availableLocations: Location[];
}

export default function AvailabilityForm({ onSubmit, onClose, currentUser, initialData, availableLocations = [] }: AvailabilityFormProps) {
  // Add this console.log to debug
  

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
      console.log('Initial Data:', initialData);
      console.log('Is Public:', initialData.is_public);
      console.log('Groups:', initialData.availability_groups);
      
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
      
      // Set isPublic based on initialData
      setIsPublic(initialData.is_public);
      
      // Set selectedGroups if the availability is not public
      if (!initialData.is_public && initialData.availability_groups?.length > 0) {
        console.log('Setting groups:', initialData.availability_groups);
        
        const groups = initialData.availability_groups.map(ag => ({
          group_id: ag.groups.id, // Update this line to use the correct path
          name: ag.groups.name,
          avatar: ag.groups.avatar,
          is_public: ag.groups.is_public,
          role: 'member'
        }));
        
        console.log('Mapped groups:', groups); // Add this log
        setSelectedGroups(groups);
        
        // Fetch user groups after setting selected groups
        fetchUserGroups();
      }
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

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowCategoryWarning(false);
  
    if (!validateForm()) {
      return;
    }
  
    try {
      if (initialData) {
        // Update main availability data
        const { error: updateError } = await supabase
          .from('availabilities')
          .update({
            is_public: isPublic,
            sports: formData.sports,
            locations: formData.locations,
            notes: formData.notes,
            duration: formData.duration,
          })
          .eq('id', initialData.id);
  
        if (updateError) throw updateError;
  
        // Update time slots
        // First, delete existing time slots
        const { error: deleteError } = await supabase
          .from('availability_time_slots')
          .delete()
          .eq('availability_id', initialData.id);
  
        if (deleteError) throw deleteError;
  
        // Then insert new time slots
        const timeSlotData = formData.timeSlots.map(slot => ({
          availability_id: initialData.id,
          day: slot.day,
          start_time: slot.startTime,
          end_time: slot.endTime
        }));
  
        const { error: timeSlotError } = await supabase
          .from('availability_time_slots')
          .insert(timeSlotData);
  
        if (timeSlotError) throw timeSlotError;
  
        // Handle group associations
        if (isPublic) {
          await supabase
            .from('availability_groups')
            .delete()
            .eq('availability_id', initialData.id);
        } else {
          const groups = selectedGroups.map(group => ({
            availability_id: initialData.id,
            group_id: group.group_id
          }));
  
          await supabase
            .from('availability_groups')
            .delete()
            .eq('availability_id', initialData.id);
  
          if (groups.length > 0) {
            const { error: groupError } = await supabase
              .from('availability_groups')
              .insert(groups);
  
            if (groupError) throw groupError;
          }
        }
      }
  
      // Rest of the code remains the same...
      onSubmit({
        player: currentUser || undefined,
        sports: formData.sports,
        locations: formData.locations,
        timeSlots: formData.timeSlots,
        notes: formData.notes,
        duration: formData.duration,
        is_public: isPublic,
        groups: !isPublic ? selectedGroups.map(group => group.group_id) : undefined
      });
      
      onClose();
    } catch (error) {
      console.error('Error in form submission:', error);
      setError('Erro ao salvar disponibilidade. Tente novamente.');
    }
  };

  // Helper function to calculate expiry date
  const calculateExpiryDate = (duration: AvailabilityDuration) => {
    const days = duration === '7days' ? 7 : 14;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
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
  // Update the fetchUserGroups function to include member role
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
          role: g.role, // Include role in the formatted group
          city: g.groups?.city, // Add city information
          state: g.groups?.state // Add state information
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
      try {
        if (group.is_public) {
          // Handle public group join logic
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
                role: 'member' // Ensure role is set for public groups
              });
            
            await fetchUserGroups();
            
            // Add to selected groups after successful database update
            handleGroupToggle(formattedGroup);
            setIsPublic(false);
          }
        } else {
          // Request to join private group
          const { error } = await supabase
            .from('group_members')
            .insert({
              user_id: currentUser.id,
              group_id: group.id,
              role: 'pending' // Set role to 'pending' for private groups
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

    const  handleSearchGroups = async (term: string) => {
      setSearchGroupTerm(term);
      if (term.length < 3) {
        setSearchGroupResults([]);
        return;
      }
    
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('id, name, is_public, avatar, city, state') // Include city and state in the select
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
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm border border-blue-100"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Adicionar Horário</span>
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
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Adicionar Horário</h3>
              <button
                type="button"
                onClick={() => setShowTimeSlotModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia da Semana
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {Object.entries(weekDayLabels).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCurrentSlot({
                        ...currentSlot,
                        day: value as WeekDay
                      })}
                      className={`
                        py-2 px-1 rounded-lg text-sm font-medium transition-all
                        ${currentSlot.day === value
                          ? 'bg-blue-600 text-white shadow-md scale-95'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      {label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        value={currentSlot.startTime}
                        onChange={(e) => setCurrentSlot({
                          ...currentSlot,
                          startTime: e.target.value
                        })}
                      >
                        <option value="">Início</option>
                        {generateTimeOptions().map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        value={currentSlot.endTime}
                        onChange={(e) => setCurrentSlot({
                          ...currentSlot,
                          endTime: e.target.value
                        })}
                      >
                        <option value="">Término</option>
                        {generateTimeOptions().map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTimeSlotModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={addTimeSlot}
                  disabled={!currentSlot.startTime || !currentSlot.endTime}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* Add search field */}
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

            {/* Display search results */}
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
              {/* Rest of the existing groups list */}
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