import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WeekDay } from '../types';

export const formatGameDate = (dateString: string) => {
  // Parse the date and adjust for timezone
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1); // Add one day to compensate for timezone
  
  // Format the date in Portuguese
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
};

export const toLocalISOString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fromLocalISOString = (dateString: string) => {
  // Create date from the local date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const normalizeDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export const getDayFromDate = (date: Date): WeekDay => {
  const days: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};