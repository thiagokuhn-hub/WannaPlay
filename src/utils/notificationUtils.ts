import { GameProposal, Availability, Notification, Player, Location } from '../types';
import { isSameDay } from 'date-fns';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    id: crypto.randomUUID(), // Use UUID instead of timestamp
    user_id: userId,
    type: 'game_match',
    title: 'Disponibilidade compatível encontrada!',
    message: `${matchedAvailability.player.name} tem disponibilidade para jogar ${
      matchedAvailability.sports.map(sport => sport === 'padel' ? 'Padel' : 'Beach Tennis').join(' ou ')
    } ${locationMessage}.`,
    created_at: new Date().toISOString(), // Ensure proper ISO format
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
  newAvailability: Availability,
  existingAvailability: Availability,
  allLocations: Location[]
): { timeMatch: boolean; locationMatch: LocationMatch } => {
  // 1. First check sport and category match
  if (!newAvailability.sports.some(sport => existingAvailability.sports.includes(sport))) {
    console.log('Sports do not match');
    return { 
      timeMatch: false, 
      locationMatch: { isMatch: false, nearbyLocations: [], distance: Infinity } 
    };
  }

  // Strict category matching for each sport
  const matchingSport = newAvailability.sports.find(sport => 
    existingAvailability.sports.includes(sport)
  );

  if (matchingSport === 'padel') {
    const newCat = newAvailability.player.padel_category;
    const existingCat = existingAvailability.player.padel_category;
    
    if (newCat !== existingCat) {
      console.log('Padel categories do not match:', { newCat, existingCat });
      return { 
        timeMatch: false, 
        locationMatch: { isMatch: false, nearbyLocations: [], distance: Infinity } 
      };
    }
  } else if (matchingSport === 'beach_tennis') {
    const newCat = newAvailability.player.beach_tennis_category;
    const existingCat = existingAvailability.player.beach_tennis_category;
    
    if (newCat !== existingCat) {
      console.log('Beach Tennis categories do not match:', { newCat, existingCat });
      return { 
        timeMatch: false, 
        locationMatch: { isMatch: false, nearbyLocations: [], distance: Infinity } 
      };
    }
  }

  // 2. Check location match
  const hasCommonLocation = newAvailability.locations.some(loc => 
    existingAvailability.locations.includes(loc)
  );
  if (!hasCommonLocation) {
    console.log('No common locations');
    return { 
      timeMatch: false, 
      locationMatch: { isMatch: false, nearbyLocations: [], distance: Infinity } 
    };
  }

  // 3 & 4. Check day and time match
  const timeMatch = newAvailability.timeSlots.some(newSlot => 
    existingAvailability.timeSlots.some(existingSlot => {
      // Check if days match
      if (newSlot.day !== existingSlot.day) return false;

      // Convert times to minutes for comparison
      const newStart = timeToMinutes(newSlot.startTime);
      const newEnd = timeToMinutes(newSlot.endTime);
      const existingStart = timeToMinutes(existingSlot.startTime);
      const existingEnd = timeToMinutes(existingSlot.endTime);

      // Check if time slots overlap
      return newStart >= existingStart && newEnd <= existingEnd;
    })
  );

  if (!timeMatch) {
    console.log('Time slots do not match');
    return { 
      timeMatch: false, 
      locationMatch: { isMatch: false, nearbyLocations: [], distance: Infinity } 
    };
  }

  // 5. Check gender match
  if (newAvailability.player.gender !== existingAvailability.player.gender) {
    console.log('Gender does not match');
    return { 
      timeMatch: false, 
      locationMatch: { isMatch: false, nearbyLocations: [], distance: Infinity } 
    };
  }

  // If all criteria are met, calculate location match details
  const locationMatch = checkLocationsProximity(
    newAvailability.locations,
    existingAvailability.locations,
    allLocations
  );

  return { timeMatch: true, locationMatch };
};

export const createGameMatchNotification = (
  game: GameProposal,
  userId: string
): Notification => {
  try {
    // Add error handling for date parsing
    const date = game.date ? parseISO(game.date) : new Date();
    
    // Format the date using date-fns with Portuguese locale
    const formattedDate = format(date, "EEEE, d 'de' MMMM 'de' yyyy", {
      locale: ptBR
    });

    return {
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'game_match',
      title: 'Novo Jogo',
      message: `${game.createdBy.name} adicionou você a um jogo para ${formattedDate}.`,
      created_at: new Date().toISOString(),
      read: false,
      game_id: game.id
    };
  } catch (error) {
    console.error('Error creating game notification:', error);
    // Fallback message without date if there's an error
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      type: 'game_match',
      title: 'Novo Jogo',
      message: `${game.createdBy.name} adicionou você a um jogo.`,
      created_at: new Date().toISOString(),
      read: false,
      game_id: game.id
    };
  }
};

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