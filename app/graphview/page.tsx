'use client';
import React, { useState, useRef, useEffect } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, SimulationNodeDatum } from 'd3-force';

type RawNode = { id: string; connections: string[] };
type PosNode = RawNode & SimulationNodeDatum;
type Edge = { source: string; target: string };

// Hilfsfunktion: Kanten ableiten
const computeEdges = (nodes: RawNode[]): Edge[] => {
  const set = new Set<string>();
  const edges: Edge[] = [];
  nodes.forEach(n => {
    n.connections.forEach(to => {
      const key = [n.id, to].sort().join('--');
      if (!set.has(key)) {
        set.add(key);
        edges.push({ source: n.id, target: to });
      }
    });
  });
  return edges;
};

export { computeEdges };

export default function DraggableGraph() {
  const [raw, setRaw] = useState<RawNode[]|null>(null);
  const [nodes, setNodes] = useState<PosNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const svgRef = useRef<SVGSVGElement|null>(null);
  const simRef = useRef<any>(null);

  const width = 300;
  const height = 200;

  // JSON laden und Simulation initialisieren
  useEffect(() => {
    fetch('/graph.json', { cache: 'no-store' })
      .then(res => res.json() as Promise<RawNode[]>)
      .then(data => {
        setRaw(data);
        const initial: PosNode[] = data.map(n => ({ ...n, x: width/2, y: height/2 }));
        const computedEdges = computeEdges(data);
        setNodes(initial);
        setEdges(computedEdges);

        // Force-Simulation
        const sim = forceSimulation(initial)
          .force('link', forceLink<PosNode, Edge>()
            .id((d: any) => d.id)
            .links(computedEdges)
            .distance(80)
          )
          .force('charge', forceManyBody().strength(-150))
          .force('center', forceCenter(width/2, height/2))
          .on('tick', () => {
            setNodes([...initial]);
          });

        simRef.current = sim;
      });
    return () => {
      simRef.current?.stop();
    };
  }, []);

  // Drag-Logik mit Simulation
  const onMouseDown = (node: PosNode) => (e: React.MouseEvent) => {
    e.preventDefault();
    simRef.current?.alphaTarget(0.3).restart();
    node.fx = node.x;
    node.fy = node.y;
  };
  const onMouseMove = (e: MouseEvent) => {
    const id = (document.activeElement as any)?.dataset?.nodeid;
    if (!id || !simRef.current) return;
    const pt = svgRef.current!.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const coord = pt.matrixTransform(svgRef.current!.getScreenCTM()!.inverse());
    const node = nodes.find(n => n.id === id) as PosNode;
    if (node) {
      node.fx = coord.x;
      node.fy = coord.y;
      setNodes([...nodes]);
    }
  };
  const onMouseUp = () => {
    if (simRef.current) simRef.current.alphaTarget(0);
    nodes.forEach(n => { n.fx = null; n.fy = null; });
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [nodes]);

  if (!raw) return <div>Lade Netzwerk…</div>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <h2 className="text-2xl font-semibold mb-6 text-center">Force-Layout Netz</h2>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64"
        >
          {/* Edges */}
          {edges.map((e, i) => {
            const a = nodes.find(n => n.id === e.source);
            const b = nodes.find(n => n.id === e.target);
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x} y1={a.y}
                x2={b.x} y2={b.y}
                stroke="#A0AEC0" strokeWidth={2}
              />
            );
          })}
          {/* Nodes */}
          {nodes.map(n => (
            <g
              key={n.id}
              data-nodeid={n.id}
              onMouseDown={onMouseDown(n)}
              style={{ cursor: 'grab' }}
            >
              <circle
                cx={n.x} cy={n.y} r={20}
                className="fill-white stroke-gray-500" strokeWidth={2}
              />
              <text
                x={n.x} y={n.y}
                textAnchor="middle" dominantBaseline="middle"
                className="text-gray-700 font-semibold"
              >
                {n.id}
              </text>
            </g>
          ))}
        </svg>
      </div>
  );
}