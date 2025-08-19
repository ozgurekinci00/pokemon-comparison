// Helper functions for Pokemon data processing and utilities

import { RawPokemonData, Pokemon } from '../types/pokemon';

/**
 * Transform raw Pokemon data from PokeAPI to our app format
 */
export const transformPokemonData = (rawData: RawPokemonData): Pokemon => {
  // Get the best available image URL
  const imageUrl = 
    rawData.sprites.other?.['official-artwork']?.front_default ||
    rawData.sprites.other?.dream_world?.front_default ||
    rawData.sprites.front_default ||
    '';

  // Extract and organize stats
  const statsMap = rawData.stats.reduce((acc, stat) => {
    const statName = stat.stat.name;
    acc[statName] = stat.base_stat;
    return acc;
  }, {} as Record<string, number>);

  // Format display name (capitalize first letter)
  const displayName = rawData.name.charAt(0).toUpperCase() + rawData.name.slice(1);

  // Extract type names
  const types = rawData.types.map(type => type.type.name);

  return {
    id: rawData.id,
    name: rawData.name,
    displayName,
    height: rawData.height,
    weight: rawData.weight,
    baseExperience: rawData.base_experience,
    imageUrl,
    types,
    stats: {
      hp: statsMap.hp || 0,
      attack: statsMap.attack || 0,
      defense: statsMap.defense || 0,
      specialAttack: statsMap['special-attack'] || 0,
      specialDefense: statsMap['special-defense'] || 0,
      speed: statsMap.speed || 0,
    },
  };
};

/**
 * Convert height from decimeters to feet and inches
 */
export const formatHeight = (heightInDecimeters: number): string => {
  const heightInInches = heightInDecimeters * 3.937; // 1 decimeter = 3.937 inches
  const feet = Math.floor(heightInInches / 12);
  const inches = Math.round(heightInInches % 12);
  return `${feet}'${inches.toString().padStart(2, '0')}"`;
};

/**
 * Convert weight from hectograms to pounds
 */
export const formatWeight = (weightInHectograms: number): string => {
  const weightInPounds = (weightInHectograms * 0.220462).toFixed(1);
  return `${weightInPounds} lbs`;
};

/**
 * Get type color for styling
 */
export const getTypeColor = (type: string): string => {
  const typeColors: Record<string, string> = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  };
  
  return typeColors[type.toLowerCase()] || '#68A090';
};

/**
 * Calculate stat percentage for visualization
 */
export const calculateStatPercentage = (statValue: number, maxStat: number = 255): number => {
  return Math.min((statValue / maxStat) * 100, 100);
};

/**
 * Get random Pokemon names for "New Battle" feature
 */
export const getRandomPokemonPair = (): { pokemon1: string; pokemon2: string } => {
  const popularPokemon = [
    'pikachu', 'charizard', 'blastoise', 'venusaur', 'mewtwo', 'mew',
    'lugia', 'ho-oh', 'rayquaza', 'dialga', 'palkia', 'giratina',
    'arceus', 'reshiram', 'zekrom', 'kyurem', 'xerneas', 'yveltal',
    'snorlax', 'dragonite', 'tyranitar', 'salamence', 'metagross',
    'garchomp', 'lucario', 'zoroark', 'greninja', 'talonflame'
  ];
  
  const shuffled = [...popularPokemon].sort(() => 0.5 - Math.random());
  return {
    pokemon1: shuffled[0],
    pokemon2: shuffled[1],
  };
};

/**
 * Validate Pokemon name format
 */
export const isValidPokemonName = (name: string): boolean => {
  return /^[a-zA-Z0-9-]+$/.test(name) && name.length > 0 && name.length < 50;
};

/**
 * Format Pokemon stat name for display
 */
export const formatStatName = (statName: string): string => {
  const statNames: Record<string, string> = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    specialAttack: 'Sp. Attack',
    specialDefense: 'Sp. Defense',
    speed: 'Speed',
  };
  
  return statNames[statName] || statName;
};
