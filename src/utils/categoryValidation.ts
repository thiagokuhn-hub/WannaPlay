import { GameProposal, Player } from '../types';

export const validatePlayerCategory = (game: GameProposal, player: Player): { isValid: boolean; message: string } => {
  if (player.isTemporary) {
    return { isValid: true, message: '' };
  }

  if (game.sport === 'padel') {
    if (!player.padel_category) {
      return {
        isValid: false,
        message: 'Para participar deste jogo, você precisa definir sua categoria de Padel no seu perfil.'
      };
    }

    const playerCategory = String(player.padel_category);
    const allowedCategories = Array.isArray(game.requiredCategories) 
      ? game.requiredCategories 
      : game.requiredCategories?.padel || [];

    if (allowedCategories.length > 0 && !allowedCategories.includes(playerCategory)) {
      return {
        isValid: false,
        message: `Este jogo é apenas para jogadores das categorias: ${allowedCategories.join(', ')}`
      };
    }
  }

  if (game.sport === 'beach_tennis') {
    if (!player.beach_tennis_category) {
      return {
        isValid: false,
        message: 'Para participar deste jogo, você precisa definir sua categoria de Beach Tennis no seu perfil.'
      };
    }

    const playerCategory = String(player.beach_tennis_category);
    const allowedCategories = Array.isArray(game.requiredCategories)
      ? game.requiredCategories
      : game.requiredCategories?.beachTennis || [];

    if (allowedCategories.length > 0 && !allowedCategories.includes(playerCategory)) {
      return {
        isValid: false,
        message: `Este jogo é apenas para jogadores das categorias: ${allowedCategories.join(', ')}`
      };
    }
  }

  return { isValid: true, message: '' };
};