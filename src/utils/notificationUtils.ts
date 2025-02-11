import { GameProposal, Availability, Notification, Player, Location } from '../types';
import { isSameDay } from 'date-fns';

// Add this interface
interface LocationMatch {
  isMatch: boolean;
  nearbyLocations: string[];
  distance: number;
}

// Add this helper function
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
           Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const checkLocationsProximity = (
  locations1: string[],
  locations2: string[],
  allLocations: Location[]
): LocationMatch => {
  let shortestDistance = Infinity;
  const nearbyLocations: string[] = [];

  for (const loc1Id of locations1) {
    for (const loc2Id of locations2) {
      const location1 = allLocations.find(l => l.id === loc1Id);
      const location2 = allLocations.find(l => l.id === loc2Id);
      
      if (location1 && location2) {
        const distance = calculateDistance(
          location1.latitude,
          location1.longitude,
          location2.latitude,
          location2.longitude
        );
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
        }
        
        if (distance <= 10) {
          nearbyLocations.push(loc2Id);
        }
      }
    }
  }

  return {
    isMatch: shortestDistance <= 10,
    nearbyLocations,
    distance: shortestDistance
  };
};

export const createAvailabilityMatchNotification = (
  matchedAvailability: Availability,
  userId: string,
  locationMatch: LocationMatch,
  allLocations: Location[],
  userLocation: string,
  otherLocation: string
): Notification => {
  const locationMessage = locationMatch.isMatch
    ? `nos mesmos horários e locais (${otherLocation})`
    : `nos mesmos horários, porém em local diferente (${otherLocation})`;

  return {
    id: Date.now().toString(),
    userId,
    type: 'availability_match',
    title: 'Disponibilidade compatível encontrada!',
    message: `${matchedAvailability.player.name} tem disponibilidade para jogar ${
      matchedAvailability.sports.map(sport => sport === 'padel' ? 'Padel' : 'Beach Tennis').join(' ou ')
    } ${locationMessage}.`,
    createdAt: new Date().toISOString(),
    read: false
  };
};

export const checkAvailabilityMatch = (
  game: GameProposal,
  availability: Availability
): boolean => {
  // Check if sports match
  if (!availability.sports.includes(game.sport)) return false;

  // Check if locations match
  if (!game.locations.some(loc => availability.locations.includes(loc))) return false;

  // Check if the game date matches any of the availability time slots
  const gameDate = new Date(game.date);
  const gameDay = getDayFromDate(gameDate);
  
  return availability.timeSlots.some(slot => {
    if (slot.day !== gameDay) return false;

    // Convert times to comparable format (minutes since midnight)
    const gameStart = timeToMinutes(game.startTime);
    const gameEnd = timeToMinutes(game.endTime);
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    // Check if time ranges overlap
    return gameStart >= slotStart && gameEnd <= slotEnd;
  });
};

export const checkAvailabilitiesMatch = (
  availability1: Availability,
  availability2: Availability,
  allLocations: Location[]
): { timeMatch: boolean; locationMatch: LocationMatch } => {
  // Check if sports match
  if (!availability1.sports.some(sport => availability2.sports.includes(sport))) {
    return { 
      timeMatch: false, 
      locationMatch: { isMatch: false, nearbyLocations: [], distance: Infinity } 
    };
  }

  // Check if time slots overlap
  const timeMatch = availability1.timeSlots.some(slot1 => 
    availability2.timeSlots.some(slot2 => {
      if (slot1.day !== slot2.day) return false;

      const start1 = timeToMinutes(slot1.startTime);
      const end1 = timeToMinutes(slot1.endTime);
      const start2 = timeToMinutes(slot2.startTime);
      const end2 = timeToMinutes(slot2.endTime);

      return (start1 <= end2) && (end1 >= start2);
    })
  );

  // Only check location proximity if times match
  const locationMatch = timeMatch 
    ? checkLocationsProximity(availability1.locations, availability2.locations, allLocations)
    : { isMatch: false, nearbyLocations: [], distance: Infinity };

  return { timeMatch, locationMatch };
};

export const createGameMatchNotification = (
  game: GameProposal,
  userId: string
): Notification => ({
  id: Date.now().toString(),
  userId,
  type: 'game_match',
  title: 'Jogo compatível encontrado!',
  message: `Um novo jogo de ${game.sport === 'padel' ? 'Padel' : 'Beach Tennis'} foi marcado em um horário que você está disponível.`,
  gameId: game.id,
  createdAt: new Date().toISOString(),
  read: false,
});

const getDayFromDate = (date: Date): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

// Helper function for time conversion
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const normalizeCategory = (category: string | undefined | null): string | null => {
  if (!category || category.trim() === '') return null;
  const match = category.match(/\d+/);
  return match ? match[0] : null;
};