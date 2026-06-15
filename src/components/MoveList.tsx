'use client';

import type { AnalyzedMove, MoveClassification } from '@/types';

const CLASS_COLOR: Record<MoveClassification, string> = {
  brilliant:   '#40e8e8',
  best:        '#70e870',
  excellent:   '#a0e8a0',
  good:        '#70b8f8',
  inaccuracy:  '#f8c840',
  mistake:     '#f89840',
  blunder:     '#f85040',
  missed_win:  '#c860f8',
};

const CLASS_ANNOT: Record<MoveClassification, string> = {
  brilliant:  '!!',
  best:       '',
  excellent:  '!',
  good:       '',
  inaccuracy: '?!',
  mistake:    '?',
  blunder:    '??',
  missed_win: '??',
};

interface Props {
  moves: AnalyzedMove[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export default function MoveList({ moves, currentIndex, onSelect }: Props) {
  const pairs: Array<[AnalyzedMove, AnalyzedMove | undefined]> = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push([moves[i], moves[i + 1]]);

  return (
    <div className="overflow-y-auto flex-1 font-mono text-sm">
      <table className="w-full border-collapse">
        <tbody>
          {pairs.map(([white, black], pi) => {
            const wi = pi * 2;
            const bi = pi * 2 + 1;
            return (
              <tr key={pi} style={{ borderBottom: '1px solid var(--border2)' }}>
                <td className="px-2 py-1 w-8 text-right select-none text-xs"
                  style={{ color: 'var(--muted)' }}>
                  {white.moveNumber}.
                </td>
                <td
                  className="px-2 py-1 cursor-pointer rounded transition-colors"
                  style={currentIndex === wi + 1
                    ? { background: 'var(--surface2)', color: 'var(--text)' }
                    : {}}
                  onClick={() => onSelect(wi + 1)}
                  onMouseEnter={(e) => { if (currentIndex !== wi + 1) (e.currentTarget as HTMLElement).style.background = 'var(--border2)'; }}
                  onMouseLeave={(e) => { if (currentIndex !== wi + 1) (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <span style={{ color: CLASS_COLOR[white.classification] }}>
                    {white.san}
                    {CLASS_ANNOT[white.classification] && (
                      <sup className="ml-0.5 text-xs">{CLASS_ANNOT[white.classification]}</sup>
                    )}
                  </span>
                </td>
                <td
                  className="px-2 py-1 cursor-pointer rounded transition-colors"
                  style={black && currentIndex === bi + 1
                    ? { background: 'var(--surface2)', color: 'var(--text)' }
                    : {}}
                  onClick={() => black && onSelect(bi + 1)}
                  onMouseEnter={(e) => { if (black && currentIndex !== bi + 1) (e.currentTarget as HTMLElement).style.background = 'var(--border2)'; }}
                  onMouseLeave={(e) => { if (black && currentIndex !== bi + 1) (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  {black && (
                    <span style={{ color: CLASS_COLOR[black.classification] }}>
                      {black.san}
                      {CLASS_ANNOT[black.classification] && (
                        <sup className="ml-0.5 text-xs">{CLASS_ANNOT[black.classification]}</sup>
                      )}
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
