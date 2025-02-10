import React, { useState, ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  width?: 'auto' | 'sm' | 'md' | 'lg';
}

export default function Tooltip({ 
  children, 
  content, 
  position = 'top',
  width = 'md' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default: // top
        return 'bottom-full mb-2';
    }
  };

  const getWidthClass = () => {
    switch (width) {
      case 'sm':
        return 'w-48';
      case 'md':
        return 'w-64';
      case 'lg':
        return 'w-80';
      default:
        return 'w-auto';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && (
        <div 
          className={`absolute z-50 ${getPositionClasses()} ${getWidthClass()} 
            left-1/2 transform -translate-x-1/2`}
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 shadow-lg whitespace-normal">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}