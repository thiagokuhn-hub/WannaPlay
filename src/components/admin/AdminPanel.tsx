import React, { useState } from 'react';
import { Trash2, Edit, Plus, MapPin, Phone, CheckCircle, XCircle, Ban, UserX } from 'lucide-react';
import { Location, GameProposal, Availability, Player } from '../../types';
import LocationForm from './LocationForm';
import Modal from '../modals/Modal';
import { formatDistance } from '../../utils/locationUtils';
import UsersList from './UsersList';

interface AdminPanelProps {
  locations: Location[];
  games: GameProposal[];
  availabilities: Availability[];
  onAddLocation: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onEditLocation: (id: string, data: Partial<Location>) => void;
  onDeleteLocation: (id: string) => void;
  onDeleteGame: (id: string) => void;
  onDeleteAvailability: (id: string) => void;
  onBlockUser: (userId: string) => void;
  onUnblockUser: (userId: string) => void;
}

export default function AdminPanel({
  locations,
  games,
  availabilities,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onDeleteGame,
  onDeleteAvailability,
  onBlockUser,
  onUnblockUser,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'locations' | 'games' | 'availabilities' | 'users'>('locations');
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: 'location' | 'game' | 'availability';
    id: string;
    name: string;
  } | null>(null);
  const [locationFilter, setLocationFilter] = useState('');

  // Get unique users from games and availabilities
  const getUsers = () => {
    const usersMap = new Map<string, Player>();
    
    games.forEach(game => {
      usersMap.set(game.createdBy.id, game.createdBy);
      game.players.forEach(player => {
        usersMap.set(player.id, player);
      });
    });
    
    availabilities.forEach(availability => {
      usersMap.set(availability.player.id, availability.player);
    });
    
    return Array.from(usersMap.values());
  };

  // Filter out deleted items
  const activeGames = games.filter(game => game.status !== 'deleted');
  const activeAvailabilities = availabilities.filter(availability => availability.status !== 'deleted');

  const handleDeleteConfirm = () => {
    if (!showDeleteConfirm) return;

    switch (showDeleteConfirm.type) {
      case 'location':
        onDeleteLocation(showDeleteConfirm.id);
        break;
      case 'game':
        onDeleteGame(showDeleteConfirm.id);
        break;
      case 'availability':
        onDeleteAvailability(showDeleteConfirm.id);
        break;
    }
    setShowDeleteConfirm(null);
  };

  const filteredLocations = locations.filter(location => 
    location.name.toLowerCase().includes(locationFilter.toLowerCase()) ||
    location.address.toLowerCase().includes(locationFilter.toLowerCase())
  );

  const openInMaps = (location: Location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'locations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Locais ({locations.length})
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'games'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Jogos ({activeGames.length})
          </button>
          <button
            onClick={() => setActiveTab('availabilities')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'availabilities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Disponibilidades ({activeAvailabilities.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Usuários ({getUsers().length})
          </button>
        </nav>
      </div>

      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar locais..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowLocationForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Local
            </button>
          </div>

          <div className="grid gap-4">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{location.name}</h3>
                      {location.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativo
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => openInMaps(location)}
                      className="flex items-center text-sm text-gray-600 hover:text-blue-600"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      {location.address}
                    </button>
                    {location.phone && (
                      <p className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-1" />
                        {location.phone}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Coordenadas: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => setEditingLocation(location)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar local"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({
                        type: 'location',
                        id: location.id,
                        name: location.name
                      })}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir local"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredLocations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {locationFilter ? 'Nenhum local encontrado' : 'Nenhum local cadastrado'}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'games' && (
        <div className="space-y-4">
          {activeGames.map((game) => (
            <div
              key={game.id}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium text-gray-900">
                  {game.sport === 'padel' ? 'Padel' : 'Beach Tennis'}
                </h3>
                <p className="text-sm text-gray-600">
                  Criado por: {game.createdBy.name}
                </p>
                <p className="text-sm text-gray-600">
                  Data: {new Date(game.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Status: {game.status}
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm({
                  type: 'game',
                  id: game.id,
                  name: `Jogo de ${game.sport}`
                })}
                className="p-2 text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {activeGames.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum jogo ativo encontrado
            </div>
          )}
        </div>
      )}

      {activeTab === 'availabilities' && (
        <div className="space-y-4">
          {activeAvailabilities.map((availability) => (
            <div
              key={availability.id}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium text-gray-900">
                  {availability.player.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Esportes: {availability.sports.join(', ')}
                </p>
                <p className="text-sm text-gray-600">
                  Status: {availability.status}
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm({
                  type: 'availability',
                  id: availability.id,
                  name: `Disponibilidade de ${availability.player.name}`
                })}
                className="p-2 text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {activeAvailabilities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma disponibilidade ativa encontrada
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <UsersList
          users={getUsers()}
          onBlockUser={onBlockUser}
          onUnblockUser={onUnblockUser}
        />
      )}

      {(showLocationForm || editingLocation) && (
        <LocationForm
          isOpen={true}
          onClose={() => {
            setShowLocationForm(false);
            setEditingLocation(null);
          }}
          onSubmit={(data) => {
            if (editingLocation) {
              onEditLocation(editingLocation.id, data);
            } else {
              onAddLocation(data);
            }
            setShowLocationForm(false);
            setEditingLocation(null);
          }}
          initialData={editingLocation}
        />
      )}

      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          title={`Excluir ${showDeleteConfirm.type === 'location' ? 'Local' : 
            showDeleteConfirm.type === 'game' ? 'Jogo' : 'Disponibilidade'}`}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Tem certeza que deseja excluir {showDeleteConfirm.name}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
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