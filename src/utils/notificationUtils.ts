import { GameProposal, Availability, Notification, Player } from '../types';
import { isSameDay } from 'date-fns';

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

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};