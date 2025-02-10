import React, { useState } from 'react';
import { Info, MapPin, Phone } from 'lucide-react';

interface LocationInfoTooltipProps {
  locations: Array<{
    id: string;
    name: string;
    address: string;
    phone?: string;
  }>;
}

export default function LocationInfoTooltip({ locations }: LocationInfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const openInMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Informações sobre os clubes"
      >
        <Info className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 md:relative md:inset-auto md:bg-transparent">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full md:absolute md:w-96 md:-left-20 md:transform md:-translate-x-1/2 md:mt-2">
            <h3 className="text-lg font-semibold mb-4">Clubes Disponíveis</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {locations.map((location) => (
                <div key={location.id} className="space-y-2">
                  <h4 className="font-semibold text-gray-900">{location.name}</h4>
                  <button
                    onClick={() => openInMaps(location.address)}
                    className="flex items-start gap-2 text-sm text-gray-600 hover:text-blue-600"
                  >
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{location.address}</span>
                  </button>
                  {location.phone && (
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {location.phone}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <button
              className="md:hidden mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
              onClick={() => setIsVisible(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}