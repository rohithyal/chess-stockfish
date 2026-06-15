'use client';

import { useState } from 'react';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { ChessComGame } from '@/types';
import { fetchRecentGames } from '@/lib/chess-com';
import GameList from '@/components/GameList';
import ParticleBackground from '@/components/ParticleBackground';

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

  if (view === 'analyzing' && selectedPgn) {
    return (
      <>
        <ParticleBackground />
        <div className="relative z-10">
          <GameAnalyzer
            pgn={selectedPgn}
            onBack={() => { setView('games'); setSelectedPgn(null); }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <ParticleBackground />
      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--accent2)' }}>
            ♟ Chess Analyzer
          </h1>
          <p style={{ color: 'var(--muted)' }}>Analyze your chess.com games with Stockfish</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md mb-8">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="chess.com username"
            className="flex-1 px-4 py-2.5 rounded-lg focus:outline-none transition-colors"
            style={{
              background: 'rgba(30, 18, 8, 0.9)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-opacity disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#120a05' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {loading ? 'Loading…' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="rounded-lg p-4 text-sm mb-6 w-full max-w-2xl"
            style={{ background: 'rgba(180,50,20,0.25)', border: '1px solid #7a2010', color: '#f8a090' }}>
            {error}
          </div>
        )}

        {view === 'games' && games.length > 0 && (
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Recent games for{' '}
                <span style={{ color: 'var(--accent2)' }}>{username}</span>
              </h2>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{games.length} games</span>
            </div>
            <GameList games={games.slice(0, showCount)} username={username} onSelect={(g) => { setSelectedPgn(g.pgn); setView('analyzing'); }} />
            {showCount < games.length && (
              <button
                onClick={() => setShowCount((n) => n + 10)}
                className="mt-4 w-full py-2 flex items-center justify-center gap-1 text-sm transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <ChevronDown size={16} /> Show more
              </button>
            )}
          </div>
        )}

        {view === 'games' && games.length === 0 && !loading && (
          <p style={{ color: 'var(--muted)' }}>No games found for this player.</p>
        )}
      </div>
    </>
  );
}
