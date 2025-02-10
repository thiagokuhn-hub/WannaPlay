import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, RefreshCw } from 'lucide-react';
import { GameProposal, Availability, Player, Location } from '../types';
import { formatGameDate } from '../utils/dateUtils';
import { getGameGenderLabel } from '../utils/formatters';
import RepublishModal from './RepublishModal';

interface PlayerHistoryProps {
  player: Player;
  games: GameProposal[];
  availabilities: Availability[];
  onViewGame: (game: GameProposal) => void;
  onRepublishGame?: (game: GameProposal) => void;
  onRepublishAvailability?: (availability: Availability, data: { duration: '7days' | '14days' }) => void;
  locations: Location[]; // Add locations prop
}

export default function PlayerHistory({
  player,
  games,
  availabilities,
  onViewGame,
  onRepublishGame,
  onRepublishAvailability,
  locations = [] // Add locations with default empty array
}: PlayerHistoryProps) {
  const [activeTab, setActiveTab] = useState<'games' | 'availabilities'>('games');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'deleted'>('all');
  const [itemToRepublish, setItemToRepublish] = useState<GameProposal | Availability | null>(null);

  const playerGames = games.filter(game => 
    game.players.some(p => p.id === player.id) || game.createdBy.id === player.id
  );

  const playerAvailabilities = availabilities.filter(
    availability => availability.player.id === player.id
  );

  // Function to get location names from IDs
  const getLocationNames = (locationIds: string[]) => {
    return locationIds
      .map(id => {
        const location = locations.find(loc => loc.id === id);
        return location ? location.name : '';
      })
      .filter(Boolean) // Remove empty strings
      .join(' / ');
  };

  const handleRepublish = (data: any) => {
    if (!itemToRepublish) return;
  
    if ('sport' in itemToRepublish) {
      // It's a game
      const updatedGame = {
        ...itemToRepublish,
        date: data.date === undefined ? itemToRepublish.date : data.date,
        startTime: data.startTime || itemToRepublish.startTime,
        endTime: data.endTime || itemToRepublish.endTime,
        status: 'open',
        players: [player],
        createdAt: new Date().toISOString(),
        deletedAt: undefined
      };
      onRepublishGame?.(updatedGame);
    } else {
      // It's an availability
      onRepublishAvailability?.(itemToRepublish, { duration: data.duration });
    }
  
    setItemToRepublish(null);
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