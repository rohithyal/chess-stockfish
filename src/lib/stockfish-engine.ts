export interface EvalResult {
  score: number;
  mate: number | null;
  bestMove: string;   // UCI e.g. "e2e4"
  altMove: string;    // second-best UCI move
  altScore: number;
  altMate: number | null;
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private listeners: Array<(line: string) => void> = [];
  private ready = false;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worker = new Worker('/stockfish.js');
      this.worker.onerror = (e) => reject(new Error(`Stockfish failed to load: ${e.message}`));

      this.worker.onmessage = (e: MessageEvent) => {
        const line: string = typeof e.data === 'string' ? e.data : String(e.data);
        for (const fn of this.listeners) fn(line);

        if (line === 'uciok') {
          this.worker!.postMessage('setoption name Hash value 32');
          this.worker!.postMessage('setoption name Threads value 1');
          this.worker!.postMessage('setoption name MultiPV value 2');
          this.worker!.postMessage('isready');
        } else if (line === 'readyok') {
          this.ready = true;
          resolve();
        }
      };

      this.worker.postMessage('uci');
    });
  }

  async evaluate(fen: string, depth = 18): Promise<EvalResult> {
    if (!this.ready || !this.worker) throw new Error('Engine not ready');

    return new Promise((resolve) => {
      // Track best info for each multipv line
      const pv: Record<number, { score: number; mate: number | null; move: string }> = {};

      const handler = (line: string) => {
        if (line.startsWith('info') && line.includes(' pv ')) {
          const pvNum = (() => { const m = line.match(/\bmultipv (\d+)\b/); return m ? parseInt(m[1]) : 1; })();
          const mateM = line.match(/\bscore mate (-?\d+)\b/);
          const cpM   = line.match(/\bscore cp (-?\d+)\b/);
          const moveM = line.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
          if (moveM) {
            pv[pvNum] = {
              score: cpM   ? parseInt(cpM[1])   : (pv[pvNum]?.score ?? 0),
              mate:  mateM ? parseInt(mateM[1]) : null,
              move:  moveM[1],
            };
          }
        }

        if (line.startsWith('bestmove')) {
          this.listeners = this.listeners.filter((l) => l !== handler);
          resolve({
            score:    pv[1]?.score    ?? 0,
            mate:     pv[1]?.mate     ?? null,
            bestMove: pv[1]?.move     ?? line.split(' ')[1] ?? '',
            altMove:  pv[2]?.move     ?? '',
            altScore: pv[2]?.score    ?? 0,
            altMate:  pv[2]?.mate     ?? null,
          });
        }
      };

      this.listeners.push(handler);
      this.worker!.postMessage('stop');
      this.worker!.postMessage(`position fen ${fen}`);
      this.worker!.postMessage(`go depth ${depth}`);
    });
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
  }
}
