// Pokemon stats display component

import React from 'react';
import { Pokemon } from '../../types/pokemon';
import { calculateStatPercentage, formatStatName } from '../../utils/pokemonHelpers';

interface PokemonStatsProps {
  stats: Pokemon['stats'];
  showLabels?: boolean;
  maxStatValue?: number;
}

const PokemonStats: React.FC<PokemonStatsProps> = ({ 
  stats, 
  showLabels = true, 
  maxStatValue = 100 
}) => {
  const statEntries = Object.entries(stats) as Array<[keyof Pokemon['stats'], number]>;

  const getStatColor = (statName: string, value: number): string => {
    const percentage = calculateStatPercentage(value, maxStatValue);
    
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      {showLabels && (
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Base Stats
        </h4>
      )}
      
      <div className="space-y-1">
        {statEntries.map(([statName, value]) => {
          const percentage = calculateStatPercentage(value, maxStatValue);
          const displayName = formatStatName(statName);
          const colorClass = getStatColor(statName, value);

          return (
            <div key={statName} className="flex items-center">
              {/* Stat Name */}
              <div className="w-20 text-xs text-gray-600 font-medium">
                {displayName}
              </div>
              
              {/* Stat Value */}
              <div className="w-8 text-xs text-gray-900 font-semibold text-right mr-2">
                {value}
              </div>
              
              {/* Stat Bar */}
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${colorClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PokemonStats;
