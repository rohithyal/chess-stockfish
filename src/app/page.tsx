'use client';

import { useState } from 'react';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { ChessComGame } from '@/types';
import { fetchRecentGames } from '@/lib/chess-com';
import GameList from '@/components/GameList';

const GameAnalyzer = dynamic(() => import('@/components/GameAnalyzer'), { ssr: false });

type View = 'search' | 'games' | 'analyzing';

export default function Home() {
  const [view, setView] = useState<View>('search');
  const [username, setUsername] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [selectedPgn, setSelectedPgn] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(10);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const name = inputVal.trim();
    if (!name) return;

    setLoading(true);
    setError(null);
    setGames([]);
    setShowCount(10);

    try {
      const fetched = await fetchRecentGames(name, 50);
      setGames(fetched);
      setUsername(name);
      setView('games');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  }

  function handleGameSelect(game: ChessComGame) {
    setSelectedPgn(game.pgn);
    setView('analyzing');
  }

  if (view === 'analyzing' && selectedPgn) {
    return (
      <GameAnalyzer
        pgn={selectedPgn}
        onBack={() => {
          setView('games');
          setSelectedPgn(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
          ♟ Chess Analyzer
        </h1>
        <p className="text-slate-400">Analyze your chess.com games with Stockfish</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md mb-8">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="chess.com username"
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          {loading ? 'Loading…' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm mb-6 w-full max-w-2xl">
          {error}
        </div>
      )}

      {view === 'games' && games.length > 0 && (
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Recent games for{' '}
              <span className="text-blue-400">{username}</span>
            </h2>
            <span className="text-slate-500 text-sm">{games.length} games</span>
          </div>

          <GameList
            games={games.slice(0, showCount)}
            username={username}
            onSelect={handleGameSelect}
          />

          {showCount < games.length && (
            <button
              onClick={() => setShowCount((n) => n + 10)}
              className="mt-4 w-full py-2 text-slate-400 hover:text-white text-sm flex items-center justify-center gap-1 transition-colors"
            >
              <ChevronDown size={16} /> Show more
            </button>
          )}
        </div>
      )}

      {view === 'games' && games.length === 0 && !loading && (
        <p className="text-slate-500">No games found for this player.</p>
      )}
    </div>
  );
}
