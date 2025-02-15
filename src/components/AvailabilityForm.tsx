import React, { useState, useEffect } from 'react';
import { Sport, Location, WeekDay, TimeSlot, Player, SkillLevel, PlayingSide, Availability, AvailabilityDuration, Gender } from '../types';
import { generateTimeOptions } from '../utils/timeUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Plus, X } from 'lucide-react';
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

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

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
            Esportes
          </label>
          <div className="flex flex-wrap gap-2">
            {(['padel', 'beach-tennis'] as Sport[]).map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => handleSportToggle(sport)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.sports.includes(sport)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                 {sport === 'padel' ? 'Padel' : 'Beach Tennis'}
              </button>
            ))}
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