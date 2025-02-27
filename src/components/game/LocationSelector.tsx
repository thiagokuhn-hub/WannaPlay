import React from 'react';
import { Location } from '../../types';
import LocationInfoTooltip from '../tooltips/LocationInfoTooltip';

interface LocationSelectorProps {
  locations: Location[];
  selectedLocations: string[];
  onLocationToggle: (locationId: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocations,
  onLocationToggle
}) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Locais (selecione um ou mais)
        </label>
        <LocationInfoTooltip locations={locations} />
      </div>
      <div className="relative">
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex gap-2 min-w-min">
            {locations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => onLocationToggle(location.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedLocations.includes(location.id)
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
  );
};

export default LocationSelector;