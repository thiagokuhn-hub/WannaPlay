import { GameStatus, Category, GameGender } from '../types';

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-white text-green-600';
    case 'full':
      return 'bg-white text-blue-600';
    case 'cancelled':
      return 'bg-white text-red-600';
    case 'expired':
      return 'bg-white text-yellow-600';
    default:
      return 'bg-white text-gray-600';
  }
};

export const getStatusText = (status: GameStatus) => {
  switch (status) {
    case 'open':
      return 'Aberto';
    case 'full':
      return 'Completo';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

export const getCategoryDescription = (category: Category): string => {
  switch (category) {
    case 'CAT 1':
      return 'Nível profissional/semi-profissional';
    case 'CAT 2':
      return 'Nível avançado com experiência em competições';
    case 'CAT 3':
      return 'Nível avançado';
    case 'CAT 4':
      return 'Nível intermediário avançado';
    case 'CAT 5':
      return 'Nível intermediário';
    case 'CAT 6':
      return 'Nível iniciante';
  }
};

export const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Agora mesmo';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m atrás`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d atrás`;
  }

  return date.toLocaleDateString('pt-BR');
};

export const getGameGenderLabel = (gender: GameGender): string => {
  switch (gender) {
    case 'male':
      return 'Jogo Masculino';
    case 'female':
      return 'Jogo Feminino';
    case 'mixed':
      return 'Jogo Misto';
    default:
      return 'Jogo Misto';
  }
};