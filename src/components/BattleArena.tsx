// Main battle arena component that orchestrates the Pokemon battle

import React, { useEffect, useState, useRef } from "react";
import { useBattleData } from "../hooks/useBattleData";
import { useBattleContext } from "../context/BattleContext";
import { useP2P } from "../hooks/useP2P";
import { useToast } from "../hooks/useToast";
import {
  generateBattleId,
  hasBrowserVotedInBattle,
  getBrowserVoteForBattle,
  recordBrowserVote,
} from "../utils/votingHelpers";
import PokemonCard from "./Pokemon/PokemonCard";
import LoadingSpinner from "./UI/LoadingSpinner";
import ErrorBoundary from "./UI/ErrorBoundary";
import ConnectionStatus from "./UI/ConnectionStatus";
import ToastContainer from "./UI/ToastContainer";

const BattleArena: React.FC = () => {
  const {
    pokemon1,
    pokemon2,
    isLoading,
    error,
    battleParams,
    startRandomBattle,
    refetch,
  } = useBattleData();
  const {
    state,
    startNewBattle,
    castVote,
    resetBattle,
    getCurrentVotes,
    syncVotes,
  } = useBattleContext();
  const [hasThisPeerVoted, setHasThisPeerVoted] = useState(false);
  const [browserVoteStatus, setBrowserVoteStatus] = useState<{
    hasVoted: boolean;
    pokemonName?: string;
  }>({ hasVoted: false });
  const { toasts, showToast, hideToast } = useToast();
  const {
    status: p2pStatus,
    connectedPeersCount,
    connectionState,
    initialize: initializeP2P,
    reinitialize: reinitializeP2P,
    broadcastVote,
    requestSync,
    sendStateToPeer,
  } = useP2P();

  // Start battle when Pokemon are loaded
  useEffect(() => {
    if (pokemon1 && pokemon2 && !state.isActive) {
      startNewBattle(pokemon1, pokemon2);
    }
  }, [pokemon1, pokemon2, state.isActive, startNewBattle]);

  // Track the current battle params to detect changes
  const [currentBattleParams, setCurrentBattleParams] = useState<{
    pokemon1Index: number;
    pokemon2Index: number;
  } | null>(null);

  // Track if we've requested initial sync
  const hasRequestedSync = useRef(false);

  // Animation state for vote-to-results transition
  const [animatedPercentages, setAnimatedPercentages] = useState({
    pokemon1: 0,
    pokemon2: 0,
  });
  const animationInProgress = useRef(false);

  // Helper function to get connection status text
  const getConnectionStatusText = (status: string): string => {
    switch (status) {
      case "discovering":
        return "Discovering peers...";
      case "connecting":
        return "Connecting...";
      case "offline":
        return "Connecting...";
      case "error":
        return "Connection failed";
      default:
        return "Connecting...";
    }
  };

  // Initialize P2P when Pokemon are loaded for the first time
  useEffect(() => {
    if (
      pokemon1 &&
      pokemon2 &&
      p2pStatus === "offline" &&
      !currentBattleParams
    ) {
      initializeP2P(battleParams.pokemon1Index, battleParams.pokemon2Index);
      setCurrentBattleParams(battleParams);
    }
  }, [
    pokemon1,
    pokemon2,
    battleParams,
    p2pStatus,
    initializeP2P,
    currentBattleParams,
  ]);

  // Reinitialize P2P when battle parameters change (New Battle)
  useEffect(() => {
    if (
      pokemon1 &&
      pokemon2 &&
      currentBattleParams &&
      (currentBattleParams.pokemon1Index !== battleParams.pokemon1Index ||
        currentBattleParams.pokemon2Index !== battleParams.pokemon2Index)
    ) {
      console.log(
        `🔄 Battle params changed: ${currentBattleParams.pokemon1Index}vs${currentBattleParams.pokemon2Index} → ${battleParams.pokemon1Index}vs${battleParams.pokemon2Index}`
      );

      // Reset voting state when Pokemon change
      setHasThisPeerVoted(false);

      // Reinitialize P2P with new battle params
      reinitializeP2P(battleParams.pokemon1Index, battleParams.pokemon2Index);
      setCurrentBattleParams(battleParams);
    }
  }, [pokemon1, pokemon2, battleParams, currentBattleParams, reinitializeP2P]);

  // Check browser voting status when Pokemon are loaded or changed
  useEffect(() => {
    if (pokemon1 && pokemon2) {
      const battleId = generateBattleId(
        battleParams.pokemon1Index,
        battleParams.pokemon2Index
      );
      const hasVoted = hasBrowserVotedInBattle(battleId);

      if (hasVoted) {
        const browserVote = getBrowserVoteForBattle(battleId);
        setBrowserVoteStatus({
          hasVoted: true,
          pokemonName: browserVote?.pokemonName,
        });
        // Don't set hasThisPeerVoted to true - this tab hasn't voted yet
        setHasThisPeerVoted(false);
      } else {
        setBrowserVoteStatus({ hasVoted: false });
        setHasThisPeerVoted(false);
      }
    }
  }, [pokemon1, pokemon2, battleParams]);

  // Request sync when P2P connects and we have peers
  useEffect(() => {
    if (
      p2pStatus === "connected" &&
      connectedPeersCount > 0 &&
      !hasRequestedSync.current
    ) {
      console.log("🔄 New peer connected, requesting state sync...");
      requestSync();
      hasRequestedSync.current = true;
    }
  }, [p2pStatus, connectedPeersCount, requestSync]);

  // Reset sync flag when battle changes or disconnects
  useEffect(() => {
    if (p2pStatus === "offline" || p2pStatus === "discovering") {
      hasRequestedSync.current = false;
    }
  }, [p2pStatus, battleParams]);

  // Set up P2P event handlers for state sync
  useEffect(() => {
    // Import the P2P service directly to set up event handlers
    import("../services/p2pService").then(({ p2pService }) => {
      // Set up callback to provide current state for sync requests
      p2pService.setCurrentStateCallback(() => getCurrentVotes());

      // Handle sync requests from other peers (only for initial state sync)
      p2pService.onSyncReceived((syncData) => {
        if (syncData.votes && syncData.votes.length > 0) {
          // Only sync if we have no votes yet (new peer joining)
          const currentVotes = getCurrentVotes();
          if (currentVotes.length === 0) {
            console.log('🔄 Syncing initial state from existing peers');
            const votes = syncData.votes;
            syncVotes(votes);
          } else {
            console.log('⚠️ Ignoring sync - already have votes (live sync is active)');
          }
        }
      });

      // Handle peer connections - send our state to newly connected peers
      p2pService.onPeerConnected((peerId) => {
        const currentVotes = getCurrentVotes();
        if (currentVotes.length > 0) {
          sendStateToPeer(peerId, currentVotes);
        }
      });
    });
  }, [getCurrentVotes, sendStateToPeer, syncVotes]);

  // Get vote counts for each Pokemon (safe calculation with null checks)
  const pokemon1Votes =
    pokemon1 && pokemon2 ? state.results[pokemon1.name]?.count || 0 : 0;
  const pokemon2Votes =
    pokemon1 && pokemon2 ? state.results[pokemon2.name]?.count || 0 : 0;

  // Animation effect when votes change
  useEffect(() => {
    if (
      state.totalVotes > 0 &&
      !animationInProgress.current &&
      pokemon1 &&
      pokemon2
    ) {
      animationInProgress.current = true;

      // Start animation sequence
      const animationDuration = 1500; // 1.5 seconds
      const steps = 30;
      const stepDuration = animationDuration / steps;

      // Reset animated values
      setAnimatedPercentages({ pokemon1: 0, pokemon2: 0 });

      // Calculate target percentage values
      const targetPokemon1Percentage =
        state.totalVotes > 0
          ? Math.round((pokemon1Votes / state.totalVotes) * 100)
          : 0;
      const targetPokemon2Percentage =
        state.totalVotes > 0
          ? Math.round((pokemon2Votes / state.totalVotes) * 100)
          : 0;

      let currentStep = 0;

      const animateStep = () => {
        currentStep++;
        const progress = currentStep / steps;
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

        setAnimatedPercentages({
          pokemon1: Math.round(targetPokemon1Percentage * easeProgress),
          pokemon2: Math.round(targetPokemon2Percentage * easeProgress),
        });

        if (currentStep < steps) {
          setTimeout(animateStep, stepDuration);
        } else {
          // Ensure final values are exact
          setAnimatedPercentages({
            pokemon1: targetPokemon1Percentage,
            pokemon2: targetPokemon2Percentage,
          });
          animationInProgress.current = false;
        }
      };

      // Start animation after a short delay for vote button transition
      setTimeout(animateStep, 200);
    } else if (state.totalVotes === 0) {
      setAnimatedPercentages({ pokemon1: 0, pokemon2: 0 });
      animationInProgress.current = false;
    }
  }, [state.totalVotes, pokemon1Votes, pokemon2Votes, pokemon1, pokemon2]);

  // Handle voting
  const handleVote = async (pokemonName: string) => {
    // Check if this browser has already voted in this battle
    if (browserVoteStatus.hasVoted) {
      const battleId = generateBattleId(
        battleParams.pokemon1Index,
        battleParams.pokemon2Index
      );
      const previousVote = browserVoteStatus.pokemonName;
      const capitalizedPokemonName = previousVote
        ? previousVote.charAt(0).toUpperCase() + previousVote.slice(1)
        : "Unknown Pokémon";

      showToast(
        `You have already voted for ${capitalizedPokemonName} in a different tab! Open an incognito window to vote again.`,
        "warning",
        6000
      );

      console.log(
        `⚠️ Vote blocked: Browser already voted for ${previousVote} in ${battleId}`
      );
      return;
    }

    if (!hasThisPeerVoted && state.isActive) {
      try {
        // Record browser vote in localStorage
        const battleId = generateBattleId(
          battleParams.pokemon1Index,
          battleParams.pokemon2Index
        );
        recordBrowserVote(battleId, pokemonName);

        // Update browser vote status
        setBrowserVoteStatus({ hasVoted: true, pokemonName });

        // Cast vote locally first
        castVote(pokemonName);

        // Broadcast vote to peers
        if (p2pStatus === "connected") {
          try {
            await broadcastVote(pokemonName, connectionState.peerId);
          } catch (error) {
            console.error("Failed to broadcast vote:", error);
          }
        }

        setHasThisPeerVoted(true);
      } catch (error) {
        console.error("Failed to process vote:", error);
        showToast("Failed to cast vote. Please try again.", "error", 4000);
      }
    }
  };

  // Handle new battle
  const handleNewBattle = async () => {
    try {
      console.log("🎲 Starting new random battle...");

      // Reset battle context first
      resetBattle();

      // Reset local voting state
      setHasThisPeerVoted(false);

      // Start a new random battle (this will update URL and fetch new Pokemon)
      await startRandomBattle();

      // Note: The useEffect will handle P2P reinitialization when battleParams change
      console.log("✅ New battle started successfully");
    } catch (error) {
      console.error("❌ Failed to start new battle:", error);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Failed to Load Pokemon
          </h3>

          <p className="text-red-700 mb-4">{error}</p>

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

  // Determine winners (safe calculation after Pokemon are loaded)
  const pokemon1IsWinner = pokemon1 ? state.winner === pokemon1.name : false;
  const pokemon2IsWinner = pokemon2 ? state.winner === pokemon2.name : false;

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

        {/* VS Display */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-gradient-to-r from-red-500 to-blue-500 text-white px-6 py-3 rounded-full text-xl font-bold shadow-lg">
            <span>{pokemon1.displayName}</span>
            <span>&nbsp;vs&nbsp;</span>
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
              hasVoted={hasThisPeerVoted}
              isConnecting={p2pStatus !== "connected"}
              connectionStatus={getConnectionStatusText(p2pStatus)}
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
              hasVoted={hasThisPeerVoted}
              isConnecting={p2pStatus !== "connected"}
              connectionStatus={getConnectionStatusText(p2pStatus)}
            />
          </div>
        </div>

        {/* New Battle Button */}
        <div className="flex justify-center my-4">
          <button
            onClick={handleNewBattle}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isLoading ? "Loading..." : "New Battle"}</span>
          </button>
        </div>

        {/* Battle Stats (when voting is complete) */}
        {hasThisPeerVoted && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-6 bg-white rounded-lg shadow-sm px-6 py-3">
              <span className="text-sm text-gray-600">
                Total Votes:{" "}
                <strong className="text-gray-900">{state.totalVotes}</strong>
              </span>
              {state.winner && (
                <span className="text-yellow-600 font-medium text-sm">
                  🏆{" "}
                  {pokemon1?.name === state.winner
                    ? pokemon1.displayName
                    : pokemon2.displayName}{" "}
                  is winning!
                </span>
              )}
              <span className="text-green-600 font-medium text-sm">
                ✅ You voted for{" "}
                {state.userVote?.pokemonName === pokemon1.name
                  ? pokemon1.displayName
                  : pokemon2.displayName}
              </span>
            </div>
          </div>
        )}

        {/* Live Vote Tracker with Smooth Animations */}
        <div
          className={`transition-all duration-500 ${
            hasThisPeerVoted
              ? "opacity-100 transform translate-y-0"
              : "opacity-0 transform translate-y-4 pointer-events-none h-0 overflow-hidden"
          }`}
        >
          {hasThisPeerVoted && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Live Vote Tracker
              </h3>

              <div className="relative">
                {/* Progress bar container */}
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden relative">
                  {/* Pokemon 1 progress (from left) with animation */}
                  {pokemon1Votes > 0 && (
                    <div
                      className={`h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700 ease-out flex items-center justify-start px-3 transform animate-slide-in-left ${
                        pokemon2Votes === 0
                          ? "rounded-full"
                          : "rounded-l-full"
                      }`}
                      style={{
                        width: `${animatedPercentages.pokemon1}%`,
                      }}
                    >
                      <span className="text-white text-sm font-medium animate-count-up">
                        {pokemon1.displayName}: {pokemon1Votes}
                      </span>
                    </div>
                  )}

                  {/* Pokemon 2 progress (from right) with animation */}
                  {pokemon2Votes > 0 && (
                    <div
                      className={`h-full bg-gradient-to-l from-blue-400 to-blue-600 transition-all duration-700 ease-out flex items-center justify-end px-3 absolute top-0 right-0 animate-slide-in-right ${
                        pokemon1Votes === 0
                          ? "rounded-full"
                          : "rounded-r-full"
                      }`}
                      style={{
                        width: `${animatedPercentages.pokemon2}%`,
                      }}
                    >
                      <span className="text-white text-sm font-medium animate-count-up">
                        {pokemon2.displayName}: {pokemon2Votes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Percentage display with count-up animation */}
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span className="font-medium transition-all duration-300 transform hover:scale-110">
                  {animatedPercentages.pokemon1}%
                </span>
                <span className="font-medium transition-all duration-300 transform hover:scale-110">
                  {animatedPercentages.pokemon2}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Real-time status indicator */}
        <div className="text-center mt-8">
          {p2pStatus === "connected" && connectedPeersCount > 0 ? (
            <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              P2P Real-time voting active with {connectedPeersCount} peer
              {connectedPeersCount !== 1 ? "s" : ""}
            </div>
          ) : p2pStatus === "connected" ? (
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

          {/* Battle URL info */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
              <span className="mr-1">🔗</span>
              <span>
                Battle: Pokemon #{battleParams.pokemon1Index} vs #
                {battleParams.pokemon2Index}
              </span>
            </div>
          </div>
        </div>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onHideToast={hideToast} />
      </div>
    </ErrorBoundary>
  );
};

export default BattleArena;
