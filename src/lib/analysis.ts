import { Chess } from 'chess.js';
import type { MoveClassification, AnalyzedMove, GameAnalysis } from '@/types';
import { StockfishEngine } from './stockfish-engine';
import { parseOpeningFromPgn, parseDateFromPgn } from './chess-com';

const MATE_SCORE = 10000;

function scoreFromEval(score: number, mate: number | null, whiteToMove: boolean): number {
  if (mate !== null) {
    const s = mate > 0 ? MATE_SCORE - Math.abs(mate) : -(MATE_SCORE - Math.abs(mate));
    return whiteToMove ? s : -s;
  }
  return whiteToMove ? score : -score;
}

function cpLossToAccuracy(acpl: number): number {
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * acpl) - 3.1669));
}

function classify(cpLoss: number, mateBefore: number | null, mateAfter: number | null): MoveClassification {
  if (mateBefore !== null && mateBefore > 0 && (mateAfter === null || mateAfter < 0)) return 'missed_win';
  if (cpLoss >= 300) return 'blunder';
  if (cpLoss >= 100) return 'mistake';
  if (cpLoss >= 50)  return 'inaccuracy';
  if (cpLoss >= 20)  return 'good';
  if (cpLoss >= 5)   return 'excellent';
  return 'best';
}

function uciToSan(fen: string, uci: string): string {
  if (!uci || uci.length < 4) return '';
  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: uci.slice(0, 2),
      to:   uci.slice(2, 4),
      promotion: (uci[4] as 'q' | 'r' | 'b' | 'n') || undefined,
    });
    return move?.san ?? uci;
  } catch {
    return uci;
  }
}

export async function analyzePgn(
  pgn: string,
  depth = 15,
  onProgress?: (done: number, total: number) => void
): Promise<GameAnalysis> {
  const chess = new Chess();
  chess.loadPgn(pgn);

  const history = chess.history({ verbose: true });
  const white = chess.header()['White'] ?? 'White';
  const black = chess.header()['Black'] ?? 'Black';
  const result = chess.header()['Result'] ?? '*';

  // Build all FENs
  const fens: string[] = [];
  const replay = new Chess();
  fens.push(replay.fen());
  for (const move of history) {
    replay.move(move.san);
    fens.push(replay.fen());
  }

  const engine = new StockfishEngine();
  await engine.init();

  // Evaluate every position (including final)
  const evals = [];
  for (let i = 0; i < fens.length; i++) {
    onProgress?.(i, fens.length);
    evals.push(await engine.evaluate(fens[i], depth));
  }
  onProgress?.(fens.length, fens.length);
  engine.terminate();

  const analyzedMoves: AnalyzedMove[] = [];
  let whiteCpLoss = 0, blackCpLoss = 0, whiteMoves = 0, blackMoves = 0;

  for (let i = 0; i < history.length; i++) {
    const move  = history[i];
    const color = move.color as 'w' | 'b';
    const whiteToMove = color === 'w';

    const evalBefore = evals[i];
    const evalAfter  = evals[i + 1];

    const scoreBefore = scoreFromEval(evalBefore.score, evalBefore.mate, whiteToMove);
    const scoreAfter  = scoreFromEval(evalAfter.score,  evalAfter.mate,  !whiteToMove);

    const cpLoss = Math.max(0, scoreBefore - (-scoreAfter));
    const classification = classify(cpLoss, evalBefore.mate, evalAfter.mate);

    if (whiteToMove) { whiteCpLoss += cpLoss; whiteMoves++; }
    else             { blackCpLoss += cpLoss; blackMoves++; }

    analyzedMoves.push({
      san: move.san,
      fen: fens[i + 1],
      moveNumber: Math.floor(i / 2) + 1,
      color,
      evalBefore: evalBefore.mate !== null ? (evalBefore.mate > 0 ? MATE_SCORE : -MATE_SCORE) : evalBefore.score,
      evalAfter:  evalAfter.mate  !== null ? (evalAfter.mate  > 0 ? MATE_SCORE : -MATE_SCORE) : evalAfter.score,
      cpLoss,
      mateBefore: evalBefore.mate,
      mateAfter:  evalAfter.mate,
      classification,
      // bestMove/altMove = best play FROM fens[i] (what should have been played instead of this move)
      bestMove:    evalBefore.bestMove,
      bestMoveSan: uciToSan(fens[i], evalBefore.bestMove),
      altMove:     evalBefore.altMove,
      altMoveSan:  uciToSan(fens[i], evalBefore.altMove),
    });
  }

  return {
    white,
    black,
    result,
    date: parseDateFromPgn(pgn),
    opening: parseOpeningFromPgn(pgn),
    moves: analyzedMoves,
    whiteAccuracy: cpLossToAccuracy(whiteMoves > 0 ? whiteCpLoss / whiteMoves : 0),
    blackAccuracy: cpLossToAccuracy(blackMoves > 0 ? blackCpLoss / blackMoves : 0),
    pgn,
  };
}
