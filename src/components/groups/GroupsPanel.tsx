import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Search, X } from 'lucide-react';
import { GiTennisBall } from 'react-icons/gi';
import { Player } from '../../types';
import { supabase } from '../../lib/supabase';
import { resizeImage } from '../../utils/imageUtils';

export default function GroupsPanel({ currentUser }: GroupsPanelProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Player[]>([]);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    avatar: undefined as string | undefined,
    isPublic: false, // Add isPublic state
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGroups();
    console.log('Current groups:', groups);
  }, [currentUser.id]);

  const fetchGroups = async () => {
    try {
      console.log('Fetching groups for user:', currentUser.id);
      
      // Get all groups where the user is a member (including groups they created)
      const { data: groups, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner (
            user_id,
            role
          ),
          members:group_members(user_id)
        `)
        .eq('group_members.user_id', currentUser.id);
      
      if (error) throw error;
      
      console.log('All groups before formatting:', groups);
      
      const formattedGroups = (groups || []).map(group => ({
        id: group.id,
        name: group.name,
        avatar: group.avatar,
        created_by: group.created_by,
        created_at: group.created_at,
        members: group.members || []
      }));
      
      console.log('Formatted groups:', formattedGroups);
      setGroups(formattedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 3MB');
      return;
    }

    try {
      const resizedImage = await resizeImage(file);
      setNewGroupData({ ...newGroupData, avatar: resizedImage });
    } catch (err) {
      alert('Erro ao processar a imagem. Tente novamente.');
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', `%${term}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching players:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name.trim()) {
      alert('Por favor, insira um nome para o grupo');
      return;
    }

    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: newGroupData.name,
          avatar: newGroupData.avatar,
          created_by: currentUser.id,
          is_public: newGroupData.isPublic // Include isPublic in the insert
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      const memberInserts = selectedMembers.map(member => ({
        group_id: group.id,
        user_id: member.id,
        role: 'member'
      }));

      memberInserts.push({
        group_id: group.id,
        user_id: currentUser.id,
        role: 'admin'
      });

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(memberInserts);

      if (membersError) throw membersError;

      setNewGroupData({ name: '', avatar: undefined, isPublic: false });
      setSelectedMembers([]);
      setShowCreateGroup(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Erro ao criar grupo. Tente novamente.');
    }
  };

  const handleEditGroup = async () => {
    if (!editingGroup) return;

    try {
      // Update group details
      const { error: updateError } = await supabase
        .from('groups')
        .update({
          name: newGroupData.name,
          avatar: newGroupData.avatar,
          is_public: newGroupData.isPublic // Include isPublic in the update
        })
        .eq('id', editingGroup.id);

      if (updateError) throw updateError;

      // Get current members to check for duplicates
      const { data: currentMembers, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', editingGroup.id);

      if (membersError) throw membersError;

      // Filter out members that are already in the group
      const existingMemberIds = currentMembers?.map(m => m.user_id) || [];
      const newMembers = selectedMembers.filter(member => !existingMemberIds.includes(member.id));

      // Add new members
      if (newMembers.length > 0) {
        const memberInserts = newMembers.map(member => ({
          group_id: editingGroup.id,
          user_id: member.id,
          role: 'member'
        }));
      
        const { error: insertError } = await supabase
          .from('group_members')
          .insert(memberInserts);
      
        if (insertError) throw insertError;
      }

      setEditingGroup(null);
      setSelectedMembers([]);
      fetchGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Erro ao atualizar grupo. Tente novamente.');
    }
  };

  const [groupMembers, setGroupMembers] = useState<Player[]>([]);

  // First, update the fetchGroupMembers function to include role information
  const fetchGroupMembers = async (groupId: string) => {
    try {
      // Get the group members with their roles
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', groupId);
  
      if (memberError) throw memberError;
  
      if (memberData && memberData.length > 0) {
        // Then, fetch the profile information for these members
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar, phone')
          .in('id', memberData.map(member => member.user_id));
  
        if (profilesError) throw profilesError;
        
        // Combine profile data with role information
        const membersWithRoles = profilesData?.map(profile => ({
          ...profile,
          role: memberData.find(m => m.user_id === profile.id)?.role
        })) || [];
        
        setGroupMembers(membersWithRoles);
      } else {
        setGroupMembers([]);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleEditGroupClick = async (group: Group) => {
    setEditingGroup(group);
    setNewGroupData({ 
      name: group.name, 
      avatar: group.avatar,
      isPublic: group.is_public // Add this line to set initial public/private state
    });
    const isAdmin = await fetchGroupMembers(group.id);
    
    // Hide the add members section if user is not an admin
    if (!isAdmin) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedMembers([]);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!editingGroup) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', editingGroup.id)
        .eq('user_id', memberId);

      if (error) throw error;

      // Refresh the members list
      fetchGroupMembers(editingGroup.id);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Erro ao remover membro. Tente novamente.');
    }
  };

  const handleAssignAdmin = async (memberId: string) => {
    if (!editingGroup) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', editingGroup.id)
        .eq('user_id', memberId);

      if (error) throw error;
  
      fetchGroupMembers(editingGroup.id);
    } catch (error) {
      console.error('Error assigning admin role:', error);
      alert('Erro ao atribuir função de administrador. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Meus Grupos</h2>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Criar Grupo
        </button>
      </div>

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
              <div>
                <h3 className="font-medium text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-500">
                  {group.members?.length || 0} membros
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateGroup && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 ${
                newGroupData.avatar ? 'bg-gray-100' : 'bg-gray-50'
              }`}>
                {newGroupData.avatar ? (
                  <img
                    src={newGroupData.avatar}
                    alt="Group Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera className="w-8 h-8" />
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                {newGroupData.avatar ? 'Alterar foto' : 'Adicionar foto'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Grupo
            </label>
            <input
              type="text"
              value={newGroupData.name}
              onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite o nome do grupo"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={newGroupData.isPublic}
              onChange={(e) => setNewGroupData({ ...newGroupData, isPublic: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-600">
              Grupo público
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adicionar Membros
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Buscar jogadores..."
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                {searchResults.map((player) => {
                  const isAlreadyMember = groupMembers.some(member => member.id === player.id);
                  const isAlreadySelected = selectedMembers.some(member => member.id === player.id);
                  
                  if (isAlreadyMember || isAlreadySelected) return null;
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => {
                        setSelectedMembers(prev => [...prev, player]);
                        setSearchResults([]);
                        setSearchTerm('');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <GiTennisBall className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <span>{player.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedMembers.length > 0 && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Membros Selecionados
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
                    >
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt=""
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                          <GiTennisBall className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm">{member.name}</span>
                      <button
                        onClick={() => setSelectedMembers(prev => prev.filter(m => m.id !== member.id))}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowCreateGroup(false);
                setNewGroupData({ name: '', avatar: undefined, isPublic: false });
                setSelectedMembers([]);
              }}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateGroup}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Criar
            </button>
          </div>
        </div>
      )}

      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {editingGroup.created_by === currentUser.id ? 'Editar Grupo' : 'Detalhes do Grupo'} 
              </h3>
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

            <div className="flex flex-col items-center">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 ${
                  newGroupData.avatar ? 'bg-gray-100' : 'bg-gray-50'
                }`}>
                  {newGroupData.avatar ? (
                    <img
                      src={newGroupData.avatar}
                      alt="Group Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                {editingGroup.created_by === currentUser.id && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      {newGroupData.avatar ? 'Alterar foto' : 'Adicionar foto'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Grupo
              </label>
              <input
                type="text"
                value={newGroupData.name}
                onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o nome do grupo"
                disabled={editingGroup.created_by !== currentUser.id}
              />
            </div>

            {editingGroup.created_by === currentUser.id && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={newGroupData.isPublic}
                  onChange={(e) => setNewGroupData({ ...newGroupData, isPublic: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editIsPublic" className="text-sm text-gray-600">
                  Grupo público
                </label>
              </div>
            )}

            {/* Conditionally render the "Adicionar Membros" section */}
            {(editingGroup.created_by === currentUser.id || groupMembers.find(m => m.id === currentUser.id)?.role === 'admin') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adicionar Membros
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Buscar jogadores..."
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                    {searchResults.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => {
                          setSelectedMembers(prev => [...prev, player]);
                          setSearchResults([]);
                          setSearchTerm('');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        {player.avatar && (
                          <img
                            src={player.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span>{player.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMembers.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Novos Membros
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
                        >
                          {member.avatar && (
                            <img
                              src={member.avatar}
                              alt=""
                              className="w-4 h-4 rounded-full"
                            />
                          )}
                          <span className="text-sm">{member.name}</span>
                          <button
                            onClick={() => setSelectedMembers(prev => prev.filter(m => m.id !== member.id))}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Membros do Grupo
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {groupMembers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <GiTennisBall className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium">{member.name}</span>
                        <span className="text-sm text-gray-500 ml-1">{member.phone}</span>
                        {member.role === 'admin' && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      {(editingGroup.created_by === currentUser.id || member.id === currentUser.id) && 
                       member.id !== editingGroup.created_by && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-500 hover:text-red-700"
                            title={member.id === currentUser.id ? "Sair do grupo" : "Remover membro"}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {editingGroup.created_by === currentUser.id && member.role !== 'admin' && (
                            <button
                              onClick={() => handleAssignAdmin(member.id)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Atribuir função de administrador"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingGroup(null);
                  setSelectedMembers([]);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditGroup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}