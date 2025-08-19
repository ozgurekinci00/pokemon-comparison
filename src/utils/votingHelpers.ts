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
    vote.sessionId &&
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

/**
 * Get or create user session ID - each tab/instance gets unique ID for P2P testing
 */
export const getUserSessionId = (): string => {
  // For P2P testing, each tab should be treated as a separate user
  // Generate a unique session ID for this specific tab/instance
  const sessionId = generateSessionId();
  
  console.log(`🆔 Generated unique session ID for this tab: ${sessionId}`);
  return sessionId;
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
