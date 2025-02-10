import React, { useState } from 'react';
import { Plus, Info } from 'lucide-react';
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
  const [showProposeInfo, setShowProposeInfo] = useState(false);
  const [showAvailabilityInfo, setShowAvailabilityInfo] = useState(false);

  const InfoModal = ({ isOpen, onClose, title, description }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string;
    description: string;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <button
            onClick={onAddAvailability}
            className="group w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full opacity-25 group-hover:scale-150 transition-transform duration-500"></div>
              <Plus className="w-5 h-5 relative z-10" />
            </div>
            <span className="font-medium">Quero Jogar</span>
            <Info
              className="w-4 h-4 ml-1 cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setShowAvailabilityInfo(true);
              }}
            />
          </button>
        </div>

        <div className="relative flex-1">
          <button
            onClick={onProposeGame}
            className="group w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full opacity-25 group-hover:scale-150 transition-transform duration-500"></div>
              <GiTennisBall className="w-5 h-5 relative z-10" />
            </div>
            <span className="font-medium">Propor Jogo</span>
            <Info
              className="w-4 h-4 ml-1 cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setShowProposeInfo(true);
              }}
            />
          </button>
        </div>
      </div>

      <InfoModal
        isOpen={showProposeInfo}
        onClose={() => setShowProposeInfo(false)}
        title="Propor Jogo"
        description="Se você já tem um horário em algum local, proponha o jogo neste horário e deixe que outros jogadores se inscrevam para participar."
      />

      <InfoModal
        isOpen={showAvailabilityInfo}
        onClose={() => setShowAvailabilityInfo(false)}
        title="Quero Jogar"
        description="Aqui você diz em que dias e horários você pode jogar nessa semana. Outros jogadores podem ver e entrar em contato contigo."
      />
    </>
  );
}