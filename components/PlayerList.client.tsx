'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

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

export default function PlayerList({ gameId }: { gameId: number }) {
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [playerGroups, setPlayerGroups] = useState<PlayerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Gamemaster States
  const [isGamemaster, setIsGamemaster] = useState(false);
  const [gmCheckStatus, setGmCheckStatus] = useState<string>('Initialisiere...'); // Für Debugging
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addPlayerError, setAddPlayerError] = useState<string | null>(null);
  const [addPlayerSuccess, setAddPlayerSuccess] = useState<string | null>(null);

  // 1. Prüfen, ob der aktuelle User der Gamemaster ist
  useEffect(() => {
    async function checkGamemaster() {
      if (!user) {
        setGmCheckStatus('Warte auf Login...');
        return;
      }
      
      const { data, error } = await supabase
        .from('games')
        .select('gamemaster_uuid')
        .eq('id', gameId)
        .single();

      if (error) {
        console.error("PlayerList: Fehler beim Abrufen des Games:", error);
        setGmCheckStatus(`DB Fehler: ${error.message}`);
        return;
      }

      if (data) {
        if (data.gamemaster_uuid === user.id) {
          setIsGamemaster(true);
          setGmCheckStatus('Erfolg: Du bist der Gamemaster.');
        } else {
          setIsGamemaster(false);
          setGmCheckStatus(`Kein GM. Erwartet: ${data.gamemaster_uuid}, Bist: ${user.id}`);
        }
      }
    }
    
    // Nur ausführen, wenn gameId und user da sind
    if (gameId) checkGamemaster();
    
  }, [gameId, user, supabase]);

  // 2. Charaktere laden
  async function loadAndGroupCharacters() {
    setIsLoading(true);

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

  useEffect(() => {
    if (gameId) loadAndGroupCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, supabase]);

  // 3. Spieler hinzufügen (Fix integriert)
  const handleAddPlayer = async () => {
    setAddPlayerError(null);
    setAddPlayerSuccess(null);

    if (!newPlayerName.trim()) return;

    try {
      // User suchen
      const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('id') // Wir brauchen nur die ID
        .eq('username', newPlayerName)
        .single();

      if (userError || !userData) {
        setAddPlayerError(`Spieler "${newPlayerName}" nicht gefunden.`);
        return;
      }

      // Prüfen ob schon vorhanden
      const alreadyExists = playerGroups.some(g => String(g.player.id) === String(userData.id));
      if (alreadyExists) {
        setAddPlayerError('Dieser Spieler ist bereits Teil der Kampagne.');
        return;
      }

      // INSERT (Korrigiert für deine Tabellenstruktur)
      const { error: insertError } = await supabase
        .from('characters')
        .insert({
          game_id: gameId,
          player_id: userData.id,
          // player_uid entfernt, da nicht in DB
          // active entfernt, da nicht in DB
          name: 'Neuer Charakter',
          race: 'Unbekannt',
          profession: 'Abenteurer',
          background: '',
          level: 1,
          stats: {},
          alive: true
        });

      if (insertError) {
        console.error("Insert Error:", insertError);
        setAddPlayerError(`Fehler: ${insertError.message}`);
        return;
      }

      setAddPlayerSuccess(`Spieler ${newPlayerName} hinzugefügt!`);
      setNewPlayerName('');
      
      await loadAndGroupCharacters();
      
      setTimeout(() => {
        setIsAddingPlayer(false);
        setAddPlayerSuccess(null);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setAddPlayerError(`Systemfehler: ${err.message}`);
    }
  };

  if (isLoading) return <div className="text-center py-10 text-amber-200 animate-pulse">Lade Gefährten...</div>;

  return (
    <div className="space-y-12 relative">
      
      {/* --- Gamemaster Controls --- */}
      {isGamemaster ? (
        <div className="flex justify-end mb-4">
          {!isAddingPlayer ? (
            <button 
              onClick={() => setIsAddingPlayer(true)}
              className="btn btn-sm btn-outline text-amber-400 border-amber-400 hover:bg-amber-400 hover:text-black gap-2 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Spieler einladen
            </button>
          ) : (
            <div className="bg-base-100 p-4 rounded-xl border border-amber-500/30 w-full max-w-md ml-auto animate-in fade-in slide-in-from-top-2 shadow-2xl shadow-black/50">
              <h3 className="text-amber-200 font-serif mb-2">Spieler hinzufügen</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Username eingeben..." 
                  className="input input-sm input-bordered w-full border-amber-900/50 focus:border-amber-500 bg-black/20"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                />
                <button onClick={handleAddPlayer} className="btn btn-sm btn-primary bg-amber-600 hover:bg-amber-700 border-none text-white">
                  Add
                </button>
                <button onClick={() => setIsAddingPlayer(false)} className="btn btn-sm btn-ghost">
                  ✕
                </button>
              </div>
              {addPlayerError && <p className="text-error text-xs mt-2 font-bold">{addPlayerError}</p>}
              {addPlayerSuccess && <p className="text-success text-xs mt-2">{addPlayerSuccess}</p>}
            </div>
          )}
        </div>
      ) : (
        // Debugging-Anzeige falls Button fehlt (Kannst du später entfernen)
        <div className="text-right text-[10px] text-gray-600 mb-2 opacity-50 hover:opacity-100 transition-opacity">
          Status: {gmCheckStatus}
        </div>
      )}

      {/* --- Empty State --- */}
      {playerGroups.length === 0 && !isLoading && (
        <div className="text-center py-10 text-gray-400">
          <p className="mb-2 text-4xl">🕸️</p>
          Keine Helden gefunden.
          {isGamemaster && <p className="text-sm mt-2 text-amber-500">Nutze den Button oben rechts, um Spieler hinzuzufügen.</p>}
        </div>
      )}

      {/* --- Player List Rendering --- */}
      {playerGroups.map((group) => (
        <div key={group.player.id} className="bg-base-100/50 rounded-xl p-6 border border-amber-900/10">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-amber-500/20">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 ring ring-amber-500/40 ring-offset-2 ring-offset-base-100">
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