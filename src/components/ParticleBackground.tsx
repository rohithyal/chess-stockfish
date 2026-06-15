'use client';

import { useEffect, useRef } from 'react';

const PARTICLE_COLORS: [number, number, number][] = [
  [200, 140, 60],
  [170, 110, 35],
  [230, 175, 90],
  [150, 95, 25],
  [215, 160, 75],
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  alphaSpeed: number;
  color: [number, number, number];
}

function flowAngle(x: number, y: number, t: number): number {
  const s = 0.0025;
  return (
    Math.sin(x * s + t * 0.25) * Math.cos(y * s * 1.4 + t * 0.18) * Math.PI * 2 +
    Math.sin((x - y) * s * 0.55 + t * 0.12) * Math.PI +
    Math.cos(x * s * 0.8 - y * s * 0.5 + t * 0.08) * 0.5
  );
}

function spawnParticle(w: number, h: number): Particle {
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    size: 0.8 + Math.random() * 2.5,
    alpha: Math.random() * 0.35,
    alphaSpeed: 0.002 + Math.random() * 0.004,
    color,
  };
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const count = Math.min(180, Math.max(60, Math.floor((window.innerWidth * window.innerHeight) / 7000)));
    const particles: Particle[] = Array.from({ length: count }, () =>
      spawnParticle(canvas.width, canvas.height)
    );

    // Initial background fill
    ctx.fillStyle = '#120a05';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function loop() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const ptr = pointerRef.current;
      t += 0.004;

      // Trail fade
      ctx.fillStyle = 'rgba(18, 10, 5, 0.12)';
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        // Flow field steering
        const angle = flowAngle(p.x, p.y, t);
        p.vx += Math.cos(angle) * 0.05;
        p.vy += Math.sin(angle) * 0.05;

        // Pointer repulsion
        if (ptr.active) {
          const dx = p.x - ptr.x;
          const dy = p.y - ptr.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 14400 && d2 > 0) {
            const d = Math.sqrt(d2);
            const f = ((120 - d) / 120) * 1.8;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }

        // Damping + speed cap
        p.vx *= 0.94;
        p.vy *= 0.94;
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > 2.2) {
          p.vx = (p.vx / spd) * 2.2;
          p.vy = (p.vy / spd) * 2.2;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Pulsing opacity
        p.alpha += p.alphaSpeed;
        if (p.alpha >= 0.45 || p.alpha <= 0.02) p.alphaSpeed *= -1;

        // Wrap edges
        if (p.x < -20) p.x = w + 20;
        else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        else if (p.y > h + 20) p.y = -20;

        // Draw
        const [r, g, b] = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha.toFixed(3)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    }

    loop();

    const onMove = (e: MouseEvent | TouchEvent) => {
      pointerRef.current.active = true;
      if ('touches' in e) {
        pointerRef.current.x = e.touches[0].clientX;
        pointerRef.current.y = e.touches[0].clientY;
      } else {
        pointerRef.current.x = (e as MouseEvent).clientX;
        pointerRef.current.y = (e as MouseEvent).clientY;
      }
    };
    const onEnd = () => { pointerRef.current.active = false; };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('mouseleave', onEnd);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('mouseleave', onEnd);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
