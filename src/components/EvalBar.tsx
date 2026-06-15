'use client';

const MATE_SCORE = 10000;

interface Props {
  score: number;
  mate: number | null;
  orientation?: 'white' | 'black';
}

function scoreToPercent(score: number, mate: number | null): number {
  if (mate !== null) return mate > 0 ? 95 : 5;
  const clamped = Math.max(-1000, Math.min(1000, score));
  return 50 + (clamped / 1000) * 45;
}

function formatEval(score: number, mate: number | null): string {
  if (mate !== null) return mate === 0 ? 'M0' : `M${Math.abs(mate)}`;
  const pawns = score / 100;
  return (pawns >= 0 ? '+' : '') + pawns.toFixed(1);
}

export default function EvalBar({ score, mate, orientation = 'white' }: Props) {
  const whitePct = scoreToPercent(score, mate);
  const label = formatEval(score, mate);
  const isWhiteAhead = mate !== null ? mate > 0 : score >= 0;

  return (
    <div className="flex flex-col items-center gap-1 h-full">
      <span className="text-xs text-slate-400 font-mono">{isWhiteAhead ? label : ''}</span>
      <div
        className="relative w-5 rounded overflow-hidden border border-slate-700"
        style={{ height: '100%', minHeight: 320 }}
      >
        {/* Black portion (top) */}
        <div
          className="absolute top-0 left-0 right-0 bg-slate-800 transition-all duration-300"
          style={{ height: `${100 - whitePct}%` }}
        />
        {/* White portion (bottom) */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-slate-100 transition-all duration-300"
          style={{ height: `${whitePct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 font-mono">{!isWhiteAhead ? label : ''}</span>
    </div>
  );
}
