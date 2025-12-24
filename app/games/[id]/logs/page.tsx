'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import ArticleBrowser from '@/components/ArticleBrowser.client';
import Logs from '@/components/Logs.client';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import GraphView from '@/components/graphview';
import Timeline from '@/components/Timeline';
import StoryBuilder from '@/components/storyGraph/story';
import PlayerList from '@/components/PlayerList.client'; // Stellen sicher, dass der Pfad stimmt
import type { Post } from '@/lib/types';

export default function CombinedPage() {
  const params = useParams();
  const gameId = parseInt(params?.id as string, 10);
  const supabase = useSupabaseClient();
  const user = useUser();

  const [articles, setArticles] = useState<Post[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'articles' | 'logs' | 'graph' | 'timeline' | 'story' | 'players'>('logs');
  
  const [selectedArticleFromLogs, setSelectedArticleFromLogs] = useState<Post | null>(null);
  const [selectedArticleContent, setSelectedArticleContent] = useState<string | null>(null);
  const [isLoadingArticleContent, setIsLoadingArticleContent] = useState(false);

  useEffect(() => {
    if (!gameId || isNaN(gameId)) return;

    (async () => {
      setIsLoading(true);
      
      const { data: articlesData, error: articlesError } = await supabase
        .from('posts')
        .select('*')
        .eq('game_id', gameId);

      if (articlesError) console.error(articlesError);
      else setArticles(articlesData || []);

      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId);

      if (foldersError) console.error(foldersError);
      else setFolders(foldersData || []);

      setIsLoading(false);
    })();
  }, [gameId, supabase]);

  const handleDeleteArticle = async (id: number) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      console.error(error);
      return false;
    } else {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      if (selectedArticleFromLogs?.id === id) {
        setSelectedArticleFromLogs(null);
        setSelectedArticleContent(null);
      }
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

  const handleArticleSelectFromLogs = async (title: string) => {
    const matchedArticle = articles.find((a) => a.title === title);
    
    if (!matchedArticle) {
      alert(`Kein Artikel mit dem Titel „${title}" gefunden.`);
      return;
    }

    setSelectedArticleFromLogs(matchedArticle);
    setSelectedArticleContent(null);
    setIsLoadingArticleContent(true);

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('content')
        .eq('id', matchedArticle.id)
        .single();

      if (error) {
        setSelectedArticleContent('*Die Zeichen verblassen vor deinen Augen…*');
      } else {
        setSelectedArticleContent(data.content);
      }
    } catch (error) {
      setSelectedArticleContent('*Ein mysteriöser Fehler verhindert das Lesen dieses Textes…*');
    } finally {
      setIsLoadingArticleContent(false);
    }
  };

  const handleGraphNodeClick = (article: Post) => {
    setActiveTab('articles');
  };

  if (isNaN(gameId)) {
    return <div className="p-10 text-error">Ungültige Spiel-ID</div>;
  }

  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      {/* Navigation Tabs */}
      <div className="flex justify-center py-6 gap-8 text-lg flex-wrap px-4">
        <button className={activeTab === 'logs' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('logs')}>Logs</button>
        <button className={activeTab === 'articles' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('articles')}>Artikel</button>
        <button className={activeTab === 'graph' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('graph')}>Graphenansicht</button>
        <button className={activeTab === 'timeline' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('timeline')}>Timeline</button>
        <button className={activeTab === 'story' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('story')}>Story</button>
        <button className={activeTab === 'players' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('players')}>Spieler</button>
      </div>

      <div className="px-6 relative">
        <div className="relative overflow-hidden min-h-[500px]">
          
          {/* LOGS TAB */}
          <div className={activeTab === 'logs' ? 'block' : 'hidden'}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="lg:w-1/2">
                {selectedArticleFromLogs ? (
                  <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-6 max-h-[700px] overflow-y-auto">
                     <div className="flex justify-between">
                       <h3 className="font-serif text-xl text-amber-200">{selectedArticleFromLogs.title}</h3>
                       <button onClick={() => setSelectedArticleFromLogs(null)}>✕</button>
                     </div>
                     {isLoadingArticleContent ? (
                       <div className="text-amber-200/50">Lade...</div>
                     ) : (
                       <MarkdownRenderer content={selectedArticleContent || ''} onLinkClick={handleArticleSelectFromLogs} className="prose-mystical-article" />
                     )}
                  </div>
                ) : (
                  <div className="text-center text-amber-200/30 p-10 border border-amber-900/20 rounded-lg">Wähle einen Link im Log</div>
                )}
              </div>
              <div className="lg:w-1/2">
                <Logs gameId={gameId.toString()} onArticleSelect={handleArticleSelectFromLogs} />
              </div>
            </div>
          </div>

          {/* ARTICLES TAB */}
          <div className={activeTab === 'articles' ? 'block' : 'hidden'}>
             <ArticleBrowser 
               articles={articles} gameId={gameId} isLoading={isLoading} 
               onDeleteArticle={handleDeleteArticle} onAddArticle={handleAddArticle} onUpdateArticle={handleUpdateArticle} 
             />
          </div>

          {/* GRAPH TAB */}
          <div className={activeTab === 'graph' ? 'block' : 'hidden'}>
            <div className="w-full flex justify-center">
              {!isLoading && (
                <GraphView 
                  articles={articles} folders={folders} onNodeClick={handleGraphNodeClick}
                  width={1000} height={700}
                />
              )}
            </div>
          </div>

          {/* TIMELINE TAB */}
          <div className={activeTab === 'timeline' ? 'block' : 'hidden'}>
             <Timeline gameId={gameId} />
          </div>

          {/* STORY TAB */}
          <div className={activeTab === 'story' ? 'block' : 'hidden'}>
             <StoryBuilder gameId={gameId} />
          </div>

          {/* PLAYERS TAB */}
          <div className={activeTab === 'players' ? 'block' : 'hidden'}>
             <h2 className="text-2xl font-bold mb-6 text-center text-amber-400 font-serif">Die Gefährten</h2>
             <PlayerList gameId={gameId} />
          </div>

        </div>
      </div>
      
      {/* Styles (gekürzt für Übersicht) */}
      <style jsx>{`
        :global(.prose-mystical-article) { color: rgb(251 191 36 / 0.9); }
        /* ... restliche Styles ... */
      `}</style>
    </div>
  );
}