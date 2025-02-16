import React, { useState } from 'react';
import { Plus, Info, Calendar } from 'lucide-react';
import { GiTennisBall } from 'react-icons/gi';
import { Player } from '../types';

interface ActionButtonsProps {
  currentUser: Player | null;
  onProposeGame: () => void;
  onAddAvailability: () => void;
}

export default function ActionButtons({
  currentUser,
  onProposeGame,
  onAddAvailability
}: ActionButtonsProps) {
  return (
    <div className="flex gap-4">
      <button
        onClick={onAddAvailability}
        className="availability-button flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        <Calendar className="w-5 h-5" />
        Quero Jogar
      </button>

      <button
        onClick={onProposeGame}
        className="propose-game-button flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
      >
        <Plus className="w-5 h-5" />
        Propor Jogo
      </button>
    </div>
  );
}