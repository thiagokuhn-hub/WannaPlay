import React, { useState } from 'react';  // Keep only useState import
import { Calendar, Clock, MapPin, Users, Trophy, UserPlus, Send } from 'lucide-react';
import { GiTennisBall } from 'react-icons/gi';
import { v4 as uuidv4 } from 'uuid';  // Add this import
import { GameProposal, Player, Location } from '../types';
import { getStatusColor, getStatusText, getGameGenderLabel } from '../utils/formatters';
import { formatGameDate } from '../utils/dateUtils';
import AddPlayerDirectlyModal from './AddPlayerDirectlyModal';
import { supabase } from '../lib/supabase';
import InvitePlayerModal from './InvitePlayerModal';
import RegistrationPrompt from './RegistrationPrompt';
import LoginForm from './LoginForm';

// Add locations to the props interface
interface GameCardProps {
  game: GameProposal;
  onJoinGame: (gameId: string, message: string) => void;
  currentUser: Player | null;
  onRemovePlayer: (gameId: string, playerId: string) => void;
  locations: Location[];
  onGameClick?: (game: GameProposal) => void;
  onMarkComplete?: (gameId: string) => void;
  onAddPlayerDirectly?: (gameId: string, player: Omit<Player, 'id' | 'email' | 'password'>) => void;
  onInvitePlayer: (gameId: string, playerId: string) => void;
  onRegisterPrompt?: () => void;
}

const GameCard: React.FC<GameCardProps> = ({
  game,
  onJoinGame,
  currentUser,
  onRemovePlayer,
  locations,
  onGameClick,
  onMarkComplete,
  onAddPlayerDirectly,
  onInvitePlayer,
  onRegisterPrompt
}) => {
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // Add handleJoinClick function
  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      setShowRegistrationPrompt(true);
      return;
    }
    onJoinGame(game.id, '');
  };

  const handleInviteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      setShowRegistrationPrompt(true);
      return;
    }
    setShowInviteModal(true);
  };

  // Add these handlers
  const handleRegistrationClick = () => {
    setShowRegistrationPrompt(false);
    onRegisterPrompt?.();
  };

  const handleLoginClick = () => {
    setShowRegistrationPrompt(false);
    setShowLoginForm(true);
  };

  // Ensure game.id is a string
  // Remove both debug useEffects and keep only the essential code
  const gameId = typeof game.id === 'string' ? game.id : String(game.id);

  const isPlayerInGame = currentUser && game.players.some(player => player.id === currentUser.id);
  const isGameCreator = currentUser && game.createdBy.id === currentUser.id;

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkComplete) {
      onMarkComplete(gameId);
    }
  };

  const handleAddPlayer = async (player: Omit<Player, 'id' | 'email' | 'password'>) => {
    // Simple validation without debug logging
    if (!/^[0-9a-fA-F-]{36}$/.test(gameId)) {
      return;
    }

    if (onAddPlayerDirectly) {
      try {
        // Insert directly into game_temporary_players
        const { data: tempPlayer, error: tempPlayerError } = await supabase
          .from('game_temporary_players')
          .insert([{
            game_id: gameId,
            name: player.name,
            phone: player.phone || null,
            gender: player.gender || null,
            category: player.category || null,
            playing_side: player.playingSide || null,
            created_by: currentUser?.id,
            join_message: `Added manually by ${currentUser?.name || 'game creator'}`
          }])
          .select()
          .single();

        if (tempPlayerError) {
          console.error('Error creating temporary player:', tempPlayerError);
          throw tempPlayerError;
        }

        // Call onAddPlayerDirectly with the temporary player data
        onAddPlayerDirectly(gameId, {
          ...player,
          id: tempPlayer.id,
          isTemporary: true
        });
        
        setShowAddPlayerModal(false);
      } catch (error) {
        console.error('Error in handleAddPlayer:', error);
      }
    }
  };

  const getCardBackground = () => {
    // First check game status
    switch (game.status) {
      case 'full':
        return 'bg-gray-50';
      case 'cancelled':
        return 'bg-red-50';
      case 'expired':
        return 'bg-yellow-50';
      default:
        // If status is 'open', use sport-specific background
        return game.sport === 'padel' ? 'bg-blue-100/70' : 'bg-green-100/70';
    }
  };

  // Remove the useEffect block and keep only the location functions
  const getLocationNames = () => {
    if (Array.isArray(game.locations) && game.locations.length > 0) {
      return game.locations.map(locationId => {
        const location = locations?.find(loc => loc.id === locationId);
        return location ? location.name : '';
      }).filter(Boolean).join(' / ');
    }

    const locationId = game.location_id || 
                      game.locationId || 
                      game.location || 
                      (game.locationIds && game.locationIds[0]);
    
    if (!locationId || !locations) {
      return '';
    }
    
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Local não encontrado';
  };

  // Add this helper function to format time
  const formatTime = (time: string) => {
    return time.split(':').slice(0, 2).join(':');
  };

  return (
    <>
      <div 
        className={`${getCardBackground()} rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
        onClick={() => onGameClick && onGameClick(game)}
      >
        <div className="p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-medium text-gray-900">
                  {game.sport === 'padel' ? 'Padel' : 'Beach Tennis'}
                </h3>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                  {getStatusText(game.status)}
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-0.5">
                <Trophy className="w-3.5 h-3.5 mr-1" />
                {game.requiredCategories.join(', ')}
              </div>
              <div className="text-xs text-gray-500">
                {getGameGenderLabel(game.gender)}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {game.createdBy.name}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              {formatGameDate(game.date)}
            </div>

            <div className="flex items-center text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              {formatTime(game.startTime)} - {formatTime(game.endTime)}
            </div>

            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              {getLocationNames() || 'Local não definido'}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-600">
                <Users className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                <span>{game.players.length} / {game.maxPlayers} jogadores</span>
              </div>
              
              <div className="flex -space-x-2">
                {game.players.map((player, index) => (
                  <div
                    key={player.id}
                    className="relative"
                    style={{ zIndex: game.players.length - index }}
                  >
                    {player.avatar ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white">
                        <img
                          src={player.avatar}
                          alt={`Avatar de ${player.name}`}
                          className="w-full h-full object-cover"
                          title={player.name}
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white"
                        title={player.name}
                      >
                        <GiTennisBall className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          
          <div className="mt-3 space-y-2">
            {game.status === 'open' && !isGameCreator && (
              <div className="flex items-center gap-2">
                {!isPlayerInGame && (
                  <button
                    onClick={handleJoinClick}
                    className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                  >
                    Participar
                  </button>
                )}
                {isPlayerInGame && (
                  <div className="flex-1 text-center text-sm text-green-600 font-medium">
                    Você tá dentro!
                  </div>
                )}
                <button
                  onClick={handleInviteClick}
                  className="bg-green-600 text-white py-1.5 px-3 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Convidar
                </button>
              </div>
            )}
            {isGameCreator && game.status === 'open' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddPlayerModal(true);
                  }}
                  className="w-full bg-green-600 text-white py-1.5 px-3 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Adicionar Jogador
                </button>
                {game.players.length >= 2 && (
                  <button
                    onClick={handleMarkComplete}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-1.5 px-3 rounded-lg transition-colors duration-200 text-sm"
                  >
                    Marcar como Completo
                  </button>
                )}
              </>
            )}
            {!isPlayerInGame && isGameCreator && (
              <div className="text-center text-xs text-blue-600 font-medium">
                Você é o criador deste jogo
              </div>
            )}
          </div>
        </div>
      </div>

      
      <AddPlayerDirectlyModal
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onSubmit={handleAddPlayer}
        gameId={gameId}
        currentUser={currentUser}
      />

      <InvitePlayerModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={(playerId) => {
          onInvitePlayer(gameId, playerId);
          setShowInviteModal(false);
        }}
        currentUser={currentUser}
      />

      <RegistrationPrompt
        isOpen={showRegistrationPrompt}
        onClose={() => setShowRegistrationPrompt(false)}
        onRegister={handleRegistrationClick}
        onLogin={handleLoginClick}
        message="Para participar de um jogo, é necessário criar uma conta."  // Updated message
      />

      <LoginForm
        isOpen={showLoginForm}
        onClose={() => setShowLoginForm(false)}
        onSubmit={async (data) => {
          try {
            await handleLogin(data);
            setShowLoginForm(false);
          } catch (error) {
            console.error('Login failed:', error);
          }
        }}
        onRegisterClick={() => {
          setShowLoginForm(false);
          onRegisterPrompt?.();
        }}
      />
    </>
  );
}

export default GameCard;