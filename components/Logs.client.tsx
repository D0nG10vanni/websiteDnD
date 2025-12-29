'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface Log {
  id: number;
  author: string;
  content: string;
  created_at: string;
  ingame_time?: string; // NEU: Die gespeicherte Ingame-Zeit
  creator_id: string | number;
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

  useEffect(() => {
    if (gameId) {
      fetchLogs(gameId);
    }
  }, [gameId]);

  async function fetchLogs(gameId: string) {
    setFetching(true);
    // NEU: ingame_date mit abfragen
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
          ingame_time: log.ingame_time, // NEU
          creator_id: log.creator_id,
        }))
      );
    }
    setFetching(false);
  }

  async function postLog(gameId: string, content: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Kein Benutzer angemeldet.');
    }

    // 1. NEU: Aktuelle Ingame-Zeit holen (Snapshot erstellen)
    let currentIngameTime = null;
    const { data: clockData } = await supabase
      .from('ingame_clock')
      .select('ingame_timestamp')
      .eq('game_id', gameId)
      .single();

    if (clockData) {
      currentIngameTime = clockData.ingame_timestamp;
    }

    // 2. Log speichern inklusive Ingame-Zeit
    const { data, error } = await supabase
      .from('logs')
      .insert({
        content,
        creator_id: user.id,
        game_id: gameId,
        ingame_time: currentIngameTime, // Hier speichern wir den Snapshot
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const newLog = await postLog(gameId, content);
      setLogs((prev) => [newLog, ...prev]);
      setContent('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Senden der Nachricht.');
    }
    setLoading(false);
  };

  const handleLinkClick = (title: string) => {
    if (onArticleSelect) {
      onArticleSelect(title);
    }
  };

  // Helper für schöne Formatierung
  const formatIngameTime = (isoString?: string) => {
    if (!isoString) return 'Unbekannte Zeit';
    const date = new Date(isoString);
    // Wir nutzen UTC wie im TimeTracker
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
      year: '2-digit', // Kurzes Jahr für weniger Platzverbrauch
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Eingabeformular bleibt gleich ... */}
      <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-4">
        <h3 className="font-serif text-amber-200 text-lg mb-3 text-center">
          <span className="text-amber-500">✦</span> Chronik der Ereignisse <span className="text-amber-500">✦</span>
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 placeholder-amber-200/30 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50 resize-none min-h-[80px]"
            placeholder="Was geschieht gerade?..."
            disabled={loading}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-amber-200/40 font-serif">
              Die aktuelle Ingame-Zeit wird automatisch gespeichert.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50 text-amber-200 rounded-sm font-serif text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Wird eingetragen...' : '✎ Eintrag hinzufügen'}
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
            Die Chroniken werden aus den Archiven geholt...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-amber-200/30 italic font-serif">
            Die Chronik ist noch leer.
          </div>
        ) : (
          <div className="space-y-6"> {/* Etwas mehr Abstand zwischen Einträgen */}
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="bg-black/30 border border-amber-900/30 rounded-sm overflow-hidden hover:bg-black/40 transition-colors group"
              >
                {/* HEADER: Enthält Ingame Zeit (Links/Prominent) und Real Zeit (Rechts/Dezent) */}
                <div className="bg-amber-900/20 px-4 py-2 flex items-center justify-between border-b border-amber-900/20">
                  
                  {/* INGAME ZEIT (Wichtig) */}
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-sm">🕰️</span>
                    <span className="font-serif text-amber-100 font-medium text-sm tracking-wide">
                      {log.ingame_time ? formatIngameTime(log.ingame_time) : <span className="text-amber-200/30 italic">Zeitlos</span>}
                    </span>
                  </div>

                  {/* REAL ZEIT & ID (Metadaten) */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-amber-200/30" title="Erstellt am (Realzeit)">
                      {formatRealTime(log.created_at)}
                    </span>
                    <span className="text-amber-700/50">|</span>
                    <span className="text-amber-700/60">
                      #{log.id}
                    </span>
                  </div>
                </div>
                
                {/* CONTENT */}
                <div className="p-4 text-amber-100 text-sm relative">
                  {/* Dekorative Linie links */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-900/0 via-amber-600/20 to-amber-900/0 opacity-50"></div>
                  
                  <div className="pl-2">
                    <MarkdownRenderer
                      content={log.content}
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

      <style jsx>{`
        :global(.prose-mystical-small) {
          font-size: 0.9rem;
          line-height: 1.5;
          color: rgba(253, 230, 138, 0.9);
        }
        :global(.prose-mystical-small p) {
          margin: 0.5rem 0;
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