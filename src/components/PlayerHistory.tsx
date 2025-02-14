import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, RefreshCw } from 'lucide-react';
import { GameProposal, Availability, Player, Location } from '../types';
import { formatGameDate } from '../utils/dateUtils';
import { getGameGenderLabel } from '../utils/formatters';
import RepublishModal from './RepublishModal';
import { useAvailabilities } from '../hooks/useAvailabilities';
import { supabase } from '../lib/supabase';

interface PlayerHistoryProps {
  player: Player;
  games: GameProposal[];
  availabilities: Availability[];
  onViewGame: (game: GameProposal) => void;
  onRepublishGame?: (game: GameProposal) => void;
  onRepublishAvailability?: (availability: Availability, data: { duration: '7days' | '14days' }) => void;
  locations: Location[];
}

export default function PlayerHistory({
  player,
  games,
  availabilities,
  onViewGame,
  onRepublishGame,
  onRepublishAvailability,
  locations = []
}: PlayerHistoryProps) {
  const { handleRepublishAvailability } = useAvailabilities();
  const [activeTab, setActiveTab] = useState<'games' | 'availabilities'>('games');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'deleted'>('all');
  const [itemToRepublish, setItemToRepublish] = useState<GameProposal | Availability | null>(null);
  const [localAvailabilities, setLocalAvailabilities] = useState(availabilities);

  useEffect(() => {
    setLocalAvailabilities(availabilities);
  }, [availabilities]);

  const playerGames = games.filter(game => 
    game.players.some(p => p.id === player.id) || game.createdBy.id === player.id
  );

  const playerAvailabilities = localAvailabilities.filter(
    availability => availability.player.id === player.id
  );

  const getLocationNames = (locationIds: string[]) => {
    return locationIds
      .map(id => {
        const location = locations.find(loc => loc.id === id);
        return location ? location.name : '';
      })
      .filter(Boolean)
      .join(' / ');
  };

  const handleRepublish = async (data: any) => {
    if (!itemToRepublish) return;
  
    try {
      if ('sport' in itemToRepublish) {
        // It's a game
        const dbGame = {
          date: data.date === undefined ? itemToRepublish.date : data.date,
          start_time: data.startTime || itemToRepublish.startTime,
          end_time: data.endTime || itemToRepublish.endTime,
          status: 'open',
          created_by: player.id,
          created_at: new Date().toISOString(),
          deleted_at: null,
          locations: itemToRepublish.locations,
          sport: itemToRepublish.sport,
          gender: itemToRepublish.gender,
          max_players: itemToRepublish.maxPlayers,
          required_categories: itemToRepublish.requiredCategories,
          notes: itemToRepublish.notes
        };
  
        // First update in Supabase
        const { error } = await supabase
          .from('games')
          .update(dbGame)
          .eq('id', itemToRepublish.id);
  
        if (error) throw error;
  
        // Then update game_players table
        const { error: playersError } = await supabase
          .from('game_players')
          .delete()
          .eq('game_id', itemToRepublish.id);
  
        if (playersError) throw playersError;
  
        // Add the creator as the first player
        const { error: addPlayerError } = await supabase
          .from('game_players')
          .insert({
            game_id: itemToRepublish.id,
            player_id: player.id,
            joined_at: new Date().toISOString()
          });
  
        if (addPlayerError) throw addPlayerError;
        
        // Format the game for frontend use
        const formattedGame = {
          ...itemToRepublish,
          date: dbGame.date,
          startTime: dbGame.start_time,
          endTime: dbGame.end_time,
          status: dbGame.status,
          createdBy: player,
          createdAt: dbGame.created_at,
          deletedAt: dbGame.deleted_at,
          players: [player],
          maxPlayers: dbGame.max_players,
          requiredCategories: dbGame.required_categories
        };
  
        // Update local games array
        const gameIndex = games.findIndex(g => g.id === itemToRepublish.id);
        if (gameIndex !== -1) {
          games[gameIndex] = formattedGame;
        }
        
        // Call the parent's onRepublishGame handler
        if (onRepublishGame) {
          await onRepublishGame(formattedGame);
        }
      } else {
        // Availability republishing logic remains the same
        const updatedAvailability = {
          ...itemToRepublish,
          id: itemToRepublish.id,
          player: itemToRepublish.player,
          sports: itemToRepublish.sports,
          locations: itemToRepublish.locations,
          timeSlots: itemToRepublish.timeSlots,
          notes: itemToRepublish.notes,
          status: 'active',
          duration: data.duration,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + (data.duration === '7days' ? 7 : 14) * 24 * 60 * 60 * 1000).toISOString(),
          deletedAt: undefined
        };
    
        // First update in the database
        const result = await handleRepublishAvailability(itemToRepublish, { duration: data.duration });
        
        // Update local state immediately
        setLocalAvailabilities(prev => 
          prev.map(avail => 
            avail.id === itemToRepublish.id ? updatedAvailability : avail
          )
        );
        
        // Update parent component state
        if (onRepublishAvailability) {
          await onRepublishAvailability(updatedAvailability, { duration: data.duration });
        }
    
        // Update the main availabilities array
        const availabilityIndex = availabilities.findIndex(a => a.id === itemToRepublish.id);
        if (availabilityIndex !== -1) {
          availabilities[availabilityIndex] = updatedAvailability;
        }
      }
      
      setItemToRepublish(null);
    } catch (error) {
      console.error('Error republishing:', error);
      alert('Erro ao republicar. Por favor, tente novamente.');
    }
  };

  const canRepublish = (item: GameProposal | Availability) => {
    return item.status === 'expired' || item.status === 'deleted';
  };

  const getGameStatusLabel = (game: GameProposal) => {
    if (game.status === 'deleted') return 'Excluído';
    if (game.status === 'expired') return 'Expirado';
    if (game.createdBy.id === player.id) return 'Criador';
    return 'Participante';
  };

  const getGameStatusColor = (game: GameProposal) => {
    switch (game.status) {
      case 'deleted':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'full':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityStatusColor = (availability: Availability) => {
    switch (availability.status) {
      case 'deleted':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterItems = (items: (GameProposal | Availability)[]) => {
    const filtered = statusFilter === 'all' ? items : items.filter(item => item.status === statusFilter);
    
    // Sort items by status (active first)
    return filtered.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      
      // For items with the same status, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const filteredGames = filterItems(playerGames);
  const filteredAvailabilities = filterItems(playerAvailabilities);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('games')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'games'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Jogos ({playerGames.length})
          </button>
          <button
            onClick={() => setActiveTab('availabilities')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'availabilities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Disponibilidades ({playerAvailabilities.length})
          </button>
        </nav>
      </div>

      <div className="flex justify-end">
        <select
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="expired">Expirados</option>
          <option value="deleted">Excluídos</option>
        </select>
      </div>

      <div className="space-y-4">
        {activeTab === 'games' ? (
          filteredGames.length > 0 ? (
            filteredGames.map(game => (
              <div
                key={game.id}
                className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow ${
                  game.status === 'deleted' ? 'opacity-75' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {game.sport === 'padel' ? 'Padel' : 'Beach Tennis'}
                    </h3>
                    <p className="text-sm text-gray-500">{getGameGenderLabel(game.gender)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGameStatusColor(game)}`}>
                      {getGameStatusLabel(game)}
                    </span>
                    {canRepublish(game) && game.createdBy.id === player.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToRepublish(game);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Republicar jogo"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div 
                  className="space-y-2 text-sm text-gray-600 cursor-pointer"
                  onClick={() => onViewGame(game)}
                >
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatGameDate(game.date)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {game.startTime} - {game.endTime}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {getLocationNames(game.locations)}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {game.players.length} / {game.maxPlayers} jogadores
                  </div>
                </div>

                {game.deletedAt && (
                  <div className="mt-2 text-sm text-gray-500">
                    Excluído em: {new Date(game.deletedAt).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">Nenhum jogo encontrado</p>
          )
        ) : (
          filteredAvailabilities.length > 0 ? (
            filteredAvailabilities.map(availability => (
              <div
                key={availability.id}
                className={`bg-white rounded-lg shadow p-4 ${
                  availability.status === 'deleted' ? 'opacity-75' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {availability.sports.map(sport => 
                        sport === 'padel' ? 'Padel' : 'Beach Tennis'
                      ).join(' / ')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getLocationNames(availability.locations)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getAvailabilityStatusColor(availability)
                    }`}>
                      {availability.status === 'active' ? 'Ativo' : 
                       availability.status === 'expired' ? 'Expirado' : 'Excluído'}
                    </span>
                    {canRepublish(availability) && (
                      <button
                        onClick={() => setItemToRepublish(availability)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Republicar disponibilidade"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {availability.timeSlots.map((slot, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      <span className="font-medium">{slot.day}:</span>{' '}
                      {slot.startTime} - {slot.endTime}
                    </div>
                  ))}
                </div>

                {availability.notes && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {availability.notes}
                  </div>
                )}

                {availability.deletedAt && (
                  <div className="mt-2 text-sm text-gray-500">
                    Excluído em: {new Date(availability.deletedAt).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">Nenhuma disponibilidade encontrada</p>
          )
        )}
      </div>

      {itemToRepublish && (
        <RepublishModal
          item={itemToRepublish}
          onClose={() => setItemToRepublish(null)}
          onSubmit={handleRepublish}
        />
      )}
    </div>
  );
}