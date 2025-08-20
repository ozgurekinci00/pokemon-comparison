// React Context for global battle state management

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { BattleState, Vote, VotingAction } from '../types/voting';
import { Pokemon } from '../types/pokemon';
import { 
  calculateVoteResults, 
  determineWinner, 
  getUserSessionId,
  hasUserVoted,
  getUserVote
} from '../utils/votingHelpers';

// Battle Context Types
interface BattleContextType {
  state: BattleState;
  dispatch: React.Dispatch<VotingAction>;
  startNewBattle: (pokemon1: Pokemon, pokemon2: Pokemon) => void;
  castVote: (pokemonName: string) => void;
  receiveVote: (vote: Vote) => void;
  resetBattle: () => void;
  getCurrentVotes: () => Vote[];
  syncVotes: (votes: Vote[]) => void;
}

// Initial state
const initialState: BattleState = {
  battleId: '',
  pokemon1Name: '',
  pokemon2Name: '',
  votes: [],
  results: {},
  hasUserVoted: false,
  userVote: undefined,
  winner: undefined,
  totalVotes: 0,
  isActive: false,
  startTime: 0,
};

// Battle reducer
const battleReducer = (state: BattleState, action: VotingAction): BattleState => {
  switch (action.type) {
    case 'START_BATTLE': {
      const { pokemon1, pokemon2, battleId } = action.payload;
      
      return {
        ...initialState,
        battleId,
        pokemon1Name: pokemon1.name,
        pokemon2Name: pokemon2.name,
        isActive: true,
        startTime: Date.now(),
      };
    }

    case 'CAST_VOTE': {
      const { pokemonName } = action.payload;
      const userId = getUserSessionId();
      
      // Check if user already voted
      if (hasUserVoted(state.votes, userId, state.battleId)) {
        return state;
      }

      const newVote: Vote = {
        id: `vote_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId,
        pokemonName,
        battleId: state.battleId,
        timestamp: Date.now(),
      };

      const updatedVotes = [...state.votes, newVote];
      const results = calculateVoteResults(updatedVotes);
      const winner = determineWinner(results);

      return {
        ...state,
        votes: updatedVotes,
        results,
        winner,
        totalVotes: updatedVotes.length,
        hasUserVoted: true,
        userVote: newVote,
      };
    }

    case 'RECEIVE_VOTE': {
      const vote = action.payload as Vote;
      const userId = getUserSessionId();
      
      // Don't add our own votes twice
      if (vote.userId === userId) {
        return state;
      }

      // Check if this vote already exists
      const existingVote = state.votes.find(v => v.id === vote.id);
      if (existingVote) {
        return state;
      }

      const updatedVotes = [...state.votes, vote];
      const results = calculateVoteResults(updatedVotes);
      const winner = determineWinner(results);

      return {
        ...state,
        votes: updatedVotes,
        results,
        winner,
        totalVotes: updatedVotes.length,
      };
    }

    case 'RESET_BATTLE': {
      return {
        ...initialState,
      };
    }

    case 'SYNC_VOTES': {
      const incomingVotes = action.payload as Vote[];
      
      // Merge incoming votes with existing votes, avoiding duplicates
      const existingVoteIds = new Set(state.votes.map(v => v.id));
      const newVotes = incomingVotes.filter(vote => !existingVoteIds.has(vote.id));
      const allVotes = [...state.votes, ...newVotes];
      
      // Recalculate results
      const results = calculateVoteResults(allVotes);
      const winner = determineWinner(results);
      
      console.log(`🔄 Synced ${newVotes.length} new votes (${allVotes.length} total)`);
      
      return {
        ...state,
        votes: allVotes,
        results,
        winner,
        totalVotes: allVotes.length,
      };
    }

    case 'SET_USER_VOTE_STATUS': {
      const userId = getUserSessionId();
      const userHasVoted = hasUserVoted(state.votes, userId, state.battleId);
      const userVote = getUserVote(state.votes, userId, state.battleId);

      return {
        ...state,
        hasUserVoted: userHasVoted,
        userVote,
      };
    }

    default:
      return state;
  }
};

// Context creation
const BattleContext = createContext<BattleContextType | undefined>(undefined);

// Provider component
interface BattleProviderProps {
  children: ReactNode;
}

export const BattleProvider: React.FC<BattleProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(battleReducer, initialState);

  // Action creators
  const startNewBattle = (pokemon1: Pokemon, pokemon2: Pokemon) => {
    // TODO: Generate unique battle ID
    const battleId = "randomBattleId";
    dispatch({
      type: 'START_BATTLE',
      payload: { pokemon1, pokemon2, battleId },
    });
  };

  const castVote = (pokemonName: string) => {
    dispatch({
      type: 'CAST_VOTE',
      payload: { pokemonName },
    });
  };

  const receiveVote = (vote: Vote) => {
    dispatch({
      type: 'RECEIVE_VOTE',
      payload: vote,
    });
  };

  const resetBattle = () => {
    dispatch({ type: 'RESET_BATTLE' });
  };

  const getCurrentVotes = (): Vote[] => {
    return state.votes;
  };

  const syncVotes = (votes: Vote[]) => {
    dispatch({
      type: 'SYNC_VOTES',
      payload: votes,
    });
  };

  // Update user vote status when votes change
  useEffect(() => {
    if (state.battleId) {
      dispatch({ type: 'SET_USER_VOTE_STATUS' });
    }
  }, [state.votes, state.battleId]);

  const contextValue: BattleContextType = {
    state,
    dispatch,
    startNewBattle,
    castVote,
    receiveVote,
    resetBattle,
    getCurrentVotes,
    syncVotes,
  };

  return (
    <BattleContext.Provider value={contextValue}>
      {children}
    </BattleContext.Provider>
  );
};

// Hook to use battle context
export const useBattleContext = (): BattleContextType => {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattleContext must be used within a BattleProvider');
  }
  return context;
};

export default BattleContext;
