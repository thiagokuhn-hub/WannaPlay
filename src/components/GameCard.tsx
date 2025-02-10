import React, { useState, useEffect } from 'react';  // Add useEffect import
import { Calendar, Clock, MapPin, Users, Trophy, UserPlus } from 'lucide-react';
import { GiTennisBall } from 'react-icons/gi';
import { v4 as uuidv4 } from 'uuid';  // Add this import
import { GameProposal, Player, Location } from '../types';
import { getStatusColor, getStatusText, getGameGenderLabel } from '../utils/formatters';
import { formatGameDate } from '../utils/dateUtils';
import AddPlayerDirectlyModal from './AddPlayerDirectlyModal';
import { supabase } from '../lib/supabase';

interface GameCardProps {
  game: GameProposal;
  currentUser: Player | null;
  onGameClick: () => void;
  onJoinClick: (gameId: string) => void;
  onMarkComplete?: (gameId: string) => void;
  onAddPlayerDirectly?: (gameId: string, player: Omit<Player, 'email' | 'password'>) => void;
  locations: Location[]; // Add locations prop
}

export default function GameCard({ 
  game, 
  currentUser, 
  onGameClick,
  onJoinClick,
  onMarkComplete,
  onAddPlayerDirectly,
  locations
}: GameCardProps) {
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  
  // Debug game ID format
  useEffect(() => {
    console.log("Game data received:", {
      id: game.id,
      type: typeof game.id,
      isValidUUID: /^[0-9a-fA-F-]{36}$/.test(game.id)
    });
  }, [game]);

  // Ensure game.id is a string
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
    if (!/^[0-9a-fA-F-]{36}$/.test(gameId)) {
      console.error("Invalid game ID format:", {
        originalId: game.id,
        processedId: gameId,
        type: typeof gameId
      });
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
    switch (game.status) {
      case 'full':
        return 'bg-gray-50';
      case 'cancelled':
        return 'bg-red-50';
      case 'expired':
        return 'bg-yellow-50';
      default:
        return 'bg-white';
    }
  };

  // Function to get location names from IDs
  // Add this debug effect
  useEffect(() => {
    console.log('Game and Locations Debug:', {
      game: {
        id: game.id,
        location_id: game.location_id,
        locationId: game.locationId,
        location: game.location,
        locationIds: game.locationIds,
        locations: game.locations, // Add this line to check if it's using 'locations'
      },
      availableLocations: locations?.map(loc => ({
        id: loc.id,
        name: loc.name
      }))
    });
  }, [game, locations]);

  const getLocationNames = () => {
    // Check if game.locations is an array and use it
    if (Array.isArray(game.locations) && game.locations.length > 0) {
      return game.locations.map(locationId => {
        const location = locations?.find(loc => loc.id === locationId);
        return location ? location.name : '';
      }).filter(Boolean).join(' / ');
    }

    // Fallback to single location if array is not available
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
      <div className={`${getCardBackground()} rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
        onClick={onGameClick}>
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
            {game.status === 'open' && !isPlayerInGame && !isGameCreator && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinClick(game.id);
                }}
                className="w-full bg-blue-600 text-white py-1.5 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                Participar
              </button>
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
            {isPlayerInGame && (
              <div className="text-center text-xs text-green-600 font-medium">
                Você já está participando deste jogo
              </div>
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
    </>
  );
}