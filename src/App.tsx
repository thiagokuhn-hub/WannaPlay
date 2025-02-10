import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import CommunityBoard from './components/CommunityBoard';
import LoginForm from './components/LoginForm';
import PlayerRegistration from './components/PlayerRegistration';
import EditProfileForm from './components/EditProfileForm';
import { GameProposal, Player, Availability, Notification, Location } from './types';
import Header from './components/Header';
import { checkAvailabilityMatch, createGameMatchNotification } from './utils/notificationUtils';
import AdminPanel from './components/admin/AdminPanel';
import { supabase } from './lib/supabase';
import { v4 as uuidv4 } from 'uuid';  // Add this import at the top


function App() {
  const { user, signOut, signIn, setUser, updateProfile } = useAuth();  // Add updateProfile here
  const [games, setGames] = useState<GameProposal[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      await signIn(data.email, data.password);
      setShowLogin(false);
    } catch (error) {
      alert('Erro ao fazer login. Verifique suas credenciais.');
    }
  };

  
  const handleEditProfile = async (data: Partial<Player>) => {
    if (user) {
      try {
        // Convert camelCase to snake_case for the API
        const apiData = {
          ...data,
          playing_side: data.playingSide,
          padel_category: data.padelCategory,
          beach_tennis_category: data.beachTennisCategory
        };
        
        await updateProfile(apiData);
        setShowEditProfile(false);
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Erro ao atualizar perfil. Tente novamente.');
      }
    }
  };

  const handleBlockUser = (userId: string) => {
    // Update user in games
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

    // Update user in availabilities
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

  const handleUnblockUser = (userId: string) => {
    // Update user in games
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

    // Update user in availabilities
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

  const handleJoinGame = async (gameId: string, player: Player, message?: string) => {
    if (player.blocked) {
      alert('Sua conta está bloqueada. Você não pode participar de jogos.');
      return;
    }

    try {
      // Check if the player is temporary
      if (player.isTemporary) {
        // For temporary players, we don't need to do anything in the database
        // as they are already added to game_temporary_players table
        setGames(prevGames =>
          prevGames.map(game => {
            if (game.id === gameId) {
              const gamePlayer = {
                ...player,
                joinMessage: message
              };
              const updatedPlayers = [...game.players, gamePlayer];
              const newStatus = updatedPlayers.length >= game.maxPlayers ? 'full' : 'open';
    
              // Update game status if it becomes full
              if (newStatus === 'full') {
                supabase
                  .from('games')
                  .update({ status: 'full' })
                  .eq('id', gameId)
                  .then(({ error }) => {
                    if (error) console.error('Error updating game status:', error);
                  });
              }
    
              return {
                ...game,
                players: updatedPlayers,
                status: newStatus
              };
            }
            return game;
          })
        );
      } else {
        // For regular players, insert into game_players table
        const { error } = await supabase
          .from('game_players')
          .insert({
            game_id: gameId,
            player_id: player.id,
            joined_at: new Date().toISOString(),
            join_message: message,
            is_temporary: false
          });
    
        if (error) throw error;
    
        // Update local state
        setGames(prevGames =>
          prevGames.map(game => {
            if (game.id === gameId) {
              const gamePlayer = {
                ...player,
                joinMessage: message
              };
              const updatedPlayers = [...game.players, gamePlayer];
              const newStatus = updatedPlayers.length >= game.maxPlayers ? 'full' : 'open';
    
              return {
                ...game,
                players: updatedPlayers,
                status: newStatus
              };
            }
            return game;
          })
        );
      }
    } catch (error) {
      console.error('Error joining game:', error);
      alert('Erro ao entrar no jogo. Tente novamente.');
    }
  };

  // Add loading state at the top of the component
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update handleGameProposal function
  const handleGameProposal = async (data: Partial<GameProposal>, player: Profile) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const gameId = uuidv4();
    
    try {
      // Create the game with the correct date format
      const gameData = {
        id: gameId,
        sport: data.sport,
        date: data.date, // The date is already normalized at this point
        start_time: data.startTime,
        end_time: data.endTime,
        location_id: data.locations[0],
        locations: data.locations,
        max_players: data.maxPlayers || 4, // Update this line
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
  
      // 2. Add the creator as a player in game_players table
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
        maxPlayers: data.maxPlayers || 4, // Change this line to use the maxPlayers from the form data
        createdBy: player,
        status: 'open',
        startTime: createdGame.start_time,
        endTime: createdGame.end_time,
        requiredCategories: createdGame.required_categories,
        locationIds: createdGame.locations
      };
  
      setGames(prev => [...prev, formattedGame]);
  
      // Check for matching availabilities and create notifications
      availabilities.forEach(availability => {
        if (
          availability.player.id !== player.id &&
          checkAvailabilityMatch(formattedGame, availability)
        ) {
          const notification = createGameMatchNotification(formattedGame, availability.player.id);
          setNotifications(prev => [...prev, notification]);
        }
      });
    } catch (error) {
      console.error('Error in handleGameProposal:', error);
      alert('Erro ao criar o jogo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleEditGame = async (gameId: string, updates: Partial<GameProposal>) => {
    try {
      // Create update data with all necessary fields
      const updateData = {
        sport: updates.sport,
        start_time: updates.startTime,
        end_time: updates.endTime,
        location_id: updates.locations?.[0],
        locations: updates.locations,
        status: updates.status,
        gender: updates.gender,
        description: updates.description,
        required_categories: updates.requiredCategories,
        max_players: updates.maxPlayers,
        updated_at: new Date().toISOString()
      };
  
      // Only include date if it exists in updates, without adjusting it
      if (updates.date) {
        updateData.date = updates.date;
      }
  
      // Update the database
      const { error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId);
  
      if (error) throw error;
  
      // Update the local state with all fields
      setGames(prevGames =>
        prevGames.map(game =>
          game.id === gameId
            ? {
                ...game,
                ...updates,
                date: updates.date || game.date,
                maxPlayers: updates.maxPlayers || game.maxPlayers
              }
            : game
        )
      );
    } catch (error) {
      console.error('Error updating game:', error);
      alert('Erro ao atualizar o jogo. Tente novamente.');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      // Update game status in Supabase
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', gameId);
  
      if (error) throw error;
  
      // Update local state
      setGames(prevGames => prevGames.map(game => 
        game.id === gameId
          ? { ...game, status: 'deleted', deletedAt: new Date().toISOString() }
          : game
      ));
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Erro ao excluir o jogo. Tente novamente.');
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    try {
      // Update availability status in Supabase
      const { error } = await supabase
        .from('availabilities')
        .update({ 
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', availabilityId);
  
      if (error) throw error;
  
      // Update local state
      setAvailabilities(prevAvailabilities => prevAvailabilities.map(availability =>
        availability.id === availabilityId
          ? { ...availability, status: 'deleted', deletedAt: new Date().toISOString() }
          : availability
      ));
    } catch (error) {
      console.error('Error deleting availability:', error);
      alert('Erro ao excluir a disponibilidade. Tente novamente.');
    }
  };

  const handleAddAvailability = async (data: Partial<Availability>) => {
    if (user?.blocked) {
      alert('Sua conta está bloqueada. Você não pode registrar disponibilidades.');
      return;
    }

    const days = data.duration === '7days' ? 7 : 14;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    try {
      // 1. First create the availability
      const { data: createdAvailability, error: availError } = await supabase
        .from('availabilities')
        .insert({
          player_id: data.player!.id,
          sports: data.sports,
          locations: data.locations,
          notes: data.notes,
          duration: data.duration,
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();
  
      if (availError) throw availError;
  
      // 2. Then create the time slots
      const timeSlotData = data.timeSlots!.map(slot => ({
        availability_id: createdAvailability.id,
        day: slot.day,
        start_time: slot.startTime,
        end_time: slot.endTime
      }));
  
      const { error: slotsError } = await supabase
        .from('availability_time_slots')
        .insert(timeSlotData);
  
      if (slotsError) throw slotsError;
  
      // Update local state with the new availability
      const newAvailability: Availability = {
        ...createdAvailability,
        player: data.player!,
        timeSlots: data.timeSlots!,
        createdAt: createdAvailability.created_at,
        expiresAt: createdAvailability.expires_at
      };
  
      setAvailabilities(prev => [...prev, newAvailability]);
    } catch (error) {
      console.error('Error creating availability:', error);
      alert('Erro ao criar disponibilidade. Tente novamente.');
    }
  };

  const handleEditAvailability = async (availabilityId: string, data: Partial<Availability>) => {
    try {
      // 1. Update the main availability record
      const newExpiresAt = data.duration === '7days' 
        ? (() => {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            return date.toISOString();
          })()
        : (() => {
            const date = new Date();
            date.setDate(date.getDate() + 14);
            return date.toISOString();
          })();

      const supabaseData = {
        sports: data.sports,
        locations: data.locations,
        notes: data.notes,
        duration: data.duration,
        expires_at: newExpiresAt
      };

      // Update availability in Supabase
      const { error: availError } = await supabase
        .from('availabilities')
        .update(supabaseData)
        .eq('id', availabilityId);

      if (availError) throw availError;

      // 2. Delete existing time slots
      const { error: deleteError } = await supabase
        .from('availability_time_slots')
        .delete()
        .eq('availability_id', availabilityId);

      if (deleteError) throw deleteError;

      // 3. Insert new time slots
      if (data.timeSlots && data.timeSlots.length > 0) {
        const timeSlotData = data.timeSlots.map(slot => ({
          availability_id: availabilityId,
          day: slot.day,
          start_time: slot.startTime,
          end_time: slot.endTime
        }));

        const { error: insertError } = await supabase
          .from('availability_time_slots')
          .insert(timeSlotData);

        if (insertError) throw insertError;
      }

      // Update local state
      setAvailabilities(prevAvailabilities =>
        prevAvailabilities.map(availability =>
          availability.id === availabilityId
            ? {
                ...availability,
                ...data,
                player: availability.player,
                createdAt: availability.createdAt,
                expiresAt: newExpiresAt
              }
            : availability
        )
      );

    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Erro ao atualizar disponibilidade. Tente novamente.');
    }
};
//
  const handleRepublishGame = async (game: GameProposal) => {
      const gameId = uuidv4();
      
      try {
        // First, create the game in the database
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .insert([{
            id: gameId,
            sport: game.sport,
            date: game.date,
            start_time: game.startTime,
            end_time: game.endTime,
            location_id: game.locations[0],
            max_players: game.maxPlayers || 4, // Use the game's maxPlayers value or default to 4
            created_by: user!.id,
            status: 'open',
            gender: game.gender,
            description: game.description,
            required_categories: game.requiredCategories,
            locations: game.locations
          }])
          .select()
          .single();
  
        if (gameError) {
          console.error('Error republishing game:', gameError);
          throw gameError;
        }
  
        // Add the creator as a player in game_players table
        const { error: playerError } = await supabase
          .from('game_players')
          .insert({
            game_id: gameId,
            player_id: user!.id,
            joined_at: new Date().toISOString(),
            is_temporary: false
          });
  
        if (playerError) throw playerError;
  
        const newGame: GameProposal = {
          ...game,
          id: gameId,
          status: 'open',
          createdAt: new Date().toISOString(),
          players: [user!],
          deletedAt: undefined
        };
        
        setGames(prev => [...prev, newGame]);
      } catch (error) {
        console.error('Error in handleRepublishGame:', error);
        alert('Erro ao republicar o jogo. Tente novamente.');
      }
  };

  const handleRemovePlayer = async (gameId: string, playerId: string) => {
    try {
      // Check if the player is temporary by looking at the game's players
      const game = games.find(g => g.id === gameId);
      const player = game?.players.find(p => p.id === playerId);
  
      if (player?.isTemporary) {
        // Delete from game_temporary_players table
        const { error } = await supabase
          .from('game_temporary_players')
          .delete()
          .eq('id', playerId);
  
        if (error) throw error;
      }
  
      // Update local state
      setGames(prevGames =>
        prevGames.map(game =>
          game.id === gameId
            ? {
                ...game,
                players: game.players.filter(player => player.id !== playerId)
              }
            : game
        )
      );
    } catch (error) {
      console.error('Error removing player:', error);
      alert('Erro ao remover jogador. Tente novamente.');
    }
  };

const handleAddLocation = async (locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    console.log('Adding location:', locationData); // Debug log

    // Add the location to Supabase
    const { data, error } = await supabase
      .from('locations')
      .insert([{
        name: locationData.name,
        address: locationData.address,
        phone: locationData.phone || '',
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        active: locationData.active
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error); // Debug log
      throw error;
    }

    console.log('Location added successfully:', data); // Debug log

    // Update local state only after successful database insertion
    setLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, ...data, updatedAt: new Date().toISOString() } : loc
    ));
  } catch (error) {
    console.error('Error updating location:', error);
    alert('Erro ao atualizar local. Tente novamente.');
  }
};

  
  const handleRepublishAvailability = async (availability: Availability, data: { duration: '7days' | '14days' }) => {
      const days = data.duration === '7days' ? 7 : 14;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
  
      try {
        // Create the new availability in the database
        const { data: createdAvailability, error: availError } = await supabase
          .from('availabilities')
          .insert({
            player_id: availability.player.id,
            sports: availability.sports,
            locations: availability.locations,
            notes: availability.notes,
            duration: data.duration,
            expires_at: expiresAt.toISOString(),
            status: 'active'
          })
          .select()
          .single();
  
        if (availError) throw availError;
  
        // Create the time slots for the new availability
        const timeSlotData = availability.timeSlots.map(slot => ({
          availability_id: createdAvailability.id,
          day: slot.day,
          start_time: slot.startTime,
          end_time: slot.endTime
        }));
  
        const { error: slotsError } = await supabase
          .from('availability_time_slots')
          .insert(timeSlotData);
  
        if (slotsError) throw slotsError;
  
        // Update local state with the new availability
        const newAvailability: Availability = {
          ...createdAvailability,
          player: availability.player,
          timeSlots: availability.timeSlots,
          createdAt: createdAvailability.created_at,
          expiresAt: createdAvailability.expires_at,
          status: 'active'
        };
  
        setAvailabilities(prev => [...prev, newAvailability]);
      } catch (error) {
        console.error('Error republishing availability:', error);
        alert('Erro ao republicar disponibilidade. Tente novamente.');
      }
    };
  
 

  
    const handleEditLocation = async (id: string, data: Partial<Location>) => {
      try {
        // Update location in Supabase
        const { error } = await supabase
          .from('locations')
          .update({
            name: data.name,
            address: data.address,
            phone: data.phone || '',
            latitude: data.latitude,
            longitude: data.longitude,
            active: data.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
    
        if (error) {
          console.error('Error updating location:', error);
          throw error;
        }
    
        // Update local state only after successful database update
        setLocations(prev => prev.map(loc => 
          loc.id === id ? { ...loc, ...data, updatedAt: new Date().toISOString() } : loc
        ));
      } catch (error) {
        console.error('Error updating location:', error);
        alert('Erro ao atualizar local. Tente novamente.');
      }
    };


 
  const handleDeleteLocation = (id: string) => {
    setLocations(prevLocations =>
      prevLocations.map(location =>
        location.id === id
          ? { ...location, active: false }
          : location
      )
    );
  };

  // Add this useEffect to fetch both games and availabilities
  useEffect(() => {
    const fetchData = async () => {
      try {
        // First fetch games with regular players
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
          // Remove this line to include deleted games
          // .neq('status', 'deleted')
          .order('created_at', { ascending: false });

        if (gamesError) throw gamesError;

        // Then fetch temporary players
        const { data: tempPlayersData, error: tempPlayersError } = await supabase
          .from('game_temporary_players')
          .select('*');

        if (tempPlayersError) throw tempPlayersError;

        // Format the games data
        const formattedGames = gamesData.map(game => {
          const regularPlayers = game.game_players?.map(gp => ({
            id: gp.player.id,
            name: gp.player.name,
            ...gp.player,
            joinMessage: gp.join_message,
            isTemporary: false
          })) || [];

          const temporaryPlayers = tempPlayersData
            .filter(tp => tp.game_id === game.id)
            .map(tp => ({
              id: tp.id,
              name: tp.name,
              phone: tp.phone,
              gender: tp.gender,
              category: tp.category,
              playingSide: tp.playing_side,
              joinMessage: tp.join_message,
              isTemporary: true
            }));

          return {
            ...game,
            players: [...regularPlayers, ...temporaryPlayers],
            maxPlayers: game.max_players, // Changed this line to use the value from database
            createdBy: game.created_by,
            startTime: game.start_time,
            endTime: game.end_time,
            requiredCategories: game.required_categories,
            locationIds: game.locations
          };
        });

        setGames(formattedGames);

        // Fetch availabilities
        const { data: availData, error: availError } = await supabase
          .from('availabilities')
          .select(`
            *,
            player:profiles(*),
            time_slots:availability_time_slots(
              day,
              start_time,
              end_time
            )
          `)
          // Remove this line to include deleted availabilities
          // .neq('status', 'deleted');

        if (availError) {
          console.error('Error fetching availabilities:', availError);
        } else {
          const formattedAvailabilities = availData.map(avail => ({
            ...avail,
            player: avail.player,
            timeSlots: avail.time_slots.map(slot => ({
              day: slot.day,
              startTime: slot.start_time,
              endTime: slot.end_time
            })) || [],
            expiresAt: avail.expires_at
          }));
          setAvailabilities(formattedAvailabilities);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const gamesSubscription = supabase
      .channel('games-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, 
        payload => {
          fetchData(); // Refresh data when changes occur
      })
      .subscribe();

    const availabilitiesSubscription = supabase
      .channel('availabilities-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'availabilities' }, 
        payload => {
          fetchData(); // Refresh data when changes occur
      })
      .subscribe();

    // Cleanup subscriptions
    return () => {
      gamesSubscription.unsubscribe();
      availabilitiesSubscription.unsubscribe();
    };
  }, []); // Empty dependency array means this runs once when component mounts

  // Add this useEffect to fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        console.log('Iniciando busca de locais...');
        
        // Primeiro, vamos verificar se conseguimos acessar a tabela
        const { data: tableCheck, error: tableError } = await supabase
          .from('locations')
          .select('count');
        
        console.log('Table check:', tableCheck, 'Error:', tableError);

        // Agora vamos fazer a busca completa
        const { data, error } = await supabase
          .from('locations')
          .select('*');

        console.log('Raw query result:', { data, error });

        if (error) {
          console.error('Erro ao buscar locais:', error);
          setLocations(defaultLocations);
          return;
        }

        if (data && data.length > 0) {
          console.log('Locais encontrados:', data);
          setLocations(data);
        } else {
          console.log('Nenhum local encontrado, usando locais padrão');
          setLocations(defaultLocations);
        }
      } catch (error) {
        console.error('Erro ao buscar locais:', error);
        setLocations(defaultLocations);
      }
    };

    fetchLocations();
  }, []);

  // Update getUserGames function
  const getUserGames = () => {
    if (!user) return [];
    return games.filter(game => 
      game.players.some(player => player.id === user.id) ||
      game.createdBy.id === user.id
    );
  };

  // Update getUserNotifications function
  const getUserNotifications = () => {
    if (!user) return [];
    return notifications.filter(notification => notification.userId === user.id);
  };

  // Remove this floating code block:
  /*
    const days = data.duration === '7days' ? 7 : 14;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const newAvailability: Availability = {
      id: Date.now().toString(),
      player: data.player!,
      sports: data.sports!,
      locations: data.locations!,
      timeSlots: data.timeSlots!,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      duration: data.duration!,
      expiresAt: expiresAt.toISOString(),
      status: 'active'
    };

    setAvailabilities(prev => [...prev, newAvailability]);
  */

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentUser={user}
        onLoginClick={() => setShowLogin(true)}
        onLogout={signOut}
        onEditProfile={() => setShowEditProfile(true)}
        notifications={getUserNotifications()}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onClearAllNotifications={handleClearAllNotifications}
      >
        {user?.isAdmin && (
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Admin
          </button>
        )}
      </Header>

      {/* Add LoginForm here */}
      {showLogin && (
        <LoginForm
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSubmit={handleLogin}
          onRegisterClick={() => {
            setShowLogin(false);
            setShowRegistration(true);
          }}
        />
      )}

      {/* Add PlayerRegistration component */}
      {showRegistration && (
        <PlayerRegistration
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          onSubmit={(data) => {
            // Handle player registration
            setShowRegistration(false);
            setShowLogin(true);
          }}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAdminPanel && user?.isAdmin ? (
          <AdminPanel
          locations={locations}
          games={games}
          availabilities={availabilities}
          onAddLocation={handleAddLocation}
          onEditLocation={handleEditLocation} // Update this line to use the new function
          onDeleteLocation={handleDeleteLocation}
          onDeleteGame={handleDeleteGame}
          onDeleteAvailability={handleDeleteAvailability}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
        />
        ) : (
          <CommunityBoard
            games={games}
            availabilities={availabilities}
            currentUser={user}
            userGames={getUserGames()}
            locations={locations}  // Add this line
            onJoinGame={handleJoinGame}
            onGameProposal={handleGameProposal}
            onEditGame={handleEditGame}
            onDeleteGame={handleDeleteGame}
            onAddAvailability={handleAddAvailability}
            onEditAvailability={handleEditAvailability}
            onDeleteAvailability={handleDeleteAvailability}
            onRegisterPrompt={() => setShowRegistration(true)}
            onRemovePlayer={handleRemovePlayer}
          />
        )}
      </main>

      {/* Make sure this condition uses the authenticated user */}
      {user && showEditProfile && (
        <EditProfileForm
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSubmit={handleEditProfile}
          games={games}
          availabilities={availabilities}
          onViewGame={(game) => {
            // Handle viewing game details
          }}
          onRepublishGame={handleRepublishGame}
          onRepublishAvailability={handleRepublishAvailability}
          locations={locations}
        />
      )}
    </div>
  );
}

export default App;