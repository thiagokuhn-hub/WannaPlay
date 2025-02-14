import { useState } from 'react';
import { Player } from '../types';

export function useUserManagement() {
  const handleBlockUser = (userId: string, setGames: any, setAvailabilities: any) => {
    setGames(prevGames =>
      prevGames.map(game => ({
        ...game,
        players: game.players.map(player =>
          player.id === userId
            ? { ...player, blocked: true, blockedAt: new Date().toISOString() }
            : player
        ),
        createdBy: game.createdBy.id === userId
          ? { ...game.createdBy, blocked: true, blockedAt: new Date().toISOString() }
          : game.createdBy
      }))
    );

    setAvailabilities(prevAvailabilities =>
      prevAvailabilities.map(availability =>
        availability.player.id === userId
          ? {
              ...availability,
              player: {
                ...availability.player,
                blocked: true,
                blockedAt: new Date().toISOString()
              }
            }
          : availability
      )
    );
  };

  const handleUnblockUser = (userId: string, setGames: any, setAvailabilities: any) => {
    setGames(prevGames =>
      prevGames.map(game => ({
        ...game,
        players: game.players.map(player =>
          player.id === userId
            ? { ...player, blocked: false, blockedAt: undefined }
            : player
        ),
        createdBy: game.createdBy.id === userId
          ? { ...game.createdBy, blocked: false, blockedAt: undefined }
          : game.createdBy
      }))
    );

    setAvailabilities(prevAvailabilities =>
      prevAvailabilities.map(availability =>
        availability.player.id === userId
          ? {
              ...availability,
              player: {
                ...availability.player,
                blocked: false,
                blockedAt: undefined
              }
            }
          : availability
      )
    );
  };

  return {
    handleBlockUser,
    handleUnblockUser
  };
}