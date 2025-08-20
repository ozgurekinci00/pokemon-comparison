import React from 'react';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { BattleProvider } from './context/BattleContext';
import BattleArena from './components/BattleArena';

function App() {
  return (
    <ErrorBoundary>
      <BattleProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Pokémon Battle Royale
                </h1>
                <p className="text-lg text-gray-600">
                  Vote for your favorite Pokémon and see real-time results!
                </p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            <BattleArena />
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-16">
            <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
              <p>Built with React, TypeScript, TailwindCSS, and PokéAPI</p>
            </div>
          </footer>
        </div>
      </BattleProvider>
    </ErrorBoundary>
  );
}

export default App;
