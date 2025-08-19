// P2P WebRTC service for serverless real-time communication

import Peer, { DataConnection } from 'peerjs';
import {
  P2PMessage,
  P2PVoteMessage,
  P2PSyncMessage,
  PeerConnection,
  P2PConnectionState,
  P2PEventHandlers,
  P2PServiceConfig,
  P2PStatus
} from '../types/p2p';

class P2PService {
  private peer: Peer | null = null;
  private state: P2PConnectionState = {
    peerId: '',
    isConnected: false,
    connectedPeers: new Map(),
    connectionAttempts: 0,
    roomId: '',
    status: 'offline'
  };
  
  private eventHandlers: Partial<P2PEventHandlers> = {};
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private discoveryTimeout: NodeJS.Timeout | null = null;
  
  private readonly config: P2PServiceConfig = {
    maxConnections: 8,
    connectionTimeout: 10000,
    heartbeatInterval: 30000,
    discoveryTimeout: 5000,
    reconnectAttempts: 3,
    reconnectDelay: 2000
  };

  /**
   * Initialize P2P service with deterministic room-based discovery
   */
  async initialize(pokemon1: string, pokemon2: string): Promise<void> {
    try {
      this.updateStatus('discovering');
      
      // Generate deterministic room ID
      this.state.roomId = this.generateRoomId(pokemon1, pokemon2);
      
      // Create unique peer ID for this session
      this.state.peerId = this.generatePeerId(this.state.roomId);
      
      console.log(`🔗 Initializing P2P service...`);
      console.log(`📍 Room: ${this.state.roomId}`);
      console.log(`🆔 Peer ID: ${this.state.peerId}`);
      
      try {
        await this.createPeer();
        await this.discoverPeers();
        this.startHeartbeat();
        this.updateStatus('connected');
        console.log(`✅ P2P service initialized successfully`);
      } catch (peerError) {
        console.warn('⚠️ PeerJS connection failed, enabling fallback mode:', peerError);
        this.enableLocalFallbackMode();
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize P2P service:', error);
      // Even if P2P fails, don't break the app - enable fallback
      this.enableLocalFallbackMode();
    }
  }

  /**
   * Send vote to all connected peers
   */
  async broadcastVote(pokemonName: string, userId: string): Promise<void> {
    const voteMessage: P2PVoteMessage = {
      type: 'VOTE',
      payload: {
        pokemonName,
        userId,
        voteId: this.generateMessageId(),
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      peerId: this.state.peerId,
      messageId: this.generateMessageId(),
      battleId: this.state.roomId
    };

    console.log(`📤 Broadcasting vote:`, voteMessage.payload);
    
    // Only broadcast if we have actual P2P connections
    if (this.state.connectedPeers.size > 0) {
      await this.broadcastMessage(voteMessage);
      console.log(`✅ Vote broadcasted to ${this.state.connectedPeers.size} peer(s)`);
    } else {
      console.log('⚠️ No P2P connections available - vote not broadcasted');
    }
  }

  /**
   * Request full state sync from connected peers
   */
  async requestSync(): Promise<void> {
    const syncRequest: P2PSyncMessage = {
      type: 'SYNC_REQUEST',
      payload: { votes: [] },
      timestamp: Date.now(),
      peerId: this.state.peerId,
      messageId: this.generateMessageId(),
      battleId: this.state.roomId
    };

    console.log(`🔄 Requesting sync from peers...`);
    await this.broadcastMessage(syncRequest);
  }

  /**
   * Disconnect from all peers and cleanup
   */
  disconnect(): void {
    console.log(`🔌 Disconnecting P2P service...`);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.discoveryTimeout) {
      clearTimeout(this.discoveryTimeout);
    }

    // Close all peer connections
    this.state.connectedPeers.forEach((peerConn, peerId) => {
      peerConn.connection.close();
    });
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.state.connectedPeers.clear();
    this.updateStatus('offline');
  }

  /**
   * Get current connection state
   */
  getConnectionState(): P2PConnectionState {
    return { ...this.state };
  }

  /**
   * Set event handlers
   */
  onVoteReceived(callback: P2PEventHandlers['onVoteReceived']): void {
    this.eventHandlers.onVoteReceived = callback;
  }

  onPeerConnected(callback: P2PEventHandlers['onPeerConnected']): void {
    this.eventHandlers.onPeerConnected = callback;
  }

  onPeerDisconnected(callback: P2PEventHandlers['onPeerDisconnected']): void {
    this.eventHandlers.onPeerDisconnected = callback;
  }

  onConnectionStatusChanged(callback: P2PEventHandlers['onConnectionStatusChanged']): void {
    this.eventHandlers.onConnectionStatusChanged = callback;
  }

  onError(callback: P2PEventHandlers['onError']): void {
    this.eventHandlers.onError = callback;
  }

  onSyncReceived(callback: P2PEventHandlers['onSyncReceived']): void {
    this.eventHandlers.onSyncReceived = callback;
  }

  /**
   * Private implementation methods
   */
  private async createPeer(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          console.log(`🔄 Creating peer with ID: ${this.state.peerId} (attempt ${attempts + 1}/${maxAttempts})`);
          
          // Use PeerJS cloud with comprehensive STUN/TURN configuration for cross-network connectivity
          this.peer = new Peer(this.state.peerId, {
            debug: 1, // Reduce debug output for cleaner logs
            config: {
              iceServers: [
                // Google STUN servers
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                // Alternative STUN servers
                { urls: 'stun:global.stun.twilio.com:3478' },
                { urls: 'stun:stun.cloudflare.com:3478' },
                // Free TURN servers (for NAT traversal)
                {
                  urls: 'turn:openrelay.metered.ca:80',
                  username: 'openrelayproject',
                  credential: 'openrelayproject'
                },
                {
                  urls: 'turn:openrelay.metered.ca:443',
                  username: 'openrelayproject',
                  credential: 'openrelayproject'
                }
              ],
              iceCandidatePoolSize: 10
            },
            // Increase connection timeout for cross-network scenarios
            pingInterval: 5000
          });

          await this.setupPeerEvents(resolve, reject);
          return; // Success, exit the retry loop

        } catch (error) {
          attempts++;
          console.warn(`⚠️ Peer creation attempt ${attempts} failed:`, error);
          
          if (attempts >= maxAttempts) {
            reject(error);
            return;
          }
          
          // Generate a new peer ID for retry
          this.state.peerId = this.generatePeerId(this.state.roomId);
          console.log(`🔄 Retrying with new peer ID: ${this.state.peerId}`);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    });
  }

  private async setupPeerEvents(resolve: () => void, reject: (error: any) => void): Promise<void> {
    if (!this.peer) return;

    const timeout = setTimeout(() => {
      reject(new Error('Peer creation timeout'));
    }, 10000);

    this.peer.on('open', (id) => {
      console.log(`🟢 Peer created with ID: ${id}`);
      clearTimeout(timeout);
      this.state.peerId = id;
      resolve();
    });

    this.peer.on('connection', (conn) => {
      console.log(`📞 Incoming connection from: ${conn.peer}`);
      this.handleIncomingConnection(conn);
    });

    this.peer.on('error', (error) => {
      console.error('❌ Peer error:', error);
      clearTimeout(timeout);
      this.handlePeerError(error);
      reject(error);
    });

    this.peer.on('close', () => {
      console.log('🔌 Peer connection closed');
      this.updateStatus('offline');
    });

    this.peer.on('disconnected', () => {
      console.log('⚠️ Peer disconnected from broker');
      this.attemptReconnection();
    });
  }

  private async discoverPeers(): Promise<void> {
    console.log(`🔍 Discovering peers in room: ${this.state.roomId}...`);
    console.log(`🆔 My peer ID: ${this.state.peerId}`);
    
    const discoveryPromises: Promise<void>[] = [];
    
    // Try to connect to all possible peer IDs using the same format we generate
    for (let i = 1; i <= 100; i++) {
      const candidatePeerId = `${this.state.roomId}_${i}`;
      
      // Don't try to connect to ourselves
      if (candidatePeerId !== this.state.peerId) {
        discoveryPromises.push(this.attemptConnection(candidatePeerId));
      }
    }

    console.log(`🔄 Attempting to discover ${discoveryPromises.length} potential peers...`);

    // Extended discovery timeout for cross-network connections
    const extendedTimeout = 10000; // 10 seconds
    
    try {
      await Promise.race([
        Promise.allSettled(discoveryPromises),
        new Promise(resolve => setTimeout(resolve, extendedTimeout))
      ]);
    } catch (error) {
      console.warn('⚠️ Discovery timeout or error:', error);
    }

    console.log(`📊 Discovery complete. Connected to ${this.state.connectedPeers.size} peers`);
    
    if (this.state.connectedPeers.size === 0) {
      console.log('💡 No peers found. Try:');
      console.log('   1. Open app in another browser tab/window');
      console.log('   2. Open app on another device');
      console.log('   3. Wait a few seconds and refresh');
    } else {
      console.log(`✅ Successfully connected to peers: ${Array.from(this.state.connectedPeers.keys()).join(', ')}`);
    }
  }

  private async attemptConnection(peerId: string): Promise<void> {
    try {
      if (!this.peer || this.state.connectedPeers.has(peerId)) {
        return;
      }

      const conn = this.peer.connect(peerId, {
        reliable: true,
        serialization: 'json'
      });

      if (conn) {
        await this.setupConnection(conn);
      }
    } catch (error) {
      // Silent fail for discovery attempts
    }
  }

  private async setupConnection(conn: DataConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      conn.on('open', () => {
        clearTimeout(timeout);
        
        const peerConnection: PeerConnection = {
          id: conn.peer,
          connection: conn,
          connectedAt: Date.now(),
          lastSeen: Date.now(),
          isReliable: conn.reliable
        };

        this.state.connectedPeers.set(conn.peer, peerConnection);
        
        console.log(`✅ Connected to peer: ${conn.peer}`);
        this.eventHandlers.onPeerConnected?.(conn.peer);
        
        resolve();
      });

      conn.on('data', (data) => {
        this.handleMessage(data as P2PMessage, conn.peer);
      });

      conn.on('close', () => {
        this.handlePeerDisconnection(conn.peer);
      });

      conn.on('error', (error) => {
        console.error(`❌ Connection error with ${conn.peer}:`, error);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private handleIncomingConnection(conn: DataConnection): void {
    // Only accept connections from our room
    if (!conn.peer.startsWith(this.state.roomId.split('_')[0])) {
      console.log(`🚫 Rejecting connection from different room: ${conn.peer}`);
      conn.close();
      return;
    }

    this.setupConnection(conn).catch(error => {
      console.error('❌ Failed to setup incoming connection:', error);
    });
  }

  private handleMessage(message: P2PMessage, fromPeer: string): void {
    // Update last seen time
    const peerConn = this.state.connectedPeers.get(fromPeer);
    if (peerConn) {
      peerConn.lastSeen = Date.now();
    }

    console.log(`📥 Received ${message.type} from ${fromPeer}:`, message.payload);

    switch (message.type) {
      case 'VOTE':
        this.eventHandlers.onVoteReceived?.(message.payload);
        break;
      case 'SYNC_REQUEST':
        this.handleSyncRequest(message as P2PSyncMessage, fromPeer);
        break;
      case 'SYNC_RESPONSE':
        this.eventHandlers.onSyncReceived?.(message.payload);
        break;
      case 'HEARTBEAT':
        // Heartbeat received, peer is alive
        break;
    }
  }

  private async handleSyncRequest(message: P2PSyncMessage, fromPeer: string): Promise<void> {
    // Send our current state to the requesting peer
    const peerConn = this.state.connectedPeers.get(fromPeer);
    if (peerConn) {
      const syncResponse: P2PSyncMessage = {
        type: 'SYNC_RESPONSE',
        payload: { votes: [] }, // Will be populated by the caller
        timestamp: Date.now(),
        peerId: this.state.peerId,
        messageId: this.generateMessageId(),
        battleId: this.state.roomId
      };

      peerConn.connection.send(syncResponse);
    }
  }

  private handlePeerDisconnection(peerId: string): void {
    console.log(`🔌 Peer disconnected: ${peerId}`);
    this.state.connectedPeers.delete(peerId);
    this.eventHandlers.onPeerDisconnected?.(peerId);
  }

  private async broadcastMessage(message: P2PMessage): Promise<void> {
    const promises: Promise<void>[] = [];

    this.state.connectedPeers.forEach((peerConn, peerId) => {
      promises.push(
        new Promise((resolve) => {
          try {
            peerConn.connection.send(message);
            resolve();
          } catch (error) {
            console.error(`❌ Failed to send message to ${peerId}:`, error);
            resolve(); // Don't fail the whole broadcast
          }
        })
      );
    });

    await Promise.allSettled(promises);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const heartbeat: P2PMessage = {
        type: 'HEARTBEAT',
        payload: {},
        timestamp: Date.now(),
        peerId: this.state.peerId,
        messageId: this.generateMessageId()
      };

      this.broadcastMessage(heartbeat);
    }, this.config.heartbeatInterval);
  }

  private async attemptReconnection(): Promise<void> {
    if (this.state.connectionAttempts >= this.config.reconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.updateStatus('error');
      return;
    }

    this.state.connectionAttempts++;
    console.log(`🔄 Attempting reconnection (${this.state.connectionAttempts}/${this.config.reconnectAttempts})...`);

    setTimeout(async () => {
      try {
        if (this.peer) {
          this.peer.reconnect();
        }
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        this.attemptReconnection();
      }
    }, this.config.reconnectDelay);
  }

  private generateRoomId(pokemon1: string, pokemon2: string): string {
    const sorted = [pokemon1, pokemon2].sort();
    return `battle_${sorted[0]}_vs_${sorted[1]}`;
  }

  private generatePeerId(roomId: string): string {
    // Use a deterministic approach: room + random number from 1-100
    const randomNum = Math.floor(Math.random() * 100) + 1;
    return `${roomId}_${randomNum}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private updateStatus(status: P2PStatus): void {
    this.state.status = status;
    this.eventHandlers.onConnectionStatusChanged?.(status);
  }

  private handleError(error: Error): void {
    this.state.error = error.message;
    this.updateStatus('error');
    this.eventHandlers.onError?.(error.message);
  }

  private handlePeerError(error: any): void {
    console.error('🔥 PeerJS Error Details:', error);
    
    // Handle specific PeerJS error types
    if (error.type === 'network') {
      console.log('🌐 Network error - will try local fallback mode');
      this.enableLocalFallbackMode();
    } else if (error.type === 'server-error') {
      console.log('🛡️ Server error - switching to offline mode');
      this.updateStatus('error');
    } else if (error.type === 'unavailable-id') {
      console.log('🔄 ID unavailable - generating new ID');
      this.regeneratePeerId();
    }
  }

  private enableLocalFallbackMode(): void {
    console.log('⚠️ P2P connection failed - app will work locally but no real-time sync');
    this.updateStatus('error');
    
    // Don't simulate votes - show error state to user
    console.log('💡 To test P2P: Open app on different devices/networks and ensure firewall allows WebRTC');
  }



  private regeneratePeerId(): void {
    this.state.peerId = this.generatePeerId(this.state.roomId);
    console.log(`🔄 Generated new peer ID: ${this.state.peerId}`);
  }
}

// Export singleton instance
export const p2pService = new P2PService();
export default p2pService;
