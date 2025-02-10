import React, { useState } from 'react';
import { GameProposal, Availability } from '../types';
import Modal from './modals/Modal';
import { toLocalISOString, normalizeDate } from '../utils/dateUtils';

interface RepublishModalProps {
  item: GameProposal | Availability;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function RepublishModal({ item, onClose, onSubmit }: RepublishModalProps) {
  const isGame = 'sport' in item;
  const [formData, setFormData] = useState(
    isGame
      ? {
          date: (item as GameProposal).date,
          startTime: (item as GameProposal).startTime,
          endTime: (item as GameProposal).endTime,
        }
      : {
          duration: (item as Availability).duration,
        }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGame) {
      onSubmit({
        ...formData,
        date: normalizeDate(formData.date)
      });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Republicar ${isGame ? 'Jogo' : 'Disponibilidade'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {isGame ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova Data
              </label>
              <input
                type="date"
                required
                min={toLocalISOString(new Date())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário de Início
                </label>
                <input
                  type="time"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário de Término
                </label>
                <input
                  type="time"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duração da Disponibilidade
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="duration"
                  value="7days"
                  checked={formData.duration === '7days'}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">7 dias</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="duration"
                  value="14days"
                  checked={formData.duration === '14days'}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">14 dias</span>
              </label>
            </div>
          </div>
        )}

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
            Republicar
          </button>
        </div>
      </form>
    </Modal>
  );
}