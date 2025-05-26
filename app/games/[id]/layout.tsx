"use client";
import '../../globals.css'
import { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="game-detail">
      {/* Wichtig: globaler Layout-Kontext wird nicht unterbrochen */}
      {children}
    </div>
  );
}
