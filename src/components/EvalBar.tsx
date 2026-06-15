'use client';

interface Props {
  score: number;
  mate: number | null;
  height: number;
}

function scoreToPct(score: number, mate: number | null): number {
  if (mate !== null) return mate > 0 ? 94 : 6;
  return 50 + (Math.max(-900, Math.min(900, score)) / 900) * 43;
}

function fmtEval(score: number, mate: number | null): string {
  if (mate !== null) return mate === 0 ? 'M0' : `M${Math.abs(mate)}`;
  const p = score / 100;
  return (p >= 0 ? '+' : '') + p.toFixed(1);
}

export default function EvalBar({ score, mate, height }: Props) {
  const whitePct = scoreToPct(score, mate);
  const isWhiteAhead = mate !== null ? mate > 0 : score >= 0;
  const label = fmtEval(score, mate);

  return (
    <div className="flex flex-col items-center gap-1" style={{ height }}>
      <span className="text-xs font-mono" style={{ color: 'var(--muted)', minHeight: 16 }}>
        {isWhiteAhead ? label : ''}
      </span>
      <div
        className="relative w-4 rounded overflow-hidden flex-1"
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Black portion */}
        <div
          className="absolute top-0 left-0 right-0 transition-all duration-300"
          style={{ height: `${100 - whitePct}%`, background: '#1a0f06' }}
        />
        {/* White portion */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-300"
          style={{ height: `${whitePct}%`, background: '#f5edd8' }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color: 'var(--muted)', minHeight: 16 }}>
        {!isWhiteAhead ? label : ''}
      </span>
    </div>
  );
}
