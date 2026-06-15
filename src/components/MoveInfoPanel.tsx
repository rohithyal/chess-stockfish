'use client';

import type { AnalyzedMove, MoveClassification } from '@/types';

const CLASS_LABEL: Record<MoveClassification, string> = {
  brilliant:  '!! Brilliant',
  best:       'Best',
  excellent:  '! Excellent',
  good:       'Good',
  inaccuracy: '?! Inaccuracy',
  mistake:    '? Mistake',
  blunder:    '?? Blunder',
  missed_win: '?? Missed Win',
};

const CLASS_COLOR: Record<MoveClassification, string> = {
  brilliant:  '#40e8e8',
  best:       '#70e870',
  excellent:  '#a0e8a0',
  good:       '#70b8f8',
  inaccuracy: '#f8c840',
  mistake:    '#f89840',
  blunder:    '#f85040',
  missed_win: '#c860f8',
};

function fmtEval(score: number, mate: number | null): string {
  if (mate !== null) return mate === 0 ? 'Mat' : `M${Math.abs(mate)}`;
  const p = score / 100;
  return (p >= 0 ? '+' : '') + p.toFixed(1);
}

interface Props {
  move: AnalyzedMove | null;
  /** true if the played move IS the best move */
  playedWasBest: boolean;
}

export default function MoveInfoPanel({ move, playedWasBest }: Props) {
  if (!move) {
    return (
      <div className="card px-4 py-3 text-sm text-center" style={{ color: 'var(--muted)' }}>
        Start position
      </div>
    );
  }

  const evalStr  = fmtEval(move.evalAfter,  move.mateAfter);
  const prevEval = fmtEval(move.evalBefore, move.mateBefore);
  const cpSign   = move.cpLoss > 0 ? `-${move.cpLoss}` : '±0';

  return (
    <div className="card px-4 py-3 text-sm space-y-2">
      {/* Header: move + classification */}
      <div className="flex items-center justify-between">
        <span style={{ color: 'var(--text)' }} className="font-semibold">
          {move.moveNumber}{move.color === 'w' ? '.' : '…'} {move.san}
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded"
          style={{ background: CLASS_COLOR[move.classification] + '22', color: CLASS_COLOR[move.classification], border: `1px solid ${CLASS_COLOR[move.classification]}55` }}>
          {CLASS_LABEL[move.classification]}
        </span>
      </div>

      {/* Best / Played / Alternate */}
      <div className="space-y-1.5 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Best move row */}
        {move.bestMoveSan && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#70e870' }} />
              <span style={{ color: 'var(--muted)' }} className="text-xs w-14 shrink-0">Best</span>
              <span className="font-mono font-semibold" style={{ color: '#70e870' }}>
                {move.bestMoveSan}
              </span>
            </div>
            <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{prevEval}</span>
          </div>
        )}

        {/* Played move row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0"
              style={{ background: playedWasBest ? '#70e870' : CLASS_COLOR[move.classification] }} />
            <span style={{ color: 'var(--muted)' }} className="text-xs w-14 shrink-0">Played</span>
            <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>
              {move.san}
            </span>
          </div>
          <span className="font-mono text-xs" style={{ color: move.cpLoss > 50 ? CLASS_COLOR[move.classification] : 'var(--muted)' }}>
            {evalStr}{!playedWasBest && move.cpLoss > 0 ? ` (${cpSign}cp)` : ''}
          </span>
        </div>

        {/* Alternate move row */}
        {move.altMoveSan && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#70b8f8', opacity: 0.7 }} />
              <span style={{ color: 'var(--muted)' }} className="text-xs w-14 shrink-0">Alternate</span>
              <span className="font-mono" style={{ color: '#70b8f8', opacity: 0.9 }}>
                {move.altMoveSan}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
