import React, { useState, useEffect } from 'react';  // Add useEffect to the imports
import { Sport, Location, GameProposal, PadelCategory, BeachTennisCategory, Player, GameGender } from '../types';
import { generateTimeOptions } from '../utils/timeUtils';
import { toLocalISOString, normalizeDate } from '../utils/dateUtils';
import CategoryTooltip from './tooltips/CategoryTooltip';
import LocationInfoTooltip from './tooltips/LocationInfoTooltip';
import { supabase } from '../lib/supabase';

interface GameProposalFormProps {
  onSubmit: (data: {
    sport: Sport;
    locations: string[];
    date: string;
    startTime: string;
    endTime: string;
    description: string;
    requiredCategories: (PadelCategory | BeachTennisCategory)[];
    gender: GameGender;
    maxPlayers: number; // Add this new field
  }) => void;
  onClose: () => void;
  initialData?: Partial<GameProposal>;
  isEditing?: boolean;
  currentUser: Player | null;
  availableLocations: Location[];
}

// Add this helper function at the top of the component
const formatTimeForSelect = (time: string) => {
  // Convert "HH:MM:SS" to "HH:MM" format
  return time ? time.slice(0, 5) : '';
};

// Add Tennis categories
const tennisCategories: TennisCategory[] = [
  '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0'
];

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

  const [formData, setFormData] = useState({
    sport: initialData?.sport || 'padel' as Sport,
    locations: initialData?.locations || [] as string[],
    date: initialData?.date ? toLocalISOString(new Date(initialData.date)) : '',
    startTime: formatTimeForSelect(initialData?.start_time || initialData?.startTime || ''),
    endTime: formatTimeForSelect(initialData?.end_time || initialData?.endTime || ''),
    description: initialData?.description || '',
    requiredCategories: initialData?.requiredCategories || [] as (PadelCategory | BeachTennisCategory)[],
    gender: initialData?.gender || 'male' as GameGender, // Changed from 'mixed' to 'male'
    maxPlayers: initialData?.maxPlayers || 4,
  });

  useEffect(() => {
    if (initialData && isEditing) {
      setFormData(prev => ({
        ...prev,
        startTime: formatTimeForSelect(initialData.start_time || initialData.startTime || prev.startTime),
        endTime: formatTimeForSelect(initialData.end_time || initialData.endTime || prev.endTime)
      }));
    }
  }, [initialData, isEditing]);

  const [error, setError] = useState('');
  const [locationStartIndex, setLocationStartIndex] = useState(0);

  const timeOptions = generateTimeOptions();

  const padelCategories: PadelCategory[] = ['CAT 1', 'CAT 2', 'CAT 3', 'CAT 4', 'CAT 5', 'CAT 6'];
  const beachTennisCategories: BeachTennisCategory[] = [
    'INICIANTE',
    'CAT C',
    'CAT B',
    'CAT A',
    'PROFISSIONAL'
  ];

  // Remove these functions as they're no longer needed
  // const showNextLocations = () => { ... }
  // const showPreviousLocations = () => { ... }
  // const visibleLocations = availableLocations.slice(locationStartIndex, locationStartIndex + 3);

  const validateTimes = (startTime: string, endTime: string) => {
    if (startTime && endTime && startTime >= endTime) {
      setError('O horário de término deve ser depois do horário de início');
      return false;
    }
    setError('');
    return true;
  };

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
      // Normalize the date before submitting
      const normalizedDate = normalizeDate(formData.date);
      onSubmit({
        ...formData,
        date: normalizedDate
      });
    } catch (error) {
      console.error('Error in form submission:', error);
      setError('Erro ao criar o jogo. Tente novamente.');
    }
  };

  // Add this after the gender selection and before the locations section
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data
        </label>
        <input
          type="date"
          required
          min={toLocalISOString(new Date())}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horário de Início
          </label>
          <select
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.startTime}
            onChange={(e) => {
              const newTime = e.target.value;
              if (validateTimes(newTime, formData.endTime)) {
                setFormData({ ...formData, startTime: newTime });
              }
            }}
          >
            <option value="">Selecione o horário</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horário de Término
          </label>
          <select
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.endTime}
            onChange={(e) => {
              const newTime = e.target.value;
              if (validateTimes(formData.startTime, newTime)) {
                setFormData({ ...formData, endTime: newTime });
              }
            }}
          >
            <option value="">Selecione o horário</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
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