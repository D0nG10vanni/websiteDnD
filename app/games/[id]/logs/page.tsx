'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Rnd } from 'react-rnd'; 

// --- IMPORTS ---
// Stelle sicher, dass diese Pfade in deinem Projekt korrekt sind
import ArticleBrowser from '@/components/ArticleBrowser.client';
import Logs from '@/components/Logs.client';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import GraphView from '@/components/graphview';
import Timeline from '@/components/Timeline';
import StoryBuilder from '@/components/storyGraph/story';
import PlayerList from '@/components/PlayerList.client';
import type { Post } from '@/lib/types';

// Dashboard Components
import { ArticleViewer } from '@/components/articleBrowser/ArticleViewer'; 
import PlayerDashboardGrid from '@/components/PlayerDashboardGrid';
import InfiniteStarfield from '@/components/InfiniteStarfield';
import TimeTracker from '@/components/TimeTracker';

type WindowType = 'logs' | 'reader' | 'graph' | 'timeline' | 'story' | 'players' | 'browser' | 'articles' | 'timer';

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

  // --- DATA STATES ---
  const [articles, setArticles] = useState<Post[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'logs' | 'graph' | 'timeline' | 'story' | 'players'>('dashboard');
  
  const [selectedArticleFromLogs, setSelectedArticleFromLogs] = useState<Post | null>(null);
  const [selectedArticleContent, setSelectedArticleContent] = useState<string | null>(null);
  const [isLoadingArticleContent, setIsLoadingArticleContent] = useState(false);
  
  const [gameTitle, setGameTitle] = useState<string>('');

  // --- DASHBOARD STATES ---
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeZIndex, setActiveZIndex] = useState(10);
  const [isClient, setIsClient] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(1200); 
  const [hasLoadedLayout, setHasLoadedLayout] = useState(false);

  // --- 1. LAYOUT LADEN ---
  const loadLayoutFromStorage = () => {
    if (typeof window === 'undefined') return false;
    try {
        const storageKey = `dnd_dashboard_save_${gameId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.windows && Array.isArray(parsed.windows)) {
                setWindows(parsed.windows);
                const maxZ = Math.max(...parsed.windows.map((w: WindowState) => w.zIndex || 10), 10);
                setActiveZIndex(maxZ + 1);
            }
            if (parsed.canvasHeight) setCanvasHeight(Math.max(parsed.canvasHeight, 1200));
            if (parsed.activeTab) setActiveTab(parsed.activeTab);
            return true;
        }
    } catch (e) { console.error(e); }
    return false;
  };

  // --- 2. LAYOUT SPEICHERN ---
  useEffect(() => {
    if (!isClient || !gameId || !hasLoadedLayout) return;
    const timeoutId = setTimeout(() => {
        const storageKey = `dnd_dashboard_save_${gameId}`;
        const stateToSave = { windows, canvasHeight, activeTab };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [windows, canvasHeight, activeTab, gameId, isClient, hasLoadedLayout]);

  // --- CANVAS AUTO-GROW ---
  useEffect(() => {
    if (windows.length === 0) return;
    const maxBottom = Math.max(...windows.map(w => w.y + (w.isMinimized ? 40 : w.height)));
    const minRequired = maxBottom + 600; 
    if (minRequired > canvasHeight) setCanvasHeight(minRequired);
  }, [windows]); 

  // --- INITIAL DATA FETCH ---
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
      const loaded = loadLayoutFromStorage();
      setHasLoadedLayout(true);

      if (!loaded && (a || []).length >= 0) {
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
    if (typeof articleOrTitle === 'string') matchedArticle = articles.find((a) => a.title === articleOrTitle);
    else matchedArticle = articleOrTitle;
    if (!matchedArticle) return; 

    const existingReader = windows.find(w => w.type === 'reader');
    if (existingReader) {
      setWindows(prev => prev.map(w => w.id === existingReader.id ? { ...w, title: matchedArticle!.title, articleData: matchedArticle, zIndex: activeZIndex + 1, isMinimized: false } : w));
      setActiveZIndex(prev => prev + 1);
    } else {
      spawnWindow('reader', matchedArticle.title, 300, 100, 500, 600, matchedArticle);
    }
  };

  const handleDashboardArticleEdit = (article: Post) => {
    // Minimal implementation to satisfy required prop; opens the articles window for editing.
    spawnWindow('articles', 'Artikel', 60, 90, 820, 720, article);
  };

  const renderWindowContent = (win: WindowState) => {
    switch (win.type) {
        case 'logs': return <Logs gameId={gameId.toString()} onArticleSelect={handleDashboardArticleSelect} />;
        case 'graph': 
  return (
    <div className="w-full h-full bg-black overflow-hidden">
      {/* WICHTIG: 
         1. Kein width={...} mehr
         2. Kein height={...} mehr
         3. Der Parent-Div ("w-full h-full") bestimmt jetzt die Größe
      */}
      <GraphView 
        articles={articles} 
        folders={folders} 
        // Das hier hatten wir vorhin besprochen (damit der Tab nicht wechselt):
        // Falls du willst, dass beim Klick NICHTS im Dashboard passiert, 
        // kannst du onNodeClick auch ganz weglassen!
        // onNodeClick={(article) => handleDashboardArticleSelect(article)} 
      />
    </div>
  );
        case 'reader': return (<div className="h-full w-full overflow-y-auto bg-[#0a0a0a] p-0 custom-scrollbar scrollbar-thin scrollbar-thumb-amber-700 scrollbar-track-transparent"><ArticleViewer key={win.articleData?.id || 'empty'} selected={win.articleData || null} articles={articles} onSelectArticle={(a) => handleDashboardArticleSelect(a)} onEdit={handleDashboardArticleEdit} /></div>);
        case 'players': return (<div className="h-full w-full bg-[#050505]"><PlayerDashboardGrid gameId={gameId} /></div>);
        case 'articles': case 'browser': return (<div className="h-full w-full overflow-y-auto bg-[#1a1a1a] custom-scrollbar"><ArticleBrowser articles={articles} gameId={gameId} isLoading={isLoading} onDeleteArticle={handleDeleteArticle} onAddArticle={handleAddArticle} onUpdateArticle={handleUpdateArticle} /></div>);
        case 'timeline': return <Timeline gameId={gameId} />;
        case 'story': return <StoryBuilder gameId={gameId} />;
        case 'timer':
          return (
            <div className="h-full w-full bg-[#2a2a2a] flex items-center justify-center">
              <TimeTracker gameId={gameId} />
            </div>
          );
        default: return null;
    }
  };

  // Legacy Handlers
  const handleArticleSelectFromLogs = async (title: string) => {
    const matchedArticle = articles.find((a) => a.title === title);
    if (!matchedArticle) { alert(`Kein Artikel "${title}" gefunden.`); return; }
    setSelectedArticleFromLogs(matchedArticle);
    setSelectedArticleContent(null);
    setIsLoadingArticleContent(true);
    try {
      const { data, error } = await supabase.from('posts').select('content').eq('id', matchedArticle.id).single();
      if (error) setSelectedArticleContent('*Die Zeichen verblassen...*');
      else setSelectedArticleContent(data.content);
    } catch (e) { setSelectedArticleContent('*Fehler beim Lesen...*'); }
    finally { setIsLoadingArticleContent(false); }
  };
  const handleGraphNodeClick = (a: Post) => setActiveTab('articles');
  const handleDeleteArticle = async (id: number) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      if (selectedArticleFromLogs?.id === id) { setSelectedArticleFromLogs(null); setSelectedArticleContent(null); }
      return true;
    }
    return false;
  };
  const handleAddArticle = (n: Post) => setArticles((prev) => [...prev, n]);
  const handleUpdateArticle = (u: Post) => setArticles((prev) => prev.map((a) => a.id === u.id ? u : a));

  if (isNaN(gameId)) return <div className="p-10 text-error text-center">Kein Spiel ausgewählt.</div>;
  if (!isClient) return null; 

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-amber-900 selection:text-white relative overflow-hidden">
      
      {/* ========================================================================
        1. LAYER (Ganz hinten): HINTERGRUND
        ========================================================================
        Muss im DOM zuerst kommen, damit z-0 funktioniert, ohne Stacking Context Issues.
      */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-black">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-950/30 blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-slate-900/40 blur-[100px]"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(30,27,75,0.2)_0%,transparent_70%)]"></div>
      </div>

      {/* ========================================================================
        2. LAYER: DASHBOARD TABS (NAVIGATION)
        ========================================================================
        Klebt unter dem Global Header.
        Global Header = h-16 (64px). -> top-16.
        Z-Index: 9999 (Unter Global Header, über Content).
      */}
      <div className="fixed top-16 left-0 w-full h-16 flex items-center justify-center gap-8 px-4 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 shadow-2xl z-[9999]">
        <button className={activeTab === 'dashboard' ? 'text-amber-500 font-bold tracking-widest uppercase text-sm border-b-2 border-amber-500 pb-1' : 'text-gray-500 hover:text-gray-300 uppercase tracking-widest text-sm transition-colors'} onClick={() => setActiveTab('dashboard')}>🖥️ Dashboard</button>
        <span className="text-gray-700">|</span>
        <button className={activeTab === 'logs' ? 'text-amber-500 font-bold tracking-widest uppercase text-sm' : 'text-gray-500 hover:text-gray-300 uppercase tracking-widest text-sm transition-colors'} onClick={() => setActiveTab('logs')}>Logs</button>
        <button className={activeTab === 'articles' ? 'text-amber-500 font-bold tracking-widest uppercase text-sm' : 'text-gray-500 hover:text-gray-300 uppercase tracking-widest text-sm transition-colors'} onClick={() => setActiveTab('articles')}>Artikel</button>
        <button className={activeTab === 'graph' ? 'text-amber-500 font-bold tracking-widest uppercase text-sm' : 'text-gray-500 hover:text-gray-300 uppercase tracking-widest text-sm transition-colors'} onClick={() => setActiveTab('graph')}>Graph</button>
        <button className={activeTab === 'timeline' ? 'text-amber-500 font-bold tracking-widest uppercase text-sm' : 'text-gray-500 hover:text-gray-300 uppercase tracking-widest text-sm transition-colors'} onClick={() => setActiveTab('timeline')}>Timeline</button>
        <button className={activeTab === 'story' ? 'text-amber-500 font-bold tracking-widest uppercase text-sm' : 'text-gray-500 hover:text-gray-300 uppercase tracking-widest text-sm transition-colors'} onClick={() => setActiveTab('story')}>Story</button>
        <button className={activeTab === 'players' ? 'text-amber-500 font-bold tracking-widest uppercase text-sm' : 'text-gray-500 hover:text-gray-300 uppercase tracking-widest text-sm transition-colors'} onClick={() => setActiveTab('players')}>Spieler</button>
      </div>

      {/* ========================================================================
        3. LAYER: CONTENT LOGIK
        ========================================================================
      */}

      {/* --- FALL A: DASHBOARD IST AKTIV --- */}
      {/* Wir brauchen hier die Tools-Leiste, die an die Tabs geklebt wird. */}
      {activeTab === 'dashboard' && (
         <>
           {/* TOOLS LEISTE 
               Position: Unter den Tabs. Tabs enden bei 128px (64+64).
               Also: top-32.
               Z-Index: 9998 (Unter Tabs).
           */}
           <div className="fixed top-32 left-0 right-0 z-50 h-16 bg-black/90 flex items-center justify-center border-b border-white/10 backdrop-blur-md0 backdrop-blur border-b border-white/5 flex items-center px-4 gap-2 z-[9998]">
              <span className="text-[10px] font-bold text-amber-600/80 mr-2 uppercase tracking-widest">Tools:</span>
              <button onClick={() => spawnWindow('logs', 'Logbuch')} className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">LOGS</button>
              <button onClick={() => spawnWindow('articles', 'Artikel')} className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">ARTIKEL</button>
              <button onClick={() => spawnWindow('timer', 'Zeit', 100, 100, 290, 240)} className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">TIMER</button>
              <button onClick={() => spawnWindow('graph', 'Graph')} className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">GRAPH</button>
              <button onClick={() => spawnWindow('story', 'Story')} className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">STORY</button>
              <button onClick={() => spawnWindow('players', 'Gefährten')} className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">SPIELER</button>
              <button onClick={() => spawnWindow('timeline', 'Timeline')} className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition">TIMELINE</button>
              <div className="flex-grow"></div>
              <div className="text-[9px] text-gray-600 font-mono hidden md:block">
                  {hasLoadedLayout ? 'SESSION RESTORED' : 'NEW SESSION'} • H: {Math.round(canvasHeight)}px
              </div>
           </div>

           {/* CANVAS AREA 
               Position: Unter der Tools Leiste. 
               Rechnung: 128px (Tabs Ende) + 40px (Tools Höhe) = 168px.
               Also: top-[168px].
           */}
           <div className="fixed top-[168px] left-0 right-0 bottom-0 overflow-auto custom-scrollbar z-10">
             
             {/* Infinite Stars & Windows Container */}
             <div 
                data-theme="fantasy"
                className="fixed top-32 left-0 right-0 bottom-0 w-full overflow-y-auto z-10 custom-scrollbar bg-base-200 text-base-content"
              >  
                
                {/* Windows Rendering */}
                {windows.map((win) => (
                    <Rnd
                        key={win.id}
                        size={{ width: win.width, height: win.isMinimized ? 32 : win.height }}
                        position={{ x: win.x, y: win.y }}
                        onDrag={(e, d) => {
                            const currentBottom = d.y + (win.isMinimized ? 40 : win.height);
                            if (currentBottom + 500 > canvasHeight) {
                                setCanvasHeight(currentBottom + 1000);
                            }
                        }}
                        onDragStop={(e, d) => updateWindowPos(win.id, { x: d.x, y: d.y })}
                        onResizeStop={(e, dir, ref, delta, pos) => {
                            if (!win.isMinimized) updateWindowSize(win.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height) }, pos);
                        }}
                        onClick={() => bringToFront(win.id)}
                        minWidth={300} minHeight={32} 
                        dragHandleClassName="window-header"
                        enableResizing={!win.isMinimized}
                        style={{ zIndex: win.zIndex }}
                        className={`flex flex-col bg-[#0f0f0f] shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 rounded-lg overflow-hidden ${win.zIndex === activeZIndex ? 'ring-1 ring-amber-500/50 border-amber-500/30' : ''}`}
                    >
                        <div className="flex flex-col w-full h-full overflow-hidden">
                            <div className="window-header h-8 flex-none bg-[#1a1a1a] border-b border-white/5 flex justify-between items-center px-3 cursor-move select-none group"
                                onDoubleClick={() => toggleMinimize(win.id)}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${win.zIndex === activeZIndex ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-gray-600'}`}></div>
                                    <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wide truncate max-w-[200px] group-hover:text-white transition-colors">{win.title}</span>
                                </div>
                                <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => e.stopPropagation()}>
                                    <button onClick={() => toggleMinimize(win.id)} className="hover:text-amber-400 text-gray-500 text-xs">_</button>
                                    <button onClick={() => closeWindow(win.id)} className="hover:text-red-400 text-gray-500 text-xs">✕</button>
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
         </>
      )}


      {/* --- FALL B: ANDERE TABS SIND AKTIV --- */}
      {/* Hier gibt es keine Tools-Leiste.
         Der Content beginnt direkt unter den Tabs (128px).
         Wir nutzen pt-32 (Padding Top 128px) für den Container.
      */}
      {activeTab !== 'dashboard' && (
        <div 
          data-theme="fantasy"
          className="fixed top-32 left-0 right-0 bottom-0 w-full overflow-y-auto z-10 custom-scrollbar bg-base-200 text-base-content"
        >     
             {/* Logs Tab */}
             <div className={`px-6 py-6 h-full ${activeTab === 'logs' ? 'block' : 'hidden'}`}>
                <div className="flex flex-col lg:flex-row gap-4 h-full">
                  <div className="lg:w-1/2 h-full flex flex-col">
                    {selectedArticleFromLogs ? (
                      <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-6 h-full overflow-y-auto custom-scrollbar">
                         <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                            <h3 className="font-serif text-xl text-amber-100">{selectedArticleFromLogs.title}</h3>
                            <button onClick={() => setSelectedArticleFromLogs(null)} className="text-gray-500 hover:text-white">✕</button>
                         </div>
                         {isLoadingArticleContent ? <div className="text-amber-200/50 animate-pulse">Lade Archiv...</div> : <MarkdownRenderer content={selectedArticleContent || ''} onLinkClick={handleArticleSelectFromLogs} className="prose-mystical-article" />}
                      </div>
                    ) : <div className="text-center text-gray-500/50 p-20 border border-white/5 rounded-xl italic">Wähle einen Eintrag aus dem Logbuch</div>}
                  </div>
                  <div className="lg:w-1/2 h-full"><Logs gameId={gameId.toString()} onArticleSelect={handleArticleSelectFromLogs} /></div>
                </div>
             </div>

             {/* Andere Tabs */}
             <div className={`px-6 py-6 h-full ${activeTab === 'articles' ? 'block' : 'hidden'}`}>
                <ArticleBrowser articles={articles} gameId={gameId} isLoading={isLoading} onDeleteArticle={handleDeleteArticle} onAddArticle={handleAddArticle} onUpdateArticle={handleUpdateArticle} />
             </div>
             
             <div className={`px-6 py-6 h-full ${activeTab === 'graph' ? 'block' : 'hidden'}`}>
                <div className="w-full flex justify-center h-full items-center">{!isLoading && <GraphView articles={articles} folders={folders} onNodeClick={handleGraphNodeClick} />}</div>
             </div>
             
             <div className={`px-6 py-6 h-full ${activeTab === 'timeline' ? 'block' : 'hidden'}`}><Timeline gameId={gameId} /></div>
             <div className={`px-6 py-6 h-full ${activeTab === 'story' ? 'block' : 'hidden'}`}><StoryBuilder gameId={gameId} /></div>
             <div className={`px-6 py-6 h-full ${activeTab === 'players' ? 'block' : 'hidden'}`}>
                <PlayerList gameId={gameId} />
             </div>
        </div>
      )}
      
      {/* GLOBAL STYLES */}
      <style jsx global>{`
        :global(.prose-mystical-article) { color: #e5e7eb; }
        :global(.prose-mystical-article h1), :global(.prose-mystical-article h2) { color: #fcd34d; font-family: serif; }
        :global(.prose-mystical-article a) { color: #60a5fa; text-decoration: underline; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
        ::-webkit-scrollbar-corner { background: #0a0a0a; }
      `}</style>
    </div>
  );
}