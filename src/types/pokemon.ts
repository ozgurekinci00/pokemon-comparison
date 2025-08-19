// Pokemon-related TypeScript interfaces and types

export interface PokemonSprites {
  front_default: string;
  front_shiny?: string;
  other?: {
    'official-artwork'?: {
      front_default: string;
    };
    dream_world?: {
      front_default: string;
    };
  };
}

export interface PokemonStats {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

// Raw Pokemon data from PokeAPI
export interface RawPokemonData {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: PokemonSprites;
  stats: PokemonStats[];
  types: PokemonType[];
  abilities: PokemonAbility[];
}

// Processed Pokemon data for our app
export interface Pokemon {
  id: number;
  name: string;
  displayName: string;
  height: number; // in decimeters
  weight: number; // in hectograms
  baseExperience: number;
  imageUrl: string;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
}

// Pokemon comparison pair
export interface PokemonBattle {
  id: string;
  pokemon1: Pokemon;
  pokemon2: Pokemon;
  startTime: number;
  status: 'active' | 'completed';
}

export type PokemonName = 'bulbasaur' | 'pikachu' | string;
