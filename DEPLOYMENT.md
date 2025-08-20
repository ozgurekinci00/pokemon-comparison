# 🚀 Pokemon Battle Royale - Deployment Guide

This guide covers deploying the Pokemon Battle Royale app to Vercel while maintaining local development support.

## 📋 Prerequisites

- Node.js 16+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Git repository

## 🌐 Vercel Deployment

### 1. Prepare for Deployment

The app is already configured for Vercel with:
- ✅ `vercel.json` configuration
- ✅ Environment variable support with fallbacks
- ✅ Static build optimization
- ✅ SPA routing support

### 2. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repository
   - Select the repository
   - Configure project settings:
     - **Framework Preset:** Create React App
     - **Build Command:** `npm run build`
     - **Output Directory:** `build`

3. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

#### Option B: Vercel CLI

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

### 3. Environment Variables (Optional)

If you need to customize the configuration, add these environment variables in your Vercel dashboard:

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_ENVIRONMENT` | Deployment environment | `production` |
| `REACT_APP_APP_NAME` | Application name | `Pokemon Battle Royale` |
| `REACT_APP_VERSION` | App version | `1.0.0` |
| `REACT_APP_POKEMON_API_BASE_URL` | PokéAPI base URL | `https://pokeapi.co/api/v2` |
| `REACT_APP_PEERJS_HOST` | Custom PeerJS server host | _(uses PeerJS cloud)_ |
| `REACT_APP_PEERJS_PORT` | Custom PeerJS server port | _(uses PeerJS cloud)_ |
| `REACT_APP_PEERJS_PATH` | Custom PeerJS server path | _(uses PeerJS cloud)_ |

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm start
```

The app will run on `http://localhost:3000` with hot reloading.

### 3. Build Locally
```bash
# Development build
npm run build:local

# Production build
npm run build:production

# Preview production build
npm run preview
```

## 🔧 Configuration

### Environment Variables

The app uses a configuration system that supports both environment variables and fallbacks:

```typescript
// src/config/environment.ts
export const appConfig = {
  appName: process.env.REACT_APP_APP_NAME || 'Pokemon Battle Royale',
  environment: process.env.REACT_APP_ENVIRONMENT || 'development',
  pokemonApi: {
    baseUrl: process.env.REACT_APP_POKEMON_API_BASE_URL || 'https://pokeapi.co/api/v2'
  },
  peerjs: {
    host: process.env.REACT_APP_PEERJS_HOST, // Optional
    port: process.env.REACT_APP_PEERJS_PORT, // Optional
    path: process.env.REACT_APP_PEERJS_PATH  // Optional
  }
};
```

### PeerJS Configuration

The app uses PeerJS cloud service by default, which works seamlessly on both local and Vercel deployments. If you need a custom PeerJS server:

1. Set environment variables:
   ```
   REACT_APP_PEERJS_HOST=your-peerjs-server.com
   REACT_APP_PEERJS_PORT=9000
   REACT_APP_PEERJS_PATH=/peerjs
   ```

2. The app will automatically use your custom server instead of PeerJS cloud.

## 🌍 Features Working on Vercel

- ✅ **P2P Communication:** WebRTC works across different networks
- ✅ **Real-time Voting:** Instant vote synchronization between peers
- ✅ **Pokemon API:** Fetches Pokemon data from PokéAPI
- ✅ **Static Hosting:** Optimized for Vercel's edge network
- ✅ **Cross-platform:** Works on desktop and mobile browsers
- ✅ **HTTPS:** Secure WebRTC connections on Vercel

## 🚦 Testing the Deployment

1. **Open the deployed URL** in two different browsers or devices
2. **Vote for different Pokemon** to test P2P synchronization
3. **Open a third browser** while voting is active to test late-joiner sync
4. **Try incognito mode** to test multi-tab vote prevention

## 📝 Deployment Checklist

- [ ] Code is pushed to Git repository
- [ ] Vercel project is connected to GitHub
- [ ] Environment variables are configured (if needed)
- [ ] Build succeeds without warnings
- [ ] P2P communication works across different browsers/devices
- [ ] Pokemon API calls are successful
- [ ] Vote synchronization is working correctly

## 🔍 Troubleshooting

### Build Fails
- Check TypeScript errors: `npm run build`
- Ensure all dependencies are installed: `npm install`

### P2P Connection Issues
- Check browser console for WebRTC errors
- Verify STUN/TURN servers are accessible
- Test on different networks/devices

### Pokemon API Issues
- Verify internet connection
- Check if PokéAPI is accessible: `https://pokeapi.co/api/v2/pokemon/1`

## 🎉 You're Ready!

Your Pokemon Battle Royale app is now deployed to Vercel and ready for global P2P battles! 🎮⚔️

The app will work seamlessly on both local development and Vercel production with zero configuration changes needed.
