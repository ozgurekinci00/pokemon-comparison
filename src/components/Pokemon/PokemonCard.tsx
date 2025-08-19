// Pokemon card component for displaying Pokemon information

import React from 'react';
import { Pokemon } from '../../types/pokemon';
import { formatHeight, formatWeight, getTypeColor } from '../../utils/pokemonHelpers';
import PokemonStats from './PokemonStats';

interface PokemonCardProps {
  pokemon: Pokemon;
  isWinner?: boolean;
  voteCount?: number;
  totalVotes?: number;
  onVote?: () => void;
  hasVoted?: boolean;
  isVotingDisabled?: boolean;
  showVoteButton?: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  isWinner = false,
  voteCount = 0,
  totalVotes = 0,
  onVote,
  hasVoted = false,
  isVotingDisabled = false,
  showVoteButton = true,
}) => {
  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

  return (
    <div className={`relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
      isWinner ? 'ring-4 ring-yellow-400 shadow-yellow-100' : ''
    }`}>
      {/* Winner Crown */}
      {isWinner && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            WINNER
          </div>
        </div>
      )}

      {/* Pokemon Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <img
          src={pokemon.imageUrl}
          alt={pokemon.displayName}
          className="w-32 h-32 object-contain drop-shadow-lg transition-transform duration-300 hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/128x128?text=${pokemon.displayName}`;
          }}
        />
        
        {/* Vote percentage overlay */}
        {voteCount > 0 && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-sm font-medium">
            {Math.round(percentage)}%
          </div>
        )}
      </div>

      {/* Pokemon Info */}
      <div className="p-6">
        {/* Name and ID */}
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {pokemon.displayName}
          </h3>
          <p className="text-gray-500 text-sm">#{pokemon.id.toString().padStart(3, '0')}</p>
        </div>

        {/* Types */}
        <div className="flex justify-center gap-2 mb-4">
          {pokemon.types.map((type) => (
            <span
              key={type}
              className="px-3 py-1 rounded-full text-white text-sm font-medium capitalize"
              style={{ backgroundColor: getTypeColor(type) }}
            >
              {type}
            </span>
          ))}
        </div>

        {/* Basic Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Height</p>
            <p className="text-lg font-semibold text-gray-900">{formatHeight(pokemon.height)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Weight</p>
            <p className="text-lg font-semibold text-gray-900">{formatWeight(pokemon.weight)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Experience</p>
            <p className="text-lg font-semibold text-gray-900">{pokemon.baseExperience}</p>
          </div>
        </div>

        {/* Pokemon Stats */}
        <PokemonStats stats={pokemon.stats} />

        {/* Vote Count Display */}
        {voteCount > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{voteCount}</span> votes
              {totalVotes > 0 && (
                <span className="ml-1">({Math.round(percentage)}%)</span>
              )}
            </p>
          </div>
        )}

        {/* Vote Button */}
        {showVoteButton && (
          <div className="mt-4">
            <button
              onClick={onVote}
              disabled={isVotingDisabled || hasVoted}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                hasVoted
                  ? 'bg-green-500 cursor-not-allowed'
                  : isVotingDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {hasVoted ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Voted!
                </span>
              ) : (
                `Vote for ${pokemon.displayName}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokemonCard;
