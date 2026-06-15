'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import type { GameAnalysis } from '@/types';
import { analyzePgn } from '@/lib/analysis';
import EvalBar from './EvalBar';
import MoveList from './MoveList';
import AccuracyCard from './AccuracyCard';

const Chessboard = dynamic(() => import('react-chessboard').then((m) => m.Chessboard), {
  ssr: false,
  loading: () => <div style={{ background: 'var(--surface)', borderRadius: 6, width: '100%', aspectRatio: '1' }} />,
});

function useBoardSize(): number {
  const [size, setSize] = useState(360);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < 768) {
        // Mobile: board fills width minus padding (16px each side), leave vertical room for controls
        const byW = w - 32;
        const byH = Math.floor(h * 0.52);
        setSize(Math.max(200, Math.min(byW, byH)));
      } else {
        // Desktop/tablet: board sits left of a 288px sidebar with gaps
        const available = Math.min(w - 320 - 64, h - 120);
        setSize(Math.max(280, Math.min(480, available)));
      }
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return size;
}

interface Props {
  pgn: string;
  onBack: () => void;
}

export default function GameAnalyzer({ pgn, onBack }: Props) {
  const boardSize = useBoardSize();
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setAnalysis(null);
    setError(null);
    setMoveIndex(0);

    analyzePgn(pgn, 15, (done, total) => {
      if (!cancelled) setProgress({ done, total });
    })
      .then((r) => { if (!cancelled) { setAnalysis(r); setMoveIndex(r.moves.length); } })
      .catch((e) => { if (!cancelled) setError(e.message); });

    return () => { cancelled = true; };
  }, [pgn]);

  const currentFen = useCallback((): string => {
    if (!analysis) return new Chess().fen();
    if (moveIndex === 0) return new Chess().fen();
    return analysis.moves[moveIndex - 1].fen;
  }, [analysis, moveIndex]);

  const currentEval = () => {
    if (!analysis) return { score: 0, mate: null };
    if (moveIndex === 0) return { score: analysis.moves[0]?.evalBefore ?? 0, mate: analysis.moves[0]?.mateBefore ?? null };
    const m = analysis.moves[moveIndex - 1];
    return { score: m.evalAfter, mate: m.mateAfter };
  };

  const nav = (dir: 'first' | 'prev' | 'next' | 'last') =>
    setMoveIndex((i) => {
      if (!analysis) return i;
      const max = analysis.moves.length;
      if (dir === 'first') return 0;
      if (dir === 'last') return max;
      if (dir === 'prev') return Math.max(0, i - 1);
      return Math.min(max, i + 1);
    });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') nav('prev');
      if (e.key === 'ArrowRight') nav('next');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const ev = currentEval();
  const navBtnStyle = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' };

  return (
    <div className="min-h-screen p-3 md:p-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm transition-colors"
        style={{ color: 'var(--muted)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
      >
        <ChevronLeft size={16} /> Back to games
      </button>

      {error && (
        <div className="rounded-lg p-4 mb-4 text-sm"
          style={{ background: 'rgba(180,50,20,0.25)', border: '1px solid #7a2010', color: '#f8a090' }}>
          {error}
        </div>
      )}

      {!analysis && !error && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <p style={{ color: 'var(--text)' }}>
            Analyzing with Stockfish…{' '}
            {progress.total > 0 && (
              <span style={{ color: 'var(--accent2)' }}>
                {progress.done}/{progress.total}
              </span>
            )}
          </p>
          <div className="w-64 rounded-full h-2 overflow-hidden" style={{ background: 'var(--surface2)' }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%',
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>
      )}

      {analysis && (
        /* Mobile: column. Desktop: row */
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
          {/* Board area */}
          <div className="flex gap-2 items-center w-full lg:w-auto justify-center">
            {/* Eval bar */}
            <EvalBar score={ev.score} mate={ev.mate} height={boardSize} />

            <div style={{ width: boardSize }}>
              {/* Player names */}
              <div className="mb-1.5 text-center text-xs" style={{ color: 'var(--muted)' }}>
                <span style={{ color: 'var(--text)' }}>{analysis.black}</span>
                <span className="mx-1.5">vs</span>
                <span style={{ color: 'var(--text)' }}>{analysis.white}</span>
                {analysis.date && <span className="ml-1.5">· {analysis.date}</span>}
              </div>

              <Chessboard
                position={currentFen()}
                boardWidth={boardSize}
                areArrowsAllowed={false}
                customBoardStyle={{ borderRadius: 6, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
                customDarkSquareStyle={{ backgroundColor: '#7a3a10' }}
                customLightSquareStyle={{ backgroundColor: '#f5edd8' }}
              />

              {/* Nav controls */}
              <div className="flex justify-center gap-2 mt-3">
                {(['first', 'prev', 'next', 'last'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => nav(dir)}
                    className="p-2 rounded transition-opacity hover:opacity-80"
                    style={navBtnStyle}
                  >
                    {dir === 'first' && <ChevronsLeft size={16} />}
                    {dir === 'prev' && <ChevronLeft size={16} />}
                    {dir === 'next' && <ChevronRight size={16} />}
                    {dir === 'last' && <ChevronsRight size={16} />}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                ← → arrow keys to navigate
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div
            className="flex flex-col gap-3 w-full"
            style={{ maxWidth: '100%', width: '100%', ...(typeof window !== 'undefined' && window.innerWidth >= 1024 ? { width: 288, maxHeight: boardSize + 80 } : {}) }}
          >
            {/* Opening */}
            <div className="card px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
              {analysis.opening}
            </div>

            <AccuracyCard analysis={analysis} />

            {/* Move list */}
            <div
              className="card flex flex-col overflow-hidden"
              style={{ flex: 1, minHeight: 0, maxHeight: 300 }}
            >
              <div
                className="px-3 py-1.5 text-xs flex justify-between"
                style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}
              >
                <span>White</span><span>Move</span><span>Black</span>
              </div>
              <MoveList
                moves={analysis.moves}
                currentIndex={moveIndex}
                onSelect={setMoveIndex}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
