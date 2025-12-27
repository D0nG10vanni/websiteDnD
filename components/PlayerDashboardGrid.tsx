'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

// Interfaces (Unverändert)
interface Character {
  id: string;
  name: string;
  race: string;
  profession: string;
  background: string;
  level: number;
  stats: Record<string, number>;
  alive: boolean;
  player_id: number;
  game_id: number;
  Users: {
    username: string;
  } | null;
}

interface PlayerGroup {
  player: {
    id: number | string;
    username: string;
    avatar_url?: string;
  };
  characters: Character[];
}

export default function PlayerDashboardGrid({ gameId }: { gameId: number }) {
  const supabase = useSupabaseClient();
  const [playerGroups, setPlayerGroups] = useState<PlayerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAndGroupCharacters() {
      setIsLoading(true);
      const { data: charactersData, error } = await supabase
        .from('characters')
        .select(`*, Users:Users!characters_player_id_fkey (username)`)
        .eq('game_id', gameId);

      if (error || !charactersData) {
        setIsLoading(false);
        return;
      }

      const groups: Record<string, PlayerGroup> = {};
      charactersData.forEach((char: any) => {
        const pId = char.player_id;
        const userName = char.Users?.username || `Spieler ${pId}`;
        const groupKey = String(pId);

        if (!groups[groupKey]) {
          groups[groupKey] = {
            player: { id: pId, username: userName },
            characters: []
          };
        }
        groups[groupKey].characters.push(char);
      });

      const sortedGroups = Object.values(groups).sort((a, b) => 
        a.player.username.localeCompare(b.player.username)
      );
      setPlayerGroups(sortedGroups);
      setIsLoading(false);
    }
    if (gameId) loadAndGroupCharacters();
  }, [gameId, supabase]);

  if (isLoading) return <div className="p-4 text-xs text-amber-500/50 animate-pulse font-mono">Scanne Frequenzen...</div>;
  if (playerGroups.length === 0) return <div className="p-4 text-xs text-gray-500 italic">Keine Lebenszeichen.</div>;

  return (
    // WICHTIG: h-full sorgt dafür, dass es die Fensterhöhe nutzt. overflow-y-auto aktiviert Scrollen.
    <div className="h-full overflow-y-auto p-2 space-y-6 scrollbar-thin scrollbar-thumb-amber-900/40 scrollbar-track-transparent pr-3">
      
      {playerGroups.map((group) => (
        <div key={group.player.id} className="relative">
          
          {/* Player Header */}
          <div className="flex items-center gap-3 mb-3 border-b border-amber-900/30 pb-1 sticky top-0 bg-[#0a0a0a] z-10 pt-2 opacity-95">
            <div className="w-8 h-8 rounded-full border border-amber-600/50 flex items-center justify-center bg-amber-900/20 text-xs text-amber-200 font-serif shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                {group.player.username.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-amber-100 font-serif text-lg tracking-wide shadow-black drop-shadow-md">
                {group.player.username}
            </h3>
          </div>

          {/* Characters Grid */}
          <div className="grid grid-cols-1 gap-3 ml-2 border-l border-amber-900/10 pl-3">
            {group.characters.map((char) => {
              const stats = char.stats || { STR:0, DEX:0, CON:0, INT:0, WIS:0, CHA:0 };
              
              return (
                <div 
                  key={char.id} 
                  className={`relative group bg-white/5 border ${char.alive ? 'border-amber-900/30 hover:border-amber-500/50' : 'border-gray-800 opacity-60'} rounded p-3 transition-all duration-200`}
                >
                    {!char.alive && (
                        <div className="absolute top-2 right-2 text-[10px] text-red-900 font-bold border border-red-900/30 px-1 rounded bg-black">†</div>
                    )}

                    {/* Info */}
                    <div className="mb-3">
                        <div className="font-bold text-amber-100 text-base font-serif">{char.name}</div>
                        <div className="text-[10px] text-amber-500/70 uppercase tracking-wider mt-0.5">
                            {char.race} • {char.profession} • Lvl {char.level}
                        </div>
                    </div>

                    {/* Stats Grid - REPARIERT: Jetzt 3 Spalten statt 6, damit Zahlen Platz haben */}
                    <div className="bg-black/40 rounded p-2 border border-white/5">
                        <div className="grid grid-cols-3 gap-y-2 gap-x-1 text-center">
                            {Object.entries(stats).map(([key, val]) => (
                                <div key={key} className="flex flex-col items-center">
                                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">{key.slice(0,3)}</span>
                                    <span className="text-sm font-mono text-amber-200/90 leading-none mt-0.5">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {char.background && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                            <p className="text-[10px] text-gray-400 italic line-clamp-2">"{char.background}"</p>
                        </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}