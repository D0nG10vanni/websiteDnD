'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import CharacterSheetModal from './CharacterSheetModal'; // NEU: Import

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
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Modal State
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Gamemaster States
  const [isGamemaster, setIsGamemaster] = useState(false);
  const [gmCheckStatus, setGmCheckStatus] = useState<string>('Initialisiere...');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addPlayerError, setAddPlayerError] = useState<string | null>(null);
  const [addPlayerSuccess, setAddPlayerSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function checkGamemaster() {
      if (!user) {
        setGmCheckStatus('Warte auf Login...');
        return;
      }
      
      const { data, error } = await supabase
        .from('games')
        .select(`
          gamemaster_uuid,
          Users!games_gamemaster_uuid_fkey (
            username
          )
        `)
        .eq('id', gameId)
        .single();

      if (error) {
        console.error("PlayerList: Fehler beim Abrufen des Games:", error);
        setGmCheckStatus(`DB Fehler: ${error.message}`);
        return;
      }

      if (!data) {
        setGmCheckStatus('Kein Spiel gefunden.');
        return;
      }

      const gmName = (data as any).Users?.username || 'Unbekannt';
      const gmUuid = data.gamemaster_uuid;

      if (gmUuid === user.id) {
        setIsGamemaster(true);
        setGmCheckStatus(`Erfolg: Du bist der Gamemaster (${gmName}).`);
      } else {
        setIsGamemaster(false);
        setGmCheckStatus(`Du bist nicht der Spielleiter! Der Spielleiter ist ${gmName}.`);
      }
    }
    
    if (gameId) checkGamemaster();
    
  }, [gameId, user, supabase]);

  // 2. Charaktere laden
  async function loadAndGroupCharacters() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(`/api/players?gameId=${gameId}`, { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Unbekannter Fehler beim Laden der Spieler');
      }

      setPlayerGroups(payload?.groups || []);
    } catch (err: any) {
      console.error('Player API Fehler:', err);
      setLoadError(err?.message || 'Spieler konnten nicht geladen werden.');
      setPlayerGroups([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (gameId) loadAndGroupCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, supabase]);

  // 3. Spieler hinzufügen
  const handleAddPlayer = async () => {
    setAddPlayerError(null);
    setAddPlayerSuccess(null);

    if (!newPlayerName.trim()) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('id')
        .eq('username', newPlayerName)
        .single();

      if (userError || !userData) {
        setAddPlayerError(`Spieler "${newPlayerName}" nicht gefunden.`);
        return;
      }

      const alreadyExists = playerGroups.some(g => String(g.player.id) === String(userData.id));
      if (alreadyExists) {
        setAddPlayerError('Dieser Spieler ist bereits Teil der Kampagne.');
        return;
      }

      const { error: insertError } = await supabase
        .from('characters')
        .insert({
          game_id: gameId,
          player_id: userData.id,
          name: 'Neuer Charakter',
          race: 'Unbekannt',
          profession: 'Abenteurer',
          background: '',
          level: 1,
          stats: {},
          alive: true
        });

      if (insertError) {
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
    <div className="space-y-6 relative">
      {loadError && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-red-300 text-xs">
          Spieler konnten nicht geladen werden: {loadError}
        </div>
      )}
      
      {/* --- Titel & Controls --- */}
      <div className="flex justify-between items-end border-b border-amber-900/30 pb-4 mb-6">
        <div>
           <h2 className="text-3xl font-serif text-amber-500">Die Gefährten</h2>
           <p className="text-xs text-gray-500 mt-1">
             {playerGroups.length} Spieler • {playerGroups.reduce((acc, g) => acc + g.characters.length, 0)} Charaktere
           </p>
        </div>

        {isGamemaster && (
          <div>
            {!isAddingPlayer ? (
              <button 
                onClick={() => setIsAddingPlayer(true)}
                className="text-xs text-amber-500 hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                + Spieler einladen
              </button>
            ) : (
              <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-right-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Username..." 
                    className="input input-xs input-bordered border-amber-900/50 bg-black/20 text-white w-32"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  />
                  <button onClick={handleAddPlayer} className="btn btn-xs bg-amber-700 hover:bg-amber-600 border-none text-white">Add</button>
                  <button onClick={() => setIsAddingPlayer(false)} className="btn btn-xs btn-ghost text-gray-500">✕</button>
                </div>
                {addPlayerError && <span className="text-red-500 text-[10px]">{addPlayerError}</span>}
                {addPlayerSuccess && <span className="text-green-500 text-[10px]">{addPlayerSuccess}</span>}
                {gmCheckStatus.startsWith('DB Fehler:') && <span className="text-red-500 text-[10px]">{gmCheckStatus}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- PLAYER GRID (Compact View) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {playerGroups.map((group) => (
          <div key={group.player.id} className="bg-[#0f0f0f] rounded-lg border border-amber-900/20 overflow-hidden flex flex-col shadow-lg shadow-black/40">
            
            {/* Player Header */}
            <div className="bg-gradient-to-r from-amber-950/20 to-transparent p-3 border-b border-amber-900/10 flex items-center gap-3">
               <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 ring-1 ring-amber-600/30">
                    <span className="text-xs">{group.player.username.substring(0, 1).toUpperCase()}</span>
                  </div>
               </div>
               <span className="font-serif text-amber-100/90 text-lg tracking-wide truncate">
                 {group.player.username}
               </span>
            </div>

            {/* Character List */}
            <div className="p-3 space-y-2 flex-1">
              {group.characters.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-600 italic">Keine Charaktere</div>
              )}

              {group.characters.map((char) => (
                <div 
                  key={char.id} 
                  className={`relative group flex items-center justify-between gap-3 bg-white/5 border ${char.alive ? 'border-transparent hover:border-amber-500/20' : 'border-red-900/20 opacity-60'} rounded p-2 transition-all`}
                >
                    {/* Status Stripe */}
                    <div className={`w-1 self-stretch rounded-full ${char.alive ? 'bg-amber-600/40' : 'bg-red-900'}`}></div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <span className={`font-bold text-sm truncate ${char.alive ? 'text-amber-50' : 'text-red-400 line-through decoration-red-900'}`}>
                             {char.name}
                           </span>
                           {!char.alive && <span className="text-[9px] border border-red-900 text-red-600 px-1 rounded bg-black">TOT</span>}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate mt-0.5 uppercase tracking-wide">
                            Lvl {char.level} • {char.profession} • {char.race}
                        </div>
                    </div>

                    {/* Details Button */}
                    <button 
                      onClick={() => setSelectedCharacter(char)}
                      className="btn btn-xs btn-ghost text-gray-500 hover:text-amber-400 hover:bg-amber-900/10"
                      title="Charakterbogen öffnen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {playerGroups.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12 text-gray-500 italic">
                Noch keine Spieler in dieser Runde.
            </div>
        )}
      </div>

      {/* --- MODAL --- */}
      {selectedCharacter && (
        <CharacterSheetModal 
          character={selectedCharacter} 
          onClose={() => setSelectedCharacter(null)} 
        />
      )}
    </div>
  );
}