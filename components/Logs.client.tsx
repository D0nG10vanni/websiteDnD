'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import MarkdownRenderer from '@/components/MarkdownRenderer';
// Importiere das Modal (Pfad ggf. anpassen, falls es in components liegt)
import CharacterSheetModal from './CharacterSheetModal'; 

interface Log {
  id: number;
  author: string;
  content: string;
  created_at: string;
  ingame_time?: string;
  creator_id: string | number;
}

// Interface muss zum CharacterSheetModal passen
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

interface LogsProps {
  gameId: string;
  onArticleSelect?: (title: string) => void;
}

export default function Logs({ gameId, onArticleSelect }: LogsProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // MENTIONS STATE
  const [availableChars, setAvailableChars] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [filteredChars, setFilteredChars] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // NEU: CHARACTER POPUP STATE
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isLoadingChar, setIsLoadingChar] = useState(false);

  useEffect(() => {
    if (gameId) {
      fetchLogs(gameId);
      fetchCharacters(); 
    }
  }, [gameId]);

  async function fetchCharacters() {
    const { data, error } = await supabase
      .from('characters')
      .select('name')
      .neq('name', null); 

    if (data && !error) {
      const names = Array.from(new Set(data.map((c: any) => c.name))).sort();
      setAvailableChars(names);
    }
  }

  async function fetchLogs(gameId: string) {
    setFetching(true);
    const { data, error } = await supabase
      .from('logs')
      .select('id, content, created_at, creator_id, game_id, ingame_time')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fehler beim Laden der Logs:', error);
      setErrorMsg('Fehler beim Laden der Einträge.');
    } else {
      setLogs(
        (data || []).map((log: any) => ({
          id: log.id,
          author: '',
          content: log.content,
          created_at: log.created_at,
          ingame_time: log.ingame_time,
          creator_id: log.creator_id,
        }))
      );
    }
    setFetching(false);
  }

  async function postLog(gameId: string, contentToPost: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Kein Benutzer angemeldet.');
    }

    let currentIngameTime = null;
    const { data: clockData } = await supabase
      .from('ingame_clock')
      .select('ingame_timestamp')
      .eq('game_id', gameId)
      .single();

    if (clockData) {
      currentIngameTime = clockData.ingame_timestamp;
    }

    const { data, error } = await supabase
      .from('logs')
      .insert({
        content: contentToPost,
        creator_id: user.id,
        game_id: gameId,
        ingame_time: currentIngameTime,
      })
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Speichern:', error);
      throw new Error(error.message || 'Unbekannter Fehler');
    }

    return {
      ...data,
      author: '',
    } as Log;
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursorIndex = e.target.selectionStart;
    const textUntilCursor = val.slice(0, cursorIndex);
    const lastWordMatch = textUntilCursor.match(/@([^\s]*)$/);

    if (lastWordMatch) {
      const query = lastWordMatch[1].toLowerCase();
      setMentionQuery(query);
      const matches = availableChars.filter(name => 
        name.toLowerCase().startsWith(query)
      ).slice(0, 5); 
      setFilteredChars(matches);
    } else {
      setMentionQuery(null);
      setFilteredChars([]);
    }
  };

  const insertMention = (charName: string) => {
    if (!textareaRef.current) return;
    const cursorIndex = textareaRef.current.selectionStart;
    const textUntilCursor = content.slice(0, cursorIndex);
    const textAfterCursor = content.slice(cursorIndex);
    const newTextBefore = textUntilCursor.replace(/@([^\s]*)$/, `@${charName} `);
    const newContent = newTextBefore + textAfterCursor;
    setContent(newContent);
    setMentionQuery(null);
    setFilteredChars([]);
    textareaRef.current.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const newLog = await postLog(gameId, content);
      setLogs((prev) => [newLog, ...prev]);
      setContent('');
      setMentionQuery(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Senden der Nachricht.');
    }
    setLoading(false);
  };

  // NEU: Logik beim Klick auf einen Link im Log
  const handleLinkClick = async (linkTarget: string) => {
    // Prüfen, ob es ein Character-Link ist (Format: "character:Name")
    if (linkTarget.startsWith('character:')) {
      const charName = linkTarget.replace('character:', '');
      await openCharacterModal(charName);
    } 
    // Ansonsten Standard-Verhalten (Wiki/Artikel)
    else if (onArticleSelect) {
      onArticleSelect(linkTarget);
    }
  };

  // NEU: Charakter laden und Modal öffnen
  const openCharacterModal = async (name: string) => {
    setIsLoadingChar(true);
    // Fetch Character Details by Name
    // Wichtig: Wir gehen davon aus, dass Namen eindeutig sind pro Game, 
    // sonst müsste man ggf. die ID beim Taggen mitspeichern.
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('name', name)
      .eq('game_id', gameId) // Sicherstellen, dass er zur Kampagne gehört
      .single();

    if (!error && data) {
      setSelectedCharacter(data as Character);
    } else {
      console.error("Charakter nicht gefunden", error);
    }
    setIsLoadingChar(false);
  };

  const formatIngameTime = (isoString?: string) => {
    if (!isoString) return 'Unbekannte Zeit';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('de-DE', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date) + ' Uhr';
  };

  const formatRealTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // UPDATE: Erstellt jetzt Markdown-Links statt nur Bold
  const preprocessContent = (rawContent: string) => {
    if (availableChars.length === 0) return rawContent;

    const escapedNames = availableChars.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    escapedNames.sort((a, b) => b.length - a.length);

    const pattern = new RegExp(`@(${escapedNames.join('|')})`, 'g');
    
    // Ersetzt @Name durch [**@Name**](character:Name)
    // Das **...** sorgt für Fettdruck, []() für den Link
    return rawContent.replace(pattern, '[**@$1**](character:$1)');
  };

  return (
    <div className="space-y-4 relative">
      <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-4 relative z-20">
        <h3 className="font-serif text-amber-200 text-lg mb-3 text-center">
          <span className="text-amber-500">✦</span> Chronik der Ereignisse <span className="text-amber-500">✦</span>
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-3 relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setMentionQuery(null);
              }}
              className="w-full bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 placeholder-amber-200/30 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50 resize-none min-h-[80px]"
              placeholder="Was geschieht gerade? (Nutze @ für Charaktere)"
              disabled={loading}
            />
            
            {mentionQuery !== null && filteredChars.length > 0 && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-black/95 border border-amber-600/50 rounded-sm shadow-xl z-50 overflow-hidden">
                <div className="px-2 py-1 text-xs text-amber-500/50 border-b border-amber-900/30 font-serif uppercase tracking-wider bg-amber-900/10">
                  Charaktere
                </div>
                <ul className="max-h-40 overflow-y-auto custom-scrollbar">
                  {filteredChars.map((name) => (
                    <li 
                      key={name}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMention(name);
                      }}
                      className="px-3 py-2 text-amber-100 hover:bg-amber-900/40 cursor-pointer text-sm font-serif transition-colors flex items-center gap-2 border-b border-amber-900/10 last:border-0"
                    >
                      <span className="text-amber-500 font-bold">@</span> {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs text-amber-200/40 font-serif">
              Ingame-Zeit wird gespeichert.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50 text-amber-200 rounded-sm font-serif text-sm transition-colors disabled:opacity-50"
            >
              {loading ? '...' : '✎ Hinzufügen'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-3 p-2 bg-red-900/20 border border-red-700/50 rounded-sm text-red-300 text-sm font-serif">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Log-Einträge Liste */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {fetching ? (
          <div className="text-center py-8 text-amber-200/50 italic font-serif">
            Lade Archive...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-amber-200/30 italic font-serif">
            Die Chronik ist noch leer.
          </div>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="bg-black/30 border border-amber-900/30 rounded-sm overflow-hidden hover:bg-black/40 transition-colors group"
              >
                <div className="bg-amber-900/20 px-4 py-2 flex items-center justify-between border-b border-amber-900/20">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-sm">🕰️</span>
                    <span className="font-serif text-amber-100 font-medium text-sm tracking-wide">
                      {log.ingame_time ? formatIngameTime(log.ingame_time) : <span className="text-amber-200/30 italic">Zeitlos</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-amber-200/30">
                      {formatRealTime(log.created_at)}
                    </span>
                    <span className="text-amber-700/50">|</span>
                    <span className="text-amber-700/60">#{log.id}</span>
                  </div>
                </div>
                
                <div className="p-4 text-amber-100 text-sm relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-900/0 via-amber-600/20 to-amber-900/0 opacity-50"></div>
                  
                  <div className="pl-2">
                    {/* WICHTIG: onLinkClick übergeben, damit das Modal öffnet */}
                    <MarkdownRenderer
                      content={preprocessContent(log.content)}
                      onLinkClick={handleLinkClick} 
                      className="prose-sm prose-mystical-small"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEU: Das Modal rendern, wenn ein Charakter ausgewählt ist */}
      {selectedCharacter && (
        <CharacterSheetModal 
          character={selectedCharacter} 
          onClose={() => setSelectedCharacter(null)} 
        />
      )}

      {/* Loading Overlay für Charakter-Abruf */}
      {isLoadingChar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-amber-500 font-serif animate-pulse">Beschwöre Charakter-Daten...</div>
        </div>
      )}

      <style jsx>{`
        :global(.prose-mystical-small) {
          font-size: 0.9rem;
          line-height: 1.5;
          color: rgba(253, 230, 138, 0.9);
        }
        :global(.prose-mystical-small p) {
          margin: 0.5rem 0;
        }
        :global(.prose-mystical-small strong) {
          color: #f59e0b;
          font-weight: 600;
          text-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }
        /* Links im Text golden und cursor pointer */
        :global(.prose-mystical-small a) {
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s;
        }
        :global(.prose-mystical-small a:hover strong) {
            color: #fbbf24;
            text-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(146, 64, 14, 0.3);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}