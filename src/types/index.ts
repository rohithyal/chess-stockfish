export type MoveClassification =
  | 'brilliant'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_win';

export type GamePhase = 'opening' | 'middlegame' | 'endgame';

export interface AnalyzedMove {
  san: string;
  fen: string;
  moveNumber: number;
  color: 'w' | 'b';
  evalBefore: number;
  evalAfter: number;
  cpLoss: number;
  mateBefore: number | null;
  mateAfter: number | null;
  classification: MoveClassification;
  accuracy: number;        // per-move accuracy 0-100
  phase: GamePhase;
  bestMove: string;        // UCI from position before this move
  bestMoveSan: string;
  altMove: string;
  altMoveSan: string;
}

export interface PhaseAccuracy {
  white: number;
  black: number;
}

export interface GameAnalysis {
  white: string;
  black: string;
  whiteRating?: number;
  blackRating?: number;
  result: string;
  date: string;
  opening: string;
  moves: AnalyzedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
  opening_acc: PhaseAccuracy;
  middlegame_acc: PhaseAccuracy;
  endgame_acc: PhaseAccuracy;
  pgn: string;
}

export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  white: { username: string; rating: number; result: string };
  black: { username: string; rating: number; result: string };
}

export interface ChessComArchive {
  url: string;
}
