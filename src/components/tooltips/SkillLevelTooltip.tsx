import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface SkillLevelInfo {
  title: string;
  description: string;
}

const skillLevelInfo: Record<string, SkillLevelInfo> = {
  beginner: {
    title: 'INICIANTE',
    description: 'Para aqueles que estão começando no esporte. Foco em aprender regras básicas e desenvolver habilidades fundamentais.'
  },
  intermediate: {
    title: 'INTERMEDIÁRIO',
    description: 'Jogadores com experiência básica, conhecimento das regras e capaz de manter um jogo consistente.'
  },
  advanced: {
    title: 'AVANÇADO',
    description: 'Jogadores experientes com boa técnica e estratégia, habituados a competições.'
  },
  expert: {
    title: 'EXPERT',
    description: 'Nível elite, para jogadores profissionais ou amadores de alto nível com domínio técnico excepcional.'
  }
};

export default function SkillLevelTooltip() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Informações sobre níveis"
      >
        <Info className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 md:relative md:inset-auto md:bg-transparent">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full md:absolute md:w-80 md:-left-20 md:transform md:-translate-x-1/2 md:mt-2">
            <div className="space-y-4">
              {Object.entries(skillLevelInfo).map(([key, info]) => (
                <div key={key} className="space-y-1">
                  <h4 className="font-semibold text-gray-900">{info.title}</h4>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </div>
              ))}
            </div>
            <button
              className="md:hidden mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
              onClick={() => setIsVisible(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}