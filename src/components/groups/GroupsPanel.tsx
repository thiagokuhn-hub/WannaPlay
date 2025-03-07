import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Search, X, Check } from 'lucide-react';
import { GiTennisBall } from 'react-icons/gi';
import { Player } from '../../types';
import { useGroupManagement, Group } from './useGroupManagement';

interface GroupsPanelProps {
  currentUser: Player;
}

export default function GroupsPanel({ currentUser }: GroupsPanelProps) {
  const {
    groupMembers,
    pendingRequests,
    groupRequestStatus,
    fetchGroups,
    handleFileChange: handleFileChangeHook,
    searchPlayers,
    createGroup,
    fetchGroupMembers,
    editGroup,
    removeMember,
    assignAdmin,
    fetchPendingRequests,
    handleJoinGroup,
    handleRequestResponse,
    searchGroups
  } = useGroupManagement(currentUser);

  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Player[]>([]);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState<any[]>([]);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    avatar: undefined as string | undefined,
    isPublic: false,
    city: '',    // Add this
    state: ''    // Add this
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGroups();
  }, [currentUser.id]);

  const loadGroups = async () => {
    const fetchedGroups = await fetchGroups();
    setGroups(fetchedGroups);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resizedImage = await handleFileChangeHook(file);
      setNewGroupData({ ...newGroupData, avatar: resizedImage });
      
      // If we're editing, update the group immediately
      if (editingGroup) {
        await editGroup(editingGroup.id, {
          ...newGroupData,
          avatar: resizedImage,
          isPublic: newGroupData.isPublic,
          newMembers: selectedMembers
        });
        // Refresh the groups list to show the new avatar
        loadGroups();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao processar a imagem');
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    const results = await searchPlayers(term);
    setSearchResults(results);
  };

  const handleCreateGroupSubmit = async () => {
    try {
      await createGroup({
        name: newGroupData.name,
        avatar: newGroupData.avatar,
        isPublic: newGroupData.isPublic,
        members: selectedMembers,
        city: newGroupData.city,    // Add this
        state: newGroupData.state   // Add this
      });

      setNewGroupData({ 
        name: '', 
        avatar: undefined, 
        isPublic: false,
        city: '',    // Add this
        state: ''    // Add this
      });
      setSelectedMembers([]);
      setShowCreateGroup(false);
      loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Erro ao criar grupo. Tente novamente.');
    }
  };

  const handleEditGroupSubmit = async () => {
    if (!editingGroup) return;

    try {
      await editGroup(editingGroup.id, {
        name: newGroupData.name,
        avatar: newGroupData.avatar,
        isPublic: newGroupData.isPublic,
        newMembers: selectedMembers,
        city: newGroupData.city,
        state: newGroupData.state
      });

      // Close modal and reset state
      setEditingGroup(null);
      setSelectedMembers([]);
      // Refresh the groups list to show the updated name
      await loadGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar grupo. Tente novamente.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!editingGroup) return;
    
    try {
      if (window.confirm('Tem certeza que deseja remover este membro?')) {
        await removeMember(editingGroup.id, memberId);
        // Refresh the group members list
        await fetchGroupMembers(editingGroup.id);
        // Refresh the groups list to update member counts
        loadGroups();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Erro ao remover membro. Tente novamente.');
    }
  };

  const handleAssignAdmin = async (memberId: string) => {
    if (!editingGroup) return;
    
    try {
      if (window.confirm('Tem certeza que deseja tornar este membro um administrador?')) {
        await assignAdmin(editingGroup.id, memberId);
        // Refresh the group members list to show the new admin status
        await fetchGroupMembers(editingGroup.id);
        // Refresh the groups list
        loadGroups();
      }
    } catch (error) {
      console.error('Error assigning admin:', error);
      alert('Erro ao tornar membro administrador. Tente novamente.');
    }
  };
  const handleEditGroupClick = async (group: Group) => {
    setEditingGroup(group);
    setNewGroupData({ 
      name: group.name, 
      avatar: group.avatar,
      isPublic: group.is_public || false,
      city: group.city || '',    // Make sure city is being loaded from the group data
      state: group.state || ''    // Make sure state is being loaded from the group data
    });
    
    await fetchGroupMembers(group.id);
    await fetchPendingRequests(group.id);
  };

  const handleGroupSearch = async (term: string) => {
    setGroupSearchTerm(term);
    const results = await searchGroups(term);
    setGroupSearchResults(results);
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Group button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Meus Grupos</h2>
        <button
          onClick={() => {
            // Reset form data before showing the modal
            setNewGroupData({
              name: '',
              avatar: undefined,
              isPublic: false,
              city: '',
              state: ''
            });
            setSelectedMembers([]);
            setShowCreateGroup(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Criar Grupo
        </button>
      </div>

      {/* Search Groups */}
      <div className="relative">
        <input
          type="text"
          value={groupSearchTerm}
          onChange={(e) => handleGroupSearch(e.target.value)}
          placeholder="Pesquisar grupos..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>

      {/* Search Results */}
      {groupSearchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Resultados da Pesquisa</h3>
          <div className="space-y-2">
            {groupSearchResults.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={group.avatar || '/default-group.png'}
                    alt={group.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span>{group.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        group.is_public 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.is_public ? 'Público' : 'Privado'}
                      </span>
                    </div>
                    {group.city && group.state && (
                      <span className="text-sm text-gray-500">
                        {group.city}, {group.state}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    try {
                      // Add loading state
                      const button = e.currentTarget;
                      button.disabled = true;
                      
                      await handleJoinGroup(group);
                      
                      // Reset button state if needed
                      if (!groupRequestStatus[group.id]) {
                        button.disabled = false;
                      }
                    } catch (error) {
                      e.currentTarget.disabled = false;
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    groupRequestStatus[group.id]
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                  disabled={groupRequestStatus[group.id]}
                >
                  {group.is_public 
                    ? 'Entrar' 
                    : groupRequestStatus[group.id] 
                      ? 'Aguardando aprovação' 
                      : 'Solicitar'
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {groupSearchTerm.length >= 3 && groupSearchResults.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          Nenhum grupo encontrado
        </p>
      )}

      {/* Groups List */}
      <div className="grid gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            onClick={() => handleEditGroupClick(group)}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4">
              {group.avatar ? (
                <img
                  src={group.avatar}
                  alt={group.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    group.is_public 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {group.is_public ? 'Público' : 'Privado'}
                  </span>
                  {group.city && group.state && (
                    <span className="text-sm text-gray-500">
                      {group.city}, {group.state}
                    </span>
                  )}
                  {group.pendingCount > 0 && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {group.pendingCount} pendente{group.pendingCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {group.status === 'pending' ? (
                  <p className="text-sm text-yellow-600">Aguardando aprovação</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {group.members?.length || 0} membros
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Criar Grupo</h3>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Group Details Form */}
            <div className="space-y-4">
              {/* Group Image Upload */}
              <div className="flex items-center gap-4">
                {newGroupData.avatar ? (
                  <img
                    src={newGroupData.avatar}
                    alt="Group avatar"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg"
                  >
                    Alterar foto
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={newGroupData.name}
                onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                placeholder="Nome do grupo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />

              {/* Add Location Fields */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newGroupData.city}
                  onChange={(e) => setNewGroupData({ ...newGroupData, city: e.target.value })}
                  placeholder="Cidade"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={newGroupData.state}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (value.length <= 2 && /^[A-Z]*$/.test(value)) {
                      setNewGroupData({ ...newGroupData, state: value });
                    }
                  }}
                  placeholder="UF"
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase"
                />
              </div>

              {/* Rest of the form content */}
              {/* Add Player Search Section */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Pesquisar jogadores..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                
                {/* Search Results */}
                {searchTerm.length >= 3 && searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {searchResults.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <GiTennisBall className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span>{player.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (!selectedMembers.find(m => m.id === player.id)) {
                              setSelectedMembers([...selectedMembers, player]);
                            }
                            setSearchTerm('');
                            setSearchResults([]);
                          }}
                          className="px-2 py-1 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Members */}
                {selectedMembers.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <h4 className="text-sm font-medium text-gray-700">Membros Selecionados</h4>
                    <div className="space-y-1">
                      {selectedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <span>{member.name}</span>
                          <button
                            onClick={() => setSelectedMembers(selectedMembers.filter(m => m.id !== member.id))}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newGroupData.isPublic}
                  onChange={(e) => setNewGroupData({ ...newGroupData, isPublic: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Grupo público
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroupSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!newGroupData.name.trim()}
              >
                Criar Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Editar Grupo</h3>
              <button
                onClick={() => {
                  setEditingGroup(null);
                  setSelectedMembers([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Group Details Form */}
            <div className="space-y-4">
              {/* Group Image Upload */}
              <div className="flex items-center gap-4">
                {newGroupData.avatar ? (
                  <img
                    src={newGroupData.avatar}
                    alt="Group avatar"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {(editingGroup.created_by === currentUser.id || 
                  groupMembers.find(m => m.id === currentUser.id)?.role === 'admin') && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg"
                    >
                      Alterar foto
                    </button>
                  </div>
                )}
              </div>

              <input
                type="text"
                value={newGroupData.name}
                onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                placeholder="Nome do grupo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />

              {/* Add Location Fields */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newGroupData.city}
                  onChange={(e) => setNewGroupData({ ...newGroupData, city: e.target.value })}
                  placeholder="Cidade"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={newGroupData.state}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (value.length <= 2 && /^[A-Z]*$/.test(value)) {
                      setNewGroupData({ ...newGroupData, state: value });
                    }
                  }}
                  placeholder="UF"
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase"
                />
              </div>

              {/* Rest of the form content */}
              {/* Add Player Search Section */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Pesquisar jogadores..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                
                {/* Search Results */}
                {searchTerm.length >= 3 && searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {searchResults.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <GiTennisBall className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span>{player.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (!selectedMembers.find(m => m.id === player.id)) {
                              setSelectedMembers([...selectedMembers, player]);
                            }
                            setSearchTerm('');
                            setSearchResults([]);
                          }}
                          className="px-2 py-1 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Members */}
                {selectedMembers.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <h4 className="text-sm font-medium text-gray-700">Membros Selecionados</h4>
                    <div className="space-y-1">
                      {selectedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <span>{member.name}</span>
                          <button
                            onClick={() => setSelectedMembers(selectedMembers.filter(m => m.id !== member.id))}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newGroupData.isPublic}
                  onChange={(e) => setNewGroupData({ ...newGroupData, isPublic: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Grupo público
                </label>
              </div>
            </div>

            {/* Pending Requests Section - Show only for admins */}
            {(editingGroup.created_by === currentUser.id || 
              groupMembers.find(m => m.id === currentUser.id)?.role === 'admin') && 
              pendingRequests.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Solicitações Pendentes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {request.profiles.avatar ? (
                          <img
                            src={request.profiles.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <GiTennisBall className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium">{request.profiles.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestResponse(request.id, 'approved', request.user_id, editingGroup.id)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Aprovar"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRequestResponse(request.id, 'rejected', request.user_id, editingGroup.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Recusar"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group Members Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Membros do Grupo</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                {groupMembers
                  .filter(member => member.role !== 'pending')
                  .sort((a, b) => {
                    // Sort by role (admin first) then by name
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (a.role !== 'admin' && b.role === 'admin') return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <GiTennisBall className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{member.name}</span>
                          <span className="text-sm text-gray-500">{member.phone}</span>
                        </div>
                        {member.role === 'admin' && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      {/* Show admin controls */}
                      {(editingGroup.created_by === currentUser.id || 
                        (currentUser.id === member.id && member.id !== editingGroup.created_by)) && (
                        <div className="flex gap-2">
                          {editingGroup.created_by === currentUser.id && member.id !== currentUser.id && (
                            <>
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Remover membro"
                              >
                                <X className="w-5 h-5" />
                              </button>
                              {member.role !== 'admin' && (
                                <button
                                  onClick={() => handleAssignAdmin(member.id)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Tornar administrador"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              )}
                            </>
                          )}
                          {currentUser.id === member.id && member.id !== editingGroup.created_by && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Sair do grupo"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingGroup(null);
                  setSelectedMembers([]);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Fechar
              </button>
              {(editingGroup.created_by === currentUser.id || 
                groupMembers.find(m => m.id === currentUser.id)?.role === 'admin') && (
                <button
                  onClick={handleEditGroupSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!newGroupData.name.trim()}
                >
                  Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}