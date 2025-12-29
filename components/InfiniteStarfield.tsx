// components/InfiniteStarfield.tsx
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';

interface Star {
  id: string;
  x: string;
  y: number;
  size: number;
  opacity: number;
  colorClass: string;
  blurIntensity: number;
  glowRadius: number;
  rotation: number;
  pulseDelay: number;
}

interface Nebula {
  id: string;
  x: string;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  colorGradient: string;
}

interface InfiniteStarfieldProps {
  height: number;
}

const CHUNK_SIZE = 1200;
const STARS_PER_CHUNK = 80;
const NEBULAS_PER_CHUNK = 8;

// Avantgardistische Farbpalette mit zerlaufenden Effekten
const COLOR_SCHEMES = [
  {
    color: 'bg-pink-400',
    glow: 'shadow-[0_0_25px_#f472b6,0_0_50px_rgba(244,114,182,0.5)]',
    blur: 'blur-[2px]'
  },
  {
    color: 'bg-purple-500',
    glow: 'shadow-[0_0_30px_#a855f7,0_0_60px_rgba(168,85,247,0.4)]',
    blur: 'blur-[3px]'
  },
  {
    color: 'bg-blue-400',
    glow: 'shadow-[0_0_20px_#60a5fa,0_0_45px_rgba(96,165,250,0.6)]',
    blur: 'blur-[1.5px]'
  },
  {
    color: 'bg-cyan-300',
    glow: 'shadow-[0_0_35px_#67e8f9,0_0_70px_rgba(103,232,249,0.5)]',
    blur: 'blur-[2.5px]'
  },
  {
    color: 'bg-indigo-600',
    glow: 'shadow-[0_0_18px_#4f46e5,0_0_40px_rgba(79,70,229,0.7)]',
    blur: 'blur-[1px]'
  },
  {
    color: 'bg-fuchsia-400',
    glow: 'shadow-[0_0_28px_#e879f9,0_0_55px_rgba(232,121,249,0.6)]',
    blur: 'blur-[2px]'
  },
  {
    color: 'bg-sky-300',
    glow: 'shadow-[0_0_22px_#7dd3fc,0_0_50px_rgba(125,211,252,0.5)]',
    blur: 'blur-[1.8px]'
  },
];

// Nebula/Wolken-Gradienten für zerlaufende Farbeffekte
const NEBULA_GRADIENTS = [
  'radial-gradient(ellipse at center, rgba(244,114,182,0.3) 0%, rgba(168,85,247,0.2) 40%, transparent 70%)',
  'radial-gradient(ellipse at center, rgba(96,165,250,0.25) 0%, rgba(103,232,249,0.15) 45%, transparent 75%)',
  'radial-gradient(ellipse at center, rgba(168,85,247,0.35) 0%, rgba(79,70,229,0.2) 35%, transparent 65%)',
  'radial-gradient(ellipse at center, rgba(232,121,249,0.28) 0%, rgba(244,114,182,0.18) 50%, transparent 80%)',
  'radial-gradient(ellipse at center, rgba(79,70,229,0.3) 0%, rgba(96,165,250,0.15) 40%, transparent 70%)',
  'radial-gradient(ellipse at center, rgba(103,232,249,0.32) 0%, rgba(168,85,247,0.16) 45%, transparent 75%)',
];

export default function InfiniteStarfield({ height }: InfiniteStarfieldProps) {
  const [stars, setStars] = useState<Star[]>([]);
  const [nebulas, setNebulas] = useState<Nebula[]>([]);
  const generatedHeightRef = useRef(0);

  useEffect(() => {
    // Generiere immer mindestens CHUNK_SIZE voraus
    const targetHeight = height + CHUNK_SIZE;
    
    if (targetHeight > generatedHeightRef.current) {
      const newStars: Star[] = [];
      const newNebulas: Nebula[] = [];
      const startY = generatedHeightRef.current;
      const endY = targetHeight;
      const neededChunks = Math.ceil((endY - startY) / CHUNK_SIZE);

      for (let chunk = 0; chunk < neededChunks; chunk++) {
        const chunkStartY = startY + (chunk * CHUNK_SIZE);

        // Generiere künstlerische Sterne mit komplexen Eigenschaften
        for (let i = 0; i < STARS_PER_CHUNK; i++) {
          const scheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
          newStars.push({
            id: `star-${chunkStartY}-${i}-${Math.random()}`,
            x: `${Math.random() * 100}%`,
            y: chunkStartY + Math.random() * CHUNK_SIZE,
            size: Math.random() * 4 + 1,
            opacity: Math.random() * 0.8 + 0.2,
            colorClass: `${scheme.color} ${scheme.glow} ${scheme.blur}`,
            blurIntensity: Math.random() * 3 + 1,
            glowRadius: Math.random() * 40 + 20,
            rotation: Math.random() * 360,
            pulseDelay: Math.random() * 5,
          });
        }

        // Generiere zerlaufende Nebula-Wolken
        for (let i = 0; i < NEBULAS_PER_CHUNK; i++) {
          newNebulas.push({
            id: `nebula-${chunkStartY}-${i}-${Math.random()}`,
            x: `${Math.random() * 100}%`,
            y: chunkStartY + Math.random() * CHUNK_SIZE,
            size: Math.random() * 400 + 200,
            opacity: Math.random() * 0.4 + 0.1,
            rotation: Math.random() * 360,
            colorGradient: NEBULA_GRADIENTS[Math.floor(Math.random() * NEBULA_GRADIENTS.length)],
          });
        }
      }

      setStars(prev => [...prev, ...newStars]);
      setNebulas(prev => [...prev, ...newNebulas]);
      generatedHeightRef.current = endY;
    }
  }, [height]);

  const renderedNebulas = useMemo(() => {
    return nebulas.map(nebula => (
      <div
        key={nebula.id}
        className="absolute pointer-events-none animate-pulse-slow"
        style={{
          left: nebula.x,
          top: `${nebula.y}px`,
          width: `${nebula.size}px`,
          height: `${nebula.size}px`,
          opacity: nebula.opacity,
          background: nebula.colorGradient,
          transform: `rotate(${nebula.rotation}deg)`,
          filter: 'blur(60px)',
          mixBlendMode: 'screen',
          // FIX: Shorthand 'animation' property replaced with individual properties
          animationName: 'float',
          animationDuration: `${15 + Math.random() * 10}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
        }}
      />
    ));
  }, [nebulas]);

  const renderedStars = useMemo(() => {
    return stars.map(star => (
      <div
        key={star.id}
        className={`absolute pointer-events-none transition-all duration-1000 ${star.colorClass}`}
        style={{
          left: star.x,
          top: `${star.y}px`,
          width: `${star.size}px`,
          height: `${star.size}px`,
          opacity: star.opacity,
          transform: `rotate(${star.rotation}deg)`,
          mixBlendMode: 'screen',
          // FIX: Shorthand 'animation' property replaced to avoid conflict with animationDelay
          animationName: 'twinkle',
          animationDuration: `${3 + Math.random() * 4}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: `${star.pulseDelay}s`,
        }}
      />
    ));
  }, [stars]);

  return (
    <>
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { 
            opacity: ${0.2};
            transform: scale(1) rotate(0deg);
          }
          50% { 
            opacity: ${1};
            transform: scale(1.3) rotate(180deg);
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          33% { 
            transform: translate(30px, -20px) rotate(120deg) scale(1.1);
          }
          66% { 
            transform: translate(-20px, 15px) rotate(240deg) scale(0.9);
          }
        }
        
        @keyframes drift {
          0% { 
            transform: translateX(0) rotate(0deg);
          }
          100% { 
            transform: translateX(100px) rotate(360deg);
          }
        }
      `}</style>
      
      <div 
        className="absolute top-0 left-0 w-full pointer-events-none z-0 overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {/* Mehrschichtige künstlerische Hintergrund-Gradienten */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/40 to-black" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-transparent to-blue-950/30" />
        <div className="absolute inset-0 bg-gradient-to-tl from-pink-950/20 via-transparent to-cyan-950/20" />
        
        {/* Zerlaufende Nebula-Wolken (Hintergrund) */}
        <div className="absolute inset-0">
          {renderedNebulas}
        </div>
        
        {/* Künstlerische Sterne mit Glow-Effekten */}
        <div className="absolute inset-0">
          {renderedStars}
        </div>
        
        {/* Vordergrund-Textur für zusätzliche Tiefe */}
        <div 
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(168,85,247,0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 60%, rgba(244,114,182,0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(96,165,250,0.1) 0%, transparent 50%)
            `,
          }}
        />
      </div>
    </>
  );
}