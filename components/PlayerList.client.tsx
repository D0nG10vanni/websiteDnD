'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

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
  // Wir definieren hier, was wir tatsächlich bekommen
  Users: {
    username: string;
    // avatar_url entfernt, da nicht in DB
  } | null;
}

interface PlayerGroup {
  player: {
    id: number | string;
    username: string;
    avatar_url?: string; // Im Frontend lassen wir es optional, falls du es später hinzufügst
  };
  characters: Character[];
}

export default function PlayerList({ gameId }: { gameId: number }) {
  const supabase = useSupabaseClient();
  const [playerGroups, setPlayerGroups] = useState<PlayerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAndGroupCharacters() {
      setIsLoading(true);

      // KORREKTUR: 'avatar_url' wurde aus dem Select entfernt.
      // Wir behalten die explizite Foreign-Key-Angabe (!characters_player_id_fkey),
      // da diese den "Mehrdeutige Beziehung"-Fehler gelöst hat.
      const { data: charactersData, error } = await supabase
        .from('characters')
        .select(`
          *,
          Users:Users!characters_player_id_fkey (
            username
          )
        `)
        .eq('game_id', gameId);

      if (error) {
        console.error('Supabase Fehler:', error);
        setIsLoading(false);
        return;
      }

      if (!charactersData) {
        setPlayerGroups([]);
        setIsLoading(false);
        return;
      }

      const groups: Record<string, PlayerGroup> = {};

      charactersData.forEach((char: any) => {
        const pId = char.player_id;
        
        const userName = char.Users?.username || `Spieler ${pId}`;
        // Da wir keinen Avatar mehr laden können, setzen wir ihn auf undefined
        // (Das Frontend zeigt dann automatisch den Anfangsbuchstaben als Platzhalter an)
        const userAvatar = undefined; 
        
        const groupKey = String(pId);

        if (!groups[groupKey]) {
          groups[groupKey] = {
            player: { 
              id: pId, 
              username: userName, 
              avatar_url: userAvatar 
            },
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

  if (isLoading) return <div className="text-center py-10 text-amber-200 animate-pulse">Lade Gefährten...</div>;

  if (playerGroups.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="mb-2 text-4xl">🕸️</p>
        Keine Helden gefunden.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {playerGroups.map((group) => (
        <div key={group.player.id} className="bg-base-100/50 rounded-xl p-6 border border-amber-900/10">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-amber-500/20">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 ring ring-amber-500/40 ring-offset-2 ring-offset-base-100">
                {/* Fallback Logik für Avatar */}
                {group.player.avatar_url ? (
                  <img src={group.player.avatar_url} alt={group.player.username} />
                ) : (
                  <span className="text-lg">{group.player.username?.substring(0, 1).toUpperCase()}</span>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-serif text-amber-100">{group.player.username}</h2>
              <span className="text-xs text-amber-200/50 uppercase tracking-widest">
                {group.characters.length} {group.characters.length === 1 ? 'Charakter' : 'Charaktere'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.characters.map((char) => (
              <div key={char.id} className={`card bg-base-100 shadow-xl border-2 transition-all duration-300 hover:scale-[1.02] ${char.alive ? 'border-amber-900/30' : 'border-gray-700 grayscale opacity-70'}`}>
                <div className="card-body p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="card-title text-amber-100 text-xl font-serif tracking-wide">{char.name}</h3>
                      <p className="text-xs text-amber-500 uppercase font-bold tracking-widest mt-1">
                        {char.race} • {char.profession} • Lvl {char.level}
                      </p>
                    </div>
                    {!char.alive && <span className="badge badge-ghost text-xs">† Gefallen</span>}
                  </div>
                  <div className="divider my-1 bg-amber-900/20 h-px"></div>
                  {char.stats && (
                    <div className="grid grid-cols-5 gap-2 my-3 bg-black/20 p-2 rounded-lg">
                      {Object.entries(char.stats).map(([key, value]) => (
                        <div key={key} className="flex flex-col items-center">
                          <span className="text-[10px] text-gray-400 uppercase">{key}</span>
                          <span className="font-bold text-amber-300">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {char.background && (
                    <div className="text-sm text-gray-400 italic mt-2 line-clamp-3 font-serif">"{char.background}"</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}