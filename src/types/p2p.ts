// P2P WebRTC and messaging types

import { DataConnection } from 'peerjs';

export interface P2PMessage {
  type: 'VOTE' | 'BATTLE_START' | 'PEER_JOIN' | 'PEER_LEAVE' | 'SYNC_REQUEST' | 'SYNC_RESPONSE' | 'HEARTBEAT';
  payload: any;
  timestamp: number;
  peerId: string;
  messageId: string;
  battleId?: string;
}

export interface P2PVoteMessage extends P2PMessage {
  type: 'VOTE';
  payload: {
    pokemonName: string;
    userId: string;
    voteId: string;
    timestamp: number;
  };
}

export interface P2PSyncMessage extends P2PMessage {
  type: 'SYNC_REQUEST' | 'SYNC_RESPONSE';
  payload: {
    votes: Array<{
      id: string;
      userId: string;
      pokemonName: string;
      battleId: string;
      timestamp: number;
    }>;
    battleState?: {
      battleId: string;
      pokemon1Name: string;
      pokemon2Name: string;
      startTime: number;
    };
  };
}

export interface PeerConnection {
  id: string;
  connection: DataConnection;
  connectedAt: number;
  lastSeen: number;
  isReliable: boolean;
  latency?: number;
}

export interface P2PConnectionState {
  peerId: string;
  isConnected: boolean;
  connectedPeers: Map<string, PeerConnection>;
  connectionAttempts: number;
  lastConnectionAttempt?: number;
  roomId: string;
  status: P2PStatus;
  error?: string;
}

export interface P2PEventHandlers {
  onVoteReceived: (vote: P2PVoteMessage['payload']) => void;
  onBattleStarted: (battle: any) => void;
  onPeerConnected: (peerId: string) => void;
  onPeerDisconnected: (peerId: string) => void;
  onConnectionStatusChanged: (status: P2PStatus) => void;
  onError: (error: string) => void;
  onSyncReceived: (data: P2PSyncMessage['payload']) => void;
}

export interface P2PServiceConfig {
  maxConnections: number;
  connectionTimeout: number;
  heartbeatInterval: number;
  discoveryTimeout: number;
  reconnectAttempts: number;
  reconnectDelay: number;
}

export type P2PStatus = 'offline' | 'discovering' | 'connecting' | 'connected' | 'error' | 'disconnected';
