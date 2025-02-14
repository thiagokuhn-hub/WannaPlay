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
import { Location } from './types';
import Header from './components/Header';
import AdminPanel from './components/admin/AdminPanel';
import { useLocations } from './hooks/useLocations';
import { supabase } from './lib/supabase';

function App() {
  const { user, signOut, signIn, updateProfile } = useAuth();
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
  const { locations } = useLocations();

  const [showLogin, setShowLogin] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
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
      const { error } = await supabase
        .from('games')
        .update(data)
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

  const getUserNotifications = () => {
    if (!user) return [];
    return notifications.filter(notification => notification.userId === user.id);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onRegisterClick={() => setShowRegistration(true)}
        onEditProfile={() => setShowEditProfile(true)}
        onLogoutClick={signOut}
        notifications={getUserNotifications()}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onAdminPanelClick={() => setShowAdminPanel(true)}
      />

      <main className="container mx-auto px-4 py-8">
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

      {showAdminPanel && user?.isAdmin && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          locations={locations}
        />
      )}
    </div>
  );
}

export default App;