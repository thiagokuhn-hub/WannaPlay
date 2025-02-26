import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGames } from './hooks/useGames';
import { useAvailabilities } from './hooks/useAvailabilities';
import { useNotifications } from './hooks/useNotifications';
import { useUserManagement } from './hooks/useUserManagement';
import CommunityBoard from './components/CommunityBoard';
import LoginForm from './components/LoginForm';
import PlayerRegistration from './components/PlayerRegistration';
import EditProfileForm from './components/EditProfileForm';
import { Location, Availability, GameProposal, Player } from './types';
import Header from './components/Header';
import AdminPanel from './components/admin/AdminPanel';
import { useLocations } from './hooks/useLocations';
import { supabase } from './lib/supabase';
import Modal from './components/modals/Modal';
import { checkAvailabilitiesMatch, createAvailabilityMatchNotification } from './utils/notificationUtils';
import Footer from './components/Footer';
// Add import
import Tutorial from './components/Tutorial';

function App() {
  const { user, signIn, signOut, updateProfile } = useAuth();
  const { games, setGames, handleGameProposal, handleJoinGame, handleRemovePlayer } = useGames();
  const { 
    availabilities, 
    setAvailabilities, 
    handleAddAvailability, 
    handleEditAvailability, 
    handleDeleteAvailability 
  } = useAvailabilities();
  const { notifications, setNotifications, handleMarkNotificationAsRead, handleClearAllNotifications } = useNotifications();
  const { handleBlockUser, handleUnblockUser } = useUserManagement();
  const { locations, setLocations } = useLocations();

  // Modified to always show tutorial (for testing)
  const [showTutorial] = useState(true);

  const [showLogin, setShowLogin] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Add this function definition here
  // Modify getUserNotifications function
  const getUserNotifications = () => {
    if (!user) return [];
    return notifications.filter(notification => notification.user_id === user.id);
  };

  // Remove debug logging for user
  useEffect(() => {
    if (user) {
      // User is authenticated, no need for debug logs
    }
  }, [user]);

  // Modify availability matching effect
  useEffect(() => {
    if (!user || !availabilities.length || !locations.length) return;

    const checkForMatches = async () => {
      const userAvailabilities = availabilities.filter(a => 
        a.player.id === user.id && 
        a.status !== 'deleted' &&
        new Date(a.expiresAt) > new Date()
      );

      const otherAvailabilities = availabilities.filter(a => 
        a.player.id !== user.id && 
        a.status !== 'deleted' &&
        new Date(a.expiresAt) > new Date()
      );

      const matchedPlayerIds = new Set();

      for (const otherAvail of otherAvailabilities) {
        if (matchedPlayerIds.has(otherAvail.player.id)) continue;

        for (const userAvail of userAvailabilities) {
          const { timeMatch, locationMatch } = checkAvailabilitiesMatch(
            userAvail,
            otherAvail,
            locations
          );
          
          if (timeMatch && locationMatch.isMatch) {
            // Check if a notification for this specific availability match already exists
            const { data: existingNotifications } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', user.id)
              .eq('type', 'game_match')
              .eq('availability_id', otherAvail.id) // Add this field to track specific availability matches
              .single();
          
            if (!existingNotifications) {
              const userLocation = locations.find(l => userAvail.locations.includes(l.id))?.name || '';
              const otherLocation = locations.find(l => otherAvail.locations.includes(l.id))?.name || '';
              
              const notification = createAvailabilityMatchNotification(
                otherAvail,
                user.id,
                locationMatch,
                locations,
                userLocation,
                otherLocation
              );
            
              const { data: savedNotification, error } = await supabase
                .from('notifications')
                .insert([{
                  user_id: notification.userId,
                  type: 'game_match',
                  message: notification.message,
                  title: notification.title,
                  read: false,
                  created_at: new Date().toISOString(), // Make sure this is in ISO format
                  availability_id: otherAvail.id
                }])
                .select()
                .single();
            
              if (error) {
                console.error('Error saving notification:', error);
              } else {
                console.log('New notification created:', savedNotification);
                setNotifications(prev => [...prev, notification]);
                matchedPlayerIds.add(otherAvail.player.id);
                break;
              }
            }
          }
        }
      }
    };

    checkForMatches();
  }, [user, availabilities, locations]);

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      const result = await signIn(data.email, data.password);
      if (result.success) {
        // Fetch all notifications for the user, not just unread ones
        const { data: notifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', result.user.id)
          .order('created_at', { ascending: false });
      
        if (notifications) {
          setNotifications(notifications);
        }
        setShowLogin(false);
      }
    } catch (error) {
      alert('Erro ao fazer login. Verifique suas credenciais.');
    }
  };

  const handleEditProfile = async (data: Partial<Player>) => {
    if (user) {  // Now user is properly defined
      try {
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

  const handleEditGame = async (gameId: string, data: Partial<GameProposal>) => {
    try {
      // Convert camelCase to snake_case for database columns
      const dbData = {
        ...data,
        start_time: data.startTime,
        end_time: data.endTime,
        required_categories: data.requiredCategories,
        max_players: data.maxPlayers,
        locations: data.locationIds,
      };
  
      // Remove the camelCase properties
      delete dbData.startTime;
      delete dbData.endTime;
      delete dbData.requiredCategories;
      delete dbData.maxPlayers;
      delete dbData.locationIds;
  
      const { error } = await supabase
        .from('games')
        .update(dbData)
        .eq('id', gameId);
  
      if (error) throw error;
  
      setGames(prevGames =>
        prevGames.map(game =>
          game.id === gameId ? { ...game, ...data } : game
        )
      );
    } catch (error) {
      console.error('Error editing game:', error);
      throw error;
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ status: 'deleted' })
        .eq('id', gameId);

      if (error) throw error;

      setGames(prevGames =>
        prevGames.map(game =>
          game.id === gameId ? { ...game, status: 'deleted' } : game
        )
      );
    } catch (error) {
      console.error('Error deleting game:', error);
      throw error;
    }
  };

  const handleRegisterPrompt = () => {
    setShowRegistration(true);
  };

  useEffect(() => {
    const fetchData = async () => {
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

        const { data: availData, error: availError } = await supabase
          .from('availabilities')
          .select(`
            *,
            player:profiles(*),
            time_slots:availability_time_slots(*),
            availability_groups(
              groups(
                id,
                name,
                group_members(
                  user_id,
                  role
                )
              )
            )
          `);

        if (availError) throw availError;

        const formattedAvailabilities = availData.map(avail => ({
          ...avail,
          player: avail.player,
          timeSlots: avail.time_slots?.map(slot => ({
            day: slot.day,
            startTime: slot.start_time,
            endTime: slot.end_time
          })) || [],
          createdAt: avail.created_at,
          expiresAt: avail.expires_at
        }));

        setAvailabilities(formattedAvailabilities);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const getUserGames = () => {
    if (!user) return [];
    return games.filter(game => 
      game.players.some(player => player.id === user.id) ||
      game.createdBy.id === user.id
    );
  };

  // Add handleGameInvitation here, before the return statement
  // Update the handleGameInvitation function
  const handleGameInvitation = async (gameId: string, playerId: string) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game || !user) return;
  
      // Get location names
      const gameLocations = game.locations
        .map(locId => locations.find(l => l.id === locId)?.name)
        .filter(Boolean)
        .join(', ');
  
      // Format date and time
      const gameDate = new Date(game.date);
      const formattedDate = gameDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Parse the time strings correctly
      const startTime = typeof game.startTime === 'string' ? 
        new Date(`${game.date}T${game.startTime}`) : 
        new Date(game.startTime);
      
      const endTime = typeof game.endTime === 'string' ? 
        new Date(`${game.date}T${game.endTime}`) : 
        new Date(game.endTime);
  
      const formattedStartTime = startTime.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      
      const formattedEndTime = endTime.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
  
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: playerId,
          type: 'game_match',
          title: 'Convite para Jogo',
          message: `${user.name} convidou você para um jogo de ${game.sport === 'padel' ? 'Padel' : 'Beach Tennis'} no dia ${formattedDate}, das ${formattedStartTime} às ${formattedEndTime}, em ${gameLocations}.`,
          game_id: gameId,
          created_at: new Date().toISOString(),
          read: false
        });
  
      if (error) throw error;
    } catch (error) {
      console.error('Error sending game invitation:', error);
      alert('Erro ao enviar convite. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onRegisterClick={() => setShowRegistration(true)}
        onEditProfile={() => setShowEditProfile(true)}
        onLogoutClick={signOut}
        notifications={getUserNotifications()}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onClearAllNotifications={() => handleClearAllNotifications(user?.id)}
        onAdminPanelClick={() => setShowAdminPanel(true)}
      />

      <main className="container mx-auto px-4 py-8 flex-grow">
        <CommunityBoard
          games={games}
          availabilities={availabilities}
          currentUser={user}
          userGames={getUserGames()}
          locations={locations}
          onJoinGame={handleJoinGame}
          onGameProposal={handleGameProposal}
          onEditGame={handleEditGame}
          onDeleteGame={handleDeleteGame}
          onAddAvailability={handleAddAvailability}
          onEditAvailability={handleEditAvailability}
          onDeleteAvailability={handleDeleteAvailability}
          onRegisterPrompt={handleRegisterPrompt}
          onRemovePlayer={handleRemovePlayer}
          onInvitePlayer={handleGameInvitation} // Make sure this is properly passed
        />
      </main>

      <Footer />

      {showLogin && (
        <LoginForm
          isOpen={showLogin}
          onSubmit={handleLogin}
          onClose={() => setShowLogin(false)}
          onRegisterClick={() => {
            setShowLogin(false);
            setShowRegistration(true);
          }}
        />
      )}

      {showRegistration && (
        <PlayerRegistration
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          onSwitchToLogin={() => {
            setShowRegistration(false);
            setShowLogin(true);
          }}
        />
      )}

      {showEditProfile && user && (
        <EditProfileForm
          isOpen={showEditProfile}
          onSubmit={handleEditProfile}
          onClose={() => setShowEditProfile(false)}
          games={games}
          availabilities={availabilities}
          onViewGame={(game) => {
            console.log('Viewing game:', game);
          }}
          onRepublishGame={(game) => {
            console.log('Republishing game:', game);
          }}
          onRepublishAvailability={(availability, data) => {
            console.log('Republishing availability:', availability, data);
          }}
          locations={locations}
        />
      )}

      {showAdminPanel && user?.is_admin && (
        <Modal
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
          title="Painel Administrativo"
        >
          <AdminPanel
            locations={locations}
            games={games}
            availabilities={availabilities}
            onAddLocation={async (location) => {
              const { data, error } = await supabase
                .from('locations')
                .insert([location])
                .select()
                .single();
              
              if (error) throw error;
              setLocations(prev => [...prev, data]);
            }}
            onEditLocation={async (id, data) => {
              const { error } = await supabase
                .from('locations')
                .update(data)
                .eq('id', id);
              
              if (error) throw error;
              setLocations(prev => 
                prev.map(loc => loc.id === id ? { ...loc, ...data } : loc)
              );
            }}
            onDeleteLocation={(id) => {
              console.log('Delete location:', id);
            }}
            onDeleteGame={handleDeleteGame}
            onDeleteAvailability={handleDeleteAvailability}
            onBlockUser={handleBlockUser}
            onUnblockUser={handleUnblockUser}
            onClose={() => setShowAdminPanel(false)}
          />
        </Modal>
      )}
    </div>
  );
}

export default App;