'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface Log {
  id: number;
  author: string;
  content: string;
  created_at: string;
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
    const { data, error } = await supabase
      .from('logs')
      .select('id, content, created_at, creator_id, game_id')
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

    const { data, error } = await supabase
      .from('logs')
      .insert({
        content,
        creator_id: user.id,
        game_id: gameId,
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

  return (
    <div className="space-y-4">
      {/* Eingabeformular mit Fantasy-Theme */}
      <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-4">
        <h3 className="font-serif text-amber-200 text-lg mb-3 text-center">
          <span className="text-amber-500">✦</span> Chronik der Ereignisse <span className="text-amber-500">✦</span>
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 placeholder-amber-200/30 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50 resize-none min-h-[80px]"
            placeholder="Verfasse einen neuen Eintrag in die Chronik... 
Verwende [[Artikelname]] für Wiki-Links oder [[Artikelname|Anzeigename]] für Aliase."
            disabled={loading}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-amber-200/40 font-serif">
              Tipp: [[Link]] für Wiki-Verweise
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

      {/* Log-Einträge */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-4 max-h-[600px] overflow-y-auto">
        {fetching ? (
          <div className="text-center py-8 text-amber-200/50 italic font-serif">
            Die Chroniken werden aus den Archiven geholt...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-amber-200/30 italic font-serif">
            Die Chronik ist noch leer. Schreibe den ersten Eintrag...
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="bg-black/30 border border-amber-900/30 rounded-sm p-4 hover:bg-black/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-amber-500 text-xs font-serif">
                    Folio {log.id}
                  </div>
                  <div className="text-amber-200/60 text-xs font-serif">
                    {new Date(log.created_at).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                <div className="text-amber-100 text-sm">
                  <MarkdownRenderer
                    content={log.content}
                    onLinkClick={handleLinkClick}
                    className="prose-sm prose-mystical-small"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.prose-mystical-small) {
          font-size: 0.875rem;
          line-height: 1.4;
        }
        :global(.prose-mystical-small p) {
          margin: 0.5rem 0;
        }
        :global(.prose-mystical-small ul, .prose-mystical-small ol) {
          margin: 0.5rem 0;
          padding-left: 1rem;
        }
        :global(.prose-mystical-small blockquote) {
          margin: 0.5rem 0;
          padding-left: 0.75rem;
          border-left: 2px solid rgba(251, 191, 36, 0.3);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}