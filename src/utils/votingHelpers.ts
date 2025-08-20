// Helper functions for voting logic and calculations

import { Vote, VoteResults, BattleState } from '../types/voting';

/**
 * Calculate vote results and percentages
 */
export const calculateVoteResults = (votes: Vote[]): VoteResults => {
  const results: VoteResults = {};
  const totalVotes = votes.length;

  // Count votes for each Pokemon
  votes.forEach(vote => {
    if (!results[vote.pokemonName]) {
      results[vote.pokemonName] = {
        count: 0,
        percentage: 0,
        votes: [],
      };
    }
    results[vote.pokemonName].count++;
    results[vote.pokemonName].votes.push(vote);
  });

  // Calculate percentages
  Object.keys(results).forEach(pokemonName => {
    const count = results[pokemonName].count;
    results[pokemonName].percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
  });

  return results;
};

/**
 * Determine the winner based on vote counts
 */
export const determineWinner = (results: VoteResults): string | null => {
  const pokemonNames = Object.keys(results);
  
  if (pokemonNames.length === 0) return null;
  
  let winner = pokemonNames[0];
  let maxVotes = results[winner].count;
  let isTie = false;

  for (let i = 1; i < pokemonNames.length; i++) {
    const currentPokemon = pokemonNames[i];
    const currentVotes = results[currentPokemon].count;
    
    if (currentVotes > maxVotes) {
      winner = currentPokemon;
      maxVotes = currentVotes;
      isTie = false;
    } else if (currentVotes === maxVotes && maxVotes > 0) {
      isTie = true;
    }
  }

  return isTie ? null : (maxVotes > 0 ? winner : null);
};

/**
 * Check if user has already voted in this battle
 */
export const hasUserVoted = (votes: Vote[], userId: string, battleId: string): boolean => {
  return votes.some(vote => vote.userId === userId && vote.battleId === battleId);
};

/**
 * Get user's vote for a specific battle
 */
export const getUserVote = (votes: Vote[], userId: string, battleId: string): Vote | undefined => {
  return votes.find(vote => vote.userId === userId && vote.battleId === battleId);
};

/**
 * Validate vote data
 */
export const isValidVote = (vote: Partial<Vote>): vote is Vote => {
  return !!(
    vote.id &&
    vote.userId &&
    vote.pokemonName &&
    vote.battleId &&
    vote.timestamp &&
    typeof vote.timestamp === 'number' &&
    vote.timestamp > 0
  );
};

/**
 * Generate unique vote ID
 */
export const generateVoteId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `vote_${timestamp}_${randomStr}`;
};

/**
 * Generate unique session ID for tracking user across tabs
 */
export const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `session_${timestamp}_${randomStr}`;
};

// Single user ID per tab instance
let tabUserId: string | null = null;

/**
 * Get or create user session ID - each tab/instance gets unique ID for P2P testing
 */
export const getUserSessionId = (): string => {
  // For P2P testing, each tab should be treated as a separate user
  // Generate a unique session ID for this specific tab/instance once
  if (!tabUserId) {
    tabUserId = generateSessionId();
    console.log(`🆔 Generated unique user ID for this tab: ${tabUserId}`);
  }
  return tabUserId;
};

/**
 * Check if this is a duplicate vote from the same user
 */
export const isDuplicateVote = (newVote: Vote, existingVotes: Vote[]): boolean => {
  return existingVotes.some(vote => 
    vote.userId === newVote.userId && 
    vote.battleId === newVote.battleId
  );
};

/**
 * Format vote percentage for display
 */
export const formatPercentage = (percentage: number): string => {
  if (percentage === 0) return '0%';
  if (percentage < 1) return '<1%';
  return `${Math.round(percentage)}%`;
};

/**
 * Sort Pokemon by vote count (descending)
 */
export const sortPokemonByVotes = (results: VoteResults): Array<{ name: string; count: number; percentage: number }> => {
  return Object.entries(results)
    .map(([name, data]) => ({
      name,
      count: data.count,
      percentage: data.percentage,
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Check if battle is still active (within time limit)
 */
export const isBattleActive = (battleState: BattleState, maxDurationMs: number = 30 * 60 * 1000): boolean => {
  const currentTime = Date.now();
  const elapsedTime = currentTime - battleState.startTime;
  return battleState.isActive && elapsedTime < maxDurationMs;
};

/**
 * Calculate battle progress percentage
 */
export const calculateBattleProgress = (startTime: number, durationMs: number): number => {
  const elapsed = Date.now() - startTime;
  const progress = (elapsed / durationMs) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

// ===============================
// BROWSER-WIDE VOTE TRACKING
// ===============================

interface BrowserVoteRecord {
  battleId: string;
  pokemonName: string;
  timestamp: number;
  userAgent: string; // For additional verification
}

const BROWSER_VOTES_KEY = 'pokemon_battle_browser_votes';
const VOTE_EXPIRY_HOURS = 24; // Votes expire after 24 hours

/**
 * Generate battle ID from Pokemon indexes
 */
export const generateBattleId = (pokemon1Index: number, pokemon2Index: number): string => {
  const sorted = [pokemon1Index, pokemon2Index].sort((a, b) => a - b);
  return `battle_${sorted[0]}_vs_${sorted[1]}`;
};

/**
 * Get all browser votes from localStorage
 */
const getBrowserVotes = (): BrowserVoteRecord[] => {
  try {
    const stored = localStorage.getItem(BROWSER_VOTES_KEY);
    if (!stored) return [];
    
    const votes: BrowserVoteRecord[] = JSON.parse(stored);
    const now = Date.now();
    const expiryMs = VOTE_EXPIRY_HOURS * 60 * 60 * 1000;
    
    // Filter out expired votes
    const validVotes = votes.filter(vote => 
      now - vote.timestamp < expiryMs
    );
    
    // Save back filtered votes if any were removed
    if (validVotes.length !== votes.length) {
      localStorage.setItem(BROWSER_VOTES_KEY, JSON.stringify(validVotes));
    }
    
    return validVotes;
  } catch (error) {
    console.warn('Failed to read browser votes from localStorage:', error);
    return [];
  }
};

/**
 * Save browser votes to localStorage
 */
const saveBrowserVotes = (votes: BrowserVoteRecord[]): void => {
  try {
    localStorage.setItem(BROWSER_VOTES_KEY, JSON.stringify(votes));
  } catch (error) {
    console.warn('Failed to save browser votes to localStorage:', error);
  }
};

/**
 * Check if user has already voted in this battle in ANY tab of this browser
 */
export const hasBrowserVotedInBattle = (battleId: string): boolean => {
  const votes = getBrowserVotes();
  return votes.some(vote => vote.battleId === battleId);
};

/**
 * Get browser's vote for a specific battle
 */
export const getBrowserVoteForBattle = (battleId: string): BrowserVoteRecord | null => {
  const votes = getBrowserVotes();
  return votes.find(vote => vote.battleId === battleId) || null;
};

/**
 * Record a vote for this browser (across all tabs)
 */
export const recordBrowserVote = (battleId: string, pokemonName: string): void => {
  const votes = getBrowserVotes();
  
  // Remove any existing vote for this battle
  const filteredVotes = votes.filter(vote => vote.battleId !== battleId);
  
  // Add new vote
  const newVote: BrowserVoteRecord = {
    battleId,
    pokemonName,
    timestamp: Date.now(),
    userAgent: navigator.userAgent.substring(0, 100) // Truncate for storage
  };
  
  filteredVotes.push(newVote);
  saveBrowserVotes(filteredVotes);
  
  console.log(`🗳️ Recorded browser vote for ${battleId}: ${pokemonName}`);
};

/**
 * Clear all browser votes (for testing or reset)
 */
export const clearBrowserVotes = (): void => {
  try {
    localStorage.removeItem(BROWSER_VOTES_KEY);
    console.log('🗑️ Cleared all browser votes');
  } catch (error) {
    console.warn('Failed to clear browser votes:', error);
  }
};

/**
 * Get vote statistics for debugging
 */
export const getBrowserVoteStats = (): { totalVotes: number; battles: string[] } => {
  const votes = getBrowserVotes();
  const battleSet = new Set(votes.map(vote => vote.battleId));
  const battles = Array.from(battleSet);
  
  return {
    totalVotes: votes.length,
    battles
  };
};
