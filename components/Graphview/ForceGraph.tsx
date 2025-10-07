'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ZoomOut, RefreshCw } from 'lucide-react';
import type { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';

// Typdefinitionen
export interface RawNode {
  id: string;
  connections: string[];
  x?: number;
  y?: number;
  name?: string;
  type?: string;
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  value?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// React-Force-Graph-Paket (kein SSR)
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
);

// Farben für verschiedene Knotentypen
export const NODE_COLORS: Record<string, string> = {
  character: '#FF6B6B',
  location: '#4ECDC4',
  item: '#FFD166',
  event: '#6A0572',
  default: '#8A8A8A'
};

interface ForceGraphProps {
  dataUrl?: string;
  graphData?: GraphData;
  height?: number;
  width?: number | string;
  onNodeSelect?: (node: GraphNode | null) => void;
}

export default function ForceGraphComponent({
  dataUrl,
  graphData,
  height = 600,
  width = '100%',
  onNodeSelect
}: ForceGraphProps) {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(() => !graphData && !!dataUrl);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | null>(null);
  
  // Daten laden
  useEffect(() => {
    if (graphData) {
      setData(graphData);
      setLoading(false);
      setError(null);
      return;
    }

    if (!dataUrl) {
      setData({ nodes: [], links: [] });
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    fetch(dataUrl, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Fehler beim Laden der Daten: ${res.status}`);
        }
        return res.json() as Promise<RawNode[]>;
      })
      .then(rawData => {
        // Daten verarbeiten und Standardwerte setzen
        const nodes: GraphNode[] = rawData.map(n => ({
          id: n.id,
          name: n.name || n.id, // Fallback auf ID wenn kein Name vorhanden
          type: n.type || 'default',
          x: n.x, // Position, falls vorhanden
          y: n.y,
          color: n.type ? NODE_COLORS[n.type] || NODE_COLORS.default : NODE_COLORS.default
        }));

        // Links erstellen und Duplikate entfernen
        const uniqueLinks = new Set<string>();
        const links: GraphLink[] = [];

        rawData.forEach(n => {
          n.connections.forEach(target => {
            const linkId = n.id < target ? `${n.id}-${target}` : `${target}-${n.id}`;
            if (!uniqueLinks.has(linkId)) {
              uniqueLinks.add(linkId);
              links.push({
                source: n.id,
                target,
                value: 1 // Kann für Kantengewichtung genutzt werden
              });
            }
          });
        });

        setData({ nodes, links });
        setLoading(false);
      })
      .catch(err => {
        console.error("Fehler beim Laden der Graphdaten:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [dataUrl, graphData]);

  // Graph zentrieren und passen
  const handleFitView = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
    }
  }, []);

  // Graph neu laden/zurücksetzen
  const handleReset = useCallback(() => {
    setSelectedNode(null);
    if (onNodeSelect) {
      onNodeSelect(null);
    }
    
    if (fgRef.current) {
      // Simulationsparameter zurücksetzen
      fgRef.current.d3Force('charge').strength(-120);
      fgRef.current.d3Force('link').distance(() => 50);
      
      // Simulation neu starten mit höherem Alpha
      fgRef.current.d3ReheatSimulation();
      
      // Nach kurzer Verzögerung View anpassen
      setTimeout(() => handleFitView(), 800);
    }
  }, [handleFitView, onNodeSelect]);

  // Knoten-Klick-Handler
  const handleNodeClick = useCallback((node: NodeObject<GraphNode>) => {
      const graphNode = node as GraphNode;
      setSelectedNode(graphNode);

      if (onNodeSelect) {
        onNodeSelect(graphNode);
      }
      
      if (fgRef.current) {
        // Graph auf den ausgewählten Knoten zentrieren
        fgRef.current.centerAt(graphNode.x, graphNode.y, 1000);
        fgRef.current.zoom(2.5, 1000);
      }
    }, [onNodeSelect]);
  
  // Custom Node-Rendering
  const nodeCanvasObject = useCallback((node: NodeObject<GraphNode>, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const { x, y, id, color, name } = node;
    if (x === undefined || y === undefined) return;
    
    const isSelected = selectedNode?.id === id;
    const size = isSelected ? 8 : 5;
    
    // Knoten zeichnen
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color || NODE_COLORS.default;
    ctx.fill();
    
    // Umrandung für ausgewählte Knoten
    if (isSelected) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Text nur anzeigen, wenn weit genug reingezoomt oder ausgewählt
    if (globalScale > 0.8 || isSelected) {
      const fontSize = isSelected ? 16 / globalScale : 12 / globalScale;
      const label = name || id;
      
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Hintergrund für bessere Lesbarkeit
      const textWidth = ctx.measureText(label).width;
      const bgPadding = 2 / globalScale;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(
        x - textWidth / 2 - bgPadding,
        y + size + bgPadding,
        textWidth + bgPadding * 2,
        fontSize + bgPadding * 2
      );
      
      // Text zeichnen
      ctx.fillStyle = '#000000';
      ctx.fillText(label, x, y + size + fontSize / 2 + bgPadding * 2);
    }
  }, [selectedNode]);

  // Link-Styling
  const linkColor = useCallback((link: LinkObject<GraphNode, GraphLink>) => {
    // Verbindungen des ausgewählten Knotens hervorheben
    if (selectedNode &&
       ((typeof link.source === 'object' && link.source.id === selectedNode.id) ||
        (typeof link.target === 'object' && link.target.id === selectedNode.id) ||
        link.source === selectedNode.id ||
        link.target === selectedNode.id)) {
      return 'rgba(255, 100, 100, 0.8)';
    }
    return selectedNode ? 'rgba(200, 200, 200, 0.2)' : 'rgba(180, 180, 180, 0.6)';
  }, [selectedNode]);
  
  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    if (onNodeSelect) {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  return (
    <div className="relative w-full h-full border border-gray-300 rounded-lg overflow-hidden bg-gray-50" style={{ height, width }}>
      {/* Lade-Indikator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">Lade Graph...</span>
        </div>
      )}
      
      {/* Fehleranzeige */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="text-red-500 text-center p-4">
            <p className="font-bold">Fehler beim Laden</p>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Neu laden
            </button>
          </div>
        </div>
      )}
      
      {/* Graph-Steuerelemente */}
      <div className="absolute top-2 right-2 flex space-x-2 z-20">
        <button 
          onClick={handleFitView}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
          title="Ansicht anpassen"
        >
          <ZoomOut size={20} />
        </button>
        <button 
          onClick={handleReset}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
          title="Graph zurücksetzen"
        >
          <RefreshCw size={20} />
        </button>
      </div>
      
      {/* Force Graph */}
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeId="id"
        nodeVal={node => selectedNode?.id === node.id ? 10 : 5}
        nodeColor="color"
        linkColor={linkColor}
        linkWidth={link => selectedNode && 
          ((typeof link.source === 'object' && link.source.id === selectedNode.id) || 
           (typeof link.target === 'object' && link.target.id === selectedNode.id) ||
           link.source === selectedNode.id || 
           link.target === selectedNode.id) ? 2 : 1}
        
        // Simulationsparameter
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.4}
        cooldownTime={3000}
        
        // Interaktionen
        enableNodeDrag={true}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        
        // Custom Rendering
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={nodeCanvasObject}
        
        // Initiales Layout
        onEngineStop={handleFitView}
      />
    </div>
  );
}