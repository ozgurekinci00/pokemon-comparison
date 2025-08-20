// Custom hook for fetching and managing Pokemon data

import { useState, useEffect, useCallback } from 'react';
import { Pokemon } from '../types/pokemon';
import { pokemonApi } from '../services/pokemonApi';

interface UsePokemonDataState {
  pokemon: Pokemon | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePokemonDataReturn extends UsePokemonDataState {
  fetchPokemon: (index: number) => Promise<void>;
  clearError: () => void;
  refetch: () => Promise<void>;
}

export const usePokemonData = (initialIndex?: number): UsePokemonDataReturn => {
  const [state, setState] = useState<UsePokemonDataState>({
    pokemon: null,
    isLoading: false,
    error: null,
  });

  const [currentIndex, setCurrentIndex] = useState<number | undefined>(initialIndex);

  const fetchPokemon = useCallback(async (index: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setCurrentIndex(index);

    try {
      const pokemon = await pokemonApi.fetchPokemonByIndex(index);
      setState({
        pokemon,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        pokemon: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Pokemon',
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refetch = useCallback(async () => {
    if (currentIndex) {
      await fetchPokemon(currentIndex);
    }
  }, [currentIndex, fetchPokemon]);

  // Auto-fetch on mount if initialIndex provided
  useEffect(() => {
    if (initialIndex) {
      fetchPokemon(initialIndex);
    }
  }, [initialIndex, fetchPokemon]);

  return {
    ...state,
    fetchPokemon,
    clearError,
    refetch,
  };
};

// Hook for fetching multiple Pokemon
interface UseMultiplePokemonReturn {
  pokemon: Pokemon[];
  isLoading: boolean;
  error: string | null;
  fetchMultiple: (indexes: number[]) => Promise<void>;
  clearError: () => void;
}

export const useMultiplePokemon = (): UseMultiplePokemonReturn => {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMultiple = useCallback(async (indexes: number[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await pokemonApi.fetchMultiplePokemon(indexes);
      setPokemon(results);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch Pokemon');
      setPokemon([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    pokemon,
    isLoading,
    error,
    fetchMultiple,
    clearError,
  };
};

// Hook for the default battle (Bulbasaur vs Pikachu)
interface UseDefaultBattleReturn {
  pokemon1: Pokemon | null;
  pokemon2: Pokemon | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDefaultBattle = (): UseDefaultBattleReturn => {
  const [pokemon1, setPokemon1] = useState<Pokemon | null>(null);
  const [pokemon2, setPokemon2] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDefaultBattle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { pokemon1, pokemon2 } = await pokemonApi.fetchDefaultBattlePokemon();
      setPokemon1(pokemon1);
      setPokemon2(pokemon2);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load Pokemon battle');
      setPokemon1(null);
      setPokemon2(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchDefaultBattle();
  }, [fetchDefaultBattle]);

  return {
    pokemon1,
    pokemon2,
    isLoading,
    error,
    refetch: fetchDefaultBattle,
  };
};
