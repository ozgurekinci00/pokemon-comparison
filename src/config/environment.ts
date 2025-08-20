// Environment configuration with fallbacks for local and production deployment

export interface AppConfig {
  appName: string;
  version: string;
  environment: 'development' | 'production' | 'test';
  pokemonApi: {
    baseUrl: string;
  };
  peerjs: {
    host?: string;
    port?: number;
    path?: string;
  };
}

// Default configuration for local development
const defaultConfig: AppConfig = {
  appName: 'Pokemon Battle Royale',
  version: '1.0.0',
  environment: 'development',
  pokemonApi: {
    baseUrl: 'https://pokeapi.co/api/v2',
  },
  peerjs: {
    // Use PeerJS cloud service by default (no host/port needed)
    // This works both locally and on Vercel
  },
};

// Get configuration from environment variables with fallbacks
export const getAppConfig = (): AppConfig => {
  return {
    appName: process.env.REACT_APP_APP_NAME || defaultConfig.appName,
    version: process.env.REACT_APP_VERSION || defaultConfig.version,
    environment: (process.env.REACT_APP_ENVIRONMENT as AppConfig['environment']) || 
                 (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
    pokemonApi: {
      baseUrl: process.env.REACT_APP_POKEMON_API_BASE_URL || defaultConfig.pokemonApi.baseUrl,
    },
    peerjs: {
      host: process.env.REACT_APP_PEERJS_HOST || undefined,
      port: process.env.REACT_APP_PEERJS_PORT ? 
            parseInt(process.env.REACT_APP_PEERJS_PORT, 10) : undefined,
      path: process.env.REACT_APP_PEERJS_PATH || undefined,
    },
  };
};

// Export the configuration
export const appConfig = getAppConfig();

// Log configuration in development
if (appConfig.environment === 'development') {
  console.log('🔧 App Configuration:', {
    ...appConfig,
    // Don't log sensitive data (though we don't have any)
  });
}
