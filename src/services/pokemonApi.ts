// PokéAPI integration service

import { RawPokemonData, Pokemon } from '../types/pokemon';
import { transformPokemonData } from '../utils/pokemonHelpers';
import { appConfig } from '../config/environment';

const POKEAPI_BASE_URL = appConfig.pokemonApi.baseUrl;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedPokemon {
  data: Pokemon;
  timestamp: number;
}

class PokemonApiService {
  private cache = new Map<string, CachedPokemon>();

  /**
   * Fetch Pokemon data by index (1-151 for Gen 1)
   */
  async fetchPokemonByIndex(index: number): Promise<Pokemon> {
    if (!this.isValidPokemonIndex(index)) {
      throw new Error(`Invalid Pokemon index: ${index}. Must be between 1 and 151.`);
    }

    return this.fetchPokemonByIdentifier(index);
  }

  /**
   * Internal method to fetch Pokemon by index
   */
  private async fetchPokemonByIdentifier(index: number): Promise<Pokemon> {
    const indexStr = index.toString();
    // Check cache first
    const cached = this.getCachedPokemon(indexStr);
    if (cached) {
      console.log(`📦 Using cached data for Pokemon #${index}`);
      return cached;
    }

    try {
      console.log(`🔍 Fetching Pokemon #${index} from PokéAPI...`);
      
      const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${index}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Pokemon #${index} not found`);
        }
        throw new Error(`Failed to fetch Pokemon data: ${response.status} ${response.statusText}`);
      }

      const rawData: RawPokemonData = await response.json();
      const pokemon = transformPokemonData(rawData);

      // Cache the result using the Pokemon's index as key
      this.setCachedPokemon(indexStr, pokemon);
      
      console.log(`✅ Successfully fetched ${pokemon.displayName} (ID: ${pokemon.id})`);
      return pokemon;

    } catch (error) {
      console.error(`❌ Error fetching Pokemon #${index}:`, error);
      
      // Try to return fallback data for demo purposes
      if (index === 1 || index === 25) {
        return this.getFallbackPokemon(index);
      }
      
      throw error;
    }
  }



  /**
   * Fetch multiple Pokemon concurrently by indexes
   */
  async fetchMultiplePokemon(indexes: number[]): Promise<Pokemon[]> {
    const promises = indexes.map(index => this.fetchPokemonByIndex(index));
    
    try {
      const results = await Promise.allSettled(promises);
      
      const pokemon: Pokemon[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          pokemon.push(result.value);
        } else {
          errors.push(`Failed to fetch Pokemon #${indexes[index]}: ${result.reason.message}`);
        }
      });

      if (errors.length > 0) {
        console.warn('⚠️  Some Pokemon failed to load:', errors);
      }

      return pokemon;

    } catch (error) {
      console.error('❌ Error fetching multiple Pokemon:', error);
      throw new Error('Failed to fetch Pokemon data');
    }
  }

  /**
   * Fetch Pokemon for default battle (Bulbasaur vs Pikachu) using indexes
   */
  async fetchDefaultBattlePokemon(): Promise<{ pokemon1: Pokemon; pokemon2: Pokemon }> {
    const [pokemon1, pokemon2] = await this.fetchMultiplePokemon([1, 25]); // Bulbasaur (1) vs Pikachu (25)
    
    if (!pokemon1 || !pokemon2) {
      throw new Error('Failed to load default battle Pokemon');
    }

    return { pokemon1, pokemon2 };
  }

  /**
   * Fetch two random Pokemon for a new battle
   */
  async fetchRandomBattlePokemon(): Promise<{ pokemon1: Pokemon; pokemon2: Pokemon }> {
    const { index1, index2 } = this.generateRandomPokemonPair();
    console.log(`🎲 Generating random battle: Pokemon ${index1} vs Pokemon ${index2}`);
    
    const [pokemon1, pokemon2] = await this.fetchMultiplePokemon([index1, index2]);
    
    if (!pokemon1 || !pokemon2) {
      throw new Error('Failed to load random battle Pokemon');
    }

    return { pokemon1, pokemon2 };
  }

  /**
   * Fetch Pokemon for battle by specific indexes
   */
  async fetchBattlePokemon(pokemon1Index: number, pokemon2Index: number): Promise<{ pokemon1: Pokemon; pokemon2: Pokemon }> {
    console.log(`⚔️ Loading battle: Pokemon ${pokemon1Index} vs Pokemon ${pokemon2Index}`);
    
    const [pokemon1, pokemon2] = await this.fetchMultiplePokemon([pokemon1Index, pokemon2Index]);
    
    if (!pokemon1 || !pokemon2) {
      throw new Error(`Failed to load battle Pokemon ${pokemon1Index} vs ${pokemon2Index}`);
    }

    return { pokemon1, pokemon2 };
  }

  /**
   * Generate two different random Pokemon indexes (1-151)
   */
  private generateRandomPokemonPair(): { index1: number; index2: number } {
    const index1 = Math.floor(Math.random() * 151) + 1; // 1-151
    let index2;
    
    // Ensure we get two different Pokemon
    do {
      index2 = Math.floor(Math.random() * 151) + 1;
    } while (index2 === index1);

    // Sort the indexes so that index1 is always less than index2
    if (index1 < index2) {
      return { index1, index2 };
    }
    return { index1: index2, index2: index1 };
  }



  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️  Pokemon cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Validate Pokemon index (1-151 for Generation 1)
   */
  private isValidPokemonIndex(index: number): boolean {
    return Number.isInteger(index) && index >= 1 && index <= 151;
  }

  /**
   * Private helper methods
   */
  private getCachedPokemon(indexStr: string): Pokemon | null {
    const cached = this.cache.get(indexStr);
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(indexStr);
      return null;
    }
    
    return cached.data;
  }

  private setCachedPokemon(indexStr: string, pokemon: Pokemon): void {
    this.cache.set(indexStr, {
      data: pokemon,
      timestamp: Date.now(),
    });
  }

  private getFallbackPokemon(index: number): Pokemon {
    const fallbackData = {
      bulbasaur: {
        id: 1,
        name: 'bulbasaur',
        displayName: 'Bulbasaur',
        height: 7,
        weight: 69,
        baseExperience: 64,
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
        types: ['grass', 'poison'],
        stats: {
          hp: 45,
          attack: 49,
          defense: 49,
          specialAttack: 65,
          specialDefense: 65,
          speed: 45,
        },
      },
      pikachu: {
        id: 25,
        name: 'pikachu',
        displayName: 'Pikachu',
        height: 4,
        weight: 60,
        baseExperience: 112,
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
        types: ['electric'],
        stats: {
          hp: 35,
          attack: 55,
          defense: 40,
          specialAttack: 50,
          specialDefense: 50,
          speed: 90,
        },
      },
    };

    // Handle index identifiers
    let pokemonKey: string;
    if (index === 1) {
      pokemonKey = 'bulbasaur';
    } else if (index === 25) {
      pokemonKey = 'pikachu';
    } else {
      throw new Error(`No fallback data for Pokemon #${index}`);
    }

    const pokemon = fallbackData[pokemonKey as keyof typeof fallbackData];
    if (!pokemon) {
      throw new Error(`No fallback data for Pokemon #${index}`);
    }

    console.log(`🔄 Using fallback data for Pokemon #${index} (${pokemon.displayName})`);
    return pokemon;
  }
}

// Export singleton instance
export const pokemonApi = new PokemonApiService();
export default pokemonApi;
