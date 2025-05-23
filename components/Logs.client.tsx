// components/Logs.client.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser, useSession } from '@supabase/auth-helpers-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Log {
  id: number;
  author: string;
  content: string;
  created_at: string;
  creator_id: string | number;
}

export default function Logs({ gameId }: { gameId: string }) {
  const supabase = createClientComponentClient();
  const session = useSession();
  const user = useUser();
  const [logs, setLogs] = useState<Log[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && gameId) {
      fetchLogs(gameId);
    }
  }, [user, gameId]);

  async function fetchLogs(gameId: string) {
    const { data, error } = await supabase
      .from("logs")
      .select("id, content, created_at, creator_id, game_id")
      .eq("creator_id", gameId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fehler beim Laden der Logs:", error);
    }
    setLogs((data || []).map((log: any) => ({
      id: log.id,
      author: "",
      content: log.content,
      created_at: log.created_at,
      creator_id: log.creator_id,
    })));
  }

  async function postLog(gameId: string, content: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("logs")
      .insert({
        content,
        creator_id: user?.id || 1,
        game_id: gameId,
      })
      .select()
      .single();

    setLoading(false);
    if (error) throw new Error("Fehler beim Speichern der Nachricht");
    return data;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const newLog = await postLog(gameId, content);
      setLogs((prev) => [newLog, ...prev]);
      setContent('');
    } catch (err) {
      alert("Fehler beim Senden der Nachricht.");
    }
    setLoading(false);
  };

  if (!session || !user) {
    return <div className="text-amber-200/70 font-serif">Bitte anmelden, um Einträge zu sehen.</div>;
  }

  return (
    <div className="w-full lg:w-1/2">
      {/* Eingabe & Anzeige wie im Originalcode */}
      {/* Kürze hier für Übersicht, vollen Block oben entnehmen */}
    </div>
  );
}
