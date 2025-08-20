// Custom hook for fetching battle Pokemon data based on URL parameters

import { useState, useEffect, useCallback } from 'react';
import { Pokemon } from '../types/pokemon';
import { pokemonApi } from '../services/pokemonApi';
import { getCurrentBattleParams, getDefaultBattleParams, updateBattleUrl, BattleParams } from '../utils/urlHelpers';

interface UseBattleDataState {
  pokemon1: Pokemon | null;
  pokemon2: Pokemon | null;
  isLoading: boolean;
  error: string | null;
  battleParams: BattleParams;
}

interface UseBattleDataReturn extends UseBattleDataState {
  startRandomBattle: () => Promise<void>;
  startBattle: (pokemon1Index: number, pokemon2Index: number) => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useBattleData = (): UseBattleDataReturn => {
  const [state, setState] = useState<UseBattleDataState>({
    pokemon1: null,
    pokemon2: null,
    isLoading: true,
    error: null,
    battleParams: getDefaultBattleParams(),
  });

  // Fetch Pokemon for current battle params
  const fetchBattlePokemon = useCallback(async (battleParams: BattleParams) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, battleParams }));

    try {
      const { pokemon1, pokemon2 } = await pokemonApi.fetchBattlePokemon(
        battleParams.pokemon1Index,
        battleParams.pokemon2Index
      );

      setState(prev => ({
        ...prev,
        pokemon1,
        pokemon2,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        pokemon1: null,
        pokemon2: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Pokemon',
      }));
    }
  }, []);

  // Start a new battle with specific Pokemon indexes
  const startBattle = useCallback(async (pokemon1Index: number, pokemon2Index: number) => {
    const battleParams: BattleParams = { pokemon1Index, pokemon2Index };
    
    // Update URL with new parameters
    updateBattleUrl(pokemon1Index, pokemon2Index);
    
    // Fetch the Pokemon
    await fetchBattlePokemon(battleParams);
  }, [fetchBattlePokemon]);

  // Start a random battle
  const startRandomBattle = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { pokemon1, pokemon2 } = await pokemonApi.fetchRandomBattlePokemon();
      
      // Update URL with the random Pokemon indexes
      updateBattleUrl(pokemon1.id, pokemon2.id);
      
      const battleParams: BattleParams = {
        pokemon1Index: pokemon1.id,
        pokemon2Index: pokemon2.id,
      };

      setState(prev => ({
        ...prev,
        pokemon1,
        pokemon2,
        isLoading: false,
        error: null,
        battleParams,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        pokemon1: null,
        pokemon2: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch random Pokemon',
      }));
    }
  }, []);

  // Refetch current battle
  const refetch = useCallback(async () => {
    await fetchBattlePokemon(state.battleParams);
  }, [fetchBattlePokemon, state.battleParams]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize data based on URL parameters
  useEffect(() => {
    const urlParams = getCurrentBattleParams();
    const battleParams = urlParams || getDefaultBattleParams();
    
    // If we don't have URL params but we should, update the URL
    if (!urlParams) {
      updateBattleUrl(battleParams.pokemon1Index, battleParams.pokemon2Index);
    }
    
    fetchBattlePokemon(battleParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  // Listen for URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = getCurrentBattleParams();
      const battleParams = urlParams || getDefaultBattleParams();
      
      // Only refetch if the params actually changed
      if (
        battleParams.pokemon1Index !== state.battleParams.pokemon1Index ||
        battleParams.pokemon2Index !== state.battleParams.pokemon2Index
      ) {
        fetchBattlePokemon(battleParams);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fetchBattlePokemon, state.battleParams]);

  return {
    ...state,
    startRandomBattle,
    startBattle,
    refetch,
    clearError,
  };
};
