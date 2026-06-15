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
  if (cpLoss >= 50) return 'inaccuracy';
  if (cpLoss >= 20) return 'good';
  if (cpLoss >= 5) return 'excellent';
  return 'best';
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

  // Rebuild position list
  const fens: string[] = [];
  const replay = new Chess();
  fens.push(replay.fen());
  for (const move of history) {
    replay.move(move.san);
    fens.push(replay.fen());
  }

  const engine = new StockfishEngine();
  await engine.init();

  const evals: Array<{ score: number; mate: number | null }> = [];
  for (let i = 0; i < fens.length; i++) {
    onProgress?.(i, fens.length);
    evals.push(await engine.evaluate(fens[i], depth));
  }
  onProgress?.(fens.length, fens.length);
  engine.terminate();

  const analyzedMoves: AnalyzedMove[] = [];
  let whiteCpLoss = 0;
  let blackCpLoss = 0;
  let whiteMoves = 0;
  let blackMoves = 0;

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const color = move.color as 'w' | 'b';
    const whiteToMove = color === 'w';

    const evalBefore = evals[i];
    const evalAfter = evals[i + 1];

    const scoreBefore = scoreFromEval(evalBefore.score, evalBefore.mate, whiteToMove);
    const scoreAfter = scoreFromEval(evalAfter.score, evalAfter.mate, !whiteToMove);

    // From the moving player's perspective, positive = good for them before move
    // After the move (opponent's turn), negative scoreAfter means bad for opponent = good for mover
    const evalForMoverBefore = scoreBefore;
    const evalForMoverAfter = -scoreAfter;

    const cpLoss = Math.max(0, evalForMoverBefore - evalForMoverAfter);
    const classification = classify(cpLoss, evalBefore.mate, evalAfter.mate);

    if (whiteToMove) {
      whiteCpLoss += cpLoss;
      whiteMoves++;
    } else {
      blackCpLoss += cpLoss;
      blackMoves++;
    }

    analyzedMoves.push({
      san: move.san,
      fen: fens[i + 1],
      moveNumber: Math.floor(i / 2) + 1,
      color,
      evalBefore: evalBefore.mate !== null ? (evalBefore.mate > 0 ? MATE_SCORE : -MATE_SCORE) : evalBefore.score,
      evalAfter: evalAfter.mate !== null ? (evalAfter.mate > 0 ? MATE_SCORE : -MATE_SCORE) : evalAfter.score,
      cpLoss,
      mateBefore: evalBefore.mate,
      mateAfter: evalAfter.mate,
      classification,
      bestMove: '',
    });
  }

  const whiteACPL = whiteMoves > 0 ? whiteCpLoss / whiteMoves : 0;
  const blackACPL = blackMoves > 0 ? blackCpLoss / blackMoves : 0;

  return {
    white,
    black,
    result,
    date: parseDateFromPgn(pgn),
    opening: parseOpeningFromPgn(pgn),
    moves: analyzedMoves,
    whiteAccuracy: cpLossToAccuracy(whiteACPL),
    blackAccuracy: cpLossToAccuracy(blackACPL),
    pgn,
  };
}
