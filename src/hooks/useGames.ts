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
            ),
            game_groups(
              groups(
                id,
                name,
                group_members(user_id)
              )
            )
          `)
          .order('created_at', { ascending: false });
    
        if (gamesError) throw gamesError;
    
        // Fetch temporary players for all games
        const gameIds = gamesData.map(game => game.id);
        const { data: tempPlayersData, error: tempPlayersError } = await supabase
          .from('game_temporary_players')
          .select('*')
          .in('game_id', gameIds);
    
        if (tempPlayersError) throw tempPlayersError;
    
        const formattedGames = gamesData.map(game => {
          // Get temporary players for this specific game
          const gameTemporaryPlayers = tempPlayersData?.filter(tp => tp.game_id === game.id) || [];
          
          return {
            ...game,
            players: [
              // Creator
              {
                id: game.created_by.id,
                name: game.created_by.name,
                avatar: game.created_by.avatar,
                phone: game.created_by.phone,
                playing_side: game.created_by.playing_side,
                tennis_category: game.created_by.tennis_category,
                joinMessage: '',
                isTemporary: false,
                category: game.sport === 'padel' 
                  ? game.created_by.padel_category 
                  : game.created_by.beach_tennis_category
              },
              // Other regular players
              ...(game.game_players
                ?.filter(gp => gp.player.id !== game.created_by.id)
                .map(gp => ({
                  id: gp.player.id,
                  name: gp.player.name,
                  avatar: gp.player.avatar || null,
                  phone: gp.player.phone,
                  playing_side: gp.player.playing_side,
                  tennis_category: gp.player.tennis_category,
                  joinMessage: gp.join_message,
                  isTemporary: gp.is_temporary,
                  category: game.sport === 'padel'
                    ? gp.player.padel_category
                    : gp.player.beach_tennis_category,
                  ...(gp.is_temporary && {
                    gender: gp.player.gender
                  })
                })) || []),
              // Add temporary players
              ...gameTemporaryPlayers.map(tp => ({
                id: tp.id,
                name: tp.name,
                phone: tp.phone,
                gender: tp.gender,
                category: tp.category,
                playing_side: tp.playing_side,
                joinMessage: tp.join_message || `Added manually by ${tp.created_by}`,
                isTemporary: true
              }))
            ],
            createdBy: game.created_by,
            startTime: game.start_time,
            endTime: game.end_time,
            requiredCategories: game.required_categories,
            locationIds: game.locations,
            maxPlayers: game.max_players
          };
        });
    
        setGames(formattedGames);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchGames();
  }, []);

  // Modify the handleGameProposal function to prevent duplicate submission
  const handleGameProposal = async (data: Partial<GameProposal>, player: Profile) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
  
    try {
      // Only update local state, not the database
      const newGame: GameProposal = {
        ...data,
        id: uuidv4(),
        createdBy: player,
        createdAt: new Date().toISOString(),
        players: [],
        status: 'open'
      };
  
      setGames(prev => [...prev, newGame]);
    } catch (error) {
      console.error('Error handling game proposal:', error);
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
        // First, check if the player is a temporary player
        const game = games.find(g => g.id === gameId);
        if (!game) throw new Error('Game not found');
        
        const player = game.players.find(p => p.id === playerId);
        if (!player) throw new Error('Player not found');
        
        if (player.isTemporary) {
          // Delete from game_temporary_players table
          const { error } = await supabase
            .from('game_temporary_players')
            .delete()
            .eq('id', playerId);
            
          if (error) throw error;
        } else {
          // Delete from game_players table for regular players
          const { error } = await supabase
            .from('game_players')
            .delete()
            .match({ game_id: gameId, player_id: playerId });
      
          if (error) throw error;
        }
    
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