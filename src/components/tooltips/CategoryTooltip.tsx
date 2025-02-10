import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Category } from '../../types';
import { getCategoryDescription } from '../../utils/formatters';

export default function CategoryTooltip() {
  const [isVisible, setIsVisible] = useState(false);
  const categories: Category[] = ['CAT 1', 'CAT 2', 'CAT 3', 'CAT 4', 'CAT 5', 'CAT 6'];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Informações sobre categorias"
      >
        <Info className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 md:relative md:inset-auto md:bg-transparent">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full md:absolute md:w-80 md:-left-20 md:transform md:-translate-x-1/2 md:mt-2">
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category} className="space-y-1">
                  <h4 className="font-semibold text-gray-900">{category}</h4>
                  <p className="text-sm text-gray-600">{getCategoryDescription(category)}</p>
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