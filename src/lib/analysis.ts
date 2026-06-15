import { Chess } from 'chess.js';
import type { MoveClassification, AnalyzedMove, GameAnalysis, GamePhase } from '@/types';
import { StockfishEngine } from './stockfish-engine';
import { parseOpeningFromPgn, parseDateFromPgn } from './chess-com';

// ── Win-probability model (chess.com formula) ──────────────────────────
function winPct(cpFromWhite: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cpFromWhite)) - 1);
}

function mateWinPct(mateFromSideToMove: number, sideToMoveIsWhite: boolean): number {
  const whiteWins =
    (sideToMoveIsWhite  && mateFromSideToMove > 0) ||
    (!sideToMoveIsWhite && mateFromSideToMove < 0);
  return whiteWins ? 99 : 1;
}

function evalToWinPctForWhite(
  score: number, mate: number | null, sideToMoveIsWhite: boolean
): number {
  if (mate !== null) return mateWinPct(mate, sideToMoveIsWhite);
  return winPct(sideToMoveIsWhite ? score : -score);
}

function moveAccuracy(winLoss: number): number {
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * Math.max(0, winLoss)) - 3.1669));
}

// ── Move classification ─────────────────────────────────────────────────
function classify(cpLoss: number, mateBefore: number | null, mateAfter: number | null): MoveClassification {
  if (mateBefore !== null && mateBefore > 0 && (mateAfter === null || mateAfter < 0)) return 'missed_win';
  if (cpLoss >= 300) return 'blunder';
  if (cpLoss >= 100) return 'mistake';
  if (cpLoss >= 50)  return 'inaccuracy';
  if (cpLoss >= 20)  return 'good';
  if (cpLoss >= 5)   return 'excellent';
  return 'best';
}

// ── Game phase detection ────────────────────────────────────────────────
function detectPhase(fen: string, halfMoveIdx: number): GamePhase {
  if (halfMoveIdx < 20) return 'opening';    // first 10 full moves
  // Count non-pawn, non-king material on both sides
  const chess = new Chess(fen);
  let material = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (sq && sq.type !== 'p' && sq.type !== 'k') {
        material += ({ n: 3, b: 3, r: 5, q: 9 } as Record<string, number>)[sq.type] ?? 0;
      }
    }
  }
  return material <= 24 ? 'endgame' : 'middlegame';
}

// ── UCI → SAN conversion ────────────────────────────────────────────────
function uciToSan(fen: string, uci: string): string {
  if (!uci || uci.length < 4) return '';
  try {
    const chess = new Chess(fen);
    const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: (uci[4] as 'q' | 'r' | 'b' | 'n') || undefined });
    return move?.san ?? uci;
  } catch { return uci; }
}

// ── Phase accuracy helper ───────────────────────────────────────────────
function phaseAvg(moves: AnalyzedMove[], color: 'w' | 'b', phase: GamePhase): number {
  const relevant = moves.filter(m => m.color === color && m.phase === phase);
  if (!relevant.length) return -1;
  return relevant.reduce((s, m) => s + m.accuracy, 0) / relevant.length;
}

// ── Main analysis entry point ───────────────────────────────────────────
export async function analyzePgn(
  pgn: string,
  depth = 15,
  onProgress?: (done: number, total: number) => void
): Promise<GameAnalysis> {
  const chess = new Chess();
  chess.loadPgn(pgn);

  const history = chess.history({ verbose: true });
  const header  = chess.header();
  const white   = header['White'] ?? 'White';
  const black   = header['Black'] ?? 'Black';
  const result  = header['Result'] ?? '*';
  const whiteRating = header['WhiteElo'] ? parseInt(header['WhiteElo']) : undefined;
  const blackRating = header['BlackElo'] ? parseInt(header['BlackElo']) : undefined;

  // Build FEN list
  const fens: string[] = [];
  const replay = new Chess();
  fens.push(replay.fen());
  for (const move of history) { replay.move(move.san); fens.push(replay.fen()); }

  const engine = new StockfishEngine();
  await engine.init();

  const evals = [];
  for (let i = 0; i < fens.length; i++) {
    onProgress?.(i, fens.length);
    evals.push(await engine.evaluate(fens[i], depth));
  }
  onProgress?.(fens.length, fens.length);
  engine.terminate();

  const analyzedMoves: AnalyzedMove[] = [];

  for (let i = 0; i < history.length; i++) {
    const move        = history[i];
    const color       = move.color as 'w' | 'b';
    const whiteTurn   = color === 'w';
    const evalBefore  = evals[i];
    const evalAfter   = evals[i + 1];

    // Win% before and after (always from white's perspective)
    const wBefore = evalToWinPctForWhite(evalBefore.score, evalBefore.mate,  whiteTurn);
    const wAfter  = evalToWinPctForWhite(evalAfter.score,  evalAfter.mate,  !whiteTurn);

    // Win% loss from the mover's perspective
    const winLoss = whiteTurn ? wBefore - wAfter : wAfter - wBefore;
    const acc     = moveAccuracy(winLoss);

    // Centipawn loss (for classification)
    const cpBefore = whiteTurn ?  evalBefore.score : -evalBefore.score;
    const cpAfter  = whiteTurn ? -evalAfter.score  :  evalAfter.score;
    const cpLoss   = evalBefore.mate === null && evalAfter.mate === null
      ? Math.max(0, cpBefore - cpAfter)
      : winLoss > 15 ? 300 : winLoss > 5 ? 100 : 0; // approximate from winLoss when mates involved

    const MATE = 10000;
    analyzedMoves.push({
      san:         move.san,
      fen:         fens[i + 1],
      moveNumber:  Math.floor(i / 2) + 1,
      color,
      evalBefore:  evalBefore.mate !== null ? (evalBefore.mate > 0 ? MATE : -MATE) : evalBefore.score,
      evalAfter:   evalAfter.mate  !== null ? (evalAfter.mate  > 0 ? MATE : -MATE) : evalAfter.score,
      cpLoss,
      mateBefore:  evalBefore.mate,
      mateAfter:   evalAfter.mate,
      classification: classify(cpLoss, evalBefore.mate, evalAfter.mate),
      accuracy:    acc,
      phase:       detectPhase(fens[i], i),
      bestMove:    evalBefore.bestMove,
      bestMoveSan: uciToSan(fens[i], evalBefore.bestMove),
      altMove:     evalBefore.altMove,
      altMoveSan:  uciToSan(fens[i], evalBefore.altMove),
    });
  }

  const avgAcc = (color: 'w' | 'b') => {
    const ms = analyzedMoves.filter(m => m.color === color);
    return ms.length ? ms.reduce((s, m) => s + m.accuracy, 0) / ms.length : 0;
  };

  return {
    white, black, whiteRating, blackRating, result,
    date:    parseDateFromPgn(pgn),
    opening: parseOpeningFromPgn(pgn),
    moves:   analyzedMoves,
    whiteAccuracy: avgAcc('w'),
    blackAccuracy: avgAcc('b'),
    opening_acc:    { white: phaseAvg(analyzedMoves, 'w', 'opening'),    black: phaseAvg(analyzedMoves, 'b', 'opening')    },
    middlegame_acc: { white: phaseAvg(analyzedMoves, 'w', 'middlegame'), black: phaseAvg(analyzedMoves, 'b', 'middlegame') },
    endgame_acc:    { white: phaseAvg(analyzedMoves, 'w', 'endgame'),    black: phaseAvg(analyzedMoves, 'b', 'endgame')    },
    pgn,
  };
}
