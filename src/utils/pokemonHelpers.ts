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
 * Convert height from decimeters to centimeters
 */
export const formatHeight = (heightInDecimeters: number): string => {
  const heightInCentimeters = heightInDecimeters * 10; // 1 decimeter = 10 centimeters
  return `${heightInCentimeters} cm`;
};

/**
 * Convert weight from hectograms to kilograms
 */
export const formatWeight = (weightInHectograms: number): string => {
  const weightInKilograms = (weightInHectograms * 0.1).toFixed(1);
  return `${weightInKilograms} kg`;
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
export const calculateStatPercentage = (statValue: number, maxStat: number = 100): number => {
  return Math.min((statValue / maxStat) * 100, 100);
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
