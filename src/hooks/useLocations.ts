import { useState, useEffect } from 'react';
import { Location } from '../types';
import { supabase } from '../lib/supabase';

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*');

        if (error) throw error;
        if (data) setLocations(data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  return {
    locations,
    setLocations
  };
}