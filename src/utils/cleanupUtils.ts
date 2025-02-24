import { supabase } from '../lib/supabase';

export const cleanupExpiredItems = async () => {
  const now = new Date().toISOString();

  try {
    // Update expired availabilities
    const { error: availabilityError } = await supabase
      .from('availabilities')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', now);

    if (availabilityError) throw availabilityError;

    // Update expired games
    const { error: gameError } = await supabase
      .from('games')
      .update({ status: 'expired' })
      .eq('status', 'open')
      .lt('date', now);

    if (gameError) throw gameError;

  } catch (error) {
    console.error('Error cleaning up expired items:', error);
  }
};