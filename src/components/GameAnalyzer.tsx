'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import type { GameAnalysis } from '@/types';
import type { Square } from 'react-chessboard/dist/chessboard/types';
import { analyzePgn } from '@/lib/analysis';
import EvalBar from './EvalBar';
import MoveList from './MoveList';
import AccuracyCard from './AccuracyCard';
import MoveInfoPanel from './MoveInfoPanel';

const Chessboard = dynamic(() => import('react-chessboard').then((m) => m.Chessboard), {
  ssr: false,
  loading: () => <div style={{ background: 'var(--surface)', borderRadius: 6, aspectRatio: '1', width: '100%' }} />,
});

// ── Board size hook ──────────────────────────────────────────────────────
function useBoardSize(): number {
  const [size, setSize] = useState(360);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < 1024) {
        setSize(Math.max(240, Math.min(w - 32, Math.floor(h * 0.5))));
      } else {
        // Right panel ≈ 320px + gaps
        setSize(Math.max(300, Math.min(500, Math.min(w - 380, h - 140))));
      }
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  return size;
}

// ── Board arrows ──────────────────────────────────────────────────────────
function buildArrows(analysis: GameAnalysis, moveIndex: number): [Square, Square, string][] {
  const m = analysis.moves[moveIndex];
  if (!m) return [];
  const out: [Square, Square, string][] = [];
  if (m.bestMove?.length >= 4)
    out.push([m.bestMove.slice(0,2) as Square, m.bestMove.slice(2,4) as Square, 'rgba(80,220,100,0.9)']);
  if (m.altMove?.length >= 4 && m.altMove !== m.bestMove)
    out.push([m.altMove.slice(0,2) as Square, m.altMove.slice(2,4) as Square, 'rgba(80,160,240,0.55)']);
  return out;
}

// ── Result label ──────────────────────────────────────────────────────────
function resultLabel(result: string, forWhite: boolean) {
  if (result === '1-0') return forWhite ? '1' : '0';
  if (result === '0-1') return forWhite ? '0' : '1';
  if (result === '1/2-1/2') return '½';
  return '';
}

interface Props {
  pgn: string;
  onBack: () => void;
}

export default function GameAnalyzer({ pgn, onBack }: Props) {
  const boardSize   = useBoardSize();
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError]       = useState<string | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setAnalysis(null); setError(null); setMoveIndex(0);
    analyzePgn(pgn, 15, (d, t) => { if (!cancelled) setProgress({ done: d, total: t }); })
      .then(r => { if (!cancelled) { setAnalysis(r); setMoveIndex(r.moves.length); } })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [pgn]);

  const currentFen = useCallback((): string =>
    !analysis || moveIndex === 0 ? new Chess().fen() : analysis.moves[moveIndex - 1].fen,
  [analysis, moveIndex]);

  const currentEval = () => {
    if (!analysis) return { score: 0, mate: null as number | null };
    if (moveIndex === 0) return { score: analysis.moves[0]?.evalBefore ?? 0, mate: analysis.moves[0]?.mateBefore ?? null };
    const m = analysis.moves[moveIndex - 1];
    return { score: m.evalAfter, mate: m.mateAfter };
  };

  const nav = useCallback((dir: 'first' | 'prev' | 'next' | 'last') =>
    setMoveIndex(i => {
      if (!analysis) return i;
      const max = analysis.moves.length;
      if (dir === 'first') return 0;
      if (dir === 'last')  return max;
      if (dir === 'prev')  return Math.max(0, i - 1);
      return Math.min(max, i + 1);
    }), [analysis]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  nav('prev');
      if (e.key === 'ArrowRight') nav('next');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [nav]);

  const ev       = currentEval();
  const lastMove = analysis && moveIndex > 0 ? analysis.moves[moveIndex - 1] : null;
  const playedWasBest = !lastMove || lastMove.san === lastMove.bestMoveSan || !lastMove.bestMoveSan;
  const arrows   = useMemo(() => analysis ? buildArrows(analysis, moveIndex) : [], [analysis, moveIndex]);

  const navBtn = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' };

  // Player name row
  const PlayerRow = ({ name, rating, isWhite }: { name: string; rating?: number; isWhite: boolean }) => (
    <div className="flex items-center gap-2 px-1 py-1.5 text-sm">
      <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: isWhite ? '#f5edd8' : '#1a0a02', color: isWhite ? '#1a0a02' : '#f5edd8', border: '1px solid var(--border)' }}>
        {isWhite ? '♙' : '♟'}
      </div>
      <span className="font-semibold truncate" style={{ color: 'var(--text)' }}>{name}</span>
      {rating && <span className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>({rating})</span>}
      <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--muted)' }}>
        {analysis ? resultLabel(analysis.result, isWhite) : ''}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen p-3 md:p-4">
      {/* Back */}
      <button onClick={onBack} className="mb-3 flex items-center gap-1 text-sm"
        style={{ color: 'var(--muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
        <ChevronLeft size={15} /> Back to games
      </button>

      {error && (
        <div className="rounded-lg p-4 mb-4 text-sm"
          style={{ background: 'rgba(180,50,20,0.25)', border: '1px solid #7a2010', color: '#f8a090' }}>
          {error}
        </div>
      )}

      {!analysis && !error && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <p style={{ color: 'var(--text)' }}>
            Analyzing with Stockfish…{' '}
            {progress.total > 0 && <span style={{ color: 'var(--accent2)' }}>{progress.done}/{progress.total}</span>}
          </p>
          <div className="w-56 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--surface2)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%', background: 'var(--accent)' }} />
          </div>
        </div>
      )}

      {analysis && (
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">

          {/* ── LEFT: Board area ── */}
          <div className="w-full lg:w-auto flex flex-col items-center">
            {/* Black player (top) */}
            <div style={{ width: boardSize + 28 }}>
              <PlayerRow name={analysis.black} rating={analysis.blackRating} isWhite={false} />
            </div>

            {/* Eval bar + board */}
            <div className="flex gap-2 items-stretch">
              <EvalBar score={ev.score} mate={ev.mate} height={boardSize} />
              <div>
                <Chessboard
                  position={currentFen()}
                  boardWidth={boardSize}
                  areArrowsAllowed={false}
                  customArrows={arrows}
                  customBoardStyle={{ borderRadius: 6, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                  customDarkSquareStyle={{ backgroundColor: '#7a3a10' }}
                  customLightSquareStyle={{ backgroundColor: '#f5edd8' }}
                />
              </div>
            </div>

            {/* White player (bottom) */}
            <div style={{ width: boardSize + 28 }}>
              <PlayerRow name={analysis.white} rating={analysis.whiteRating} isWhite={true} />
            </div>

            {/* Nav controls */}
            <div className="flex gap-2 mt-2">
              {(['first','prev','next','last'] as const).map(dir => (
                <button key={dir} onClick={() => nav(dir)}
                  className="p-2 rounded hover:opacity-75 transition-opacity" style={navBtn}>
                  {dir === 'first' && <ChevronsLeft  size={15} />}
                  {dir === 'prev'  && <ChevronLeft   size={15} />}
                  {dir === 'next'  && <ChevronRight  size={15} />}
                  {dir === 'last'  && <ChevronsRight size={15} />}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>← → keys to navigate</p>
          </div>

          {/* ── RIGHT: Analysis panel ── */}
          <div className="flex flex-col gap-3 w-full lg:w-80 shrink-0">

            {/* 1. Accuracy + phases + move counts */}
            <AccuracyCard analysis={analysis} />

            {/* 2. Opening */}
            <div className="card px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
              <span style={{ color: 'var(--accent)' }}>♟ </span>{analysis.opening}
            </div>

            {/* 3. Move list */}
            <div className="card flex flex-col overflow-hidden" style={{ minHeight: 0, maxHeight: 260 }}>
              <div className="px-3 py-1.5 text-xs flex justify-between"
                style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                <span>White</span><span>#</span><span>Black</span>
              </div>
              <MoveList moves={analysis.moves} currentIndex={moveIndex} onSelect={setMoveIndex} />
            </div>

            {/* 4. Current move analysis */}
            <MoveInfoPanel move={lastMove} playedWasBest={playedWasBest} />

          </div>
        </div>
      )}
    </div>
  );
}
