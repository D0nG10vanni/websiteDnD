// components/InfiniteStarfield.tsx
'use client';

import { useEffect, useRef } from 'react';

interface InfiniteStarfieldProps {
  // Optional: Falls du die Dichte steuern willst
  starCount?: number; 
}

export default function InfiniteStarfield({ starCount = 300 }: InfiniteStarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let w = 0;
    let h = 0;

    // Sterne-Array zur Wiederverwendung
    const stars: {
      x: number;
      y: number;
      radius: number;
      alpha: number;
      decreasing: boolean;
      speed: number;
    }[] = [];

    // Initialisierung der Größe
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        w = entry.contentRect.width;
        h = entry.contentRect.height;
        canvas.width = w;
        canvas.height = h;
        initStars();
      }
    });

    resizeObserver.observe(canvas.parentElement || document.body);

    // Sterne initialisieren
    const initStars = () => {
      stars.length = 0; // Array leeren
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 1.5, // Kleinere, feinere Sterne
          alpha: Math.random(),
          decreasing: Math.random() > 0.5,
          speed: Math.random() * 0.02 + 0.005, // Funkel-Geschwindigkeit
        });
      }
    };

    // Zeichen-Loop (60 FPS)
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      
      // Zeichne Sterne
      ctx.fillStyle = '#FFFFFF';
      
      stars.forEach((star) => {
        // Funkel-Logik (Alpha-Wert ändern)
        if (star.decreasing) {
          star.alpha -= star.speed;
          if (star.alpha <= 0.2) {
            star.decreasing = false;
          }
        } else {
          star.alpha += star.speed;
          if (star.alpha >= 1) {
            star.decreasing = true;
          }
        }

        // Stern zeichnen
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Optional: Sehr leichte Bewegung (Drift)
        star.y -= 0.1; 
        // Wenn Stern oben rausfliegt, unten wieder einfügen
        if (star.y < 0) {
          star.y = h;
          star.x = Math.random() * w;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [starCount]);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden bg-black">
      {/* Layer 1: Statischer Farb-Hintergrund (Nebula Ersatz) 
        Viel performanter als hunderte Divs.
      */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.2), transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.15), transparent 40%),
            radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.15), transparent 40%)
          `
        }} 
      />

      {/* Layer 2: Das Canvas für die Sterne */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full block"
        style={{ mixBlendMode: 'screen' }}
      />
      
      {/* Optional: Vignette für Tiefe */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
    </div>
  );
}