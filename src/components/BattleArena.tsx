// Main battle arena component that orchestrates the Pokemon battle

import React, { useEffect } from 'react';
import { useDefaultBattle } from '../hooks/usePokemonData';
import { useBattleContext } from '../context/BattleContext';
import { useP2P } from '../hooks/useP2P';
import PokemonCard from './Pokemon/PokemonCard';
import LoadingSpinner from './UI/LoadingSpinner';
import ErrorBoundary from './UI/ErrorBoundary';
import ConnectionStatus from './UI/ConnectionStatus';

const BattleArena: React.FC = () => {
  const { pokemon1, pokemon2, isLoading, error, refetch } = useDefaultBattle();
  const { state, startNewBattle, castVote } = useBattleContext();
  const { 
    status: p2pStatus, 
    connectedPeersCount, 
    connectionState,
    initialize: initializeP2P, 
    broadcastVote 
  } = useP2P();

  // Start battle when Pokemon are loaded
  useEffect(() => {
    if (pokemon1 && pokemon2 && !state.isActive) {
      startNewBattle(pokemon1, pokemon2);
    }
  }, [pokemon1, pokemon2, state.isActive, startNewBattle]);

  // Initialize P2P when Pokemon are loaded
  useEffect(() => {
    if (pokemon1 && pokemon2 && p2pStatus === 'offline') {
      initializeP2P(pokemon1.name, pokemon2.name);
    }
  }, [pokemon1, pokemon2, p2pStatus, initializeP2P]);

  // Handle voting
  const handleVote = async (pokemonName: string) => {
    if (!state.hasUserVoted && state.isActive) {
      // Cast vote locally first
      castVote(pokemonName);
      
      // Broadcast vote to peers
      if (p2pStatus === 'connected') {
        try {
          await broadcastVote(pokemonName, connectionState.peerId);
        } catch (error) {
          console.error('Failed to broadcast vote:', error);
        }
      }
    }
  };

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Failed to Load Pokemon
          </h3>
          
          <p className="text-red-700 mb-4">
            {error}
          </p>
          
          <button
            onClick={refetch}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !pokemon1 || !pokemon2) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <LoadingSpinner size="lg" message="Loading Pokemon battle..." />
        </div>
      </div>
    );
  }

  // Get vote counts for each Pokemon
  const pokemon1Votes = state.results[pokemon1.name]?.count || 0;
  const pokemon2Votes = state.results[pokemon2.name]?.count || 0;
  
  // Determine winners
  const pokemon1IsWinner = state.winner === pokemon1.name;
  const pokemon2IsWinner = state.winner === pokemon2.name;

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto">
        {/* Connection Status */}
        <div className="text-center mb-6">
          <ConnectionStatus 
            status={p2pStatus}
            connectedPeersCount={connectedPeersCount}
            peerId={connectionState.peerId}
          />
        </div>

        {/* Battle Status */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {state.hasUserVoted ? 'Battle Results' : 'Choose Your Champion!'}
            </h2>
            
            {state.totalVotes > 0 && (
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <span>Total Votes: <strong>{state.totalVotes}</strong></span>
                {state.winner && (
                  <span className="text-yellow-600 font-medium">
                    🏆 {pokemon1?.name === state.winner ? pokemon1.displayName : pokemon2.displayName} is winning!
                  </span>
                )}
              </div>
            )}
            
            {state.hasUserVoted && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                ✅ You voted for {state.userVote?.pokemonName === pokemon1.name ? pokemon1.displayName : pokemon2.displayName}
              </div>
            )}
          </div>
        </div>

        {/* VS Display */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-gradient-to-r from-red-500 to-blue-500 text-white px-6 py-3 rounded-full text-xl font-bold shadow-lg">
            <span>{pokemon1.displayName}</span>
            <span className="mx-4 text-2xl">⚔️</span>
            <span>{pokemon2.displayName}</span>
          </div>
        </div>

        {/* Pokemon Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Pokemon 1 */}
          <div className="transform transition-all duration-300 hover:scale-105">
            <PokemonCard
              pokemon={pokemon1}
              isWinner={pokemon1IsWinner}
              voteCount={pokemon1Votes}
              totalVotes={state.totalVotes}
              onVote={() => handleVote(pokemon1.name)}
              hasVoted={state.hasUserVoted && state.userVote?.pokemonName === pokemon1.name}
              isVotingDisabled={state.hasUserVoted}
              showVoteButton={true}
            />
          </div>

          {/* Pokemon 2 */}
          <div className="transform transition-all duration-300 hover:scale-105">
            <PokemonCard
              pokemon={pokemon2}
              isWinner={pokemon2IsWinner}
              voteCount={pokemon2Votes}
              totalVotes={state.totalVotes}
              onVote={() => handleVote(pokemon2.name)}
              hasVoted={state.hasUserVoted && state.userVote?.pokemonName === pokemon2.name}
              isVotingDisabled={state.hasUserVoted}
              showVoteButton={true}
            />
          </div>
        </div>

        {/* Vote Progress Bar (when there are votes) */}
        {state.totalVotes > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Live Vote Tracker
            </h3>
            
            <div className="relative">
              {/* Progress bar container */}
              <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                {/* Pokemon 1 progress */}
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out flex items-center justify-start px-3"
                  style={{ 
                    width: `${state.totalVotes > 0 ? (pokemon1Votes / state.totalVotes) * 100 : 0}%` 
                  }}
                >
                  {pokemon1Votes > 0 && (
                    <span className="text-white text-sm font-medium">
                      {pokemon1.displayName}: {pokemon1Votes}
                    </span>
                  )}
                </div>
                
                {/* Pokemon 2 progress (from right) */}
                <div
                  className="h-full bg-gradient-to-l from-blue-400 to-blue-600 transition-all duration-500 ease-out flex items-center justify-end px-3 absolute top-0 right-0"
                  style={{ 
                    width: `${state.totalVotes > 0 ? (pokemon2Votes / state.totalVotes) * 100 : 0}%` 
                  }}
                >
                  {pokemon2Votes > 0 && (
                    <span className="text-white text-sm font-medium">
                      {pokemon2.displayName}: {pokemon2Votes}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Center divider */}
              <div className="absolute top-0 left-1/2 transform -translate-x-0.5 h-8 w-1 bg-gray-400"></div>
            </div>
            
            {/* Percentage display */}
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>
                {state.totalVotes > 0 ? Math.round((pokemon1Votes / state.totalVotes) * 100) : 0}%
              </span>
              <span>
                {state.totalVotes > 0 ? Math.round((pokemon2Votes / state.totalVotes) * 100) : 0}%
              </span>
            </div>
          </div>
        )}

        {/* Real-time status indicator */}
        <div className="text-center mt-8">
          {p2pStatus === 'connected' && connectedPeersCount > 0 ? (
            <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              P2P Real-time voting active with {connectedPeersCount} peer{connectedPeersCount !== 1 ? 's' : ''}
            </div>
          ) : p2pStatus === 'connected' ? (
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              P2P ready - open app on another device/network to connect
            </div>
          ) : (
            <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
              Setting up P2P connection...
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BattleArena;
