"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, useUser } from '@supabase/auth-helpers-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from "next/navigation";

interface Log {
  id: number;
  author: string;
  content: string;
  created_at: string;
  creator_id: string | number;
}

export default function LogsPage({ params }: { params: { id: string } }) {
  return <LogsPageContent params={params} />;
}

function LogsPageContent({ params }: { params: { id: string } }) {
  const routeParams = useParams(); // routeParams ist vom Typ Record<string, string>
  const gameId = routeParams?.id;
  const supabase = createClientComponentClient();
  const session = useSession();
  const user = useUser();
  const [logs, setLogs] = useState<Log[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (typeof routeParams.id === "string") {
      fetchLogs(routeParams.id);
    }
  }, [user, routeParams.id]);

  async function fetchLogs(gameId: string) {
    const { data, error } = await supabase
      .from("logs")
      .select("id, content, created_at, creator_id, game_id")
      .eq("creator_id", gameId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fehler beim Laden der Logs:", error);
    }
    setLogs(
      (data || []).map((log: any) => ({
        id: log.id,
        author: "", // Set to "" or fetch author if available
        content: log.content,
        created_at: log.created_at,
        creator_id: log.creator_id,
      }))
    );
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
      if (typeof routeParams.id === "string") {
        const newLog = await postLog(routeParams.id, content);
        setLogs((prev) => [newLog, ...prev]);
        setContent("");
      } else {
        alert("Ungültige Spiel-ID.");
      }
    } catch (err) {
      alert("Fehler beim Senden der Nachricht.");
    }
    setLoading(false);
  };

  if (!session || !user) {
    return (
      <div className="min-h-screen bg-base-200" data-theme="fantasy">
        <div className="max-w-4xl mx-auto p-6 pt-12">
          <div className="card w-full bg-base-100 shadow-xl border border-primary/20">
            <div className="card-body text-center">
              <div className="text-amber-200/70 font-serif">
                Die mystischen Runen verwehren dir den Zugang. Bitte melde dich an, um das Tagebuch zu öffnen.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      <div className="max-w-4xl mx-auto p-6 pt-12">
        <div className="card w-full bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body">
            <h1 className="card-title text-3xl font-serif text-center mx-auto mb-6">
              <span className="text-primary">✦</span> ABENTEUER-TAGEBUCH <span className="text-primary">✦</span>
            </h1>
            
            <div className="divider">✧ ✦ ✧</div>

            {/* Eingabebereich */}
            <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-6 mb-6">
              <h2 className="font-serif text-xl text-amber-200 mb-4 text-center">
                <span className="text-amber-500">❖</span> Neuer Eintrag <span className="text-amber-500">❖</span>
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Verewige deine Abenteuer in den Annalen der Zeit…"
                    className="w-full bg-black/50 border border-amber-900/50 rounded-sm px-4 py-3 text-amber-100 placeholder-amber-200/30 font-serif resize-none focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                    rows={3}
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-amber-500/50">✧</div>
                </div>
                
                <div className="text-center">
                  <button
                    type="submit"
                    className="px-6 py-2 border border-amber-900/40 rounded-sm font-serif text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !content.trim()}
                  >
                    {loading ? "Schreibt..." : "In die Chroniken eintragen"}
                  </button>
                </div>
              </form>
            </div>

            {/* Tagebuch-Einträge */}
            <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6">
              <h2 className="font-serif text-xl text-amber-200 mb-6 text-center">
                <span className="text-amber-500">❖</span> Die Chroniken <span className="text-amber-500">❖</span>
              </h2>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="bg-black/30 border border-amber-900/30 rounded-sm p-4 shadow-[0_0_10px_rgba(0,0,0,0.3)]">
                      <div className="flex items-center justify-between mb-2 text-xs text-amber-400/70 font-serif">
                        <span className="flex items-center gap-2">
                          <span className="text-amber-500">♦</span>
                          {log.creator_id || "Unbekannter Chronist"}
                        </span>
                        <span>
                          {log.created_at ? new Date(log.created_at).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : "Zeit unbekannt"}
                        </span>
                      </div>
                      
                      <div className="text-amber-100 font-serif leading-relaxed whitespace-pre-wrap">
                        {log.content || "Die Worte sind in der Zeit verloren gegangen..."}
                      </div>
                      
                      <div className="text-right text-xs text-amber-200/30 font-serif italic mt-2">
                        Kodex {log.id}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-amber-200/50 italic font-serif">
                    <span className="text-amber-500/50 text-2xl block mb-2">✦</span>
                    Die Seiten sind noch leer. Dein Abenteuer wartet darauf, geschrieben zu werden.
                    <span className="text-amber-500/50 text-2xl block mt-2">✦</span>
                  </div>
                )}
              </div>
            </div>

            <div className="divider mt-8">✧ ✦ ✧</div>

            <div className="text-center mt-4 text-xs opacity-70 font-serif">
              ✧ "Jede Geschichte verdient es, erzählt zu werden." ✧
              <br /> ~ Aus den Chroniken der Abenteurer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}