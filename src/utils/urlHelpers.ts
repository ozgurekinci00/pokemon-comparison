// URL parameter utilities for Pokemon battles

export interface BattleParams {
  pokemon1Index: number;
  pokemon2Index: number;
}

/**
 * Parse URL search parameters to get Pokemon battle configuration
 */
export const parseBattleParams = (searchParams: URLSearchParams): BattleParams | null => {
  const p1 = searchParams.get('p1');
  const p2 = searchParams.get('p2');
  
  if (!p1 || !p2) {
    return null;
  }
  
  const pokemon1Index = parseInt(p1, 10);
  const pokemon2Index = parseInt(p2, 10);
  
  // Validate indexes are valid Pokemon numbers (1-151)
  if (
    !Number.isInteger(pokemon1Index) || 
    !Number.isInteger(pokemon2Index) ||
    pokemon1Index < 1 || pokemon1Index > 151 ||
    pokemon2Index < 1 || pokemon2Index > 151 ||
    pokemon1Index === pokemon2Index
  ) {
    return null;
  }
  
  return { pokemon1Index, pokemon2Index };
};

/**
 * Get current battle params from window location
 */
export const getCurrentBattleParams = (): BattleParams | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const searchParams = new URLSearchParams(window.location.search);
  return parseBattleParams(searchParams);
};

/**
 * Update URL with new battle parameters
 */
export const updateBattleUrl = (pokemon1Index: number, pokemon2Index: number): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  const url = new URL(window.location.href);
  url.searchParams.set('p1', pokemon1Index.toString());
  url.searchParams.set('p2', pokemon2Index.toString());
  
  // Update URL without page reload
  window.history.pushState({}, '', url.toString());
};

/**
 * Get default battle params (Bulbasaur vs Pikachu)
 */
export const getDefaultBattleParams = (): BattleParams => {
  return {
    pokemon1Index: 1,  // Bulbasaur
    pokemon2Index: 25  // Pikachu
  };
};

/**
 * Clear battle parameters from URL (go to default)
 */
export const clearBattleUrl = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  const url = new URL(window.location.href);
  url.searchParams.delete('p1');
  url.searchParams.delete('p2');
  
  window.history.pushState({}, '', url.toString());
};
