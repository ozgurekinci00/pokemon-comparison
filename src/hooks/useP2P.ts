// Custom hook for P2P WebRTC functionality

import { useState, useEffect, useCallback, useRef } from 'react';
import { p2pService } from '../services/p2pService';
import { P2PConnectionState, P2PStatus } from '../types/p2p';
import { useBattleContext } from '../context/BattleContext';

interface UseP2PReturn {
  connectionState: P2PConnectionState;
  connectedPeersCount: number;
  status: P2PStatus;
  isConnected: boolean;
  initialize: (pokemon1: string, pokemon2: string) => Promise<void>;
  broadcastVote: (pokemonName: string, userId: string) => Promise<void>;
  disconnect: () => void;
  requestSync: () => Promise<void>;
}

export const useP2P = (): UseP2PReturn => {
  const [connectionState, setConnectionState] = useState<P2PConnectionState>(
    p2pService.getConnectionState()
  );
  const [status, setStatus] = useState<P2PStatus>('offline');
  
  const { receiveVote } = useBattleContext();
  const isInitialized = useRef(false);
  
  // Update connection state when it changes
  const updateConnectionState = useCallback(() => {
    setConnectionState(p2pService.getConnectionState());
  }, []);

  // Initialize P2P service
  const initialize = useCallback(async (pokemon1: string, pokemon2: string) => {
    if (isInitialized.current) {
      console.log('⚠️ P2P already initialized, skipping...');
      return;
    }

    try {
      console.log('🚀 Initializing P2P connection...');
      await p2pService.initialize(pokemon1, pokemon2);
      isInitialized.current = true;
      updateConnectionState();
    } catch (error) {
      console.error('❌ Failed to initialize P2P:', error);
    }
  }, [updateConnectionState]);

  // Broadcast vote to all peers
  const broadcastVote = useCallback(async (pokemonName: string, userId: string) => {
    try {
      await p2pService.broadcastVote(pokemonName, userId);
      console.log(`📤 Vote broadcasted for ${pokemonName}`);
    } catch (error) {
      console.error('❌ Failed to broadcast vote:', error);
    }
  }, []);

  // Request state sync from peers
  const requestSync = useCallback(async () => {
    try {
      await p2pService.requestSync();
      console.log('🔄 Sync requested from peers');
    } catch (error) {
      console.error('❌ Failed to request sync:', error);
    }
  }, []);

  // Disconnect from all peers
  const disconnect = useCallback(() => {
    p2pService.disconnect();
    isInitialized.current = false;
    updateConnectionState();
  }, [updateConnectionState]);

  // Set up event handlers
  useEffect(() => {
    // Handle incoming votes
    p2pService.onVoteReceived((voteData) => {
      console.log('📥 Received vote from peer:', voteData);
      
      // Create vote object compatible with our context
      const vote = {
        id: voteData.voteId,
        userId: voteData.userId,
        pokemonName: voteData.pokemonName,
        battleId: connectionState.roomId,
        timestamp: voteData.timestamp,
        sessionId: voteData.userId, // Use userId as sessionId for P2P votes
      };
      
      receiveVote(vote);
    });

    // Handle peer connections
    p2pService.onPeerConnected((peerId) => {
      console.log(`✅ Peer connected: ${peerId}`);
      updateConnectionState();
    });

    // Handle peer disconnections
    p2pService.onPeerDisconnected((peerId) => {
      console.log(`🔌 Peer disconnected: ${peerId}`);
      updateConnectionState();
    });

    // Handle connection status changes
    p2pService.onConnectionStatusChanged((newStatus) => {
      console.log(`📡 Connection status changed: ${newStatus}`);
      setStatus(newStatus);
      updateConnectionState();
    });

    // Handle errors
    p2pService.onError((error) => {
      console.error('❌ P2P Error:', error);
      setStatus('error');
    });

    // Handle sync responses
    p2pService.onSyncReceived((syncData) => {
      console.log('🔄 Received sync data:', syncData);
      // TODO: Process sync data if needed
    });

    // Cleanup function
    return () => {
      // Event handlers are managed by the service
    };
  }, [receiveVote, updateConnectionState, connectionState.roomId]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  return {
    connectionState,
    connectedPeersCount: connectionState.connectedPeers.size,
    status,
    isConnected: status === 'connected',
    initialize,
    broadcastVote,
    disconnect,
    requestSync,
  };
};
