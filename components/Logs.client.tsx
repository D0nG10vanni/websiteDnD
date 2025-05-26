'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Gleicher Import wie ArticleBrowser

interface Log {
  id: number;
  author: string;
  content: string;
  created_at: string;
  creator_id: string | number;
}

export default function Logs({ gameId }: { gameId: string }) {
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

  return (
    <div className="w-full lg:w-1/2">
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          placeholder="Neuer Eintrag..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Speichern...' : 'Eintrag hinzufügen'}
        </button>
      </form>

      {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
      {fetching ? (
        <p className="text-gray-500">Lade Einträge...</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="border p-2 rounded bg-gray-800 text-white">
              <div className="text-sm text-gray-400">{new Date(log.created_at).toLocaleString()}</div>
              <div>{log.content}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}