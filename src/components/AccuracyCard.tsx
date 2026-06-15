'use client';

import type { GameAnalysis, MoveClassification } from '@/types';

function accuracyColor(acc: number): string {
  if (acc >= 90) return '#70e870';
  if (acc >= 75) return '#60b8f8';
  if (acc >= 60) return '#f8c840';
  return '#f87060';
}

function countClassifications(moves: GameAnalysis['moves'], color: 'w' | 'b') {
  const filtered = moves.filter((m) => m.color === color);
  const counts: Partial<Record<MoveClassification, number>> = {};
  for (const m of filtered) {
    counts[m.classification] = (counts[m.classification] ?? 0) + 1;
  }
  return counts;
}

const ROWS: Array<{ label: string; key: MoveClassification; color: string }> = [
  { label: 'Best',       key: 'best',       color: '#70e870' },
  { label: 'Excellent',  key: 'excellent',  color: '#a0e8a0' },
  { label: 'Good',       key: 'good',       color: '#70b8f8' },
  { label: 'Inaccuracy', key: 'inaccuracy', color: '#f8c840' },
  { label: 'Mistake',    key: 'mistake',    color: '#f89840' },
  { label: 'Blunder',    key: 'blunder',    color: '#f85040' },
];

export default function AccuracyCard({ analysis }: { analysis: GameAnalysis }) {
  const wc = countClassifications(analysis.moves, 'w');
  const bc = countClassifications(analysis.moves, 'b');

  return (
    <div className="card p-4 text-sm">
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <div className="text-2xl font-bold" style={{ color: accuracyColor(analysis.whiteAccuracy) }}>
            {analysis.whiteAccuracy.toFixed(1)}%
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
            {analysis.white}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Accuracy</span>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: accuracyColor(analysis.blackAccuracy) }}>
            {analysis.blackAccuracy.toFixed(1)}%
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
            {analysis.black}
          </div>
        </div>
      </div>

      <div className="pt-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
        {ROWS.map(({ label, key, color }) => (
          <div key={key} className="grid grid-cols-3 items-center text-center">
            <span style={{ color: 'var(--text)' }}>{wc[key] ?? 0}</span>
            <span className="text-xs" style={{ color }}>{label}</span>
            <span style={{ color: 'var(--text)' }}>{bc[key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
