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

  useEffect(() => {
    if (!gameId) return;

    console.log('Lade Artikel für Spiel mit ID:', gameId);

    (async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('game_id', gameId); // Nur Artikel mit dieser gameId laden

      if (error) {
        console.error('Fehler beim Laden der Artikel:', error);
      } else {
        console.log('Supabase result:', { data, error })
        setArticles(data || []);
        console.log('Geladene Artikel:', data);
        console.table(data);
        
      }
    })();
  }, [gameId]); 

  return (
    <div className="min-h-screen bg-base-200 p-6 flex flex-col lg:flex-row gap-6" data-theme="fantasy">
      <div className="w-full lg:w-1/2">
        <ArticleBrowser initialArticles={articles} gameId={gameId} />
      </div>
      <div className="w-full lg:w-1/2">
        <Logs gameId={params?.id as string} />
      </div>
    </div>
  );
}
