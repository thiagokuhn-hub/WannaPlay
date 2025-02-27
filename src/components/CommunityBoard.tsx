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
import LoginForm from './LoginForm';  // Add this import
import { getDayFromDate } from '../utils/dateUtils';
import { useGeolocation } from '../hooks/useGeolocation';
import LoadingSkeleton from './LoadingSkeleton';
import { cleanupExpiredItems } from '../utils/cleanupUtils';

interface CommunityBoardProps {
  games: GameProposal[];
  availabilities: Availability[];
  currentUser: Player | null;
  userGames: GameProposal[];
  locations: Location[];
  onJoinGame: (gameId: string, player: Player, message: string) => Promise<void>;
  onGameProposal: (data: Partial<GameProposal>, player: Profile) => Promise<void>;
  onEditGame: (gameId: string, data: Partial<GameProposal>) => Promise<void>;
  onDeleteGame: (gameId: string) => Promise<void>;
  onAddAvailability: (data: Partial<Availability>) => Promise<void>;
  onEditAvailability: (availabilityId: string, data: Partial<Availability>) => Promise<void>; // Make sure this is defined
  onDeleteAvailability: (availabilityId: string) => Promise<void>;
  onRegisterPrompt: () => void;
  onRemovePlayer: (gameId: string, playerId: string) => Promise<void>;
  onInvitePlayer?: (gameId: string, playerId: string) => Promise<void>;
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
  onRemovePlayer,
  onInvitePlayer
}: CommunityBoardProps) {
  //console.log('CommunityBoard locations:', locations);  // Add this line here
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
    // Add this with other state declarations (around line 50)
  const [showLoginForm, setShowLoginForm] = useState(false);

  // Update the initial filters state
  const [filters, setFilters] = useState<Filters>({
    sports: currentUser?.preferred_sports || ['padel', 'beach-tennis', 'tennis'],
    locations: [],
    categories: [],
    days: [],
    genders: []
  });
  useEffect(() => {
    const cleanup = async () => {
      await cleanupExpiredItems();
    };
    
    // Run cleanup when component mounts
    cleanup();

    // Set up an interval to run cleanup every hour
    const interval = setInterval(cleanup, 3600000); // 1 hour in milliseconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setFilters(prev => ({
        ...prev,
        sports: currentUser.preferred_sports || ['padel', 'beach-tennis']
      }));
    }
  }, [currentUser]);

  const handleActionWithAuth = (action: string, callback: () => void) => {
    if (!currentUser) {
      setRegistrationMessage(`Para ${action}, é necessário criar uma conta.`);
      setShowRegistrationPrompt(true);
    } else {
      callback();
    }
  };

  const handleProposeGame = () => {
    if (!currentUser) {
      setRegistrationMessage(`Para propor um jogo, é necessário criar uma conta.`);
      setShowRegistrationPrompt(true);
      return;
    }

    if (!currentUser.phone?.trim() || (!currentUser.padel_category && !currentUser.beach_tennis_category)) {
      alert('Por favor, complete seu cadastro com telefone e categoria antes de propor um jogo.');
      return;
    }

    setShowGameForm(true);
  };

  const handleAddAvailability = () => {
    if (!currentUser) {
      setRegistrationMessage(`Para adicionar disponibilidade, é necessário criar uma conta.`);
      setShowRegistrationPrompt(true);
      return;
    }

    if (!currentUser.phone?.trim() || (!currentUser.padel_category && !currentUser.beach_tennis_category)) {
      alert('Por favor, complete seu cadastro com telefone e categoria antes de adicionar uma disponibilidade.');
      return;
    }

    setShowAvailabilityForm(true);
  };

  const handleJoinGameClick = (gameId: string) => {
    handleActionWithAuth(
      'participar de um jogo',
      () => {
        console.log('Setting game to join:', gameId); // Add debug log
        setSelectedGameToJoin(gameId);
        setShowJoinGameModal(true);
      }
    );
  };

  // Add this after handleJoinGameClick and before handleMarkComplete
const handleGameClick = (game: GameProposal) => {
  setSelectedGame(game);
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

  const handleJoinGameSubmit = async (gameId: string, message: string) => {
      if (!currentUser || !gameId) {
        console.error('Missing required data:', { currentUser, gameId });
        return;
      }
      
      try {
        // Pass gameId directly instead of the game object
        await onJoinGame(gameId, currentUser, message);
        setShowJoinGameModal(false);
        setSelectedGameToJoin(null); // Reset selected game
      } catch (error) {
        console.error('Join game error:', error);
        alert(error instanceof Error ? error.message : 'Erro ao entrar no jogo');
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
    try {
      if (editingAvailability) {
        // Make sure onEditAvailability exists before calling it
        if (!onEditAvailability) {
          throw new Error('Edit availability function is not defined');
        }
        onEditAvailability(editingAvailability.id, data);
        setEditingAvailability(null);
      } else {
        // Make sure onAddAvailability exists before calling it
        if (!onAddAvailability) {
          throw new Error('Add availability function is not defined');
        }
        onAddAvailability(data);
      }
      setShowAvailabilityForm(false);
    } catch (error) {
      console.error('Error in availability submission:', error);
      alert('Erro ao salvar disponibilidade. Por favor, tente novamente.');
    }
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


  const handleRemovePlayer = async (gameId: string, playerId: string) => {
      if (!onRemovePlayer) {
        console.error('onRemovePlayer function is not defined');
        return;
      }
  
      try {
        if (window.confirm('Tem certeza que deseja remover este jogador?')) {
          await onRemovePlayer(gameId, playerId);
          
          // Update local state if needed
          const updatedGame = games.find(g => g.id === gameId);
          if (selectedGame?.id === gameId && updatedGame) {
            const gameWithUpdatedPlayers = {
              ...updatedGame,
              players: updatedGame.players.filter(player => player.id !== playerId)
            };
            setSelectedGame(gameWithUpdatedPlayers);
          }
        }
      } catch (error) {
        console.error('Error removing player:', error);
        alert('Erro ao remover jogador. Por favor, tente novamente.');
      }
    };

  const handleInvitePlayer = async (gameId: string, playerId: string) => {
    if (!onInvitePlayer) {
      console.error('onInvitePlayer function is not defined');
      return;
    }

    try {
      await onInvitePlayer(gameId, playerId);
    } catch (error) {
      console.error('Error inviting player:', error);
      alert('Erro ao convidar jogador. Por favor, tente novamente.');
    }
  };

  const filterGames = (games: GameProposal[]) => {
    // First, ensure all games have a valid dateObj
    const gamesWithValidDates = games.map(game => {
      if (!game.dateObj) {
        // Create a dateObj from the game.date if it doesn't exist
        const dateObj = new Date(game.date);
        return { ...game, dateObj };
      }
      return game;
    });

    // Add debug logging to see what games are being processed
    console.log('Games before filtering:', games.length);
    
    return gamesWithValidDates.filter(game => {
      // First check if game is deleted
      if (game.status === 'deleted') return false;

      // Debug: Log the game creator ID and current user ID
      if (currentUser) {
        console.log(`Game ${game.id} created by: ${game.createdBy.id}, Current user: ${currentUser.id}`);
      }

      // Always show games created by the current user
      if (currentUser && game.createdBy.id === currentUser.id) {
        return true;
      }

      // If user has selected to see only group content and the game is public
      if (currentUser?.show_only_group_content && game.is_public) {
        return false;
      }

      // If game is not public, check if user is in the game's groups
      if (!game.is_public) {
        if (!currentUser) return false;
        
        const isInGroup = game.game_groups?.some(gg => 
          gg.groups.group_members?.some(member => 
            member.user_id === currentUser.id
          )
        );
        
        if (!isInGroup) return false;
      }

      // Rest of filtering logic remains the same
      const locationMatch = filters.locations.length === 0 || 
        game.locations.some(loc => filters.locations.includes(loc));
      
      const categoryMatch = filters.categories.length === 0 || 
        game.requiredCategories.some(cat => filters.categories.includes(cat));
      
      const dayMatch = filters.days.length === 0 || filters.days.includes(game.dayOfWeek);
      
      const genderMatch = filters.genders.length === 0 || 
        filters.genders.includes(game.gender);
      
      const sportMatch = filters.sports.length === 0 || 
        filters.sports.includes(game.sport);

      return locationMatch && categoryMatch && dayMatch && genderMatch && sportMatch;
    })
      .sort((a, b) => {
        if (!a.dateObj) return -1;
        if (!b.dateObj) return 1;
        return a.dateObj.getTime() - b.dateObj.getTime();
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
        // First check if availability is deleted or expired
        if (availability.status === 'deleted' || availability.status === 'expired') return false;
        
        const expirationDate = new Date(availability.expiresAt);
        expirationDate.setHours(0, 0, 0, 0);
        if (expirationDate < today) return false;

        // Check if any of the availability sports match user's preferred sports
        const sportsMatch = availability.sports.some(sport => 
          currentUser?.preferred_sports?.includes(sport)
        );
        if (currentUser && !sportsMatch) return false;

        // If user wants to see only group content
        if (currentUser?.show_only_group_content) {
          // Always show user's own availabilities if sports match
          if (currentUser.id === availability.player.id) return true;

          // For other availabilities, only show if user is in the group
          const isInGroup = availability.availability_groups?.some(ag => 
            ag.groups.group_members?.some(member => 
              member.user_id === currentUser.id && 
              (member.role === 'member' || member.role === 'admin')
            )
          );

          return isInGroup || false;
        }

        // Show public availabilities if no user is logged in
        if (availability.is_public) return true;

        // For private availabilities, check group membership
        if (!currentUser) return false;
        
        if (currentUser.id === availability.player.id) return true;

        const isInGroup = availability.availability_groups?.some(ag => 
          ag.groups.group_members?.some(member => 
            member.user_id === currentUser.id && 
            (member.role === 'member' || member.role === 'admin')
          )
        );

        return isInGroup || false;

        const locationMatch = filters.locations.length === 0 || 
          availability.locations.some(loc => filters.locations.includes(loc));
        
        const dayMatch = filters.days.length === 0 || 
          availability.timeSlots.some(slot => filters.days.includes(slot.day));
        
        const genderMatch = filters.genders.length === 0 || 
          filters.genders.includes(availability.player.gender);
        
        const sportMatch = filters.sports.length === 0 || 
          availability.sports.some(sport => filters.sports.includes(sport));
      
        const categoryMatch = filters.categories.length === 0 || 
          (availability.sports.includes('padel') && 
           availability.player.padel_category && 
           filters.categories.includes(availability.player.padel_category)) ||
          (availability.sports.includes('beach-tennis') && 
           availability.player.beach_tennis_category && 
           filters.categories.includes(availability.player.beach_tennis_category));
      
        return locationMatch && dayMatch && genderMatch && sportMatch && categoryMatch;
      });
  };

  const filteredGames = filterGames(games);
  const filteredAvailabilities = filterAvailabilities(availabilities);



  // Add this useEffect after other state declarations
  // Move isLoading state to the top with other state declarations
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Wait for both games and locations to be loaded
        if (games.length >= 0 && locations.length >= 0) {
          // Add a small delay to ensure smooth transition
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };
  
    loadData();
  }, [games, locations]);

  return (
    <div className="space-y-4">
      <div className="game-proposal">
        <ActionButtons
          currentUser={currentUser}
          onProposeGame={handleProposeGame}
          onAddAvailability={handleAddAvailability}
        />
      </div>

      <div className="flex flex-col space-y-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="filter-button flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-fit"
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
          {isLoading ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <LoadingSkeleton />
              <LoadingSkeleton />
            </div>
          ) : (
            <>
              {filteredGames.length > 0 && (
                // Replace the games section with this corrected version
                <div className="games-section">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Jogos Disponíveis</h2>
                  <div className="games-list grid gap-6 grid-cols-1 md:grid-cols-2">
                    {filteredGames.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onJoinGame={handleJoinGameClick}
                        currentUser={currentUser}
                        onRemovePlayer={onRemovePlayer}
                        locations={locations}
                        onGameClick={handleGameClick}
                        onMarkComplete={handleMarkComplete}
                        onAddPlayerDirectly={handleAddPlayerDirectly}
                        onInvitePlayer={handleInvitePlayer}  // Update this line
                        onRegisterPrompt={onRegisterPrompt}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="availability-section sticky top-4">
            {isLoading ? (
              <div className="space-y-4">
                <LoadingSkeleton />
                <LoadingSkeleton />
              </div>
            ) : (
              filteredAvailabilities.length > 0 && (
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
              )
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

      {showJoinGameModal && selectedGameToJoin && (
        <JoinGameModal
          isOpen={showJoinGameModal}
          onClose={() => setShowJoinGameModal(false)}
          onJoin={handleJoinGameSubmit}
          onRegisterPrompt={onRegisterPrompt}
          currentUser={currentUser}
          gameId={selectedGameToJoin}  // Make sure this is being passed
        />
      )}

      {showRegistrationPrompt && (
        <RegistrationPrompt
          isOpen={showRegistrationPrompt}
          onClose={() => setShowRegistrationPrompt(false)}
          onLogin={() => {
            setShowRegistrationPrompt(false);
            setShowLoginForm(true);  // Show LoginForm instead of going to registration
          }}
          message={registrationMessage}
        />
      )}

      {showLoginForm && (
        <LoginForm
          isOpen={showLoginForm}
          onClose={() => setShowLoginForm(false)}
          onSubmit={async (data) => {
            try {
              // Handle login logic here
              setShowLoginForm(false);
            } catch (error) {
              console.error('Login failed:', error);
            }
          }}
          onRegisterClick={() => {
            setShowLoginForm(false);
            onRegisterPrompt();
          }}
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