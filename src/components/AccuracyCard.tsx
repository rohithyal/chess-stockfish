'use client';

import type { GameAnalysis, MoveClassification } from '@/types';

function accuracyColor(acc: number): string {
  if (acc >= 90) return 'text-green-400';
  if (acc >= 75) return 'text-blue-400';
  if (acc >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function countClassifications(moves: GameAnalysis['moves'], color: 'w' | 'b') {
  const filtered = moves.filter((m) => m.color === color);
  const counts: Partial<Record<MoveClassification, number>> = {};
  for (const m of filtered) {
    counts[m.classification] = (counts[m.classification] ?? 0) + 1;
  }
  return counts;
}

interface Props {
  analysis: GameAnalysis;
}

export default function AccuracyCard({ analysis }: Props) {
  const whiteCounts = countClassifications(analysis.moves, 'w');
  const blackCounts = countClassifications(analysis.moves, 'b');

  const rows: Array<{ label: string; key: MoveClassification; color: string }> = [
    { label: 'Best', key: 'best', color: 'text-green-400' },
    { label: 'Excellent', key: 'excellent', color: 'text-green-300' },
    { label: 'Good', key: 'good', color: 'text-blue-300' },
    { label: 'Inaccuracy', key: 'inaccuracy', color: 'text-yellow-400' },
    { label: 'Mistake', key: 'mistake', color: 'text-orange-400' },
    { label: 'Blunder', key: 'blunder', color: 'text-red-500' },
  ];

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 text-sm">
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <div className={`text-2xl font-bold ${accuracyColor(analysis.whiteAccuracy)}`}>
            {analysis.whiteAccuracy.toFixed(1)}%
          </div>
          <div className="text-slate-400 text-xs mt-0.5">{analysis.white} (W)</div>
        </div>
        <div className="flex items-center justify-center">
          <div className="text-slate-500 text-xs">Accuracy</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${accuracyColor(analysis.blackAccuracy)}`}>
            {analysis.blackAccuracy.toFixed(1)}%
          </div>
          <div className="text-slate-400 text-xs mt-0.5">{analysis.black} (B)</div>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-3 space-y-1">
        {rows.map(({ label, key, color }) => (
          <div key={key} className="grid grid-cols-3 items-center text-center">
            <span className="text-slate-300">{whiteCounts[key] ?? 0}</span>
            <span className={`${color} text-xs`}>{label}</span>
            <span className="text-slate-300">{blackCounts[key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
