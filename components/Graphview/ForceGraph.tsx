'use client';

import { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export interface GenericNode {
  id: string;
  group?: number; // für Farben
  val?: number;   // für Größe
  name?: string;
  [key: string]: any;
}

export interface GenericLink {
  source: string;
  target: string;
}

interface SimpleGraphProps {
  nodes: GenericNode[];
  links: GenericLink[];
  width?: number;
  height?: number;
}

export default function SimpleGraph({ nodes, links, width = 600, height = 400 }: SimpleGraphProps) {
  const fgRef = useRef<any>(null);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name || node.id;
    const fontSize = 12 / globalScale;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || '#4ECDC4'; // Standard Türkis
    ctx.fill();

    if (globalScale > 1.5) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(label, node.x, node.y + 8);
    }
  }, []);

  return (
    <div className="border rounded overflow-hidden bg-gray-900">
      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height}
        graphData={{ nodes, links }}
        nodeCanvasObject={paintNode}
        backgroundColor="#111"
        d3AlphaDecay={0.05}
      />
    </div>
  );
}