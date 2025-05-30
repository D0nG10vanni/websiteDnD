'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import ArticleBrowser from '@/components/ArticleBrowser.client';
import Logs from '@/components/Logs.client';
import type { Post } from '@/lib/types';

export default function CombinedPage() {
  const params = useParams();
  const gameId = parseInt(params?.id as string, 10);
  const supabase = useSupabaseClient();
  const user = useUser();
  console.log('Angemeldeter Benutzer:', user?.id);


  const [articles, setArticles] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'logs'>('logs');

  useEffect(() => {
    if (!gameId || isNaN(gameId)) return;

    (async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('game_id', gameId);

      if (error) {
        console.error('Fehler beim Laden der Artikel:', error);
      } else {
        setArticles(data || []);
      }
      setIsLoading(false);
    })();
  }, [gameId, supabase]);


  const handleDeleteArticle = async (id: number) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      console.error('Fehler beim Löschen:', error);
      return false;
    } else {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      return true;
    }
  };

  const handleAddArticle = (newArticle: Post) => {
    setArticles((prev) => [...prev, newArticle]);
  };

  const handleUpdateArticle = (updatedArticle: Post) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === updatedArticle.id ? updatedArticle : article
      )
    );
  };

  if (isNaN(gameId)) {
    return (
      <div className="min-h-screen bg-base-200 p-6 flex items-center justify-center" data-theme="fantasy">
        <div className="text-center text-error">
          <h1 className="text-2xl font-bold">Ungültige Spiel-ID</h1>
          <p>Die angegebene Spiel-ID ist nicht gültig.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      {/* Tab-Leiste mit Animation */}
      <div className="flex justify-center py-6 gap-8 text-lg">
        <button
          className={`transition-all duration-300 hover:scale-110 ${
            activeTab === 'logs'
              ? 'underline text-primary font-bold transform scale-105'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
        <button
          className={`transition-all duration-300 hover:scale-110 ${
            activeTab === 'articles'
              ? 'underline text-accent font-bold transform scale-105'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('articles')}
        >
          Artikel
        </button>
      </div>

      {/* Content Area */}
      <div className="px-6 relative">
        <div className="relative overflow-hidden">
          {/* Logs Tab */}
            <div
              className={`w-full bg-base-100 p-6 rounded-lg shadow-md transition-all duration-700 ease-in-out transform ${
              activeTab === 'logs'
                ? 'opacity-100 translate-x-0 scale-100'
                : 'opacity-0 translate-x-8 scale-95 pointer-events-none absolute top-0 left-0'
              }`}
            >
              {/* Titel zentriert */}
              <div className="w-full flex justify-center mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-info bg-clip-text text-transparent text-center">
                Logs
              </h2>
              </div>
              <div className="flex flex-col lg:flex-row gap-4">
              {/* Linker Bereich (z. B. Info oder frei lassen) */}
              <div className="lg:w-1/2">
                <p className="text-gray-400">Platzhalter für Inhalte auf der linken Seite</p>
              </div>
              {/* Dunkelgrauer Trenner */}
              <div className="hidden lg:flex items-stretch">
                <div className="w-px bg-gray-700 mx-4" />
              </div>
              {/* Rechter Bereich – Logs */}
              <div className="lg:w-1/2">
                <Logs gameId={gameId.toString()} />
              </div>
              </div>
            </div>

          {/* Artikel Tab */}
          <div
            className={`w-full bg-base-100 p-6 rounded-lg shadow-md transition-all duration-700 ease-in-out transform ${
              activeTab === 'articles'
                ? 'opacity-100 translate-x-0 scale-100'
                : 'opacity-0 translate-x-8 scale-95 pointer-events-none absolute top-0 left-0'
            }`}
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Artikelübersicht
            </h2>
            <div className="overflow-x-auto">
              <ArticleBrowser
                articles={articles}
                gameId={gameId}
                isLoading={isLoading}
                onDeleteArticle={handleDeleteArticle}
                onAddArticle={handleAddArticle}
                onUpdateArticle={handleUpdateArticle}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
