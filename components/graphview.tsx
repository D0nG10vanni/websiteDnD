'use client';

import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import * as d3 from 'd3';
import type { Post, Folder } from '@/lib/types';
import { Dialog } from '@headlessui/react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowPathIcon, 
  InformationCircleIcon,
  Cog6ToothIcon // Neues Icon für Einstellungen
} from '@heroicons/react/24/outline';
import MarkdownRenderer from './MarkdownRenderer';
import { forceCollide } from 'd3-force';

// TS-Fehler Unterdrückung für die Library
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-500">Lade Knowledge Graph...</div>
}) as any;

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-500">Lade 3D Graph...</div>
}) as any;

// --- TYPEN ---
interface GraphNode {
  id: string; 
  label: string;
  type: 'article' | 'folder';
  val: number; 
  color: string;
  folderClusterId?: number;
  folderDepth?: number;
  data?: Post | Folder; 
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  neighbors?: {
    incoming: GraphNode[];
    outgoing: GraphNode[];
  };
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  isFolderLink?: boolean;
}

interface GraphViewProps {
  articles: Post[];
  folders?: Folder[];
  onNodeClick?: (article: Post) => void; 
}

export default function GraphView({ 
  articles, 
  folders = [], 
  onNodeClick 
}: GraphViewProps) {
  const fg2dRef = useRef<any>(null);
  const fg3dRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [activeArticle, setActiveArticle] = useState<Post | null>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [infoPanelOpen, setInfoPanelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false); // State für Settings Panel
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  const activeFgRef = useMemo(() => (viewMode === '3d' ? fg3dRef : fg2dRef), [viewMode]);

  // --- NEU: Physik State ---
  const [physicsControls, setPhysicsControls] = useState({
    strength: -100, // Standard etwas erhöht, damit es sich besser verteilt
    distance: 150
  });

  const computeFallbackHeight = useCallback(() => {
    if (!containerRef.current || typeof window === 'undefined') return 600;
    const rect = containerRef.current.getBoundingClientRect();
    // Fill remaining viewport space downwards with a small bottom gutter.
    return Math.max(window.innerHeight - rect.top - 20, 420);
  }, []);

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextWidth = entry.contentRect.width || 800;
        const measuredHeight = entry.contentRect.height;
        const nextHeight = measuredHeight > 120 ? measuredHeight : computeFallbackHeight();
        setDimensions({ width: nextWidth, height: nextHeight });
      }
    });
    resizeObserver.observe(containerRef.current);

    const handleWindowResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextWidth = rect.width || 800;
      const nextHeight = rect.height > 120 ? rect.height : computeFallbackHeight();
      setDimensions({ width: nextWidth, height: nextHeight });
    };

    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver.disconnect();
    };
  }, [infoPanelOpen, computeFallbackHeight]);

  // --- PHYSIK-ENGINE ANPASSEN (LIVE) ---
  useEffect(() => {
    const graph = activeFgRef.current;
    if (!graph) return;

    const chargeForce = graph.d3Force('charge');
    const linkForce = graph.d3Force('link');

    // 1. Abstoßung (Charge) - gesteuert durch Slider
    // Je negativer, desto stärker stoßen sich Knoten ab
    if (chargeForce?.strength) {
      chargeForce.strength(physicsControls.strength);
    }
    
    // 2. Link Distanz - gesteuert durch Slider
    if (linkForce?.distance) {
      linkForce.distance(physicsControls.distance);
    }

    // 3. Kollision nur in 2D setzen (3D intern hat anderes Layout-Handling)
    if (viewMode === '2d') {
      graph.d3Force(
        'collide',
        forceCollide(45).strength(1)
      );
    } else {
      graph.d3Force('collide', null);
    }
    
    // Simulation neu anheizen (wichtig für Live-Update)
    graph.d3ReheatSimulation();
  }, [articles, folders, physicsControls, viewMode, activeFgRef]); // Reagiert jetzt auch auf Slider-Changes

  // Prevent 3D animation lifecycle races when switching modes by pausing hidden renderer.
  useEffect(() => {
    const graph3d = fg3dRef.current;
    if (!graph3d?.pauseAnimation || !graph3d?.resumeAnimation) return;

    if (viewMode === '3d') {
      graph3d.resumeAnimation();
      graph3d.d3ReheatSimulation?.();
    } else {
      graph3d.pauseAnimation();
    }
  }, [viewMode]);

  // --- 1. DATEN-AUFBEREITUNG (MEMOIZED) ---
  const { graphData, folderLegend } = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    
    // Maps & Listen
    const articleTitleToId = new Map<string, string>();
    const articleIdToNodeMap = new Map<string, GraphNode>();
    const folderColorMap = new Map<number, string>();
    const folderDepthMap = new Map<number, number>();
    const legendItems: { id: number; name: string; color: string; depth: number }[] = [];

    // --- A. Ordner-Baum aufbauen ---
    const folderChildren = new Map<number | string, Folder[]>();
    
    folders.forEach(f => {
      const pid = f.parent_id === null ? 'root' : f.parent_id;
      if (!folderChildren.has(pid)) folderChildren.set(pid, []);
      folderChildren.get(pid)!.push(f);
    });

    folderChildren.forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));

    // --- B. Farben & Legende rekursiv berechnen ---
    const rootColorScale = d3.scaleOrdinal(d3.schemeTableau10); 

    const processFolderTree = (
        folder: Folder, 
        depth: number, 
        parentColorHsl: { h: number, s: number, l: number } | null, 
        siblingIndex: number, 
        totalSiblings: number
    ) => {
        let color: any; 

        if (depth === 0) {
            color = d3.hsl(rootColorScale(String(folder.id)));
            color.l = 0.45; 
            color.s = 0.85; 
        } else {
            color = d3.hsl(parentColorHsl!.h, parentColorHsl!.s, parentColorHsl!.l);
            color.l = Math.min(0.92, color.l + 0.12);

            if (totalSiblings > 1) {
                const maxSpread = 50; 
                const step = maxSpread / (totalSiblings - 1);
                const shift = -maxSpread/2 + (siblingIndex * step);
                color.h += shift;
            }
        }

        const colorStr = color.toString();
        folderColorMap.set(folder.id, colorStr);
        folderDepthMap.set(folder.id, depth);
        legendItems.push({ id: folder.id, name: folder.name, color: colorStr, depth });

        nodes.push({
            id: `folder_${folder.id}`,
            label: folder.name,
            type: 'folder',
            val: 1,
            color: 'transparent',
            data: folder
        });
        
        if (folder.parent_id) {
            links.push({ source: `folder_${folder.id}`, target: `folder_${folder.parent_id}`, isFolderLink: true });
        }

        const children = folderChildren.get(folder.id) || [];
        children.forEach((child, idx) => {
            processFolderTree(child, depth + 1, color, idx, children.length);
        });
    };

    const roots = folderChildren.get('root') || [];
    roots.forEach((root, idx) => {
        processFolderTree(root, 0, null, idx, roots.length);
    });

    // --- C. Artikel-Nodes ---
    articles.forEach(a => {
      const nodeId = `post_${a.id}`;
      articleTitleToId.set(a.title.toLowerCase(), nodeId);
      
      const fId = a.folder_id ? Number(a.folder_id) : 0;
      const nodeColor = (fId && folderColorMap.has(fId)) 
          ? folderColorMap.get(fId)! 
          : '#64748b'; 

      const node: GraphNode = {
        id: nodeId,
        label: a.title,
        type: 'article',
        val: 5, 
        color: nodeColor,
        folderClusterId: fId || 0,
        folderDepth: folderDepthMap.get(fId) ?? 0,
        data: a,
        neighbors: { incoming: [], outgoing: [] } 
      };
      nodes.push(node);
      articleIdToNodeMap.set(nodeId, node);

      if (a.folder_id) {
        links.push({ source: nodeId, target: `folder_${a.folder_id}`, isFolderLink: true });
      }
    });

    // --- D. Wiki-Links ---
    const regex = /\[\[([^\]|]+)(\|[^\]]+)?\]\]/g;
    articles.forEach(sourceArticle => {
      const matches = [...sourceArticle.content.matchAll(regex)];
      const sourceNodeId = `post_${sourceArticle.id}`;
      matches.forEach(match => {
        const targetTitle = match[1].trim().toLowerCase();
        const targetId = articleTitleToId.get(targetTitle);
        if (targetId) {
          links.push({ source: sourceNodeId, target: targetId, isFolderLink: false });
        }
      });
    });

    // --- E. Größe & Nachbarn ---
    nodes.filter(n => n.type === 'article').forEach(node => {
        const outgoingLinks = links.filter(l => l.source === node.id && !l.isFolderLink);
        const incomingLinks = links.filter(l => l.target === node.id && !l.isFolderLink);
        
        const totalConnections = outgoingLinks.length + incomingLinks.length;
        node.val = 5 + Math.min(totalConnections, 20);

        const outNodes = outgoingLinks.map(l => articleIdToNodeMap.get(l.target as string)!).filter(Boolean);
        const inNodes = incomingLinks.map(l => articleIdToNodeMap.get(l.source as string)!).filter(Boolean);

        node.neighbors!.outgoing = [...new Set(outNodes)];
        node.neighbors!.incoming = [...new Set(inNodes)];
    });

    return { graphData: { nodes, links }, folderLegend: legendItems };
  }, [articles, folders]);

  // 3D clustering by folder structure: articles of same folder are pulled towards shared centers,
  // with z-offset by folder depth for better spatial separation.
  useEffect(() => {
    if (viewMode !== '3d') return;
    const graph3d = fg3dRef.current;
    if (!graph3d) return;

    const articleNodes = (graphData.nodes as GraphNode[]).filter((n) => n.type === 'article');
    const clusterIds = Array.from(new Set(articleNodes.map((n) => n.folderClusterId ?? 0)));
    const centers = new Map<number, { x: number; y: number; z: number }>();

    const radius = Math.max(180, Math.min(dimensions.width, dimensions.height) * 0.34);
    clusterIds.forEach((clusterId, index) => {
      const angle = (index / Math.max(clusterIds.length, 1)) * Math.PI * 2;
      const sample = articleNodes.find((n) => (n.folderClusterId ?? 0) === clusterId);
      const depth = sample?.folderDepth ?? 0;

      centers.set(clusterId, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: depth * 150,
      });
    });

    const folderCluster3dForce = (alpha: number) => {
      articleNodes.forEach((node) => {
        const center = centers.get(node.folderClusterId ?? 0);
        if (!center) return;

        node.vx = (node.vx || 0) + (center.x - (node.x || 0)) * 0.08 * alpha;
        node.vy = (node.vy || 0) + (center.y - (node.y || 0)) * 0.08 * alpha;
        node.vz = (node.vz || 0) + (center.z - (node.z || 0)) * 0.08 * alpha;
      });
    };

    graph3d.d3Force('folderCluster3d', folderCluster3dForce);
    graph3d.d3ReheatSimulation();

    return () => {
      graph3d.d3Force('folderCluster3d', null);
    };
  }, [viewMode, graphData, dimensions]);

  // --- 2. INTERAKTIONEN ---
  const handleNodeClick = useCallback((node: any) => {
    const n = node as GraphNode;
    if (n.type !== 'article') return;
    if (n.data) {
      if (viewMode === '3d') {
        fg3dRef.current?.cameraPosition(
          { x: (n.x || 0) + 120, y: (n.y || 0) + 120, z: (n.z || 0) + 350 },
          { x: n.x || 0, y: n.y || 0, z: n.z || 0 },
          1000
        );
      } else {
        fg2dRef.current?.centerAt(n.x, n.y, 1000);
        fg2dRef.current?.zoom(3, 1000);
      }
      setActiveArticle(n.data as Post);
    }
  }, [viewMode]);

  // --- 3. RENDERING ---
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const n = node as GraphNode;
    if (n.type === 'folder') return; 

    const isHovered = hoverNode?.id === n.id;
    const isNeighbor = hoverNode && (
        hoverNode.neighbors?.outgoing.some(neighbor => neighbor.id === n.id) ||
        hoverNode.neighbors?.incoming.some(neighbor => neighbor.id === n.id)
    );

    const showText = isHovered || isNeighbor || globalScale > 1.8; 
    const r = n.val;
    const x = n.x!;
    const y = n.y!;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = n.color;
    
    if (hoverNode && !isHovered && !isNeighbor) {
        ctx.globalAlpha = 0.2; 
    } else {
        ctx.globalAlpha = 1;
    }
    
    ctx.fill();

    if (isHovered) {
      ctx.lineWidth = 3 / globalScale;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.shadowBlur = 15;
      ctx.shadowColor = n.color;
    } else if (isNeighbor) {
      ctx.lineWidth = 2 / globalScale;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.stroke();
    } else {
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1 / globalScale;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
    }

    if (showText) {
      const label = n.label;
      const fontSize = isHovered ? (16 / globalScale) : (12 / globalScale);
      ctx.font = `${isHovered ? 'bold' : ''} ${fontSize}px Sans-Serif`;
      
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
      const padding = 4 / globalScale;
      ctx.fillRect(
          x - textWidth / 2 - padding, 
          y + r + padding, 
          textWidth + (padding * 2), 
          fontSize + (padding * 2)
      );

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x, y + r + (padding * 2));
    }
    
    ctx.globalAlpha = 1; 
  }, [hoverNode]);

  const getLinkColor = useCallback((link: any) => {
      if (link.isFolderLink) return 'transparent';
      
      if (hoverNode) {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;

          if (sourceId === hoverNode.id) return '#ef4444'; 
          if (targetId === hoverNode.id) return '#22c55e'; 
          
          return 'rgba(50,50,50, 0.1)'; 
      }
      return '#4b5563'; 
  }, [hoverNode]);

  return (
    <div className="flex h-full min-h-[420px] w-full bg-gray-950 overflow-hidden relative font-sans">
      
      {/* GRAPH AREA */}
      <div ref={containerRef} className="flex-1 relative h-full min-h-[420px] min-w-0">
        <div className={`absolute inset-0 ${viewMode === '2d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <ForceGraph2D
            key="force-2d"
            ref={fg2dRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeCanvasObject={paintNode}
            linkWidth={(link: any) => {
              if (link.isFolderLink) return 0;
              if (hoverNode) {
                const s = typeof link.source === 'object' ? link.source.id : link.source;
                const t = typeof link.target === 'object' ? link.target.id : link.target;
                if (s === hoverNode.id || t === hoverNode.id) return 2;
              }
              return 1;
            }}
            linkColor={getLinkColor}
            linkDirectionalArrowLength={7.5}
            linkDirectionalArrowRelPos={1}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.1}
            cooldownTime={7000}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: any) => setHoverNode(node || null)}
            backgroundColor="#020617"
          />
        </div>

        <div className={`absolute inset-0 ${viewMode === '3d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <ForceGraph3D
            key="force-3d"
            ref={fg3dRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel={(node: any) => (node as GraphNode).label}
            nodeColor={(node: any) => (node as GraphNode).color}
            nodeResolution={12}
            linkWidth={(link: any) => {
              if (link.isFolderLink) return 0;
              if (hoverNode) {
                const s = typeof link.source === 'object' ? link.source.id : link.source;
                const t = typeof link.target === 'object' ? link.target.id : link.target;
                if (s === hoverNode.id || t === hoverNode.id) return 2;
              }
              return 1;
            }}
            linkColor={getLinkColor}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.1}
            cooldownTime={7000}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: any) => setHoverNode(node || null)}
            backgroundColor="#020617"
          />
        </div>

        {/* Toolbar Top Left */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            onClick={() => setViewMode((prev) => (prev === '2d' ? '3d' : '2d'))}
            className={`p-2 rounded border shadow-lg transition-colors ${viewMode === '3d' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-600'}`}
            title="2D/3D umschalten"
          >
            {viewMode === '3d' ? '3D' : '2D'}
          </button>
          <button onClick={() => activeFgRef.current?.zoomToFit(800)} className="p-2 bg-slate-800 text-slate-200 rounded hover:bg-slate-700 border border-slate-600 shadow-lg" title="Zoom Fit">
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>
          <button onClick={() => activeFgRef.current?.d3ReheatSimulation()} className="p-2 bg-slate-800 text-slate-200 rounded hover:bg-slate-700 border border-slate-600 shadow-lg" title="Reload Physics">
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        {/* PHYSICS SETTINGS PANEL (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
            <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`p-2 rounded border shadow-lg flex items-center justify-center transition-colors ${settingsOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'}`}
                title="Graph Einstellungen"
            >
                <Cog6ToothIcon className="w-5 h-5" />
            </button>

            {settingsOpen && (
                <div className="bg-slate-800 border border-slate-700 rounded p-4 shadow-xl w-64 animate-in slide-in-from-bottom-2 fade-in">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Physik Einstellungen</h3>
                    
                    {/* Strength Slider */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                            <span>Abstoßung</span>
                            <span>{physicsControls.strength}</span>
                        </div>
                        <input 
                            type="range" 
                            min="-500" 
                            max="0" 
                            step="10"
                            value={physicsControls.strength}
                            onChange={(e) => setPhysicsControls(prev => ({ ...prev, strength: Number(e.target.value) }))}
                            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Distance Slider */}
                    <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                            <span>Link Länge</span>
                            <span>{physicsControls.distance}</span>
                        </div>
                        <input 
                            type="range" 
                            min="10" 
                            max="400" 
                            step="10"
                            value={physicsControls.distance}
                            onChange={(e) => setPhysicsControls(prev => ({ ...prev, distance: Number(e.target.value) }))}
                            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* SIDEBAR */}
      <div className={`flex-shrink-0 transition-all duration-300 bg-slate-900 border-l border-slate-700 flex flex-col h-full z-20 absolute right-0 md:static ${infoPanelOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full md:w-0'}`}>
        <div className={`w-80 flex flex-col h-full ${!infoPanelOpen && 'hidden'}`}>
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h2 className="font-bold text-slate-100 flex items-center gap-2">
                    <InformationCircleIcon className="w-5 h-5 text-blue-400"/>
                    Knowledge Base
                </h2>
                <button onClick={() => setInfoPanelOpen(false)} className="text-slate-400 hover:text-white">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {/* 1. SELECTION INFO */}
                <div className={`rounded p-3 border ${hoverNode ? 'bg-slate-800 border-blue-500/50' : 'bg-slate-800/50 border-slate-700 border-dashed'}`}>
                    <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Aktiver Knoten</h3>
                    {hoverNode?.type === 'article' ? (
                    <div>
                        <div className="font-bold text-lg text-white mb-1">{hoverNode.label}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{background: hoverNode.color}}></span>
                            {(hoverNode.data as Post).folder_id ? folderLegend.find(f => f.id === Number((hoverNode.data as Post).folder_id))?.name : 'Root'}
                        </div>
                    </div>
                    ) : (
                    <div className="text-slate-500 italic text-sm text-center py-2">Fahre über einen Knoten...</div>
                    )}
                </div>

                {/* 2. CONNECTIONS */}
                {hoverNode?.type === 'article' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        
                        {/* Outgoing */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-red-400 mb-2 flex justify-between">
                                Verweist auf <span>{hoverNode.neighbors?.outgoing.length}</span>
                            </h3>
                            <div className="space-y-1 pl-2 border-l-2 border-slate-700">
                                {hoverNode.neighbors?.outgoing.length === 0 && <span className="text-xs text-slate-600 italic">Keine ausgehenden Links</span>}
                                {hoverNode.neighbors?.outgoing.slice(0, 8).map(n => (
                                    <div key={n.id} className="text-sm text-slate-300 truncate hover:text-white cursor-help" title={n.label}>
                                        → {n.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Incoming */}
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-green-400 mb-2 flex justify-between">
                                Wird erwähnt von <span>{hoverNode.neighbors?.incoming.length}</span>
                            </h3>
                            <div className="space-y-1 pl-2 border-l-2 border-slate-700">
                                {hoverNode.neighbors?.incoming.length === 0 && <span className="text-xs text-slate-600 italic">Keine eingehenden Links</span>}
                                {hoverNode.neighbors?.incoming.slice(0, 8).map(n => (
                                    <div key={n.id} className="text-sm text-slate-300 truncate hover:text-white cursor-help" title={n.label}>
                                        ← {n.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <hr className="border-slate-700" />

                {/* 3. LEGEND (Strukturiert) */}
                <div>
                    <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3">Ordner-Struktur</h3>
                    <div className="space-y-0.5 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                    {folderLegend.map(f => (
                        <div 
                            key={f.id} 
                            className="flex items-center gap-2 text-sm text-slate-300 py-1.5 px-2 hover:bg-slate-800 rounded transition-colors group"
                            style={{ 
                                paddingLeft: `${f.depth * 16 + 8}px`,
                                borderLeft: f.depth > 0 ? '2px solid rgba(255,255,255,0.05)' : 'none'
                            }}
                        >
                            <div 
                                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm border border-white/10" 
                                style={{backgroundColor: f.color}}
                            ></div>
                            <span className={`truncate flex-1 ${f.depth === 0 ? 'font-semibold text-slate-200' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                {f.name}
                            </span>
                        </div>
                    ))}
                    {folderLegend.length === 0 && <div className="text-slate-500 italic text-xs p-2">Keine Ordner definiert</div>}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {!infoPanelOpen && (
        <button onClick={() => setInfoPanelOpen(true)} className="absolute top-4 right-4 p-2 bg-slate-800 text-blue-400 rounded-full shadow-lg border border-slate-600 hover:bg-slate-700 z-10">
          <InformationCircleIcon className="w-6 h-6" />
        </button>
      )}

      {/* MODAL */}
      <Dialog open={!!activeArticle} onClose={() => setActiveArticle(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-start justify-center p-4 pt-40">
            <Dialog.Panel className="max-w-3xl w-full bg-slate-900 rounded-xl border border-slate-600 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800">
                <Dialog.Title className="text-xl font-bold text-slate-100">{activeArticle?.title}</Dialog.Title>
                <button onClick={() => setActiveArticle(null)}><XMarkIcon className="w-6 h-6 text-slate-400 hover:text-red-400" /></button>
            </div>
            <div className="overflow-y-auto p-6 text-slate-300 custom-scrollbar">
                <MarkdownRenderer content={activeArticle?.content || ''} onLinkClick={(title) => {
                     const next = articles.find(a => a.title.toLowerCase() === title.toLowerCase());
                     if (next) setActiveArticle(next);
                }} />
            </div>
            </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}