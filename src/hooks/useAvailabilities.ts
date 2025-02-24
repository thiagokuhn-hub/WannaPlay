import { useState, useEffect } from 'react';
import { Availability, Player } from '../types';
import { supabase } from '../lib/supabase';

export function useAvailabilities() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  const fetchAvailabilities = async () => {
    try {
      const { data: availData, error: availError } = await supabase
        .from('availabilities')
        .select(`
          *,
          player:profiles(*),
          time_slots:availability_time_slots(*)
        `);
  
      if (availError) throw availError;
  
      const formattedAvailabilities = availData.map(avail => ({
        ...avail,
        player: avail.player,
        timeSlots: avail.time_slots?.map(slot => ({
          day: slot.day,
          startTime: slot.start_time,
          endTime: slot.end_time
        })) || [],
        createdAt: avail.created_at,
        expiresAt: avail.expires_at
      }));
  
      setAvailabilities(formattedAvailabilities);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
    }
  };

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const handleAddAvailability = async (data: Partial<Availability>) => {
    if (!data.player) return;
    
    const days = data.duration === '7days' ? 7 : 14;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
  
    try {
      // 1. Criar a disponibilidade
      const { data: createdAvailability, error: availError } = await supabase
        .from('availabilities')
        .insert({
          player_id: data.player.id,
          sports: data.sports,
          locations: data.locations,
          notes: data.notes,
          duration: data.duration,
          expires_at: expiresAt.toISOString(),
          status: 'active',
          is_public: data.is_public // Garantir que is_public está sendo salvo
        })
        .select()
        .single();
  
      if (availError) throw availError;
  
      // 2. Se não for pública e tiver grupos, criar as relações
      if (data.is_public === false && data.groups && data.groups.length > 0) {
        const availabilityGroups = data.groups.map(groupId => ({
          availability_id: createdAvailability.id,
          group_id: groupId
        }));
  
        const { error: groupsError } = await supabase
          .from('availability_groups')
          .insert(availabilityGroups);
  
        if (groupsError) throw groupsError;
      }
  
      // 2. Criar os time slots
      const timeSlotData = data.timeSlots!.map(slot => ({
        availability_id: createdAvailability.id,
        day: slot.day,
        start_time: slot.startTime,
        end_time: slot.endTime
      }));
  
      const { error: slotsError } = await supabase
        .from('availability_time_slots')
        .insert(timeSlotData);
  
      if (slotsError) throw slotsError;
  
      // 3. Buscar a disponibilidade completa com todas as relações
      const { data: completeAvailability, error: fetchError } = await supabase
        .from('availabilities')
        .select(`
          *,
          player:profiles(*),
          time_slots:availability_time_slots(*)
        `)
        .eq('id', createdAvailability.id)
        .single();
  
      if (fetchError) throw fetchError;
  
      // 4. Formatar a disponibilidade para o estado
      const formattedAvailability: Availability = {
        ...completeAvailability,
        player: completeAvailability.player,
        timeSlots: completeAvailability.time_slots?.map(slot => ({
          day: slot.day,
          startTime: slot.start_time,
          endTime: slot.end_time
        })) || [],
        createdAt: completeAvailability.created_at,
        expiresAt: completeAvailability.expires_at
      };
  
      // 5. Atualizar o estado com a nova disponibilidade
      setAvailabilities(prev => [formattedAvailability, ...prev]);
      
      return formattedAvailability;
    } catch (error) {
      console.error('Error creating availability:', error);
      throw error;
    }
  };

  const handleEditAvailability = async (availabilityId: string, data: Partial<Availability>) => {
    try {
      // Update main availability data
      const { error: availError } = await supabase
        .from('availabilities')
        .update({
          sports: data.sports,
          locations: data.locations,
          expires_at: data.expiresAt,
          status: data.status || 'active'
        })
        .eq('id', availabilityId);

      if (availError) throw availError;

      // Delete existing time slots
      const { error: deleteError } = await supabase
        .from('availability_time_slots')
        .delete()
        .eq('availability_id', availabilityId);

      if (deleteError) throw deleteError;

      // Insert new time slots
      if (data.timeSlots) {
        const timeSlotData = data.timeSlots.map(slot => ({
          availability_id: availabilityId,
          day: slot.day,
          start_time: slot.startTime,
          end_time: slot.endTime
        }));

        const { error: insertError } = await supabase
          .from('availability_time_slots')
          .insert(timeSlotData);

        if (insertError) throw insertError;
      }

      // Update local state
      setAvailabilities(prev =>
        prev.map(avail =>
          avail.id === availabilityId
            ? { ...avail, ...data }
            : avail
        )
      );
    } catch (error) {
      console.error('Error editing availability:', error);
      throw error;
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    try {
      const { error } = await supabase
        .from('availabilities')
        .update({ status: 'deleted' })
        .eq('id', availabilityId);

      if (error) throw error;

      setAvailabilities(prev =>
        prev.map(avail =>
          avail.id === availabilityId
            ? { ...avail, status: 'deleted' }
            : avail
        )
      );
    } catch (error) {
      console.error('Error deleting availability:', error);
      throw error;
    }
  };

  const handleRepublishAvailability = async (availability: Availability, data: { duration: string }) => {
    try {
      console.log('Starting republish with:', { availability, data });
      
      const days = data.duration === '7days' ? 7 : 14;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
  
      // Update the availability
      const { error: availError } = await supabase
        .from('availabilities')
        .update({
          expires_at: expiresAt.toISOString(),
          status: 'active',
          duration: data.duration
        })
        .eq('id', availability.id);
  
      if (availError) {
        console.error('Error updating availability:', availError);
        throw availError;
      }
  
      // Create the updated availability object
      const updatedAvailability = {
        ...availability,
        status: 'active',
        duration: data.duration,
        expiresAt: expiresAt.toISOString()
      };
  
      // Update local state immediately
      setAvailabilities(prev => 
        prev.map(avail =>
          avail.id === availability.id ? updatedAvailability : avail
        )
      );
  
      // Fetch fresh data from the server
      await fetchAvailabilities();
  
      return updatedAvailability;
    } catch (error) {
      console.error('Error republishing availability:', error);
      throw error;
    }
  };

  return {
    availabilities,
    setAvailabilities,
    handleAddAvailability,
    handleEditAvailability,
    handleDeleteAvailability,
    handleRepublishAvailability // Make sure this is included
  };
}