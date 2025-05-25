'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ArticleBrowser from '@/components/ArticleBrowser.client';
import Logs from '@/components/Logs.client';
import type { Post } from '@/lib/types';

export default function CombinedPage() {
  const params = useParams();
  const gameId = parseInt(params?.id as string, 10);
  const [articles, setArticles] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!gameId || isNaN(gameId)) return;

    console.log('Lade Artikel für Spiel mit ID:', gameId);

    (async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('game_id', gameId);

      if (error) {
        console.error('Fehler beim Laden der Artikel:', error);
      } else {
        console.log('Supabase result:', { data, error });
        setArticles(data || []);
        console.log('Geladene Artikel:', data);
        console.table(data);
      }
      setIsLoading(false);
    })();
  }, [gameId]);

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
    <div className="min-h-screen bg-base-200 p-6 flex flex-col lg:flex-row gap-6" data-theme="fantasy">
      <div className="w-full lg:w-1/2">
        <ArticleBrowser 
          articles={articles}
          gameId={gameId}
          isLoading={isLoading}
          onDeleteArticle={handleDeleteArticle}
          onAddArticle={handleAddArticle}
          onUpdateArticle={handleUpdateArticle}
        />
      </div>
      <div className="w-full lg:w-1/2">
        <Logs gameId={gameId.toString()} />
      </div>
    </div>
  );
}