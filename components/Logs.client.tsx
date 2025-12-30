'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CharacterSheetModal from './CharacterSheetModal';

// Interfaces
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

interface Log {
  id: number;
  content: string;
  created_at: string;
  ingame_time?: string;
  creator_id: string | number;
}

interface LogsProps {
  gameId: string;
  onArticleSelect?: (title: string) => void;
}

type SuggestionType = 'char' | 'article' | null;

export default function Logs({ gameId, onArticleSelect }: LogsProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // SEARCH / AUTOCOMPLETE STATE
  const [availableChars, setAvailableChars] = useState<string[]>([]);
  const [availableArticles, setAvailableArticles] = useState<string[]>([]);
  const [suggestionQuery, setSuggestionQuery] = useState<string | null>(null);
  const [suggestionType, setSuggestionType] = useState<SuggestionType>(null);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // MODAL STATE
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isLoadingChar, setIsLoadingChar] = useState(false);

  useEffect(() => {
    if (gameId) {
      fetchLogs();
      fetchCharacters();
      fetchArticles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function fetchCharacters() {
    const { data, error } = await supabase
      .from('characters')
      .select('name')
      .eq('game_id', gameId);

    if (data && !error) {
      const names = Array.from(new Set(data.map((c: any) => c.name))).sort();
      setAvailableChars(names);
    }
  }

  async function fetchArticles() {
    const { data, error } = await supabase
      .from('posts') 
      .select('title')
      .eq('game_id', gameId);

    if (error) {
      console.error("Fehler beim Laden der Artikel:", error);
      // Falls es immer noch nicht geht, probiere auch Tabellennamen wie: 'Wiki', 'Entries', etc.
      return;
    }

    if (data) {
      console.log("Geladene Artikel:", data); 

      const titles = Array.from(new Set(
        data
          .map((a: any) => a.title)
          .filter((t: any) => t && typeof t === 'string')
      )).sort();
      
      setAvailableArticles(titles);
    }
  }

  async function fetchLogs() {
    setFetching(true);
    const { data, error } = await supabase
      .from('logs')
      .select('id, content, created_at, creator_id, game_id, ingame_time')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLogs(data as Log[]);
    }
    setFetching(false);
  }

  // --- INPUT HANDLER ---

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      closeSuggestions();
      return;
    }

    // Autofill für Wiki-Links: [ -> [[|]]
    if (e.key === '[') {
      e.preventDefault();
      
      if (!textareaRef.current) return;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = content;
      
      const insertText = '[[|]]';
      const newText = text.slice(0, start) + insertText + text.slice(end);
      
      setContent(newText);
      
      // Cursor positionieren: nach [[
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        // Trigger check manually falls nötig, aber meist tippt der User erst danach
      }, 0);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    checkSuggestions(val, e.target.selectionStart);
  };

  const checkSuggestions = (text: string, cursorIndex: number) => {
    const textUntilCursor = text.slice(0, cursorIndex);

    // 1. Check auf Character (@Name)
    const charMatch = textUntilCursor.match(/@([^\s]*)$/);
    
    // 2. Check auf Artikel ([[Title)
    // Dieser Regex sucht nach [[ gefolgt von beliebigem Text (außer ] oder |) bis zum Cursor
    const articleMatch = textUntilCursor.match(/\[\[([^\]|]*)$/);

    // Zuerst Character prüfen
    if (charMatch) {
      const query = charMatch[1].toLowerCase();
      // Mindestens 3 Zeichen für Vorschläge
      if (query.length >= 3) {
        setSuggestionType('char');
        setSuggestionQuery(query);
        const matches = availableChars
          .filter(n => n.toLowerCase().includes(query))
          .slice(0, 5);
        setFilteredSuggestions(matches);
        return;
      }
    } 
    
    // Dann Artikel prüfen
    if (articleMatch) {
      const query = articleMatch[1].toLowerCase();
      // Mindestens 3 Zeichen für Vorschläge
      if (query.length >= 3) {
        setSuggestionType('article');
        setSuggestionQuery(query);
        const matches = availableArticles
          .filter(t => t.toLowerCase().includes(query))
          .slice(0, 5);
        
        // Debugging: Falls keine Treffer, loggen warum
        if (matches.length === 0 && availableArticles.length > 0) {
            console.log(`Suche nach "${query}" ergab keine Treffer in`, availableArticles);
        }

        setFilteredSuggestions(matches);
        return;
      }
    }

    // Wenn nichts passt -> schließen
    closeSuggestions();
  };

  const closeSuggestions = () => {
    setSuggestionType(null);
    setSuggestionQuery(null);
    setFilteredSuggestions([]);
  };

  const insertSuggestion = (value: string) => {
    if (!textareaRef.current) return;
    const cursorIndex = textareaRef.current.selectionStart;
    const textUntilCursor = content.slice(0, cursorIndex);
    const textAfterCursor = content.slice(cursorIndex);

    let newText = '';
    
    if (suggestionType === 'char') {
      newText = textUntilCursor.replace(/@([^\s]*)$/, `@${value} `) + textAfterCursor;
    } else if (suggestionType === 'article') {
      // Wir ersetzen den Teil nach [[ mit dem vollen Titel
      // Durch den Autofill steht im textAfterCursor meist "|]]"
      // Das Ergebnis ist also [[Titel|]]
      newText = textUntilCursor.replace(/\[\[([^\]|]*)$/, `[[${value}`) + textAfterCursor;
    }

    setContent(newText);
    closeSuggestions();
    textareaRef.current.focus();
  };

  // --- RENDERING Helpers ---

  const preprocessContent = (rawContent: string) => {
    let processed = rawContent;

    if (availableChars.length > 0) {
      const escapedNames = availableChars.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      escapedNames.sort((a, b) => b.length - a.length);
      const pattern = new RegExp(`@(${escapedNames.join('|')})`, 'g');
      
      processed = processed.replace(pattern, (match, name) => {
        return `[**@${name}**](character:${encodeURIComponent(name)})`;
      });
    }

    return processed;
  };

  const handleLinkClick = async (linkTarget: string) => {
    if (!linkTarget) return;

    if (linkTarget.startsWith('character:')) {
      const charName = decodeURIComponent(linkTarget.replace('character:', ''));
      await openCharacterModal(charName);
    } 
    else if (onArticleSelect && linkTarget.trim() !== '') {
      onArticleSelect(linkTarget);
    }
  };

  const openCharacterModal = async (name: string) => {
    setIsLoadingChar(true);
    const { data, error } = await supabase
      .from('characters')
      .select(`*, Users:Users!characters_player_id_fkey ( username )`)
      .eq('name', name)
      .eq('game_id', gameId)
      .single();

    if (!error && data) {
      setSelectedCharacter(data as Character);
    }
    setIsLoadingChar(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clock } = await supabase
      .from('ingame_clock')
      .select('ingame_timestamp')
      .eq('game_id', gameId)
      .single();

    const { data, error } = await supabase
      .from('logs')
      .insert({
        content,
        creator_id: user.id,
        game_id: gameId,
        ingame_time: clock?.ingame_timestamp
      })
      .select()
      .single();

    if (!error && data) {
      setLogs(prev => [data, ...prev]);
      setContent('');
    } else {
      setErrorMsg(error?.message || 'Fehler');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4 relative">
      <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-4 relative z-20">
        <h3 className="font-serif text-amber-200 text-lg mb-3 text-center">
          <span className="text-amber-500">✦</span> Chronik <span className="text-amber-500">✦</span>
        </h3>
        
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 placeholder-amber-200/30 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50 min-h-[80px]"
            placeholder="Eintrag verfassen... (@Name oder [ für Wiki-Artikel)"
            disabled={loading}
          />
          
          {/* SUGGESTION DROPDOWN */}
          {suggestionQuery !== null && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-black/95 border border-amber-600/50 rounded-sm shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
               <div className="px-2 py-1 text-[10px] text-amber-500/50 border-b border-amber-900/30 font-serif uppercase tracking-wider bg-amber-900/10 sticky top-0 backdrop-blur-md text-[1.05em]">
                 {suggestionType === 'char' ? 'Charaktere' : 'Artikel'}
               </div>
               {filteredSuggestions.map(item => (
                 <div 
                   key={item}
                   onMouseDown={(e) => { e.preventDefault(); insertSuggestion(item); }}
                   className="px-3 py-2 text-amber-100 hover:bg-amber-900/40 cursor-pointer text-sm font-serif border-b border-amber-900/10 flex gap-2 items-center"
                 >
                   <span className="text-amber-500 font-bold opacity-70">
                     {suggestionType === 'char' ? '@' : '📄'}
                   </span>
                   {item}
                 </div>
               ))}
            </div>
          )}

          <div className="flex justify-end mt-2">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-900/30 border border-amber-700/50 text-amber-200 rounded-sm text-sm hover:bg-amber-900/50 transition-colors">
              {loading ? '...' : 'Eintragen'}
            </button>
          </div>
        </form>
        {errorMsg && <div className="text-red-400 text-xs mt-2">{errorMsg}</div>}
      </div>

      <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-4 max-h-[600px] overflow-y-auto custom-scrollbar space-y-4">
        {logs.map(log => (
          <div key={log.id} className="bg-black/30 border border-amber-900/30 rounded-sm overflow-hidden">
             <div className="bg-amber-900/20 px-4 py-2 flex justify-between items-center text-xs text-amber-200/50 border-b border-amber-900/20">
               <span>{log.ingame_time ? new Date(log.ingame_time).toLocaleString() : 'Zeitlos'}</span>
               <span>#{log.id}</span>
             </div>
             <div className="p-4 text-amber-100 text-sm">
                <MarkdownRenderer 
                  content={preprocessContent(log.content)} 
                  onLinkClick={handleLinkClick}
                />
             </div>
          </div>
        ))}
      </div>

      {selectedCharacter && (
        <CharacterSheetModal 
          character={selectedCharacter} 
          onClose={() => setSelectedCharacter(null)} 
        />
      )}

      {isLoadingChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-none">
          <span className="text-amber-500 animate-pulse font-serif">Öffne Akte...</span>
        </div>
      )}
    </div>
  );
}