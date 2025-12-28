'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Rnd } from 'react-rnd'; 

// --- IMPORTS ---
import ArticleBrowser from '@/components/ArticleBrowser.client';
import Logs from '@/components/Logs.client';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import GraphView from '@/components/graphview';
import Timeline from '@/components/Timeline';
import StoryBuilder from '@/components/storyGraph/story';
import PlayerList from '@/components/PlayerList.client';
import type { Post } from '@/lib/types';

// Components
import { ArticleViewer } from '@/components/articleBrowser/ArticleViewer'; 
import PlayerDashboardGrid from '@/components/PlayerDashboardGrid'; 

type WindowType = 'logs' | 'reader' | 'graph' | 'timeline' | 'story' | 'players' | 'browser' | 'articles';

interface WindowState {
  id: string;
  type: WindowType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  articleData?: Post | null; 
}

export default function CombinedPage() {
  const params = useParams();
  const gameId = parseInt(params?.id as string, 10);
  const supabase = useSupabaseClient();

  const [articles, setArticles] = useState<Post[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'logs' | 'graph' | 'timeline' | 'story' | 'players'>('dashboard');
  
  // Legacy State
  const [selectedArticleFromLogs, setSelectedArticleFromLogs] = useState<Post | null>(null);
  const [selectedArticleContent, setSelectedArticleContent] = useState<string | null>(null);
  const [isLoadingArticleContent, setIsLoadingArticleContent] = useState(false);
  
  // Game Title
  const [gameTitle, setGameTitle] = useState<string>('');

  // Dashboard State
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeZIndex, setActiveZIndex] = useState(10);
  const [isClient, setIsClient] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(1200); // Standard-Höhe etwas größer starten

  // --- AUTOMATISCHE HÖHENBERECHNUNG (Beim Laden/Loslassen) ---
  useEffect(() => {
    if (windows.length === 0) return;
    const maxBottom = Math.max(...windows.map(w => w.y + (w.isMinimized ? 40 : w.height)));
    
    // Immer mindestens 100vh oder Screen-Height garantieren + Puffer
    const minRequired = maxBottom + 600; 
    if (minRequired > canvasHeight) {
        setCanvasHeight(minRequired);
    }
  }, [windows]); // Reagiert auf onDragStop Updates

  useEffect(() => {
    setIsClient(true);
    if (!gameId || isNaN(gameId)) return;

    (async () => {
      setIsLoading(true);
      const { data: a } = await supabase.from('posts').select('*').eq('game_id', gameId);
      const { data: f } = await supabase.from('folders').select('*').eq('game_id', gameId);
      setArticles(a || []);
      setFolders(f || []);

      const { data: gameData } = await supabase.from('games').select('name').eq('id', gameId).single();
      if (gameData) {
         setGameTitle(gameData.name);
         document.title = gameData.name; 
      }

      setIsLoading(false);

      if ((a || []).length >= 0) {
         spawnWindow('logs', 'Logbuch', 20, 80, 400, 600);
         spawnWindow('graph', 'Wissensnetz', 440, 80, 500, 400);
      }
    })();
  }, [gameId, supabase]);

  // --- HANDLER ---
  const spawnWindow = (type: WindowType, title: string, x = 50, y = 50, w = 400, h = 300, data: any = null) => {
    const newId = Date.now().toString() + Math.random();
    const newZ = activeZIndex + 1;
    setActiveZIndex(newZ);
    setWindows(prev => [...prev, {
      id: newId, type, title, x, y, width: w, height: h, zIndex: newZ, isMinimized: false, articleData: data
    }]);
  };

  const closeWindow = (id: string) => setWindows(prev => prev.filter(w => w.id !== id));
  const toggleMinimize = (id: string) => setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
  
  const bringToFront = (id: string) => {
    const newZ = activeZIndex + 1;
    setActiveZIndex(newZ);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: newZ } : w));
  };
  
  const updateWindowPos = (id: string, d: { x: number, y: number }) => setWindows(prev => prev.map(w => w.id === id ? { ...w, x: d.x, y: d.y } : w));
  const updateWindowSize = (id: string, s: { width: number, height: number }, pos: { x: number, y: number }) => setWindows(prev => prev.map(w => w.id === id ? { ...w, width: s.width, height: s.height, x: pos.x, y: pos.y } : w));

  const handleDashboardArticleSelect = (articleOrTitle: string | Post) => {
    let matchedArticle: Post | undefined;
    if (typeof articleOrTitle === 'string') {
        matchedArticle = articles.find((a) => a.title === articleOrTitle);
    } else {
        matchedArticle = articleOrTitle;
    }
    if (!matchedArticle) return; 

    const existingReader = windows.find(w => w.type === 'reader');
    if (existingReader) {
      setWindows(prev => prev.map(w => 
        w.id === existingReader.id 
          ? { ...w, title: matchedArticle!.title, articleData: matchedArticle, zIndex: activeZIndex + 1, isMinimized: false } 
          : w
      ));
      setActiveZIndex(prev => prev + 1);
    } else {
      spawnWindow('reader', matchedArticle.title, 300, 100, 500, 600, matchedArticle);
    }
  };

  const renderWindowContent = (win: WindowState) => {
    switch (win.type) {
        case 'logs': return <Logs gameId={gameId.toString()} onArticleSelect={handleDashboardArticleSelect} />;
        case 'graph': return (
            <div className="w-full h-full bg-black overflow-hidden">
                <GraphView articles={articles} folders={folders} onNodeClick={(node) => handleDashboardArticleSelect(node)} width={win.width} height={win.height} />
            </div>
        );
        case 'reader': return (
            <div className="h-full w-full overflow-y-auto bg-[#0a0a0a] p-0 custom-scrollbar scrollbar-thin scrollbar-thumb-amber-700 scrollbar-track-transparent">
                <ArticleViewer key={win.articleData?.id || 'empty'} selected={win.articleData || null} articles={articles} onSelectArticle={handleDashboardArticleSelect} />
            </div>
        );
        case 'players': return (
            <div className="h-full w-full bg-[#050505]">
                <PlayerDashboardGrid gameId={gameId} />
            </div>
        );
        case 'articles': case 'browser': return (
            <div className="h-full w-full overflow-y-auto bg-[#1a1a1a] custom-scrollbar">
                <ArticleBrowser articles={articles} gameId={gameId} isLoading={isLoading} onDeleteArticle={()=>{return Promise.resolve(true)}} onAddArticle={()=>{}} onUpdateArticle={()=>{}} />
            </div>
        );
        case 'timeline': return <Timeline gameId={gameId} />;
        case 'story': return <StoryBuilder gameId={gameId} />;
        default: return null;
    }
  };

  // Legacy Handlers
  const handleArticleSelectFromLogs = async (t: string) => {};
  const handleGraphNodeClick = (a: Post) => setActiveTab('articles');
  const handleDeleteArticle = async (id: number) => true;
  const handleAddArticle = (n: Post) => {};
  const handleUpdateArticle = (u: Post) => {};

  if (!isClient) return null; 

  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      {/* Navigation */}
      <div className="flex justify-center py-6 gap-8 text-lg flex-wrap px-4 bg-base-100 border-b border-base-300 shadow-sm z-50 relative">
        <div className="flex justify-center py-6 gap-8 text-lg flex-wrap px-4 bg-base-100 border-b border-base-300 shadow-sm z-50 relative">
        <button className={activeTab === 'dashboard' ? 'underline text-amber-500 font-bold' : 'text-gray-400 hover:text-amber-600 transition'} onClick={() => setActiveTab('dashboard')}>🖥️ Dashboard</button>
        <span className="text-gray-300">|</span>
        <button className={activeTab === 'logs' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('logs')}>Logs</button>
        <button className={activeTab === 'articles' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('articles')}>Artikel</button>
        <button className={activeTab === 'graph' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('graph')}>Graph</button>
        <button className={activeTab === 'timeline' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('timeline')}>Timeline</button>
        <button className={activeTab === 'story' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('story')}>Story</button>
        <button className={activeTab === 'players' ? 'underline text-amber-400 font-bold' : 'text-gray-400'} onClick={() => setActiveTab('players')}>Spieler</button>
        </div>
      </div>

      <div className="relative w-full">
        {/* DASHBOARD TAB */}
        <div className={`${activeTab === 'dashboard' ? 'block' : 'hidden'} h-[calc(100vh-100px)] w-full relative`}>
           
           {/* Taskbar */}
           <div className="absolute top-0 left-0 right-0 h-10 bg-base-300/90 backdrop-blur border-b border-amber-900/20 flex items-center px-4 gap-2 z-[40]">
              <span className="text-xs font-bold text-amber-600 mr-2 uppercase tracking-widest">Tools:</span>
              <button type="button" onClick={() => spawnWindow('logs', 'Logbuch')} className="btn btn-xs btn-ghost">Logs</button>
              <button type="button" onClick={() => spawnWindow('articles', 'Artikel')} className="btn btn-xs btn-ghost">Artikel</button>
              <button type="button" onClick={() => spawnWindow('graph', 'Graph')} className="btn btn-xs btn-ghost">Graph</button>
              <button type="button" onClick={() => spawnWindow('story', 'Story')} className="btn btn-xs btn-ghost">Story</button>
              <button type="button" onClick={() => spawnWindow('players', 'Gefährten', 50, 50, 400, 300)} className="btn btn-xs btn-ghost">Spieler</button>
              <button type="button" onClick={() => spawnWindow('timeline', 'Timeline', 100, 400, 800, 300)} className="btn btn-xs btn-ghost">Timeline</button>
              <div className="flex-grow"></div>
              <div className="text-[10px] text-gray-500 hidden md:block">Infinite Canvas Height: {Math.round(canvasHeight)}px</div>
           </div>

           {/* Scrollable Viewport */}
           <div className="w-full h-full pt-10 relative overflow-auto custom-scrollbar bg-[#050505]">
             
             {/* INFINITE CANVAS - Wächst mit dem Inhalt */}
             <div 
                className="w-full relative bg-[url('/img/dark-pattern.png')] bg-repeat transition-all duration-75 ease-linear"
                style={{ height: `${canvasHeight}px`, minHeight: '100%' }}
             >
                {windows.map((win) => (
                    <Rnd
                        key={win.id}
                        size={{ width: win.width, height: win.isMinimized ? 36 : win.height }}
                        position={{ x: win.x, y: win.y }}
                        
                        // --- LIVE UPDATE BEIM ZIEHEN ---
                        onDrag={(e, d) => {
                            // Berechne Unterkante des Fensters während des Ziehens
                            const currentBottom = d.y + (win.isMinimized ? 40 : win.height);
                            // Wenn wir näher als 400px an den Rand kommen, vergrößere den Canvas sofort
                            if (currentBottom + 400 > canvasHeight) {
                                setCanvasHeight(currentBottom + 600); // Gib direkt etwas mehr Platz
                            }
                        }}

                        onDragStop={(e, d) => updateWindowPos(win.id, { x: d.x, y: d.y })}
                        onResizeStop={(e, dir, ref, delta, pos) => {
                            if (!win.isMinimized) updateWindowSize(win.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height) }, pos);
                        }}
                        onClick={() => bringToFront(win.id)}
                        minWidth={300} minHeight={36} 
                        dragHandleClassName="window-header"
                        enableResizing={!win.isMinimized}
                        style={{ zIndex: win.zIndex }}
                        className={`flex flex-col bg-base-100 shadow-2xl border border-amber-900/30 rounded ${win.zIndex === activeZIndex ? 'ring-1 ring-amber-400' : ''}`}
                    >
                        {/* Fenster Inhalt */}
                        <div className="flex flex-col w-full h-full overflow-hidden rounded bg-base-100">
                            <div className="window-header h-9 flex-none bg-base-300 border-b border-amber-900/10 flex justify-between items-center px-2 cursor-move select-none"
                                onDoubleClick={() => toggleMinimize(win.id)}>
                                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide truncate max-w-[200px]">{win.title}</span>
                                <div className="flex gap-1" onMouseDown={(e) => e.stopPropagation()}>
                                    <button onClick={() => toggleMinimize(win.id)} className="w-6 h-6 flex items-center justify-center hover:bg-black/10 rounded text-amber-600 font-bold text-xs">_</button>
                                    <button onClick={() => closeWindow(win.id)} className="w-6 h-6 flex items-center justify-center hover:bg-red-900/20 hover:text-red-500 rounded text-gray-400 font-bold text-xs">✕</button>
                                </div>
                            </div>
                            <div className={`flex-1 min-h-0 relative w-full ${win.isMinimized ? 'hidden' : 'block'}`}>
                                {renderWindowContent(win)}
                            </div>
                        </div>
                    </Rnd>
                ))}
             </div>
           </div>
        </div>

        {/* =====================================================================================
            ALTE TABS (Legacy View)
           ===================================================================================== */}
        
        <div className="px-6 relative">
          <div className="relative overflow-hidden min-h-[500px]">
          
          {/* LOGS TAB */}
          <div className={activeTab === 'logs' ? 'block' : 'hidden'}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="lg:w-1/2">
                {selectedArticleFromLogs ? (
                  <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-6 max-h-[700px] overflow-y-auto custom-scrollbar">
                     <div className="flex justify-between">
                       <h3 className="font-serif text-xl text-amber-200">{selectedArticleFromLogs.title}</h3>
                       <button onClick={() => setSelectedArticleFromLogs(null)}>✕</button>
                     </div>
                     {isLoadingArticleContent ? <div className="text-amber-200/50">Lade...</div> : <MarkdownRenderer content={selectedArticleContent || ''} onLinkClick={handleArticleSelectFromLogs} className="prose-mystical-article" />}
                  </div>
                ) : <div className="text-center text-amber-200/30 p-10 border border-amber-900/20 rounded-lg">Wähle einen Link im Log</div>}
              </div>
              <div className="lg:w-1/2">
                <Logs gameId={gameId.toString()} onArticleSelect={handleArticleSelectFromLogs} />
              </div>
            </div>
          </div>

          <div className={activeTab === 'articles' ? 'block' : 'hidden'}>
             <ArticleBrowser articles={articles} gameId={gameId} isLoading={isLoading} onDeleteArticle={handleDeleteArticle} onAddArticle={handleAddArticle} onUpdateArticle={handleUpdateArticle} />
          </div>

          <div className={activeTab === 'graph' ? 'block' : 'hidden'}>
            <div className="w-full flex justify-center">
              {!isLoading && <GraphView articles={articles} folders={folders} onNodeClick={handleGraphNodeClick} width={1000} height={700} />}
            </div>
          </div>

          <div className={activeTab === 'timeline' ? 'block' : 'hidden'}>
             <Timeline gameId={gameId} />
          </div>

          <div className={activeTab === 'story' ? 'block' : 'hidden'}>
             <StoryBuilder gameId={gameId} />
          </div>

          <div className={activeTab === 'players' ? 'block' : 'hidden'}>
             <h2 className="text-2xl font-bold mb-6 text-center text-amber-400 font-serif">Die Gefährten</h2>
             <PlayerList gameId={gameId} />
          </div>

        </div>
      </div>
      
      {/* GLOBAL CSS Styles Fallback, falls Tailwind-Plugin versagt */}
      <style jsx global>{`
        :global(.prose-mystical-article) { color: rgb(251 191 36 / 0.9); }

        ::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
          display: block !important;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2) !important; 
        }
        ::-webkit-scrollbar-thumb {
          background: #78350f !important;
          border-radius: 4px;
          border: 1px solid #000;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #d97706 !important;
        }
        
        /* Firefox */
        * {
            scrollbar-width: thin;
            scrollbar-color: #78350f rgba(0, 0, 0, 0.2);
        }
      `}</style>
      </div>
    </div>
  );
}