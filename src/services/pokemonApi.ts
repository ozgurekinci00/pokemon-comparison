// PokéAPI integration service

import { RawPokemonData, Pokemon } from '../types/pokemon';
import { transformPokemonData, isValidPokemonName } from '../utils/pokemonHelpers';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedPokemon {
  data: Pokemon;
  timestamp: number;
}

class PokemonApiService {
  private cache = new Map<string, CachedPokemon>();

  /**
   * Fetch Pokemon data by name
   */
  async fetchPokemon(name: string): Promise<Pokemon> {
    const normalizedName = name.toLowerCase().trim();
    
    if (!isValidPokemonName(normalizedName)) {
      throw new Error(`Invalid Pokemon name: ${name}`);
    }

    // Check cache first
    const cached = this.getCachedPokemon(normalizedName);
    if (cached) {
      console.log(`📦 Using cached data for ${normalizedName}`);
      return cached;
    }

    try {
      console.log(`🔍 Fetching ${normalizedName} from PokéAPI...`);
      
      const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${normalizedName}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Pokemon "${name}" not found`);
        }
        throw new Error(`Failed to fetch Pokemon data: ${response.status} ${response.statusText}`);
      }

      const rawData: RawPokemonData = await response.json();
      const pokemon = transformPokemonData(rawData);

      // Cache the result
      this.setCachedPokemon(normalizedName, pokemon);
      
      console.log(`✅ Successfully fetched ${pokemon.displayName}`);
      return pokemon;

    } catch (error) {
      console.error(`❌ Error fetching Pokemon ${name}:`, error);
      
      // Try to return fallback data for demo purposes
      if (normalizedName === 'bulbasaur' || normalizedName === 'pikachu') {
        return this.getFallbackPokemon(normalizedName);
      }
      
      throw error;
    }
  }

  /**
   * Fetch multiple Pokemon concurrently
   */
  async fetchMultiplePokemon(names: string[]): Promise<Pokemon[]> {
    const promises = names.map(name => this.fetchPokemon(name));
    
    try {
      const results = await Promise.allSettled(promises);
      
      const pokemon: Pokemon[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          pokemon.push(result.value);
        } else {
          errors.push(`Failed to fetch ${names[index]}: ${result.reason.message}`);
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
   * Fetch Pokemon for default battle (Bulbasaur vs Pikachu)
   */
  async fetchDefaultBattlePokemon(): Promise<{ pokemon1: Pokemon; pokemon2: Pokemon }> {
    const [pokemon1, pokemon2] = await this.fetchMultiplePokemon(['bulbasaur', 'pikachu']);
    
    if (!pokemon1 || !pokemon2) {
      throw new Error('Failed to load default battle Pokemon');
    }

    return { pokemon1, pokemon2 };
  }

  /**
   * Search Pokemon by partial name (for future autocomplete feature)
   */
  async searchPokemon(query: string, limit: number = 10): Promise<string[]> {
    try {
      // This is a simplified search - in a real app, you might want to use a more sophisticated search
      const response = await fetch(`${POKEAPI_BASE_URL}/pokemon?limit=1000`);
      const data = await response.json();
      
      const matches = data.results
        .filter((pokemon: any) => pokemon.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
        .map((pokemon: any) => pokemon.name);
      
      return matches;

    } catch (error) {
      console.error('❌ Error searching Pokemon:', error);
      return [];
    }
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
   * Private helper methods
   */
  private getCachedPokemon(name: string): Pokemon | null {
    const cached = this.cache.get(name);
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(name);
      return null;
    }
    
    return cached.data;
  }

  private setCachedPokemon(name: string, pokemon: Pokemon): void {
    this.cache.set(name, {
      data: pokemon,
      timestamp: Date.now(),
    });
  }

  private getFallbackPokemon(name: string): Pokemon {
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

    const pokemon = fallbackData[name as keyof typeof fallbackData];
    if (!pokemon) {
      throw new Error(`No fallback data for ${name}`);
    }

    console.log(`🔄 Using fallback data for ${name}`);
    return pokemon;
  }
}

// Export singleton instance
export const pokemonApi = new PokemonApiService();
export default pokemonApi;
