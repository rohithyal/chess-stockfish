'use client';

import type { ChessComGame } from '@/types';
import { getResultLabel } from '@/lib/chess-com';

interface Props {
  games: ChessComGame[];
  username: string;
  onSelect: (game: ChessComGame) => void;
}

function resultBadge(result: string) {
  const label = getResultLabel(result);
  const styles =
    label === 'Win'
      ? { background: 'rgba(60,140,60,0.25)', border: '1px solid #3a7a3a', color: '#90d890' }
      : label === 'Loss'
      ? { background: 'rgba(160,50,20,0.25)', border: '1px solid #7a3020', color: '#f8a080' }
      : { background: 'rgba(80,60,20,0.35)', border: '1px solid var(--border)', color: 'var(--muted)' };
  return (
    <span className="text-xs px-2 py-0.5 rounded font-medium" style={styles}>
      {label}
    </span>
  );
}

function formatTimeControl(tc: string): string {
  const secs = parseInt(tc.split('+')[0]);
  const inc = tc.includes('+') ? tc.split('+')[1] : '0';
  return `${Math.floor(secs / 60)}+${inc}`;
}

export default function GameList({ games, username, onSelect }: Props) {
  return (
    <div className="space-y-2">
      {games.map((game, i) => {
        const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
        const me = isWhite ? game.white : game.black;
        const opp = isWhite ? game.black : game.white;
        const date = new Date(game.end_time * 1000).toLocaleDateString();

        return (
          <button
            key={i}
            onClick={() => onSelect(game)}
            className="card w-full text-left px-4 py-3 transition-all duration-150"
            style={{ display: 'block' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(40,24,10,0.92)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(30,18,8,0.82)';
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {resultBadge(me.result)}
                <span className="font-medium truncate" style={{ color: 'var(--text)' }}>
                  {opp.username}
                </span>
                <span className="text-sm shrink-0" style={{ color: 'var(--muted)' }}>
                  ({opp.rating})
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm shrink-0" style={{ color: 'var(--muted)' }}>
                <span>{formatTimeControl(game.time_control)}</span>
                <span className="hidden sm:inline">{date}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--border2)', color: 'var(--accent)' }}
                >
                  {isWhite ? '♙ W' : '♟ B'}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
