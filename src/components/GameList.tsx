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
  const color =
    label === 'Win'
      ? 'bg-green-900/60 text-green-300 border-green-700'
      : label === 'Loss'
      ? 'bg-red-900/60 text-red-300 border-red-700'
      : 'bg-slate-700/60 text-slate-300 border-slate-600';
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${color}`}>{label}</span>
  );
}

function formatTimeControl(tc: string): string {
  const [base] = tc.split('+');
  const mins = Math.floor(parseInt(base) / 60);
  const bonus = tc.includes('+') ? tc.split('+')[1] : '0';
  return `${mins}+${bonus}`;
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
            className="w-full text-left bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 hover:border-slate-500 rounded-lg px-4 py-3 transition-all"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {resultBadge(me.result)}
                <span className="text-slate-300 font-medium">{opp.username}</span>
                <span className="text-slate-500 text-sm">({opp.rating})</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 shrink-0">
                <span>{formatTimeControl(game.time_control)}</span>
                <span>{date}</span>
                <span className="text-xs px-1.5 py-0.5 bg-slate-700 rounded">
                  {isWhite ? '♙ White' : '♟ Black'}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
