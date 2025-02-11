import React from 'react';
import { Filter as FilterIcon, X } from 'lucide-react';
import { Location, Category, WeekDay, Gender, Sport, Filters, GameGender, GameProposal, Availability } from '../types';

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  games: GameProposal[];
  availabilities: Availability[];
  locations: Location[]; // Add locations prop
}

export default function FilterPanel({ filters, onFilterChange, games, availabilities, locations }: FilterPanelProps) {
  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  // Extrair opções únicas dos jogos e disponibilidades
  const getAvailableOptions = () => {
    const options = {
      sports: new Set<Sport>(),
      locations: new Set<string>(),
      categories: new Set<Category>(),
      days: new Set<WeekDay>(),
      genders: new Set<Gender | GameGender>(),
    };

    // Make sure to include all locations from both games and filters
    locations.forEach(location => {
      options.locations.add(location.id);
    });

    // Extrair de jogos
    games.forEach(game => {
      if (game.status === 'deleted') return;
      
      options.sports.add(game.sport);
      game.locations.forEach(loc => options.locations.add(loc));
      game.requiredCategories.forEach(cat => options.categories.add(cat));
      options.genders.add(game.gender);
      
      const gameDay = getDayFromDate(new Date(game.date));
      options.days.add(gameDay);
    });

    // Extrair de disponibilidades
    availabilities.forEach(availability => {
      if (availability.status === 'deleted') return;
      
      availability.sports.forEach(sport => options.sports.add(sport));
      availability.locations.forEach(loc => options.locations.add(loc));
      availability.timeSlots.forEach(slot => options.days.add(slot.day));
      options.genders.add(availability.player.gender);
    });

    // Also include any locations that are in the current filters
    filters.locations.forEach(loc => options.locations.add(loc));

    return {
      sports: Array.from(options.sports),
      locations: Array.from(options.locations),
      categories: Array.from(options.categories),
      days: Array.from(options.days),
      genders: Array.from(options.genders),
    };
  };

  const availableOptions = getAvailableOptions();

  const clearFilters = () => {
    onFilterChange({
      locations: [],
      categories: [],
      days: [],
      genders: [],
      sports: []
    });
  };

  const toggleFilter = <T extends string>(
    key: keyof Filters,
    value: T
  ) => {
    const currentValues = filters[key];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange({
      ...filters,
      [key]: newValues
    });
  };

  const isSelected = <T extends string>(key: keyof Filters, value: T): boolean => {
    return filters[key].includes(value);
  };

  const weekDayLabels: Record<WeekDay, string> = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const genderLabels: Record<Gender | GameGender, string> = {
    male: 'Masculino',
    female: 'Feminino',
    mixed: 'Misto'
  };

  // Function to get location name from ID
  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : locationId;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {availableOptions.sports.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Modalidade
            </label>
            <div className="flex flex-wrap gap-2">
              {availableOptions.sports.map((sport) => (
                <button
                  key={sport}
                  onClick={() => toggleFilter('sports', sport)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected('sports', sport)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sport === 'padel' ? 'Padel' : 'Beach Tennis'}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableOptions.locations.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Local
            </label>
            <div className="flex flex-wrap gap-2">
              {availableOptions.locations.map((locationId) => (
                <button
                  key={locationId}
                  onClick={() => toggleFilter('locations', locationId)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected('locations', locationId)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getLocationName(locationId)}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableOptions.categories.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <div className="flex flex-wrap gap-2">
              {availableOptions.categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleFilter('categories', category)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected('categories', category)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableOptions.days.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Dia da Semana
            </label>
            <div className="flex flex-wrap gap-2">
              {availableOptions.days.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleFilter('days', day)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected('days', day)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {weekDayLabels[day]}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableOptions.genders.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Gênero
            </label>
            <div className="flex flex-wrap gap-2">
              {availableOptions.genders.map((gender) => (
                <button
                  key={gender}
                  onClick={() => toggleFilter('genders', gender)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected('genders', gender)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {genderLabels[gender]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, values]) => 
              values.map(value => {
                let displayValue = value;
                if (key === 'locations') {
                  displayValue = getLocationName(value);
                } else if (key === 'sports') {
                  displayValue = value === 'padel' ? 'Padel' : 'Beach Tennis';
                } else if (key === 'days') {
                  displayValue = weekDayLabels[value as WeekDay];
                } else if (key === 'genders') {
                  displayValue = genderLabels[value as Gender | GameGender];
                }

                return (
                  <div
                    key={`${key}-${value}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                  >
                    <span>{displayValue}</span>
                    <button
                      onClick={() => toggleFilter(key as keyof Filters, value)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getDayFromDate(date: Date): WeekDay {
  const days: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}