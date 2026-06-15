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
  loading: () => <div className="bg-slate-800 rounded" style={{ width: 480, height: 480 }} />,
});

interface Props {
  pgn: string;
  onBack: () => void;
}

export default function GameAnalyzer({ pgn, onBack }: Props) {
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
      .then((result) => {
        if (!cancelled) {
          setAnalysis(result);
          setMoveIndex(result.moves.length);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [pgn]);

  const currentFen = useCallback(() => {
    if (!analysis) return 'start';
    if (moveIndex === 0) {
      const c = new Chess();
      return c.fen();
    }
    return analysis.moves[moveIndex - 1].fen;
  }, [analysis, moveIndex]);

  const currentEval = () => {
    if (!analysis) return { score: 0, mate: null };
    if (moveIndex === 0) return { score: analysis.moves[0]?.evalBefore ?? 0, mate: analysis.moves[0]?.mateBefore ?? null };
    const m = analysis.moves[moveIndex - 1];
    return { score: m.evalAfter, mate: m.mateAfter };
  };

  const nav = (dir: 'first' | 'prev' | 'next' | 'last') => {
    if (!analysis) return;
    const max = analysis.moves.length;
    setMoveIndex((i) => {
      if (dir === 'first') return 0;
      if (dir === 'last') return max;
      if (dir === 'prev') return Math.max(0, i - 1);
      return Math.min(max, i + 1);
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') nav('prev');
      if (e.key === 'ArrowRight') nav('next');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const ev = currentEval();

  return (
    <div className="min-h-screen p-4">
      <button
        onClick={onBack}
        className="mb-4 text-slate-400 hover:text-white flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeft size={16} /> Back to games
      </button>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded p-4 text-red-300 mb-4">
          {error}
        </div>
      )}

      {!analysis && !error && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="animate-spin text-blue-400" size={40} />
          <p className="text-slate-300">
            Analyzing with Stockfish…{' '}
            {progress.total > 0 && (
              <span className="text-blue-400">
                {progress.done}/{progress.total} positions
              </span>
            )}
          </p>
          <div className="w-64 bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      )}

      {analysis && (
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
          {/* Board + eval bar */}
          <div className="flex gap-3 items-center">
            <div style={{ height: 480 }}>
              <EvalBar score={ev.score} mate={ev.mate} />
            </div>
            <div>
              <div className="mb-2 text-center text-slate-400 text-sm">
                <span className="text-white font-medium">{analysis.black}</span>
                <span className="mx-2">vs</span>
                <span className="text-white font-medium">{analysis.white}</span>
                <span className="mx-2 text-slate-500">·</span>
                <span>{analysis.date}</span>
              </div>
              <Chessboard
                position={currentFen()}
                boardWidth={480}
                areArrowsAllowed={false}
                customBoardStyle={{ borderRadius: 4 }}
                customDarkSquareStyle={{ backgroundColor: '#b58863' }}
                customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
              />
              <div className="flex justify-center gap-2 mt-3">
                {(['first', 'prev', 'next', 'last'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => nav(dir)}
                    className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                  >
                    {dir === 'first' && <ChevronsLeft size={18} />}
                    {dir === 'prev' && <ChevronLeft size={18} />}
                    {dir === 'next' && <ChevronRight size={18} />}
                    {dir === 'last' && <ChevronsRight size={18} />}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-slate-500 mt-2">Use arrow keys to navigate</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-3 w-full lg:w-72" style={{ maxHeight: 600 }}>
            <div className="bg-slate-800/50 rounded px-3 py-2 text-sm text-slate-400">
              {analysis.opening}
            </div>

            <AccuracyCard analysis={analysis} />

            <div
              className="bg-slate-800/50 rounded flex flex-col overflow-hidden"
              style={{ flex: 1, minHeight: 0 }}
            >
              <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-700 flex justify-between">
                <span>White</span>
                <span>Move</span>
                <span>Black</span>
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
