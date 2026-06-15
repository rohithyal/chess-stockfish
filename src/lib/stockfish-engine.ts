export interface EvalResult {
  score: number;
  mate: number | null;
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
      let score = 0;
      let mate: number | null = null;

      const handler = (line: string) => {
        if (line.includes('score mate')) {
          const m = line.match(/score mate (-?\d+)/);
          if (m) mate = parseInt(m[1]);
        } else if (line.includes('score cp')) {
          const m = line.match(/score cp (-?\d+)/);
          if (m) {
            score = parseInt(m[1]);
            mate = null;
          }
        }

        if (line.startsWith('bestmove')) {
          this.listeners = this.listeners.filter((l) => l !== handler);
          resolve({ score, mate });
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
