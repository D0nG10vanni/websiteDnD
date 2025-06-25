"use client";

import React, { useEffect, useState } from "react";
import Ballpit from "@/components/ballpit"; // Pfad ggf. anpassen

// ----------------- Glitch-Text-Komponente -----------------

type LetterGlitchProps = {
  text: string;
  className?: string;
};

const LetterGlitch = ({ text, className }: LetterGlitchProps) => {
  const [glitchedText, setGlitchedText] = useState(text);

  useEffect(() => {
    const interval = setInterval(() => {
      const glitch = (char: string) => {
        const chars =
          "!@#$%^&*()_+-=[]{};':,.<>/?|1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        return Math.random() < 0.2
          ? chars[Math.floor(Math.random() * chars.length)]
          : char;
      };
      const newText = text
        .split("")
        .map((char) => (char === " " ? " " : glitch(char)))
        .join("");
      setGlitchedText(newText);
    }, 100);

    return () => clearInterval(interval);
  }, [text]);

  return <div className={className}>{glitchedText}</div>;
};

// ----------------- Matrix Background -----------------

const MatrixBackground = () => {
  useEffect(() => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*(){}[]|\\:;\"'<>,.?/~`!";
    const columns = Math.floor(window.innerWidth / 20);
    const drops = Array(columns).fill(1);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "1";
    canvas.style.pointerEvents = "none";
    document.body.appendChild(canvas);

    const draw = () => {
      if (!ctx) return;
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#00ff00";
      ctx.font = "15px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 20, drops[i] * 20);

        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      document.body.removeChild(canvas);
    };
  }, []);

  return null;
};

// ----------------- NotFound Page -----------------

const NotFound404 = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      <MatrixBackground />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      {/* Page content */}
      <div className="relative z-20 text-center px-4">
        {/* Headline */}
        <LetterGlitch
          text="404"
          className="text-8xl sm:text-9xl md:text-[12rem] font-extrabold text-green-400 tracking-widest mb-8 font-mono"
        />

        {/* Subline */}
        <LetterGlitch
          text="SEITE NICHT GEFUNDEN"
          className="text-2xl md:text-3xl font-bold text-green-300 mb-4 tracking-wider font-mono"
        />

        {/* Info */}
        <p className="text-lg text-green-200 mb-8 font-mono opacity-80">
          Die angeforderte Seite existiert im System nicht
        </p>

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="px-8 py-3 border-2 border-green-400 text-green-400 font-mono font-bold hover:bg-green-400 hover:text-black transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-400/50 mb-12"
        >
          [ ZURÜCK ]
        </button>

        {/* 3D Ballpit Section */}
        <div className="mt-12 bg-black/80 border-2 border-green-400 rounded-lg p-4 w-[90vw] h-[500px] mx-auto relative">
          <LetterGlitch
            text="HIER SIND EIN PAAR BÄLLE ZUM VERTRÖSTEN"
            className="text-xl font-mono text-green-300 mb-2 text-center z-10 relative"
          />
          <Ballpit className="absolute inset-0 z-0" followCursor={true} />
        </div>
      </div>
    </div>
  );
};

export default NotFound404;
