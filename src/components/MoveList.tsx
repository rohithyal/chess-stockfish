'use client';

import type { AnalyzedMove, MoveClassification } from '@/types';

const CLASS_COLORS: Record<MoveClassification, string> = {
  brilliant: 'text-cyan-400',
  best: 'text-green-400',
  excellent: 'text-green-300',
  good: 'text-blue-300',
  inaccuracy: 'text-yellow-400',
  mistake: 'text-orange-400',
  blunder: 'text-red-500',
  missed_win: 'text-purple-400',
};

const CLASS_ICONS: Record<MoveClassification, string> = {
  brilliant: '!!',
  best: '!',
  excellent: '!',
  good: '',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
  missed_win: '??',
};

interface Props {
  moves: AnalyzedMove[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export default function MoveList({ moves, currentIndex, onSelect }: Props) {
  const pairs: Array<[AnalyzedMove, AnalyzedMove | undefined]> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }

  return (
    <div className="overflow-y-auto flex-1 font-mono text-sm">
      <table className="w-full border-collapse">
        <tbody>
          {pairs.map(([white, black], pairIdx) => {
            const wIdx = pairIdx * 2;
            const bIdx = pairIdx * 2 + 1;
            return (
              <tr key={pairIdx} className="border-b border-slate-800">
                <td className="px-2 py-1 text-slate-500 w-8 text-right select-none">
                  {white.moveNumber}.
                </td>
                <td
                  className={`px-2 py-1 cursor-pointer rounded transition-colors ${
                    currentIndex === wIdx + 1
                      ? 'bg-slate-600 text-white'
                      : 'hover:bg-slate-700'
                  }`}
                  onClick={() => onSelect(wIdx + 1)}
                >
                  <span className={CLASS_COLORS[white.classification]}>
                    {white.san}
                    <sup className="ml-0.5 text-xs">{CLASS_ICONS[white.classification]}</sup>
                  </span>
                </td>
                <td
                  className={`px-2 py-1 cursor-pointer rounded transition-colors ${
                    black && currentIndex === bIdx + 1
                      ? 'bg-slate-600 text-white'
                      : 'hover:bg-slate-700'
                  }`}
                  onClick={() => black && onSelect(bIdx + 1)}
                >
                  {black && (
                    <span className={CLASS_COLORS[black.classification]}>
                      {black.san}
                      <sup className="ml-0.5 text-xs">{CLASS_ICONS[black.classification]}</sup>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
