import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { GameProposal, Player, Availability, Location, WeekDay, Gender, Sport, Filters } from '../types';
import GameDetails from './GameDetails';
import AvailabilityForm from './AvailabilityForm';
import AvailabilityCard from './AvailabilityCard';
import FilterPanel from './FilterPanel';
import GameProposalForm from './GameProposalForm';
import Modal from './modals/Modal';
import ActionButtons from './ActionButtons';
import GameCard from './GameCard';
import JoinGameModal from './JoinGameModal';
import RegistrationPrompt from './RegistrationPrompt';
import { getDayFromDate } from '../utils/dateUtils';
import { useGeolocation } from '../hooks/useGeolocation';

interface CommunityBoardProps {
  games: GameProposal[];
  availabilities: Availability[];
  currentUser: Player | null;
  userGames: GameProposal[];
  locations: Location[];
  onJoinGame: (gameId: string, player: Player, message?: string) => void;
  onGameProposal: (data: any, player: Player) => void;
  onEditGame: (gameId: string, data: Partial<GameProposal>) => void;
  onDeleteGame: (gameId: string) => void;
  onAddAvailability: (data: Partial<Availability>) => void;
  onEditAvailability: (availabilityId: string, data: Partial<Availability>) => void;
  onDeleteAvailability: (availabilityId: string) => void;
  onRegisterPrompt: () => void;
  onRemovePlayer: (gameId: string, playerId: string) => void;
}

export default function CommunityBoard({
  games,
  availabilities,
  currentUser,
  userGames,
  locations,
  onJoinGame,
  onGameProposal,
  onEditGame,
  onDeleteGame,
  onAddAvailability,
  onEditAvailability,
  onDeleteAvailability,
  onRegisterPrompt,
  onRemovePlayer
}: CommunityBoardProps) {
  console.log('CommunityBoard locations:', locations);  // Add this line here
  const { latitude, longitude, error } = useGeolocation();
  const [selectedGame, setSelectedGame] = useState<GameProposal | null>(null);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState<GameProposal | null>(null);
  const [showJoinGameModal, setShowJoinGameModal] = useState(false);
  const [selectedGameToJoin, setSelectedGameToJoin] = useState<string | null>(null);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [availabilityToDelete, setAvailabilityToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    sports: [],
    locations: [],
    categories: [],
    days: [],
    genders: []
  });

  const handleActionWithAuth = (action: string, callback: () => void) => {
    if (!currentUser) {
      setRegistrationMessage(`Para ${action}, é necessário criar uma conta.`);
      setShowRegistrationPrompt(true);
    } else {
      callback();
    }
  };

  const handleProposeGame = () => {
    handleActionWithAuth(
      'propor um jogo',
      () => setShowGameForm(true)
    );
  };

  const handleAddAvailability = () => {
    handleActionWithAuth(
      'adicionar disponibilidade',
      () => setShowAvailabilityForm(true)
    );
  };

  const handleJoinGameClick = (gameId: string) => {
    handleActionWithAuth(
      'participar de um jogo',
      () => {
        setSelectedGameToJoin(gameId);
        setShowJoinGameModal(true);
      }
    );
  };

  const handleMarkComplete = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    if (game.players.length < 2) {
      alert('O jogo precisa ter pelo menos 2 jogadores para ser marcado como completo.');
      return;
    }

    if (window.confirm('Tem certeza que deseja marcar este jogo como completo?')) {
      onEditGame(gameId, { status: 'full' });
      
      if (selectedGame?.id === gameId) {
        setSelectedGame({ ...game, status: 'full' });
      }
    }
  };

  const handleAddPlayerDirectly = (gameId: string, player: Omit<Player, 'email' | 'password'>) => {
    const gamePlayer = {
      ...player,
      email: '',
      password: '',
    };
    onJoinGame(gameId, gamePlayer as Player);
  };

  const handleJoinGameSubmit = (player: Player, message?: string) => {
    if (selectedGameToJoin) {
      onJoinGame(selectedGameToJoin, player, message);
      setShowJoinGameModal(false);
      setSelectedGameToJoin(null);
    }
  };

  const handleGameProposal = (data: any) => {
    if (currentUser) {
      onGameProposal(data, currentUser);
      setShowGameForm(false);
    }
  };

  const handleEditGameSubmit = (data: any) => {
    if (editingGame) {
      onEditGame(editingGame.id, data);
      setEditingGame(null);
    }
  };

  const handleEditAvailability = (availability: Availability) => {
    setEditingAvailability(availability);
    setShowAvailabilityForm(true);
  };

  const handleDeleteAvailability = (availabilityId: string) => {
    setAvailabilityToDelete(availabilityId);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    if (availabilityToDelete) {
      onDeleteAvailability(availabilityToDelete);
      setShowDeleteConfirmation(false);
      setAvailabilityToDelete(null);
    }
  };

  const handleAvailabilitySubmit = (data: Partial<Availability>) => {
    if (editingAvailability) {
      onEditAvailability(editingAvailability.id, data);
      setEditingAvailability(null);
    } else {
      onAddAvailability(data);
    }
    setShowAvailabilityForm(false);
  };

  useEffect(() => {
    if (latitude && longitude) {
      const nearbyLocations = locations.filter(location => {
        const distance = calculateDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        );
        return distance <= 10; // Show locations within 10km
      });
      
      // Update filters to show nearby locations
      setFilters(prev => ({
        ...prev,
        locations: nearbyLocations.map(loc => loc.id)
      }));
    }
  }, [latitude, longitude, locations]);

  // Add this helper function
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };


  const handleRemovePlayer = (gameId: string, playerId: string) => {
    if (window.confirm('Tem certeza que deseja remover este jogador?')) {
      onRemovePlayer(gameId, playerId);
      
      // Update only the selected game if needed
      const updatedGame = games.find(g => g.id === gameId);
      if (selectedGame?.id === gameId && updatedGame) {
        const gameWithUpdatedPlayers = {
          ...updatedGame,
          players: updatedGame.players.filter(player => player.id !== playerId)
        };
        setSelectedGame(gameWithUpdatedPlayers);
      }
    }
  };

  const filterGames = (games: GameProposal[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gamesWithDistance = games.map(game => {
      const closestLocation = game.locations
        .map(locId => locations.find(l => l.id === locId))
        .filter(loc => loc !== undefined)
        .map(loc => ({
          location: loc!,
          distance: latitude && longitude ? 
            calculateDistance(latitude, longitude, loc!.latitude, loc!.longitude) : 
            Infinity
        }))
        .sort((a, b) => a.distance - b.distance)[0];

      return {
        ...game,
        distance: closestLocation?.distance || Infinity
      };
    });

    return gamesWithDistance
      .filter(game => {
        if (game.status === 'deleted') return false;
        
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        if (gameDate < today) return false;
        
        const locationMatch = filters.locations.length === 0 || 
          game.locations.some(loc => filters.locations.includes(loc));
        
        const categoryMatch = filters.categories.length === 0 || 
          game.requiredCategories.some(cat => filters.categories.includes(cat));
        
        const dayMatch = filters.days.length === 0 || 
          filters.days.includes(getDayFromDate(new Date(game.date)));
        
        const genderMatch = filters.genders.length === 0 || 
          filters.genders.includes(game.gender);
        
        const sportMatch = filters.sports.length === 0 || 
          filters.sports.includes(game.sport);

        return locationMatch && categoryMatch && dayMatch && genderMatch && sportMatch;
      });
  };

  const filterAvailabilities = (availabilities: Availability[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availabilitiesWithDistance = availabilities.map(availability => {
      const closestLocation = availability.locations
        .map(locId => locations.find(l => l.id === locId))
        .filter(loc => loc !== undefined)
        .map(loc => ({
          location: loc!,
          distance: latitude && longitude ? 
            calculateDistance(latitude, longitude, loc!.latitude, loc!.longitude) : 
            Infinity
        }))
        .sort((a, b) => a.distance - b.distance)[0];

      return {
        ...availability,
        distance: closestLocation?.distance || Infinity
      };
    });

    return availabilitiesWithDistance
      .filter(availability => {
        if (availability.status === 'deleted') return false;
        
        const expirationDate = new Date(availability.expiresAt);
        expirationDate.setHours(0, 0, 0, 0);
        if (expirationDate < today) return false;
        
        const locationMatch = filters.locations.length === 0 || 
          availability.locations.some(loc => filters.locations.includes(loc));
        
        const dayMatch = filters.days.length === 0 || 
          availability.timeSlots.some(slot => filters.days.includes(slot.day));
        
        const genderMatch = filters.genders.length === 0 || 
          filters.genders.includes(availability.player.gender);
        
        const sportMatch = filters.sports.length === 0 || 
          availability.sports.some(sport => filters.sports.includes(sport));

        return locationMatch && dayMatch && genderMatch && sportMatch;
      });
  };

  const filteredGames = filterGames(games);
  const filteredAvailabilities = filterAvailabilities(availabilities);

  return (
    <div className="space-y-4">
      <ActionButtons
        currentUser={currentUser}
        onProposeGame={handleProposeGame}
        onAddAvailability={handleAddAvailability}
      />

      <div className="flex flex-col space-y-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-fit"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>

        {showFilters && (
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            games={games}
            availabilities={availabilities}
            locations={locations}
          />
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-9">
          {filteredGames.length > 0 && (
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Jogos Disponíveis</h2>
          )}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                currentUser={currentUser}
                onGameClick={() => setSelectedGame(game)}
                onJoinClick={handleJoinGameClick}
                onMarkComplete={handleMarkComplete}
                onAddPlayerDirectly={handleAddPlayerDirectly}
                locations={locations}  // Add this line
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="sticky top-4">
            {filteredAvailabilities.length > 0 && (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Quero Jogar</h3>
                <div className="space-y-4">
                  {filteredAvailabilities.map((availability) => (
                    <AvailabilityCard
                      key={availability.id}
                      availability={availability}
                      currentUserId={currentUser?.id}
                      onEdit={handleEditAvailability}
                      onDelete={handleDeleteAvailability}
                      locations={locations}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedGame && (
        <GameDetails
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          currentUser={currentUser}
          onEdit={() => {
            setEditingGame(selectedGame);
            setSelectedGame(null);
          }}
          onDelete={onDeleteGame}
          onRemovePlayer={handleRemovePlayer}
          locations={locations}
        />
      )}

      {showJoinGameModal && (
        <JoinGameModal
          isOpen={showJoinGameModal}
          onClose={() => {
            setShowJoinGameModal(false);
            setSelectedGameToJoin(null);
          }}
          onJoin={handleJoinGameSubmit}
          onRegisterPrompt={onRegisterPrompt}
          currentUser={currentUser}
        />
      )}

      {showRegistrationPrompt && (
        <RegistrationPrompt
          isOpen={showRegistrationPrompt}
          onClose={() => setShowRegistrationPrompt(false)}
          onRegister={() => {
            onRegisterPrompt();
            setShowRegistrationPrompt(false);
          }}
          message={registrationMessage}
        />
      )}

      {showAvailabilityForm && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowAvailabilityForm(false);
            setEditingAvailability(null);
          }}
          title={editingAvailability ? "Editar Disponibilidade" : "Adicionar Disponibilidade"}
        >
          <AvailabilityForm
            onSubmit={handleAvailabilitySubmit}
            onClose={() => {
              setShowAvailabilityForm(false);
              setEditingAvailability(null);
            }}
            currentUser={currentUser}
            initialData={editingAvailability}
            availableLocations={locations}
          />
        </Modal>
      )}

      {(showGameForm || editingGame) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowGameForm(false);
            setEditingGame(null);
          }}
          title={editingGame ? "Editar Jogo" : "Propor um Jogo"}
        >
          <GameProposalForm
            onSubmit={editingGame ? handleEditGameSubmit : handleGameProposal}
            onClose={() => {
              setShowGameForm(false);
              setEditingGame(null);
            }}
            initialData={editingGame || undefined}
            isEditing={!!editingGame}
            currentUser={currentUser}
            availableLocations={locations}
          />
        </Modal>
      )}

      {showDeleteConfirmation && (
        <Modal
          isOpen={showDeleteConfirmation}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setAvailabilityToDelete(null);
          }}
          title="Excluir Disponibilidade"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Tem certeza que deseja excluir esta disponibilidade?
            </p>
            <p className="text-sm text-blue-600">
              Dica: Você poderá republicar esta disponibilidade mais tarde acessando seu histórico no perfil.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setAvailabilityToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}