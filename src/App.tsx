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
  const getUserNotifications = () => {
    if (!user) return [];
    const userNotifications = notifications.filter(notification => notification.user_id === user.id);
    console.log('Getting user notifications:', {
      userId: user.id,
      total: userNotifications.length,
      notifications: userNotifications
    });
    return userNotifications;
  };

  // Debug logging for user
  useEffect(() => {
    if (user) {
      console.log('Current user admin status:', user.is_admin);
      console.log('Full user data:', user);
    }
  }, [user]);

  // Add availability matching effect
  useEffect(() => {
    if (!user || !availabilities.length || !locations.length) return;

    console.log('Starting availability match check');

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
            time_slots:availability_time_slots(*)
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

  // Add debug logging for notifications
  useEffect(() => {
    console.log('Notification System Debug:', {
      currentUser: user,
      availabilities: availabilities.length,
      games: games.length,
      notifications: notifications.length
    });

    if (user) {
      const userNotifications = notifications.filter(n => n.userId === user.id);
      console.log('User Notifications:', {
        total: userNotifications.length,
        unread: userNotifications.filter(n => !n.read).length,
        notifications: userNotifications
      });
    }
  }, [user, availabilities, games, notifications]);

  // Update the getUserNotifications function
  

  // Update the debug logging useEffect to use the same function
  useEffect(() => {
    console.log('Notification System Debug:', {
      currentUser: user,
      availabilities: availabilities.length,
      games: games.length,
      notifications: notifications.length
    });

    if (user) {
      const userNotifications = getUserNotifications();
      console.log('User Notifications:', {
        total: userNotifications.length,
        unread: userNotifications.filter(n => !n.read).length,
        notifications: userNotifications
      });
    }
  }, [user, availabilities, games, notifications]);

  // Remove the first debug logging useEffect (around line 352)
  // Remove the second getUserNotifications declaration
  // Keep only this single implementation
  

  // Keep this useEffect for debug logging
  useEffect(() => {
    console.log('Notification System Debug:', {
      currentUser: user,
      availabilities: availabilities.length,
      games: games.length,
      notifications: notifications.length
    });

    if (user) {
      const userNotifications = getUserNotifications();
      console.log('User Notifications:', {
        total: userNotifications.length,
        unread: userNotifications.filter(n => !n.read).length,
        notifications: userNotifications
      });
    }
  }, [user, availabilities, games, notifications]);

  // Remove all other declarations and keep only this one implementation at the top level
  

  // Keep only one debug logging useEffect
  useEffect(() => {
    console.log('Notification System Debug:', {
      currentUser: user,
      availabilities: availabilities.length,
      games: games.length,
      notifications: notifications.length
    });

    if (user) {
      const userNotifications = getUserNotifications();
      console.log('User Notifications:', {
        total: userNotifications.length,
        unread: userNotifications.filter(n => !n.read).length,
        notifications: userNotifications
      });
    }
  }, [user, availabilities, games, notifications]);

  // Add this effect after your other useEffects
  useEffect(() => {
    if (!user) return;
  
    // Subscribe to notifications for the current user
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new : n)
            );
          }
        }
      )
      .subscribe();
  
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showTutorial && <Tutorial />}
      
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