import React from 'react';
import { Calendar, Clock, MapPin, User, Pencil, Trash2, Clock4 } from 'lucide-react';
import { GiTennisBall } from 'react-icons/gi';
import { Availability, WeekDay, Location } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDisplayName } from '../utils/nameUtils';

// Update the props interface
interface AvailabilityCardProps {
  availability: Availability;
  currentUserId?: string | null;
  onEdit?: (availability: Availability) => void;
  onDelete?: (availabilityId: string) => void;
  locations: Location[];
}

// Update the component parameters to remove onToggleVisibility
export default function AvailabilityCard({ 
  availability, 
  currentUserId,
  onEdit,
  onDelete,
  locations = []
}: AvailabilityCardProps) {
  const isOwner = currentUserId === availability.player.id;
  
  // Add validation for expiration date
  const expiresAt = new Date(availability.expiresAt);
  const isValidDate = !isNaN(expiresAt.getTime());

  // Add getLocationNames function
  const getLocationNames = () => {
    return availability.locations
      .map(locationId => {
        const location = locations.find(loc => loc.id === locationId);
        return location ? location.name : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  const getDayName = (day: WeekDay) => {
    const days: Record<WeekDay, string> = {
      monday: 'Seg',
      tuesday: 'Ter',
      wednesday: 'Qua',
      thursday: 'Qui',
      friday: 'Sex',
      saturday: 'Sáb',
      sunday: 'Dom'
    };
    return days[day];
  };

  const formatPhoneToWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  };

  const getGenderLabel = (gender: string | undefined) => {
    if (!gender) return 'Masculino';
    return gender === 'male' ? 'Masculino' : 'Feminino';
  };

  const getPlayingSideLabel = (side: string) => {
    const sides = {
      'left': 'Esquerdo',
      'right': 'Direito',
      'both': 'Ambos'
    };
    // Change from playingSide to playing_side
    return sides[side as keyof typeof sides] || 'Não especificado';
  };

  // In the getCategoryDisplay function
  const getCategoryDisplay = () => {
    const categories = [];
    
    if (availability.sports.includes('padel')) {
      const padelCategory = availability.player.padel_category || 'Não informada';
      categories.push(`Padel: ${padelCategory}`);
    }
    
    if (availability.sports.includes('beach-tennis')) {
      const btCategory = availability.player.beach_tennis_category || 'Não informada';
      categories.push(`BT: ${btCategory}`);
    }
  
    if (availability.sports.includes('tennis')) {
      const tennisCategory = availability.player.tennis_category || 'Não informada';
      categories.push(`Tênis: ${tennisCategory}`);
    }
    
    return categories.length > 0 ? categories.join(' • ') : 'Sem categoria';
  };

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  return (
    <div 
      className={`
        rounded-sm shadow-md p-3 
        hover:shadow-lg transition-all 
        transform hover:-rotate-1 
        relative
        ${
          availability.sports.length === 1 
            ? availability.sports[0] === 'padel' 
              ? 'bg-blue-100' 
              : availability.sports[0] === 'tennis'
                ? 'bg-yellow-100'
                : 'bg-green-100'
            : 'bg-yellow-50'
        }
        before:content-[''] 
        before:absolute 
        before:top-0 
        before:left-[50%] 
        before:w-8 
        before:h-3 
        before:bg-gray-200/50 
        before:-translate-x-1/2 
        before:-translate-y-1/2
        before:rounded-sm
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {availability.player.avatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img
                src={availability.player.avatar}
                alt={`Avatar de ${availability.player.name}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <GiTennisBall className="w-6 h-6 text-blue-600" />
            </div>
          )}
          <div>
            <h3 className="font-medium text-gray-900 text-sm">{formatDisplayName(availability.player.name)}</h3>
            <p className="text-xs text-gray-500">
              {getCategoryDisplay()} • {getGenderLabel(availability.player.gender)} • {getPlayingSideLabel(availability.player.playing_side)}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-1">
            <button
              onClick={() => onEdit?.(availability)}
              className="text-gray-400 hover:text-blue-600 transition-colors p-1"
              title="Editar disponibilidade"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete?.(availability.id)}
              className="text-gray-400 hover:text-red-600 transition-colors p-1"
              title="Excluir disponibilidade"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-xs text-gray-600">
          <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {availability.sports.map((sport) => (
              <span key={sport} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                {sport === 'padel' ? 'Padel' : sport === 'beach-tennis' ? 'Beach Tennis' : 'Tênis'}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center text-xs text-gray-600">
          <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            <span className="px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded-full">
              {getLocationNames()}
            </span>
          </div>
        </div>

        <div className="flex items-start text-xs text-gray-600">
          <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {availability.timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center">
                <span className="font-medium mr-1">{getDayName(slot.day)}:</span>
                <span>
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>

        {availability.notes && (
          <div className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded">
            {availability.notes}
          </div>
        )}

        <div className="text-xs text-gray-600">
          {availability.player.phone && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">WhatsApp:</span>
              <a 
                href={`https://wa.me/55${formatPhoneNumber(availability.player.phone)}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800"
              >
                {availability.player.phone}
              </a>
            </div>
          )}
        </div>

        
        <div className="text-xs text-gray-500 flex items-center">
          <Clock4 className="w-3 h-3 mr-1" />
          {isValidDate ? (
            `Expira em ${format(expiresAt, "dd 'de' MMMM", { locale: ptBR })}`
          ) : (
            'Data de expiração não disponível'
          )}
        </div>
      </div>
    </div>
  );
}