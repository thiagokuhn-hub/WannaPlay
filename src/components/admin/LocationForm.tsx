import React, { useState, useEffect, useRef } from 'react';
import { Location } from '../../types';
import Modal from '../modals/Modal';
import { MapPin } from 'lucide-react';

import { supabase } from '../../lib/supabase';

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Location | null;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function LocationForm({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: LocationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: -23.550520, // São Paulo como default
    longitude: -46.633308,
    active: true
  });
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        address: initialData.address,
        phone: initialData.phone || '',
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        active: initialData.active
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: formData.latitude, lng: formData.longitude },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      const newMarker = new window.google.maps.Marker({
        position: { lat: formData.latitude, lng: formData.longitude },
        map: newMap,
        draggable: true
      });

      // Atualizar coordenadas quando o marcador é arrastado
      newMarker.addListener('dragend', () => {
        const position = newMarker.getPosition();
        if (position) {
          const lat = position.lat();
          const lng = position.lng();
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
          updateAddressFromCoordinates(lat, lng);
        }
      });

      // Permitir clique no mapa para mover o marcador
      newMap.addListener('click', (e: google.maps.MouseEvent) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        newMarker.setPosition({ lat, lng });
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        updateAddressFromCoordinates(lat, lng);
      });

      setMap(newMap);
      setMarker(newMarker);
    }
  }, [mapRef.current]);

  const updateAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError('');

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode(
          { location: { lat, lng } },
          (results: google.maps.GeocoderResult[], status: string) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error('Falha ao obter endereço'));
            }
          }
        );
      });

      setFormData(prev => ({
        ...prev,
        address: (result as google.maps.GeocoderResult).formatted_address
      }));
    } catch (err) {
      setError('Erro ao obter endereço. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const searchAddress = async () => {
    if (!formData.address) return;

    setIsLoading(true);
    setError('');

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode(
          { address: formData.address },
          (results: google.maps.GeocoderResult[], status: string) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error('Endereço não encontrado'));
            }
          }
        );
      });

      const location = (result as google.maps.GeocoderResult).geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        address: (result as google.maps.GeocoderResult).formatted_address
      }));

      if (map && marker) {
        map.setCenter({ lat, lng });
        marker.setPosition({ lat, lng });
      }
    } catch (err) {
      setError('Endereço não encontrado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const locationData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        latitude: formData.latitude,
        longitude: formData.longitude,
        active: formData.active
      };

      if (initialData) {
        // Update existing location
        const { error } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Insert new location
        const { error } = await supabase
          .from('locations')
          .insert([locationData]);

        if (error) throw error;
      }

      onSubmit(locationData);
      onClose();
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Erro ao salvar localização. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Editar Local" : "Adicionar Local"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Endereço
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Digite o endereço ou selecione no mapa"
            />
            <button
              type="button"
              onClick={searchAddress}
              disabled={isLoading || !formData.address}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        <div className="text-sm text-gray-600">
          Coordenadas: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
            Ativo
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {initialData ? 'Salvar Alterações' : 'Adicionar Local'}
          </button>
        </div>
      </form>
    </Modal>
  );
}