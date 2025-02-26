import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Player } from '../../types';
import { resizeImage } from '../../utils/imageUtils';

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  created_by: string;
  created_at: string;
  members?: any[];
  status?: string;
  is_public?: boolean;
  city?: string;    // Make sure this is defined
  state?: string;   // Make sure this is defined
}

export const useGroupManagement = (currentUser: Player) => {
  const [groupMembers, setGroupMembers] = useState<Player[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [groupRequestStatus, setGroupRequestStatus] = useState<{ [key: string]: boolean }>({});

  const fetchGroups = async () => {
    try {
      // Get groups and members
      const { data: groups, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner (
            user_id,
            role
          ),
          members:group_members(user_id, role),
          pending_count:group_members(count)
        `)
        .eq('group_members.user_id', currentUser.id);
      
      if (error) throw error;
      
      // For each group where user is admin, get pending count
      const groupsWithPending = await Promise.all((groups || []).map(async group => {
        const isAdmin = group.members.find(m => 
          m.user_id === currentUser.id && 
          (m.role === 'admin' || group.created_by === currentUser.id)
        );
      
        let pendingCount = 0;
        if (isAdmin) {
          const { count, error: countError } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('role', 'pending');
            
          if (!countError) {
            pendingCount = count || 0;
          }
        }
      
        return {
          id: group.id,
          name: group.name,
          avatar: group.avatar,
          created_by: group.created_by,
          created_at: group.created_at,
          members: group.members || [],
          status: group.members.find(m => m.user_id === currentUser.id)?.role || 'member',
          pendingCount,
          city: group.city,        // Add this
          state: group.state,      // Add this
          is_public: group.is_public
        };
      }));
      
      return groupsWithPending;
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  };

  const handleFileChange = async (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      throw new Error('A imagem deve ter no máximo 3MB');
    }

    try {
      return await resizeImage(file);
    } catch (err) {
      throw new Error('Erro ao processar a imagem');
    }
  };

  const searchPlayers = async (term: string) => {
    if (term.length < 3) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', `%${term}%`)
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching players:', error);
      return [];
    }
  };

  const createGroup = async (groupData: {
    name: string;
    avatar?: string;
    isPublic: boolean;
    members: Player[];
    city: string;     // Add this
    state: string;    // Add this
  }) => {
    if (!groupData.name.trim()) {
      throw new Error('Por favor, insira um nome para o grupo');
    }
  
    if (!groupData.city.trim() || !groupData.state.trim()) {
      throw new Error('Por favor, insira a cidade e estado do grupo');
    }
  
    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: groupData.name,
          avatar: groupData.avatar,
          created_by: currentUser.id,
          is_public: groupData.isPublic,
          city: groupData.city,        // Add this
          state: groupData.state       // Add this
        }])
        .select()
        .single();
  
      if (groupError) throw groupError;
  
      const memberInserts = [
        ...groupData.members.map(member => ({
          group_id: group.id,
          user_id: member.id,
          role: 'member'
        })),
        {
          group_id: group.id,
          user_id: currentUser.id,
          role: 'admin'
        }
      ];
  
      const { error: membersError } = await supabase
        .from('group_members')
        .insert(memberInserts);
  
      if (membersError) throw membersError;
  
      return group;
    } catch (error) {
      throw error;
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', groupId);
  
      if (memberError) throw memberError;
  
      if (memberData && memberData.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar, phone')
          .in('id', memberData.map(member => member.user_id));
  
        if (profilesError) throw profilesError;
        
        const membersWithRoles = profilesData?.map(profile => ({
          ...profile,
          role: memberData.find(m => m.user_id === profile.id)?.role
        })) || [];
        
        setGroupMembers(membersWithRoles);
        return membersWithRoles;
      }
      
      setGroupMembers([]);
      return [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  };

  const editGroup = async (groupId: string, updateData: {
    name: string;
    avatar?: string;
    isPublic: boolean;
    newMembers: Player[];
    city: string;
    state: string;
  }) => {
    try {
      if (!updateData.name.trim()) {
        throw new Error('O nome do grupo não pode ficar vazio');
      }
  
      const { data, error: updateError } = await supabase
        .from('groups')
        .update({
          name: updateData.name.trim(),
          avatar: updateData.avatar,
          is_public: updateData.isPublic,
          city: updateData.city,
          state: updateData.state
        })
        .eq('id', groupId)
        .select();
  
      if (updateError) throw updateError;
  
      if (updateData.newMembers.length > 0) {
        const memberInserts = updateData.newMembers.map(member => ({
          group_id: groupId,
          user_id: member.id,
          role: 'member'
        }));
  
        const { error: insertError } = await supabase
          .from('group_members')
          .insert(memberInserts);
  
        if (insertError) throw insertError;
      }
  
      return data;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };

  const removeMember = async (groupId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberId);

      if (error) throw error;
      await fetchGroupMembers(groupId);
    } catch (error) {
      throw error;
    }
  };

  const assignAdmin = async (groupId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', groupId)
        .eq('user_id', memberId);

      if (error) throw error;
      await fetchGroupMembers(groupId);
    } catch (error) {
      throw error;
    }
  };

  const fetchPendingRequests = async (groupId: string) => {
    try {
      // First, get pending members
      const { data: pendingMembers, error: pendingError } = await supabase
        .from('group_members')
        .select('id, user_id, role')
        .eq('group_id', groupId)
        .eq('role', 'pending');
    
      if (pendingError) throw pendingError;
    
      if (pendingMembers && pendingMembers.length > 0) {
        // Then, get their profile information
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar, phone')
          .in('id', pendingMembers.map(member => member.user_id));
    
        if (profilesError) throw profilesError;
    
        // Combine the data
        const pendingRequestsWithProfiles = pendingMembers.map(member => ({
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          profiles: profilesData?.find(profile => profile.id === member.user_id)
        }));
    
        setPendingRequests(pendingRequestsWithProfiles);
        return pendingRequestsWithProfiles;
      }
    
      setPendingRequests([]);
      return [];
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  };

  const handleJoinGroup = async (group: Group) => {
    try {
      if (group.is_public) {
        const { error } = await supabase
          .from('group_members')
          .insert({
            user_id: currentUser.id,
            group_id: group.id,
            role: 'member'
          });
  
        if (error) throw error;
        return true;
      } else {
        // Check for any existing request
        const { data: existingRequests, error: checkError } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', group.id)
          .eq('user_id', currentUser.id);
  
        if (checkError) throw checkError;
        
        if (existingRequests && existingRequests.length > 0) {
          const status = existingRequests[0].role;
          if (status === 'pending') {
            throw new Error('Você já tem uma solicitação pendente para este grupo.');
          } else if (status === 'member' || status === 'admin') {
            throw new Error('Você já é membro deste grupo.');
          } else if (status === 'rejected') {
            throw new Error('Sua solicitação anterior foi recusada.');
          }
        }
  
        // Create new pending request
        const { error } = await supabase
          .from('group_members')
          .insert({
            user_id: currentUser.id,
            group_id: group.id,
            role: 'pending'
          });
  
        if (error) throw error;
  
        // Update UI state immediately
        setGroupRequestStatus(prev => ({ ...prev, [group.id]: true }));
        alert('Uma solicitação de aprovação foi enviada para o administrador do grupo.');
        return true;
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Erro ao processar a solicitação.');
      }
      return false;
    }
  };

  const handleRequestResponse = async (requestId: string, status: 'approved' | 'rejected', userId: string, groupId: string) => {
    try {
      // Simply update the role based on the status
      const { error: updateError } = await supabase
        .from('group_members')
        .update({ role: status === 'approved' ? 'member' : 'rejected' })
        .eq('id', requestId);
  
      if (updateError) throw updateError;
  
      // Refresh the lists
      await Promise.all([
        fetchPendingRequests(groupId),
        fetchGroupMembers(groupId)
      ]);
    } catch (error) {
      console.error('Error handling request response:', error);
      throw error;
    }
  };

  const searchGroups = async (term: string) => {
    if (term.length < 3) return [];
    
    try {
      // Split the search term into words
      const searchWords = term.toLowerCase().split(' ').filter(word => word.length >= 3);
      
      if (searchWords.length === 0) return [];
  
      const { data, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          avatar,
          is_public,
          created_by,
          created_at,
          city,
          state,
          group_members (
            user_id,
            role
          )
        `)
        .or(searchWords.map(word => `name.ilike.%${word}%`).join(','))
        .limit(5);
  
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching groups:', error);
      return [];
    }
  };

  return {
    groupMembers,
    pendingRequests,
    groupRequestStatus,
    fetchGroups,
    handleFileChange,
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
  };
};