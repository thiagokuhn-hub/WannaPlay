import React, { useState } from 'react';
import { Plus, Info } from 'lucide-react';
// Try one of these imports:
import { IoGameController } from 'react-icons/io5';  // Option 1: Game controller icon
import { MdSportsTennis } from 'react-icons/md';    // Option 2: Tennis/Sports icon
import { FaTableTennis } from 'react-icons/fa';     // Option 3: Table tennis icon
import { BiSolidGame } from 'react-icons/bi';       // Option 4: Game icon
import { Player } from '../types';
import Tutorial from './Tutorial';

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
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <>
      <div className="flex gap-4 items-center">
        <div className="flex gap-4">
          <button
            onClick={onAddAvailability}
            className="availability-button flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {/* Choose one of these options: */}
            <MdSportsTennis className="w-5 h-5" />  {/* Option 2: More modern sports icon */}
            {/* <FaTableTennis className="w-5 h-5" /> */}  {/* Option 3: Similar to padel */}
            {/* <IoGameController className="w-5 h-5" /> */}  {/* Option 1: Gaming style */}
            {/* <BiSolidGame className="w-5 h-5" /> */}  {/* Option 4: Simple game icon */}
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

        <button
          onClick={() => setShowTutorial(true)}
          className="text-gray-500 hover:text-gray-700"
          title="Ver tutorial"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
      
      {showTutorial && (
        <Tutorial 
          initialDelay={0} 
          force={true} 
          onClose={() => setShowTutorial(false)} 
        />
      )}
    </>
  );
}