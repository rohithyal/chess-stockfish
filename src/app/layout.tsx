import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chess Analyzer — Stockfish',
  description: 'Analyze your chess.com games with Stockfish engine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
