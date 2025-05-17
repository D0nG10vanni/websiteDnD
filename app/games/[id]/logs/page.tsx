"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, useUser } from '@supabase/auth-helpers-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Log {
  id: number;
  author: string;
  content: string;
  created_at: string;
}

export default function LogsPage({ params }: { params: { id: string } }) {
  return <LogsPageContent params={params} />;
}

function LogsPageContent({ params }: { params: { id: string } }) {
  const supabase = createClientComponentClient();
  const session = useSession();
  const user = useUser();
  const [logs, setLogs] = useState<Log[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    fetchLogs(params.id);
  }, [user]);

  async function fetchLogs(gameId: string) {
    const { data, error } = await supabase
      .from("logs")
      .select("id, content, created_at, author")
      .eq("creator_id", gameId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fehler beim Laden der Logs:", error);
    } else {
      setLogs(data || []);
    }
  }

  async function postLog(gameId: string, content: string) {
    const { data, error } = await supabase
      .from("logs")
      .insert({
        content,
        creator_id: gameId,
        author: user?.email || "DataMissing"
      })
      .select()
      .single();

    if (error) throw new Error("Fehler beim Speichern der Nachricht");
    return data;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const newLog = await postLog(params.id, content);
      setLogs((prev) => [newLog, ...prev]);
      setContent("");
    } catch (err) {
      alert("Fehler beim Senden der Nachricht.");
    }
    setLoading(false);
  };

  if (!session || !user) {
    return <div className="text-center p-6 text-amber-200">Bitte einloggen, um das Tagebuch zu verwenden.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 font-serif text-amber-200 bg-[#121017] bg-[url('/textures/parchment-dark.png')] bg-repeat min-h-screen">
      <h1 className="text-3xl text-center mb-6 text-amber-400 tracking-wide">✎ Abenteuer-Tagebuch</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Neuer Eintrag..."
          className="flex-1 px-3 py-2 rounded-sm bg-black/30 border border-amber-800 text-amber-100"
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-sm"
          disabled={loading}
        >
          Eintragen
        </button>
      </form>

      <ul className="space-y-4">
        {logs.length > 0 ? (
          logs.map((log) => (
            <li key={log.id} className="p-4 rounded border border-amber-900/40 bg-black/30">
              <div className="text-sm text-amber-400 mb-1">
                {log.author || "DataMissing"} – {log.created_at ? new Date(log.created_at).toLocaleString() : "DataMissing"}
              </div>
              <div className="text-amber-100 whitespace-pre-wrap">{log.content || "DataMissing"}</div>
            </li>
          ))
        ) : (
          <li className="text-center italic text-amber-500/60">Noch keine Einträge. Dein Abenteuer wartet.</li>
        )}
      </ul>
    </div>
  );
}