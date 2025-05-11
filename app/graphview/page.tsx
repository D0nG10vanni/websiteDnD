'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Home, FileText, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { remark } from 'remark';
import html from 'remark-html';

// Komponente importieren
import ForceGraphComponent, { 
  GraphNode, 
  NODE_COLORS 
} from '@/components/Graphview/ForceGraph';

// Markdown-Verarbeitung
async function markdownToHtml(markdown: string) {
  const result = await remark()
    .use(html)
    .process(markdown);
  return result.toString();
}

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [articleContent, setArticleContent] = useState<string>('');
  const [articlePath, setArticlePath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  interface DebugInfo {
    requestedId?: string;
    nodeInfo?: GraphNode;
    findArticleResponse?: any;
    getContentResponse?: any;
  }

  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [graphWidth, setGraphWidth] = useState<string>('50%');
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef<boolean>(false);

  // Artikel laden, wenn ein Knoten ausgewählt wird
  useEffect(() => {
    if (!selectedNode) {
      setArticleContent('');
      setArticlePath('');
      setDebug(null);
      return;
    }

    // Artikel ID vorbereiten
    let articleId = selectedNode.id;
    
    // Stelle sicher, dass die .md Erweiterung angehängt wird
    if (!articleId.endsWith('.md')) {
      articleId = articleId + '.md';
    }
    
    setLoading(true);
    setError(null);
    setDebug({
      requestedId: articleId,
      nodeInfo: selectedNode
    });

    // Suche nach der passenden Markdown-Datei im Database-Ordner
    fetch(`/api/findArticle?id=${encodeURIComponent(articleId)}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
        setDebug((prev: DebugInfo | null) => ({ ...prev, findArticleResponse: data }));
          });
        }
        return res.json();
      })
      .then(async data => {
        setArticlePath(data.path);
        setDebug(prev => ({ ...prev, findArticleResponse: data }));
        
        // Markdown-Inhalt laden
        const contentRes = await fetch(`/api/getArticleContent?path=${encodeURIComponent(data.path)}`);
        if (!contentRes.ok) {
          return contentRes.json().then(contentData => {
            throw new Error(`Inhalt konnte nicht geladen werden: ${contentData.error || contentRes.status}`);
          });
        }
        const contentData = await contentRes.json();
        setDebug(prev => ({ ...prev, getContentResponse: contentData }));
        
        // Markdown zu HTML konvertieren
        const htmlContent = await markdownToHtml(contentData.content);
        setArticleContent(htmlContent);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fehler beim Laden des Artikels:", err);
        setError(err.message || "Unbekannter Fehler");
        setLoading(false);
      });
  }, [selectedNode]);

  // Handler für die Node-Auswahl
  const handleNodeSelect = (node: GraphNode | null) => {
    setSelectedNode(node);
  };

  // Resize-Funktionalität
  useEffect(() => {
    const resizeHandler = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      
      const containerWidth = document.getElementById('main-container')?.clientWidth || 0;
      const newWidth = Math.min(Math.max(e.clientX, 200), containerWidth - 200);
      const widthPercent = (newWidth / containerWidth) * 100;
      
      setGraphWidth(`${widthPercent}%`);
    };

    const stopResize = () => {
      isResizingRef.current = false;
      document.body.style.cursor = 'default';
      document.removeEventListener('mousemove', resizeHandler);
      document.removeEventListener('mouseup', stopResize);
    };

    const startResize = (e: MouseEvent) => {
      isResizingRef.current = true;
      document.body.style.cursor = 'col-resize';
      document.addEventListener('mousemove', resizeHandler);
      document.addEventListener('mouseup', stopResize);
    };

    const resizeElement = resizeRef.current;
    if (resizeElement) {
      resizeElement.addEventListener('mousedown', startResize as any);
    }

    return () => {
      if (resizeElement) {
        resizeElement.removeEventListener('mousedown', startResize as any);
      }
      document.removeEventListener('mousemove', resizeHandler);
      document.removeEventListener('mouseup', stopResize);
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col h-screen">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold">D&D Lore Manager</h1>
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            <Home size={18} /> Startseite
          </button>
        </Link>
      </header>
      
      {/* Hauptinhalt: Graph und Artikel nebeneinander */}
      <div id="main-container" className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Linke Seite: Graph */}
        <div style={{ width: graphWidth }} className="h-[50vh] md:h-full p-4">
          {/* Graph-Komponente */}
          <div className="h-full">
            <ForceGraphComponent 
              dataUrl="/graph_with_pos.json"
              height={window.innerHeight}
              onNodeSelect={handleNodeSelect}
            />
          </div>
          
          {/* Legende */}
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              type !== 'default' && (
                <div key={type} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color as string }}></div>
                  <span className="capitalize text-sm">{type}</span>
                </div>
              )
            ))}
          </div>
        </div>
        
        {/* Resize Handle */}
        <div 
          ref={resizeRef}
          className="w-2 md:cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-10 relative"
        >
          <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-gray-300 md:flex flex-col items-center justify-center hidden">
            <ChevronLeft size={16} className="text-gray-500" />
            <ChevronRight size={16} className="text-gray-500" />
          </div>
        </div>
        
        {/* Rechte Seite: Artikel */}
        <div style={{ width: `calc(100% - ${graphWidth})` }} className="h-[50vh] md:h-full p-4 border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50 overflow-auto">
          {!selectedNode && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <FileText size={48} strokeWidth={1.5} />
              <p className="mt-4 text-lg">Wähle einen Knoten im Graph aus, um den zugehörigen Artikel anzuzeigen</p>
            </div>
          )}
          
          {selectedNode && loading && (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3">Artikel wird geladen...</span>
            </div>
          )}
          
          {selectedNode && error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 shadow">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold">Fehler beim Laden</h3>
                  <p>{error}</p>
                  {error.includes('nicht gefunden') && (
                    <div className="mt-2 text-sm">
                      <p>Es scheint keine Markdown-Datei für &quot;{selectedNode.name}&quot; zu existieren.</p>
                      <p className="mt-1">Überprüfe den Dateinamen oder erstelle eine neue Datei.</p>
                      <p className="mt-3 font-medium">Gesuchte ID: {selectedNode.id}.md</p>
                    </div>
                  )}
                  
                  {debug && (
                    <details className="mt-4 text-gray-700 text-xs">
                      <summary className="cursor-pointer text-blue-600">Debug-Informationen</summary>
                      <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(debug, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {selectedNode && !loading && !error && (
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold mb-1">{selectedNode.name}</h2>
              <p className="text-sm text-gray-500 mb-6">
                Typ: <span className="capitalize">{selectedNode.type || 'Unbekannt'}</span>
                {articlePath && (
                  <span className="ml-2 text-gray-400">| Pfad: {articlePath}</span>
                )}
              </p>
              
              <div 
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: articleContent }}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}