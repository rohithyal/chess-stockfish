export type MoveClassification =
  | 'brilliant'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_win';

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
  // Best move to play FROM the position before this move was played
  bestMove: string;     // UCI "e2e4"
  bestMoveSan: string;  // SAN "e4"
  altMove: string;      // UCI second-best
  altMoveSan: string;   // SAN second-best
}

export interface GameAnalysis {
  white: string;
  black: string;
  result: string;
  date: string;
  opening: string;
  moves: AnalyzedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
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
