'use client';

import { useState } from 'react';
import InventoryManager from './InventoryManager'; // Pfad prüfen, liegt whs. im selben Ordner

interface Character {
  id: string;
  name: string;
  race: string;
  profession: string;
  background: string;
  level: number;
  stats: Record<string, number>;
  alive: boolean;
  game_id: number;
}

interface Props {
  character: Character;
  onClose: () => void;
}

export default function CharacterSheetModal({ character, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'equipment'>('stats');

  // Fallback für Stats, falls leer
  const stats = character.stats || { INT:0, REF:0, DEX:0, BODY:0, SPD:0, EMP:0, CRA:0, WILL:0, LUCK:0 };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pt-40">
      <div className="bg-[#121212] border border-amber-900/50 w-full max-w-4xl h-[85vh] rounded-xl flex flex-col shadow-2xl shadow-amber-900/20 overflow-hidden relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 z-10 p-2 bg-black/50 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* --- Header --- */}
        <div className="bg-gradient-to-r from-amber-950/40 to-black p-6 border-b border-amber-900/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded border-2 border-amber-600/30 bg-black flex items-center justify-center text-2xl font-serif text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              {character.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-serif text-amber-100 tracking-wide">{character.name}</h2>
              <p className="text-amber-500/80 uppercase text-xs tracking-widest font-bold mt-1">
                {character.race} • {character.profession} • Level {character.level}
              </p>
            </div>
            {!character.alive && (
               <span className="ml-auto px-3 py-1 bg-red-950/50 border border-red-900 text-red-500 text-xs font-bold uppercase rounded">
                 † Gefallen
               </span>
            )}
          </div>
        </div>

        {/* --- Tabs Navigation --- */}
        <div className="flex border-b border-white/10 bg-black/40 shrink-0">
          {[
            { id: 'stats', label: 'Werte & Attribute' },
            { id: 'inventory', label: 'Inventar' },
            { id: 'equipment', label: 'Ausrüstung (WIP)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab.id 
                  ? 'bg-amber-900/20 text-amber-400 border-b-2 border-amber-500' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- Content Area --- */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-amber-900/40 scrollbar-track-transparent bg-[#0a0a0a]">
          
          {/* TAB: STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {Object.entries(stats).map(([key, val]) => (
                  <div key={key} className="bg-white/5 border border-white/10 rounded p-3 flex flex-col items-center justify-center aspect-square hover:bg-white/10 transition-colors">
                    <span className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-widest">{key}</span>
                    <span className="text-2xl sm:text-3xl font-serif text-amber-100">{val}</span>
                  </div>
                ))}
              </div>
              
              {character.background && (
                <div className="mt-6 bg-black/30 p-4 rounded border border-white/5">
                  <h4 className="text-amber-500 font-serif mb-2 text-sm uppercase tracking-wider">Hintergrund</h4>
                  <p className="text-gray-400 italic text-sm leading-relaxed whitespace-pre-wrap font-serif">
                    "{character.background}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: INVENTORY */}
          {activeTab === 'inventory' && (
            <div>
               <InventoryManager 
                  characterId={character.id} 
                  onUpdate={() => {}} 
               />
            </div>
          )}

          {/* TAB: EQUIPMENT (Placeholder) */}
          {activeTab === 'equipment' && (
            <div className="h-full flex flex-col items-center justify-center space-y-8 py-8 opacity-70">
              <div className="text-center space-y-2 mb-4">
                <h3 className="text-amber-500 font-serif text-xl">Ausrüstung</h3>
                <p className="text-xs text-gray-500">Das Paper-Doll System wird geschmiedet...</p>
              </div>
              
              {/* Simple Skeleton layout */}
              <div className="relative w-[280px] h-[400px] border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center">
                 <span className="text-6xl grayscale opacity-20">🛡️</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}