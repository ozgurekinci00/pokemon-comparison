// Voting-related TypeScript interfaces and types

export interface Vote {
  id: string;
  userId: string;
  pokemonName: string;
  battleId: string;
  timestamp: number;
}

export interface VoteData {
  pokemonName: string;
  battleId: string;
  userId: string;
  timestamp: number;
}

export interface VoteResults {
  [pokemonName: string]: {
    count: number;
    percentage: number;
    votes: Vote[];
  };
}

export interface BattleState {
  battleId: string;
  pokemon1Name: string;
  pokemon2Name: string;
  votes: Vote[];
  results: VoteResults;
  hasUserVoted: boolean;
  userVote?: Vote;
  winner?: string | null;
  totalVotes: number;
  isActive: boolean;
  startTime: number;
}

export interface User {
  id: string;
  hasVoted: boolean;
  voteTimestamp?: number;
}

export type VotingStatus = 'idle' | 'voting' | 'voted' | 'disabled';

export interface VotingAction {
  type: 'CAST_VOTE' | 'RECEIVE_VOTE' | 'START_BATTLE' | 'RESET_BATTLE' | 'SET_USER_VOTE_STATUS' | 'SYNC_VOTES';
  payload?: any;
}
