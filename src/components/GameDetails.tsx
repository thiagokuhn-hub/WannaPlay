import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, X, Trash2, UserMinus } from 'lucide-react';
import { GiTennisBall } from 'react-icons/gi';
import { GameProposal, Player } from '../types';
import { formatGameDate } from '../utils/dateUtils';
import { getGameGenderLabel } from '../utils/formatters';
import Modal from './modals/Modal';

interface GameDetailsProps {
  game: GameProposal;
  onClose: () => void;
  currentUser: Player | null;
  onEdit?: () => void;
  onDelete?: (gameId: string) => void;
  onRemovePlayer?: (gameId: string, playerId: string) => void;
  locations: Location[];
}

export default function GameDetails({ 
  game, 
  onClose, 
  currentUser, 
  onEdit, 
  onDelete,
  onRemovePlayer,
  locations
}: GameDetailsProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const isCreator = currentUser?.id === game.createdBy.id;

  const handleRemovePlayer = (playerId: string) => {
    onRemovePlayer?.(game.id, playerId);
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    onDelete?.(game.id);
    setShowDeleteConfirmation(false);
    onClose();
  };

  const getGenderLabel = (gender: string | undefined) => {
    if (!gender) return null;
    return gender === 'male' ? 'Masculino' : 'Feminino';
  };

  const getPlayerCategories = (player: Player) => {
    const categories = [];
    
    // For regular players (including game creator)
    if (player.padel_category) {
      categories.push(`Padel: ${player.padel_category}`);
    }
    if (player.beach_tennis_category) {
      categories.push(`Beach Tennis: ${player.beach_tennis_category}`);
    }
    
    // For temporary players
    if (player.category) {
      categories.push(game.sport === 'padel' ? `Padel: ${player.category}` : `Beach Tennis: ${player.category}`);
    }
    
    return categories;
  };

  const getPlayingSideLabel = (side: string | undefined) => {
    if (!side) return null;
    // Use the side parameter directly
    return side === 'both' ? 'Ambos os lados' : 
           side === 'left' ? 'Lado Esquerdo' : 
           side === 'right' ? 'Lado Direito' : null;
  };

  // Add this function
  const getLocationNames = () => {
    if (!game.locations || !locations) return 'Local não encontrado';
    
    return game.locations.map(locationId => {
      const location = locations.find(loc => loc.id === locationId);
      return location ? location.name : 'Local não encontrado';
    }).join(' / ');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Jogo</h2>
              <div className="flex items-center gap-2">
                {isCreator && (
                  <>
                    <button
                      onClick={onEdit}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-semibold">
                      {game.sport === 'padel' ? 'Padel' : 'Beach Tennis'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                      game.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : game.status === 'full'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {game.status === 'open' ? 'Aberto' : game.status === 'full' ? 'Completo' : 'Cancelado'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {getGameGenderLabel(game.gender)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Categorias: {game.requiredCategories.join(', ')}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>{formatGameDate(game.date)}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>
                    {game.startTime?.substring(0, 5)} - {game.endTime?.substring(0, 5)}
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{getLocationNames()}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-2" />
                  <span>
                    {game.players.length} / {game.maxPlayers} jogadores
                  </span>
                </div>
              </div>

              {game.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Informações Adicionais</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{game.description}</p>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-4">Participantes</h4>
                <div className="space-y-3">
                  {game.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex flex-col bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {player.avatar ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                              <img
                                src={player.avatar}
                                alt={`Avatar de ${player.name}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <GiTennisBall className="w-6 h-6 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{player.name}</p>
                            <div className="text-sm text-gray-500 space-y-1">
                              {getPlayerCategories(player).map((category, index) => (
                                <span key={index} className="block">{category}</span>
                              ))}
                              {player.gender && (
                                <span className="block">{getGenderLabel(player.gender)}</span>
                              )}
                              {(player.playing_side || player.playingSide) && (
                                <span className="block">{getPlayingSideLabel(player.playing_side || player.playingSide)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-right">
                            {player.phone && player.phone.trim() !== '' && (
                              <p className="text-sm text-gray-600">
                                <a 
                                  href={`https://wa.me/55${player.phone.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {player.phone}
                                </a>
                              </p>
                            )}
                            {player.email && player.email.trim() !== '' && (
                              <p className="text-sm text-gray-500">{player.email}</p>
                            )}
                          </div>
                          {(isCreator || (currentUser?.id === player.id)) && player.id !== game.createdBy.id && (
                            <button
                              onClick={() => handleRemovePlayer(player.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title={currentUser?.id === player.id ? "Sair do jogo" : "Remover jogador"}
                            >
                              <UserMinus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                      {player.joinMessage && (
                        <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded">
                          "{player.joinMessage}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirmation && (
        <Modal
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          title="Excluir Jogo"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Tem certeza que deseja excluir este jogo?
            </p>
            <p className="text-sm text-blue-600">
              Dica: Você poderá republicar este jogo mais tarde acessando seu histórico no perfil.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
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
    </>
  );
}