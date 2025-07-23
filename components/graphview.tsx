import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { Post, Folder } from '@/lib/types';
import { Dialog } from '@headlessui/react'; // Modal-Bibliothek (HeadlessUI)
import { XMarkIcon } from '@heroicons/react/24/outline'; // Für "Schließen"-Icon
import MarkdownRenderer from './MarkdownRenderer'; // Importiere den Markdown-Renderer

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  content: string;
  folderId?: number | null;
  folderName?: string;
  connections: number;
  x?: number;
  y?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}

interface GraphViewProps {
  articles: Post[];
  folders?: Folder[];
  onNodeClick?: (article: Post) => void;
  width?: number;
  height?: number;
}

type FolderColorMap = Map<number, string> // folder_id → farbwert
type ParentFolderMap = Map<number, number> // child_id → top_level_id

export default function GraphView({ 
  articles, 
  folders = [], 
  onNodeClick, 
  width = 800, 
  height = 600 
}: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<Post | null>(null);
  const folderMap = new Map(folders.map(f => [f.id, f]));
  const topLevelFolders = folders.filter(f => f.parent_id === null);

  // 1. Farbschema für Top-Level-Folder
  const topLevelColors = d3.schemeCategory10; // 10 eindeutige Farben
  
  // 2. Map: Top-Level-Folder-ID → Farbe
  const topLevelColorMap = new Map<number, string>();
    topLevelFolders.forEach((folder, index) => {
      topLevelColorMap.set(folder.id, topLevelColors[index % topLevelColors.length]);
    });

    const resolveTopLevelId = (folderId: number): number => {
    let current = folderMap.get(folderId);
    while (current && current.parent_id !== null) {
      current = folderMap.get(current.parent_id);
    }
    return current?.id ?? folderId;
  };

  // Farbmapping für Top-Level-Ordner erstellen
  const folderColorMap = new Map<number, string>();
  folders.forEach((folder) => {
    const topId = resolveTopLevelId(folder.id);
    const baseColor = d3.color(topLevelColorMap.get(topId) || '#888');

    if (baseColor) {
      if (folder.id === topId) {
        folderColorMap.set(folder.id, baseColor.formatHex());
      } else {
        // Unterordner → dunklere Abstufung
        const darker = baseColor.darker(1 + Math.random()); // optional variiert
        folderColorMap.set(folder.id, darker.formatHex());
      }
    } else {
      // fallback color if baseColor is null
      folderColorMap.set(folder.id, '#888');
    }
  });
  // Extract wiki links from content
  const extractWikiLinks = (content: string): string[] => {
    const regex = /\[\[([^\]|]+)(\|[^\]]+)?\]\]/g;
    const matches = [...content.matchAll(regex)];
    return matches.map(match => match[1].trim());
  };

  // Create nodes and links data
  const graphData = useMemo(() => {
    const folderMap = new Map(folders.map(f => [f.id, f.name]));

    // Erfasse eindeutige folderIds zur späteren Farbkodierung
    const uniqueFolderIds = Array.from(new Set(
    articles.map(a => a.folder_id).filter(id => id != null)
    )) as number[];

    // Baue eindeutiges Farb-Mapping
    const colors = [
    '#ef4444', '#3b82f6', '#10b981', '#8b5cf6',
    '#f97316', '#06b6d4', '#84cc16', '#ec4899',
    ];
    const folderColorMap = new Map<number, string>();
    uniqueFolderIds.forEach((id, index) => {
    folderColorMap.set(id, colors[index % colors.length]);
    });

    // Funktion für Farbauswahl
    const getNodeColor = (node: GraphNode): string => {
    if (node.folderId == null) return '#f59e0b'; // amber für unkategorisiert
    return folderColorMap.get(node.folderId) || '#f59e0b';
    };

    const getFolderColor = (folderId: number | null): string => {
    if (folderId == null) return '#f59e0b'; // amber
    return folderColorMap.get(folderId) || '#f59e0b';
    };

    // Zähle incoming Links auch mit
    const incomingCount = new Map<string, number>();
    articles.forEach(article => {
      const links = extractWikiLinks(article.content);
      links.forEach(target => {
        const key = target.trim();
        incomingCount.set(key, (incomingCount.get(key) || 0) + 1);
      });
    });
    
    // Create nodes
    const nodes: GraphNode[] = articles.map(article => {
    const links = extractWikiLinks(article.content);
    const folderId = article.folder_id != null ? Number(article.folder_id) : null;
    const folderName = folderId != null ? folderMap.get(folderId) : 'Unkategorisiert';

    const outgoing = links.length;
    const incoming = incomingCount.get(article.title) || 0;

    return {
      id: article.title,
      title: article.title,
      content: article.content,
      folderId,
      folderName,
      connections: outgoing + incoming // neue Berechnung
    };
  });

    // Create links
    const links: GraphLink[] = [];
    const titleSet = new Set(articles.map(a => a.title));

    articles.forEach(article => {
      const wikiLinks = extractWikiLinks(article.content);
      wikiLinks.forEach(linkedTitle => {
        if (titleSet.has(linkedTitle) && linkedTitle !== article.title) {
          links.push({
            source: article.title,
            target: linkedTitle,
            value: 1
          });
        }
      });
    });

    return { nodes, links };
  }, [articles, folders]);

  // Color scheme for different folders
  const getNodeColor = (node: GraphNode): string => {
    if (!node.folderId) return '#f59e0b'; // amber for uncategorized
    
    const colors = [
      '#ef4444', // red
      '#3b82f6', // blue  
      '#10b981', // emerald
      '#8b5cf6', // violet
      '#f97316', // orange
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#ec4899', // pink
    ];
    
    return colors[node.folderId % colors.length];
  };

  // Helper function to get folder color for legend - using the same logic as getNodeColor
  const getFolderColor = (folderId: number | null): string => {
    if (!folderId) return '#f59e0b'; // amber for uncategorized
    
    const colors = [
      '#ef4444', // red
      '#3b82f6', // blue  
      '#10b981', // emerald
      '#8b5cf6', // violet
      '#f97316', // orange
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#ec4899', // pink
    ];
    
    return colors[folderId % colors.length];
  };

  useEffect(() => {
    if (!svgRef.current || !graphData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svg.append('g');
    const linksGroup = container.append('g').attr('class', 'links');
    const nodesGroup = container.append('g').attr('class', 'nodes');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links).id(d => d.id).distance(80).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const links = linksGroup
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .style('transition', 'all 0.3s ease');

    // Create nodes
    const nodeGroups = nodesGroup
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer');

    // Add circles for nodes
    const circles = nodeGroups
      .append('circle')
      .attr('r', d => Math.max(8, Math.min(20, 8 + d.connections * 2)))
      .attr('fill', getNodeColor)
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .style('transition', 'all 0.3s ease');

    // Add labels
    const labels = nodeGroups
      .append('text')
      .text(d => d.title.length > 15 ? d.title.substring(0, 15) + '...' : d.title)
      .attr('dy', -25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f9fafb')
      .attr('font-size', '12px')
      .attr('font-family', 'serif')
      .attr('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');

    // Add connection count badges
    nodeGroups
      .filter(d => d.connections > 0)
      .append('circle')
      .attr('r', 8)
      .attr('cx', 15)
      .attr('cy', -15)
      .attr('fill', '#dc2626')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1);

    nodeGroups
      .filter(d => d.connections > 0)
      .append('text')
      .text(d => d.connections.toString())
      .attr('x', 15)
      .attr('y', -11)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none');

    // Add drag behavior
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroups.call(drag);

    // Add interaction handlers
    nodeGroups
      .on('click', (event, d) => {
        event.stopPropagation();
        const article = articles.find(a => a.title === d.title);
        if (article && onNodeClick) {
          onNodeClick(article);
        }
        setSelectedNode(d.id);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNode(d.id);
        
        // Highlight connected nodes and links
        const connectedNodes = new Set<string>();
        graphData.links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          
          if (sourceId === d.id) connectedNodes.add(targetId);
          if (targetId === d.id) connectedNodes.add(sourceId);
        });

        // Dim non-connected elements
        circles
          .attr('opacity', node => 
            node.id === d.id || connectedNodes.has(node.id) ? 1 : 0.3
          );
        
        links
          .attr('stroke-opacity', link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            return sourceId === d.id || targetId === d.id ? 0.8 : 0.1;
          })
          .attr('stroke-width', link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            return sourceId === d.id || targetId === d.id ? 3 : 1.5;
          });

        labels
          .attr('opacity', node => 
            node.id === d.id || connectedNodes.has(node.id) ? 1 : 0.3
          );
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        
        // Reset all elements
        circles.attr('opacity', 1);
        links
          .attr('stroke-opacity', 0.4)
          .attr('stroke-width', 1.5);
        labels.attr('opacity', 1);
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    nodeGroups
      .on('click', (event, d) => {
        event.stopPropagation();
        const article = articles.find(a => a.title === d.title);
        if (article) setActiveArticle(article); // NEU
        setSelectedNode(d.id);
      });

    return () => {
      simulation.stop();
    };
  }, [graphData, articles, width, height]);

  const stats = useMemo(() => {
    const folderDistribution: Record<string, { count: number; folderId: number | null }> = {};
    
    graphData.nodes.forEach(node => {
      const folder = node.folderName || 'Unkategorisiert';
      if (!folderDistribution[folder]) {
        folderDistribution[folder] = { count: 0, folderId: node.folderId || null };
      }
      folderDistribution[folder].count++;
    });

    return {
      totalNodes: graphData.nodes.length,
      totalLinks: graphData.links.length,
      mostConnected: graphData.nodes.reduce((max, node) => 
        node.connections > max.connections ? node : max, 
        { connections: 0, title: '' }
      ),
      folderDistribution
    };
  }, [graphData]);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Sidebar Left: Stats */}
      <div className="w-full lg:w-1/5 space-y-4">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-4">
          <h2 className="font-serif text-center text-xl text-amber-200 mb-4">
            <span className="text-amber-500">❋</span> KNOWLEDGE GRAPH <span className="text-amber-500">❋</span>
          </h2>
          <div className="grid grid-cols-2 gap-4 text-center text-sm">
            {/* Stats Blöcke */}
            <div className="bg-black/30 rounded p-2">
              <div className="text-amber-100 font-bold">{stats.totalNodes}</div>
              <div className="text-amber-200/60 text-xs">Artikel</div>
            </div>
            <div className="bg-black/30 rounded p-2">
              <div className="text-amber-100 font-bold">{stats.totalLinks}</div>
              <div className="text-amber-200/60 text-xs">Verbindungen</div>
            </div>
            <div className="bg-black/30 rounded p-2 col-span-2">
              <div className="text-amber-100 font-bold">{stats.mostConnected.connections}</div>
              <div className="text-amber-200/60 text-xs">Max. Links</div>
              <div className="truncate text-amber-100" title={stats.mostConnected.title}>{stats.mostConnected.title}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Middle */}
      <div className="w-full lg:w-3/5">
        <div className="mb-2 text-center text-amber-200/60 text-sm font-serif">
          Ziehen zum Verschieben • Klicken zum Auswählen • Mausrad zum Zoomen
        </div>
        <div className="rounded border border-amber-900/20 overflow-hidden">
          <svg ref={svgRef} width={width} height={height} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        </div>
      </div>

      {/* Legend Right */}
      <div className="w-full lg:w-1/4 space-y-4">
        {/* Legende */}
        <div className="bg-black/30 rounded-lg p-4 border border-amber-900/20">
          <h4 className="text-amber-200 font-serif font-bold mb-3 text-center">Legende</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-500 rounded-full border-2 border-gray-800" />
              <span className="text-amber-200/80">Artikel-Node</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-500" />
              <span className="text-amber-200/80">Wiki-Link</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded-full text-white text-xs flex items-center justify-center font-bold">3</div>
              <span className="text-amber-200/80">Verbindungen</span>
            </div>
          </div>
        </div>

        {/* Farben */}
        <div className="bg-black/30 rounded-lg p-4 border border-amber-900/20">
          <h4 className="text-amber-200 font-serif font-bold mb-3 text-center">Farbzuordnung</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(stats.folderDistribution).map(([folder, data]) => (
              <div key={folder} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-gray-700" style={{ backgroundColor: getFolderColor(data.folderId) }} />
                <span className="text-amber-200/70 truncate">{folder} ({data.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal für Artikelanzeige */}
      <Dialog open={!!activeArticle} onClose={() => setActiveArticle(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="max-w-3xl w-full bg-gray-900 rounded-xl p-6 border border-amber-700 shadow-xl overflow-y-auto max-h-[80vh] text-white">
            <div className="flex justify-between items-start mb-4">
                <Dialog.Title className="text-lg font-bold text-amber-300 font-serif">
                {activeArticle?.title}
                </Dialog.Title>
                <button onClick={() => setActiveArticle(null)} className="text-gray-400 hover:text-red-400">
                <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
            <MarkdownRenderer 
                content={activeArticle?.content || ''} 
                onLinkClick={(title) => {
                const article = articles.find(a => a.title === title)
                if (article) setActiveArticle(article)
                }}
            />
            </Dialog.Panel>
        </div>
        </Dialog>
    </div>
  );
}