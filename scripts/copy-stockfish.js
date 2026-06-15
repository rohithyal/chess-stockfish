const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'node_modules', 'stockfish', 'src');
const destDir = path.join(__dirname, '..', 'public');

// JS is renamed to stockfish.js for a stable URL, but the WASM must keep its
// original name because it's hardcoded inside the emscripten-compiled JS.
const files = [
  ['stockfish-nnue-16-single.js', 'stockfish.js'],
  ['stockfish-nnue-16-single.wasm', 'stockfish-nnue-16-single.wasm'],
  ['nn-5af11540bbfe.nnue', 'nn-5af11540bbfe.nnue'],
];

for (const [src_file, dest_file] of files) {
  const src = path.join(srcDir, src_file);
  const dest = path.join(destDir, dest_file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src_file} → public/${dest_file}`);
  } else {
    console.warn(`Warning: ${src_file} not found at ${src}`);
  }
}
