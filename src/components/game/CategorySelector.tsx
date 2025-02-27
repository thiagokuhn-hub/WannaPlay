import React from 'react';
import { Sport, PadelCategory, BeachTennisCategory } from '../../types';
import CategoryTooltip from '../tooltips/CategoryTooltip';

// Define Tennis categories
const tennisCategories: TennisCategory[] = [
  '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0'
];

// Define Padel categories
const padelCategories: PadelCategory[] = ['CAT 1', 'CAT 2', 'CAT 3', 'CAT 4', 'CAT 5', 'CAT 6'];

// Define Beach Tennis categories
const beachTennisCategories: BeachTennisCategory[] = [
  'INICIANTE',
  'CAT C',
  'CAT B',
  'CAT A',
  'PROFISSIONAL'
];

interface CategorySelectorProps {
  sport: Sport;
  selectedCategories: (PadelCategory | BeachTennisCategory | TennisCategory)[];
  onCategoryToggle: (category: PadelCategory | BeachTennisCategory | TennisCategory) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  sport, 
  selectedCategories, 
  onCategoryToggle 
}) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Categorias Permitidas (selecione uma ou mais)
        </label>
        <CategoryTooltip />
      </div>
      <div className="flex flex-wrap gap-2">
        {sport === 'padel' && padelCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryToggle(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategories.includes(category)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
        {sport === 'beach-tennis' && beachTennisCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryToggle(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategories.includes(category)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
        {sport === 'tennis' && tennisCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryToggle(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategories.includes(category)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;