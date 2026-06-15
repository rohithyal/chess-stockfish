import type { ChessComGame, ChessComArchive } from '@/types';

const BASE = 'https://api.chess.com/pub/player';

export async function fetchArchives(username: string): Promise<ChessComArchive[]> {
  const res = await fetch(`${BASE}/${username}/games/archives`, {
    headers: { 'User-Agent': 'chess-stockfish-analyzer/1.0' },
  });
  if (!res.ok) throw new Error(`Player "${username}" not found`);
  const data = await res.json();
  return (data.archives as string[]).map((url) => ({ url })).reverse();
}

export async function fetchGames(archiveUrl: string): Promise<ChessComGame[]> {
  const res = await fetch(archiveUrl, {
    headers: { 'User-Agent': 'chess-stockfish-analyzer/1.0' },
  });
  if (!res.ok) throw new Error('Failed to fetch games');
  const data = await res.json();
  return (data.games as ChessComGame[]).reverse();
}

export async function fetchRecentGames(username: string, limit = 20): Promise<ChessComGame[]> {
  const archives = await fetchArchives(username);
  const games: ChessComGame[] = [];

  for (const archive of archives) {
    if (games.length >= limit) break;
    const batch = await fetchGames(archive.url);
    games.push(...batch);
  }

  return games.slice(0, limit);
}

export function getResultLabel(result: string): string {
  const map: Record<string, string> = {
    win: 'Win',
    checkmated: 'Loss',
    resigned: 'Loss',
    timeout: 'Loss',
    drawn: 'Draw',
    stalemate: 'Draw',
    insufficient: 'Draw',
    agreed: 'Draw',
    repetition: 'Draw',
    '50move': 'Draw',
  };
  return map[result] ?? result;
}

export function parseOpeningFromPgn(pgn: string): string {
  const match = pgn.match(/\[ECOUrl "[^"]*\/([^"]+)"\]/);
  if (match) {
    return match[1].replace(/-/g, ' ');
  }
  const eco = pgn.match(/\[Opening "([^"]+)"\]/);
  return eco ? eco[1] : 'Unknown Opening';
}

export function parseDateFromPgn(pgn: string): string {
  const match = pgn.match(/\[Date "([^"]+)"\]/);
  return match ? match[1].replace(/\./g, '-') : '';
}
