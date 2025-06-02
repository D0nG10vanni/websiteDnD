'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import ArticleBrowser from '@/components/ArticleBrowser.client';
import Logs from '@/components/Logs.client';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import GraphView from '@/components/graphview';
import type { Post } from '@/lib/types';

export default function CombinedPage() {
  const params = useParams();
  const gameId = parseInt(params?.id as string, 10);
  const supabase = useSupabaseClient();
  const user = useUser();
  console.log('Angemeldeter Benutzer:', user?.id);

  const [articles, setArticles] = useState<Post[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'logs' | 'graph'>('logs');
  const [selectedArticleFromLogs, setSelectedArticleFromLogs] = useState<Post | null>(null);
  const [selectedArticleContent, setSelectedArticleContent] = useState<string | null>(null);
  const [isLoadingArticleContent, setIsLoadingArticleContent] = useState(false);

  useEffect(() => {
    if (!gameId || isNaN(gameId)) return;

    (async () => {
      setIsLoading(true);
      
      // Load articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('posts')
        .select('*')
        .eq('game_id', gameId);

      if (articlesError) {
        console.error('Fehler beim Laden der Artikel:', articlesError);
      } else {
        setArticles(articlesData || []);
      }

      // Load folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId);

      if (foldersError) {
        console.error('Fehler beim Laden der Ordner:', foldersError);
      } else {
        setFolders(foldersData || []);
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
      // Reset selected article if it was deleted
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
        console.error('Fehler beim Laden des Artikelinhalts:', error);
        setSelectedArticleContent('*Die Zeichen verblassen vor deinen Augen…*');
      } else {
        setSelectedArticleContent(data.content);
      }
    } catch (error) {
      console.error('Unerwarteter Fehler:', error);
      setSelectedArticleContent('*Ein mysteriöser Fehler verhindert das Lesen dieses Textes…*');
    } finally {
      setIsLoadingArticleContent(false);
    }
  };

  const handleGraphNodeClick = (article: Post) => {
    // Switch to articles tab and show the selected article
    setActiveTab('articles');
    // You can add additional logic here to select the article in ArticleBrowser
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
        <button
          className={`transition-all duration-300 hover:scale-110 ${
            activeTab === 'graph'
              ? 'underline text-secondary font-bold transform scale-105'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('graph')}
        >
          Graphenansicht
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
                Logs der Chroniken
              </h2>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Linker Bereich - Artikel-Anzeige */}
              <div className="lg:w-1/2">
                {selectedArticleFromLogs ? (
                  <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-6 max-h-[700px] overflow-y-auto">
                    {isLoadingArticleContent ? (
                      <div className="text-center py-12 text-amber-200/50 italic font-serif">
                        Die mystischen Runen enthüllen sich langsam…
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-serif text-xl text-amber-200 tracking-wider">
                            <span className="text-amber-500 mr-2">❖</span>
                            {selectedArticleFromLogs.title}
                          </h3>
                          <button
                            onClick={() => {
                              setSelectedArticleFromLogs(null);
                              setSelectedArticleContent(null);
                            }}
                            className="text-amber-400 hover:text-amber-300 transition-colors px-2 py-1 rounded"
                            title="Artikel schließen"
                          >
                            ✕
                          </button>
                        </div>
                        
                        {selectedArticleContent && (
                          <>
                            <MarkdownRenderer
                              content={selectedArticleContent}
                              onLinkClick={handleArticleSelectFromLogs}
                              className="prose-mystical-article"
                            />
                            <div className="text-center text-xs text-amber-200/40 font-serif italic mt-4 pt-4 border-t border-amber-900/30">
                              Aus dem Kodex, Folio {selectedArticleFromLogs.id}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-black/10 backdrop-blur-sm rounded-lg border border-amber-900/20 p-6 h-[400px] flex items-center justify-center">
                    <div className="text-center text-amber-200/30 font-serif italic">
                      <div className="text-4xl mb-4">📜</div>
                      <p>Klicke auf einen [[Wiki-Link]] in den Logs,</p>
                      <p>um hier den Artikel anzuzeigen</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dunkelgrauer Trenner */}
              <div className="hidden lg:flex items-stretch">
                <div className="w-px bg-gray-700 mx-4" />
              </div>
              
              {/* Rechter Bereich – Logs */}
              <div className="lg:w-1/2">
                <Logs 
                  gameId={gameId.toString()} 
                  onArticleSelect={handleArticleSelectFromLogs}
                />
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

          {/* Graph Tab */}
          <div
            className={`w-full bg-base-100 p-6 rounded-lg shadow-md transition-all duration-700 ease-in-out transform ${
              activeTab === 'graph'
                ? 'opacity-100 translate-x-0 scale-100'
                : 'opacity-0 translate-x-8 scale-95 pointer-events-none absolute top-0 left-0'
            }`}
          >
            <div className="w-full">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-secondary to-info bg-clip-text text-transparent">
                  Graphenansicht der Artikel
                </h2>
              </div>
              
              {isLoading ? (
                <div className="text-center py-12 text-amber-200/50 italic font-serif">
                  Die Verbindungen zwischen den Artikeln werden erkundet…
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <GraphView 
                    articles={articles}
                    folders={folders}
                    onNodeClick={handleGraphNodeClick}
                    width={Math.min(1200, window.innerWidth - 100)}
                    height={700}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        :global(.prose-mystical-article) {
          color: rgb(251 191 36 / 0.9);
        }
        :global(.prose-mystical-article h1, .prose-mystical-article h2, .prose-mystical-article h3) {
          color: rgb(251 191 36);
          border-bottom: 1px solid rgb(251 191 36 / 0.3);
          padding-bottom: 0.5rem;
        }
        :global(.prose-mystical-article p) {
          margin: 1rem 0;
          line-height: 1.6;
        }
        :global(.prose-mystical-article ul, .prose-mystical-article ol) {
          color: rgb(251 191 36 / 0.8);
        }
        :global(.prose-mystical-article blockquote) {
          border-left: 4px solid rgb(251 191 36 / 0.4);
          background: rgb(0 0 0 / 0.2);
          padding: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }
        :global(.prose-mystical-article code) {
          background: rgb(0 0 0 / 0.4);
          color: rgb(251 191 36 / 0.9);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
        }
        :global(.prose-mystical-article pre) {
          background: rgb(0 0 0 / 0.4);
          border: 1px solid rgb(251 191 36 / 0.3);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}