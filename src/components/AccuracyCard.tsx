'use client';

import type { GameAnalysis, MoveClassification } from '@/types';

function accColor(acc: number): string {
  if (acc < 0)  return 'var(--muted)';
  if (acc >= 90) return '#70e870';
  if (acc >= 75) return '#70b8f8';
  if (acc >= 60) return '#f8c840';
  return '#f87060';
}

function accBar(acc: number, max = 100) {
  const pct = Math.max(0, Math.min(100, acc));
  return (
    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border2)', flex: 1 }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: accColor(acc) }} />
    </div>
  );
}

function fmt(acc: number) {
  return acc < 0 ? '—' : acc.toFixed(1) + '%';
}

const MOVE_ROWS: Array<{ label: string; key: MoveClassification; color: string; sym: string }> = [
  { label: 'Best',       key: 'best',       color: '#70e870', sym: ''   },
  { label: 'Excellent',  key: 'excellent',  color: '#a0e8a0', sym: '!'  },
  { label: 'Good',       key: 'good',       color: '#70b8f8', sym: ''   },
  { label: 'Inaccuracy', key: 'inaccuracy', color: '#f8c840', sym: '?!' },
  { label: 'Mistake',    key: 'mistake',    color: '#f89840', sym: '?'  },
  { label: 'Blunder',    key: 'blunder',    color: '#f85040', sym: '??' },
];

function countClass(moves: GameAnalysis['moves'], color: 'w' | 'b') {
  const counts: Partial<Record<MoveClassification, number>> = {};
  for (const m of moves.filter(m => m.color === color)) {
    counts[m.classification] = (counts[m.classification] ?? 0) + 1;
  }
  return counts;
}

export default function AccuracyCard({ analysis }: { analysis: GameAnalysis }) {
  const wc = countClass(analysis.moves, 'w');
  const bc = countClass(analysis.moves, 'b');

  const phases = [
    { label: 'Opening',    w: analysis.opening_acc.white,    b: analysis.opening_acc.black    },
    { label: 'Middlegame', w: analysis.middlegame_acc.white, b: analysis.middlegame_acc.black },
    { label: 'Endgame',    w: analysis.endgame_acc.white,    b: analysis.endgame_acc.black    },
  ];

  return (
    <div className="card p-4 space-y-4 text-sm">
      {/* Overall accuracy */}
      <div className="flex items-center gap-3">
        {/* White */}
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold" style={{ color: accColor(analysis.whiteAccuracy) }}>
            {analysis.whiteAccuracy.toFixed(1)}%
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
            {analysis.white}{analysis.whiteRating ? ` (${analysis.whiteRating})` : ''}
          </div>
        </div>

        <div className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: 'var(--muted)', background: 'var(--border2)' }}>
          Accuracy
        </div>

        {/* Black */}
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold" style={{ color: accColor(analysis.blackAccuracy) }}>
            {analysis.blackAccuracy.toFixed(1)}%
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
            {analysis.black}{analysis.blackRating ? ` (${analysis.blackRating})` : ''}
          </div>
        </div>
      </div>

      {/* Phase breakdown */}
      <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        {phases.map(({ label, w, b }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: accColor(w), fontVariantNumeric: 'tabular-nums' }}>{fmt(w)}</span>
              <span style={{ color: 'var(--muted)' }}>{label}</span>
              <span style={{ color: accColor(b), fontVariantNumeric: 'tabular-nums' }}>{fmt(b)}</span>
            </div>
            <div className="flex gap-1 items-center">
              {accBar(w)}
              <div className="w-px h-3 shrink-0" style={{ background: 'var(--border)' }} />
              {accBar(b)}
            </div>
          </div>
        ))}
      </div>

      {/* Move quality table */}
      <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="grid grid-cols-3 text-xs mb-1" style={{ color: 'var(--muted)' }}>
          <span>White</span><span className="text-center">Move</span><span className="text-right">Black</span>
        </div>
        {MOVE_ROWS.map(({ label, key, color, sym }) => (
          <div key={key} className="grid grid-cols-3 items-center py-0.5 text-xs">
            <span style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{wc[key] ?? 0}</span>
            <span className="text-center font-medium" style={{ color }}>
              {sym ? <>{label} <sup>{sym}</sup></> : label}
            </span>
            <span className="text-right" style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{bc[key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
