// Connection status component for P2P networking

import React from 'react';
import { P2PStatus } from '../../types/p2p';

interface ConnectionStatusProps {
  status: P2PStatus;
  connectedPeersCount: number;
  peerId?: string;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  connectedPeersCount,
  peerId,
  className = ''
}) => {
  const getStatusConfig = (status: P2PStatus) => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '🟢',
          message: connectedPeersCount > 0 
            ? `Connected to ${connectedPeersCount} peer${connectedPeersCount !== 1 ? 's' : ''}` 
            : 'Ready for P2P connections',
          dotColor: 'bg-green-500',
          showPulse: true
        };
      
      case 'connecting':
      case 'discovering':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '🔄',
          message: status === 'discovering' ? 'Discovering peers...' : 'Connecting...',
          dotColor: 'bg-yellow-500',
          showPulse: true
        };
      
      case 'error':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '❌',
          message: 'Connection error',
          dotColor: 'bg-red-500',
          showPulse: false
        };
      
      case 'offline':
      case 'disconnected':
      default:
        return {
          color: 'bg-gray-100 text-gray-600 border-gray-200',
          icon: '⚫',
          message: status === 'disconnected' ? 'Disconnected' : 'Offline',
          dotColor: 'bg-gray-400',
          showPulse: false
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium ${config.color} ${className}`}>
      {/* Status dot with optional pulse animation */}
      <div className="relative mr-2">
        <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
        {config.showPulse && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.dotColor} animate-ping opacity-75`}></div>
        )}
      </div>
      
      {/* Status message */}
      <span className="mr-2">{config.message}</span>
      
      {/* Real-time indicator for connected state */}
      {status === 'connected' && connectedPeersCount > 0 && (
        <span className="text-xs opacity-75">• Real-time</span>
      )}
      
      {/* Peer ID display (for debugging) */}
      {peerId && process.env.NODE_ENV === 'development' && (
        <details className="ml-2">
          <summary className="cursor-pointer text-xs opacity-50">ID</summary>
          <div className="absolute z-10 mt-1 p-2 bg-black text-white text-xs rounded shadow-lg max-w-xs break-all">
            {peerId}
          </div>
        </details>
      )}
    </div>
  );
};

export default ConnectionStatus;
