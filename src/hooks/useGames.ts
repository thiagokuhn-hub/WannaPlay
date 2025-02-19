import { useState, useEffect } from 'react';
import { GameProposal, Player } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { validatePlayerCategory } from '../utils/categoryValidation';

export function useGames() {
  const [games, setGames] = useState<GameProposal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add this useEffect to handle games state updates
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select(`
            *,
            created_by:profiles!games_created_by_fkey(*),
            game_players(
              player:profiles(*),
              joined_at,
              is_temporary,
              join_message
            )
          `)
          .order('created_at', { ascending: false });

        if (gamesError) throw gamesError;

        const formattedGames = gamesData.map(game => ({
          ...game,
          players: game.game_players?.map(gp => ({
            id: gp.player.id,
            name: gp.player.name,
            ...gp.player,
            joinMessage: gp.join_message,
            isTemporary: gp.is_temporary
          })) || [],
          createdBy: game.created_by,
          startTime: game.start_time,
          endTime: game.end_time,
          requiredCategories: game.required_categories,
          locationIds: game.locations,
          maxPlayers: game.max_players
        }));

        setGames(formattedGames);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchGames();
  }, []);

  const handleGameProposal = async (data: Partial<GameProposal>, player: Profile) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const gameId = uuidv4();
    
    try {
      const gameData = {
        id: gameId,
        sport: data.sport,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        location_id: data.locations[0],
        locations: data.locations,
        max_players: data.maxPlayers || 4,
        created_by: player.id,
        status: 'open',
        gender: data.gender,
        description: data.description,
        required_categories: data.requiredCategories
      };
  
      const { data: createdGame, error: gameError } = await supabase
        .from('games')
        .insert([gameData])
        .select()
        .single();
  
      if (gameError) throw gameError;
  
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: gameId,
          player_id: player.id,
          joined_at: new Date().toISOString(),
          is_temporary: false
        });
  
      if (playerError) throw playerError;
  
      const formattedGame = {
        ...createdGame,
        players: [player],
        maxPlayers: data.maxPlayers || 4,
        createdBy: player,
        status: 'open',
        startTime: createdGame.start_time,
        endTime: createdGame.end_time,
        requiredCategories: createdGame.required_categories,
        locationIds: createdGame.locations
      };
  
      setGames(prev => [...prev, formattedGame]);
      return formattedGame;
    } catch (error) {
      console.error('Error in handleGameProposal:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGame = async (gameId: string, player: Player, message: string) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) {
        throw new Error('Jogo não encontrado');
      }
  
      // Validate player category
      const validation = validatePlayerCategory(game, player);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
  
      // If validation passes, proceed with joining the game
      // Remove the validation here since it's already done before showing the modal
      if (!player.isTemporary) {
        const { error } = await supabase
          .from('game_players')
          .insert({
            game_id: game.id,
            player_id: player.id,
            join_message: message || '',
            joined_at: new Date().toISOString(),
            is_temporary: false
          });
  
        if (error) {
          console.error('Database error:', error);
          throw new Error('Erro ao entrar no jogo. Por favor, tente novamente.');
        }
      }
  
      // Update local state
      setGames(prevGames => 
        prevGames.map(g => {
          if (g.id === game.id) {
            return {
              ...g,
              players: [...g.players, {
                ...player,
                joinMessage: message,
                isTemporary: player.isTemporary || false
              }]
            };
          }
          return g;
        })
      );

    } catch (error) {
      console.error('Error joining game:', error);
      throw error;
    }
  };

  // Remove the duplicate handleJoinGame function and keep only one instance

  const handleRemovePlayer = async (gameId: string, playerId: string) => {
      try {
        const { error } = await supabase
          .from('game_players')
          .delete()
          .match({ game_id: gameId, player_id: playerId });
  
        if (error) throw error;
  
        // Update local state
        setGames(prevGames =>
          prevGames.map(game => {
            if (game.id === gameId) {
              return {
                ...game,
                players: game.players.filter(player => player.id !== playerId)
              };
            }
            return game;
          })
        );
      } catch (error) {
        console.error('Error removing player:', error);
        throw error;
      }
    };
  
    return {
      games,
      setGames,
      handleGameProposal,
      handleJoinGame,
      handleRemovePlayer, // Add this to the returned object
      isSubmitting
    };
}