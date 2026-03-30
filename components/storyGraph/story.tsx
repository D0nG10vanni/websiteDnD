import React, { useCallback, useEffect, useState, useReducer, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Node,
  Edge,
  NodeProps,
  Connection,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { supabase } from '@/lib/supabaseClient';
import EditorPopup from './editorPopup'; // Dein neues Popup

// --- TYPES ---

interface StoryNodeData {
  label: string;
  description?: string;
  color: string;
  predecessors: string[];
  done?: boolean;
  image_url?: string;
  tags?: string[];
  metadata?: any;
  // --- NEU: Verknüpfungen ---
  log_id?: number | null;
  linked_article_id?: number | null;
  linked_npc_id?: number | null;
  linked_item_id?: number | null;
  linked_location_id?: number | null;
  
  onDrillDown?: (id: string, label: string) => void; 
}

interface StoryNode extends Node {
  data: StoryNodeData;
}

interface AppState {
  nodes: StoryNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  deleteMode: boolean;
  loading: boolean;
  error: string | null;
  saving: boolean;
}

// Actions für den Reducer
type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_NODES_AND_EDGES'; payload: { nodes: StoryNode[]; edges: Edge[] } }
  | { type: 'UPDATE_NODES'; payload: StoryNode[] }
  | { type: 'UPDATE_EDGES'; payload: Edge[] }
  | { type: 'SET_SELECTED_NODE'; payload: string | null }
  | { type: 'TOGGLE_DELETE_MODE' }
  | { type: 'ADD_NODE'; payload: StoryNode }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'UPDATE_NODE_DATA'; payload: { id: string; data: Partial<StoryNodeData> } };

// --- REDUCER ---

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_SAVING': return { ...state, saving: action.payload };
    case 'SET_NODES_AND_EDGES': 
      return { ...state, nodes: action.payload.nodes, edges: action.payload.edges, loading: false, error: null };
    case 'UPDATE_NODES': return { ...state, nodes: action.payload };
    case 'UPDATE_EDGES': return { ...state, edges: action.payload };
    case 'SET_SELECTED_NODE': return { ...state, selectedNodeId: action.payload };
    case 'TOGGLE_DELETE_MODE': return { ...state, deleteMode: !state.deleteMode };
    case 'ADD_NODE': return { ...state, nodes: [...state.nodes, action.payload], error: null };
    case 'DELETE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter(n => n.id !== action.payload),
        edges: state.edges.filter(e => e.source !== action.payload && e.target !== action.payload),
        selectedNodeId: state.selectedNodeId === action.payload ? null : state.selectedNodeId
      };
    case 'UPDATE_NODE_DATA':
      return {
        ...state,
        nodes: state.nodes.map(n => 
          n.id === action.payload.id 
            ? { ...n, data: { ...n.data, ...action.payload.data } }
            : n
        )
      };
    default: return state;
  }
};

// --- NODE COMPONENTS ---

const StartNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className="px-4 py-2 rounded-full text-white text-xs font-bold shadow-lg border-2 border-white/20" style={{ background: data.color || "#ef4444" }}>
    Start: {data.label}
    <Handle type="source" position={Position.Right} className="!bg-white" />
  </div>
);

const StoryNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className="p-3 rounded-md text-white text-sm shadow-lg border border-white/10 min-w-[120px]" style={{ background: data.color || "#3b82f6" }}>
    <div className="font-bold mb-1">⚔️ Encounter</div>
    <div>{data.label}</div>
    <Handle type="target" position={Position.Left} className="!bg-white" />
    <Handle type="source" position={Position.Right} className="!bg-white" />
  </div>
);

// Neuer, schicker GatewayNode
const GatewayNode = ({ data }: NodeProps<StoryNodeData>) => {
  const baseColor = data.color || "#facc15"; // Standard Gelb/Gold

  return (
    // Container für relative Positionierung, keine Rotation hier
    <div className="relative w-[140px] h-[140px] flex items-center justify-center group">
      
      {/* 1. Der visuelle Hintergrund-Kristall (rotiert) */}
      <div 
        className="absolute inset-2 transform rotate-45 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_30px_currentColor]"
        style={{ 
          background: `linear-gradient(135deg, ${baseColor}20, ${baseColor}60)`, // Transparenter Gradient
          border: `3px solid ${baseColor}`,
          color: baseColor // Für den Hover-Schatten
        }}
      >
        {/* Inneres Glühen */}
        <div className="absolute inset-1 border border-white/20 rounded-lg" />
      </div>

      {/* 2. Der Inhalt (NICHT rotiert, schwebt darüber) */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-2">
        {/* Kleines Icon */}
        <div className="text-2xl mb-1 filter drop-shadow-md">🤔</div>
        {/* Label */}
        <div className="text-white font-bold text-sm leading-tight filter drop-shadow-lg break-words max-w-[100px]">
          {data.label || "Entscheidung?"}
        </div>
      </div>

      {/* 3. Die Handles und Pfad-Labels */}
      
      {/* Eingang (Links) */}
      <Handle 
        type="target" 
        position={Position.Left}
        className="!w-4 !h-4 !bg-white !border-2 !border-gray-800 z-20 transition-transform group-hover:scale-125"
        style={{ left: '5%' }} // Leicht nach innen versetzt
      />

      {/* Ausgang JA (Oben) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 flex flex-col items-center z-20 opacity-80 group-hover:opacity-100 transition-opacity">
        <span className="text-xs font-bold text-emerald-400 mb-1 uppercase tracking-wider drop-shadow-md">Ja</span>
        <Handle 
          type="source" 
          position={Position.Top} 
          id="yes"
          className="!relative !transform-none !w-4 !h-4 !bg-emerald-500 !border-2 !border-emerald-200 transition-transform group-hover:scale-125"
        />
      </div>

      {/* Ausgang NEIN (Unten) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 flex flex-col-reverse items-center z-20 opacity-80 group-hover:opacity-100 transition-opacity">
        <span className="text-xs font-bold text-red-400 mt-1 uppercase tracking-wider drop-shadow-md">Nein</span>
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="no"
          className="!relative !transform-none !w-4 !h-4 !bg-red-500 !border-2 !border-red-200 transition-transform group-hover:scale-125"
        />
      </div>
    </div>
  );
};

const EventNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className="p-3 rounded-tr-xl rounded-bl-xl text-white text-sm shadow-lg border border-white/10" style={{ background: data.color || "#a855f7" }}>
    <div className="uppercase text-[10px] tracking-wider opacity-80">Event</div>
    <div className="font-medium">{data.label}</div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

const EndNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className="px-4 py-2 rounded-full text-white text-xs font-bold shadow-lg border-2 border-white/20" style={{ background: data.color || "#ef4444" }}>
    🏁 {data.label || "Ende"}
    <Handle type="target" position={Position.Left} className="!bg-white" />
  </div>
);

// --- NEU: Quest Group Node (Container) ---
const QuestGroupNode = ({ id, data }: NodeProps<StoryNodeData>) => {
  return (
    <div className="min-w-[180px] bg-slate-800 border-2 border-orange-500/50 rounded-lg shadow-2xl overflow-hidden group hover:border-orange-400 transition-colors">
      <div className="bg-orange-500/20 p-2 border-b border-orange-500/30 flex justify-between items-center">
        <span className="text-orange-400 text-[10px] font-bold uppercase tracking-wider">Sub-Quest</span>
        <span className="text-lg">📂</span>
      </div>
      <div className="p-3">
        <div className="text-white font-medium mb-3">{data.label}</div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (data.onDrillDown) data.onDrillDown(id, data.label);
          }}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xs py-1.5 px-3 rounded transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <span>↳</span> Öffnen
        </button>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-orange-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-orange-500 !w-3 !h-3" />
    </div>
  );
};

// 1. Die "Sticky Note" (Gelber Zettel, freischwebend, keine Eingänge/Ausgänge zwingend)
const NoteNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className="w-48 p-4 shadow-xl transform -rotate-2" style={{ backgroundColor: data.color || '#fef08a', border: '1px solid #fde047' }}>
    <div className="text-gray-800 font-serif text-sm whitespace-pre-wrap font-medium">
      📌 {data.label}
    </div>
    {data.description && <div className="mt-2 text-xs text-gray-700 font-handwriting">{data.description}</div>}
  </div>
);

// 2. NPC / Charakter Node (Rund, mit Bild)
const NpcNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className={`p-1 rounded-full bg-gray-800 border-4 shadow-2xl flex items-center gap-3 pr-4 transition-all ${data.done ? 'opacity-50 grayscale border-gray-600' : 'border-emerald-500'}`}>
    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
      {data.image_url ? (
        <img src={data.image_url} alt={data.label} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
      )}
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">NPC</span>
      <span className="text-white font-medium text-sm">{data.label}</span>
      {data.tags && data.tags.length > 0 && (
        <span className="text-[9px] text-gray-400 mt-1">{data.tags.join(', ')}</span>
      )}
    </div>
    <Handle type="target" position={Position.Left} className="!bg-emerald-500" />
    <Handle type="source" position={Position.Right} className="!bg-emerald-500" />
  </div>
);

// 3. Combat / Boss Fight Node
const CombatNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className={`p-3 rounded-lg border-2 shadow-[0_0_15px_rgba(220,38,38,0.3)] bg-gray-900 min-w-[160px] ${data.done ? 'border-gray-700 opacity-60' : 'border-red-600'}`}>
    <div className="flex justify-between items-center mb-2 border-b border-red-900/50 pb-1">
      <span className="text-red-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
        ⚔️ Combat {data.done && '✓'}
      </span>
      {data.metadata?.cr && <span className="bg-red-950 text-red-300 text-[10px] px-1.5 py-0.5 rounded">CR {data.metadata.cr}</span>}
    </div>
    <div className={`text-white text-sm font-medium ${data.done ? 'line-through text-gray-400' : ''}`}>{data.label}</div>
    {data.description && <div className="mt-1 text-xs text-gray-400 line-clamp-2">{data.description}</div>}
    <Handle type="target" position={Position.Left} className="!bg-red-500" />
    <Handle type="source" position={Position.Right} className="!bg-red-500" />
  </div>
);

// 4. Location Node (Mit Hintergrundbild-Option)
const LocationNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div 
    className="relative w-48 h-24 rounded-lg shadow-xl overflow-hidden border border-white/20 group"
    style={{ backgroundColor: data.color || '#1e293b' }}
  >
    {data.image_url && (
      <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
        <img src={data.image_url} alt="" className="w-full h-full object-cover" />
      </div>
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
    <div className="absolute bottom-2 left-3 right-3">
      <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider mb-0.5">🗺️ Location</div>
      <div className="text-white font-medium text-sm truncate">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Left} className="!bg-blue-400" />
    <Handle type="source" position={Position.Right} className="!bg-blue-400" />
  </div>
);

// Base Types Mapping
const baseTypes = {
  start: StartNode,
  story: StoryNode,
  gateway: GatewayNode,
  event: EventNode,
  end: EndNode,
  questGroup: QuestGroupNode,
  note: NoteNode,
  npc: NpcNode,
  combat: CombatNode,
  location: LocationNode
};

// Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-xl z-[100] flex items-center gap-3 animation-fade-in ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
    <span>{message}</span>
    <button onClick={onClose} className="opacity-70 hover:opacity-100 font-bold">×</button>
  </div>
);

// --- MAIN COMPONENT ---

export default function StoryFlowDesigner({ gameId = 1 }: { gameId?: number }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const computeFallbackHeight = useCallback(() => {
    if (!rootRef.current || typeof window === 'undefined') return 800;
    const rect = rootRef.current.getBoundingClientRect();
    return Math.max(window.innerHeight - rect.top - 20, 420);
  }, []);

  const [autoHeight, setAutoHeight] = useState(800);

  useEffect(() => {
    if (!rootRef.current) return;

    const updateHeight = () => {
      const parent = rootRef.current?.parentElement;
      const parentHeight = parent?.clientHeight ?? 0;
      const nextHeight = parentHeight > 200 ? parentHeight : computeFallbackHeight();
      setAutoHeight(nextHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    const parent = rootRef.current.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      resizeObserver.disconnect();
    };
  }, [computeFallbackHeight]);

  // State für Navigation (Breadcrumbs)
  // Stack beginnt immer mit Root (id: null)
  const [viewStack, setViewStack] = useState<{id: string | null, label: string}[]>([
    { id: null, label: 'Hauptgeschichte' }
  ]);

  // Aktuelle Parent ID ist das letzte Element im Stack
  const currentParentId = viewStack[viewStack.length - 1].id;

  const initialState: AppState = {
    nodes: [], edges: [], selectedNodeId: null, deleteMode: false, loading: true, error: null, saving: false,
  };

  const [state, dispatch] = useReducer(appReducer, initialState);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Helper
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleError = useCallback((error: any, message: string) => {
    console.error(message, error);
    dispatch({ type: 'SET_ERROR', payload: message });
    showToast(message, 'error');
  }, [showToast]);

  // Edges berechnen
  // Edges berechnen
  // In story.tsx:

// Edges berechnen
const computeEdges = useCallback((nodeList: StoryNode[]): Edge[] => {
  const nodeMap = new Map(nodeList.map((n) => [n.id, n]));
  
  // WICHTIG: Eine Map benutzen, um EINDEUTIGE Keys zu garantieren
  const uniqueEdges = new Map<string, Edge>();

  nodeList.forEach((target) => {
    const predecessors = target.data.predecessors || [];
    
    // Safety First: Selbst wenn "A" zweimal im Array steht, nehmen wir es nur einmal
    const distinctPredecessors = [...new Set(predecessors)];

    distinctPredecessors.forEach((sourceId: string) => {
      const source = nodeMap.get(sourceId);
      if (!source) return; // Schutz gegen gelöschte Nodes

      // Der Key, der den Fehler verursacht hat
      const edgeId = `${sourceId}->${target.id}`;

      // Wir fügen die Edge nur hinzu, wenn wir diese ID noch nicht haben
      if (!uniqueEdges.has(edgeId)) {
        uniqueEdges.set(edgeId, {
          id: edgeId,
          source: sourceId,
          target: target.id,
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: true,
          type: "smoothstep",
          style: { stroke: '#64748b', strokeWidth: 2 }
        });
      }
    });
  });

  // Aus der Map wieder ein Array machen
  return Array.from(uniqueEdges.values());
}, []);

  // Drill Down Funktion (in Sub-Quest eintauchen)
  const handleDrillDown = useCallback((nodeId: string, nodeLabel: string) => {
    // 1. Stack erweitern
    setViewStack(prev => [...prev, { id: nodeId, label: nodeLabel }]);
    // 2. Loading State setzen (damit UI neu lädt)
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_SELECTED_NODE', payload: null });
  }, []);

  // Navigation zurück (Breadcrumbs)
  const navigateToLevel = (index: number) => {
    if (index === viewStack.length - 1) return; // Schon da
    setViewStack(prev => prev.slice(0, index + 1));
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_SELECTED_NODE', payload: null });
  };

  // Node Types mit DrillDown Funktion verknüpfen
  // Wir nutzen useMemo, damit die Components nicht bei jedem Render neu erstellt werden
  const nodeTypes = useMemo(() => {
    // Wrapper um Delete-Button hinzuzufügen
    const typesWithLogic = Object.entries(baseTypes).map(([key, Comp]) => {
      const Wrapped = (props: NodeProps<StoryNodeData>) => (
        <div className="relative group">
          {/* Node Component rendern und handleDrillDown weitergeben */}
          <Comp {...props} data={{ ...props.data, onDrillDown: handleDrillDown }} />
          
          {/* Delete Button (nur im Delete Mode sichtbar) */}
          {state.deleteMode && (
            <button
              className="absolute -top-3 -right-3 z-50 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-700 hover:scale-110 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(props.id);
              }}
            >
              ×
            </button>
          )}
        </div>
      );
      return [key, Wrapped];
    });
    return Object.fromEntries(typesWithLogic);
  }, [state.deleteMode, handleDrillDown]); // Dependencies

  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      try {
        // Query bauen
        let query = supabase
          .from("story")
          .select("*")
          .eq("game_id", gameId);

        // FILTER: Nur Nodes der aktuellen Ebene laden
        if (currentParentId) {
          query = query.eq("parent_node_id", currentParentId);
        } else {
          // Root Level: parent_node_id ist NULL
          query = query.is("parent_node_id", null);
        }

        const { data, error } = await query;
        if (error) throw error;

        const loadedNodes: StoryNode[] = (data || []).map((row) => ({
          id: row.id,
          type: row.type,
          position: row.position || { x: 200, y: 200 },
          data: {
            label: row.label || `${row.type} node`,
            description: row.description, // NEU
            color: row.color,
            predecessors: Array.isArray(row.predecessors) ? row.predecessors : [],
            image_url: row.image_url,     // NEU
            tags: row.tags || [],         // NEU
            done: row.done || false,      // NEU
            metadata: row.metadata || {},  // NEU
            // ... (innerhalb von loadData)
            log_id: row.log_id,
            linked_article_id: row.linked_article_id,
            linked_npc_id: row.linked_npc_id,
            linked_item_id: row.linked_item_id,
            linked_location_id: row.linked_location_id,
          },
        }));

        const edges = computeEdges(loadedNodes);
        dispatch({ type: 'SET_NODES_AND_EDGES', payload: { nodes: loadedNodes, edges } });
        
      } catch (error) {
        handleError(error, "Fehler beim Laden der Story");
      }
    };

    loadData();
  }, [gameId, currentParentId, computeEdges, handleError]); // Lädt neu bei Ebenenwechsel

  // --- ACTIONS ---

  // Speichert Updates (Label/Color) aus dem Popup
  const updateNodeData = useCallback(async (id: string, newData: { label: string; color: string }) => {
    try {
      // Optimistic Update
      dispatch({ type: 'UPDATE_NODE_DATA', payload: { id, data: newData } });
      
      // DB Update
      const { error } = await supabase
        .from("story")
        .update(newData)
        .eq("id", id);

      if (error) throw error;
      showToast('Node aktualisiert', 'success');
      
    } catch (error) {
      handleError(error, "Fehler beim Speichern");
    }
  }, [handleError, showToast]);

  // Position Auto-Save (vereinfacht für Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.nodes.length > 0 && !state.loading && !state.saving) {
        savePositions(state.nodes);
      }
    }, 1500); // 1.5s Debounce
    return () => clearTimeout(timer);
  }, [state.nodes]);

  const savePositions = async (nodes: StoryNode[]) => {
    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      const updates = nodes.map(node => 
        supabase.from("story").update({ position: node.position }).eq("id", node.id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error("Pos save fail", err);
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    const updated = applyNodeChanges(changes, state.nodes) as StoryNode[];
    dispatch({ type: 'UPDATE_NODES', payload: updated });
    // Edges neu berechnen falls nötig (hier nicht zwingend, aber sicher)
  }, [state.nodes]);

  const onConnect: OnConnect = useCallback(async (connection) => {
    const { source, target } = connection;
    if(!source || !target) return;

    try {
      // 1. Lokales Update (Optimistic)
      const targetNode = state.nodes.find(n => n.id === target);
      if(!targetNode) return;
      
      const currentPreds = targetNode.data.predecessors || [];

      // --- FIX START: Verhindere Duplikate ---
      if (currentPreds.includes(source)) {
        console.warn("Verbindung existiert bereits!");
        return; 
      }

      const newPreds = [...currentPreds, source];
      
      dispatch({ 
        type: 'UPDATE_NODE_DATA', 
        payload: { id: target, data: { predecessors: newPreds } } 
      });
      
      // Edges sofort updaten für visuelles Feedback
      const newNodes = state.nodes.map(n => n.id === target ? {...n, data: {...n.data, predecessors: newPreds}} : n);
      dispatch({ type: 'UPDATE_EDGES', payload: computeEdges(newNodes) });

      // 2. DB Update
      const { data: currentData } = await supabase.from("story").select("predecessors").eq("id", target).single();
      const dbPreds = [...(currentData?.predecessors || []), source];
      
      await supabase.from("story").update({ predecessors: dbPreds }).eq("id", target);

    } catch (e) {
      handleError(e, "Verbindung fehlgeschlagen");
    }
  }, [state.nodes, computeEdges, handleError]);

  // Verbindung zwischen zwei Nodes loeschen
  const removeConnection = useCallback(async (sourceId: string, targetId: string) => {
    try {
      const targetNode = state.nodes.find((n) => n.id === targetId);
      if (!targetNode) return;

      const currentPreds = targetNode.data.predecessors || [];
      if (!currentPreds.includes(sourceId)) return;

      const newPreds = currentPreds.filter((pred) => pred !== sourceId);
      const updatedNodes = state.nodes.map((node) =>
        node.id === targetId
          ? { ...node, data: { ...node.data, predecessors: newPreds } }
          : node
      );

      dispatch({ type: 'UPDATE_NODES', payload: updatedNodes });
      dispatch({ type: 'UPDATE_EDGES', payload: computeEdges(updatedNodes) });

      const { error } = await supabase
        .from('story')
        .update({ predecessors: newPreds })
        .eq('id', targetId);

      if (error) throw error;
      showToast('Verbindung geloescht', 'success');
    } catch (e) {
      handleError(e, 'Verbindung loeschen fehlgeschlagen');
    }
  }, [state.nodes, computeEdges, handleError, showToast]);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    if (!state.deleteMode) return;

    const removedChanges = changes.filter((change) => change.type === 'remove');
    if (removedChanges.length === 0) return;

    removedChanges.forEach((change) => {
      const edge = state.edges.find((currentEdge) => currentEdge.id === change.id);
      if (edge?.source && edge?.target) {
        void removeConnection(edge.source, edge.target);
      }
    });
  }, [state.deleteMode, state.edges, removeConnection]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (!state.deleteMode) return;

    event.stopPropagation();
    if (!confirm('Diese Verbindung wirklich loeschen?')) return;

    void removeConnection(edge.source, edge.target);
  }, [state.deleteMode, removeConnection]);

  // Node Löschen
  const deleteNode = async (id: string) => {
    if(!confirm("Diesen Node wirklich löschen?")) return;
    try {
      dispatch({ type: 'DELETE_NODE', payload: id });
      await supabase.from("story").delete().eq("id", id);
      showToast("Gelöscht", "success");
    } catch (e) {
      handleError(e, "Löschen fehlgeschlagen");
    }
  };

  // Node Hinzufügen
  const addNode = async (type: string) => {
    const id = uuidv4();
    const newNode: StoryNode = {
      id,
      type,
      position: { 
        x: Math.random() * 200 + 100, 
        y: Math.random() * 200 + 100 
      },
      data: {
        label: type === 'questGroup' ? 'Neue Quest-Reihe' : `Neuer ${type}`,
        color: getDefaultColor(type),
        predecessors: [],
      },
    };

    try {
      dispatch({ type: 'ADD_NODE', payload: newNode });
      
      // WICHTIG: parent_node_id speichern!
      const { error } = await supabase.from("story").insert({
        id,
        game_id: gameId,
        label: newNode.data.label,
        type,
        position: newNode.position,
        predecessors: [],
        color: newNode.data.color,
        parent_node_id: currentParentId ?? null // <--- Hier passiert die Magie
      });

      if (error) throw error;
      
    } catch (e) {
      handleError(e, "Erstellen fehlgeschlagen");
      dispatch({ type: 'DELETE_NODE', payload: id }); // Rollback
    }
  };

  const getDefaultColor = (type: string) => {
    const map: Record<string, string> = {
      start: "#ef4444", story: "#3b82f6", gateway: "#facc15", 
      event: "#a855f7", end: "#ef4444", questGroup: "#f97316"
    };
    return map[type] || "#64748b";
  };

  const selectedNode = state.selectedNodeId ? state.nodes.find(n => n.id === state.selectedNodeId) : null;

  return (
    <div
      ref={rootRef}
      style={{ height: autoHeight }}
      className="w-full min-h-[420px] border border-gray-700 rounded-xl flex flex-col bg-gray-900 overflow-hidden shadow-2xl"
    >
      
      {/* 1. Breadcrumb Navigation */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-2 text-sm shadow-sm z-10">
        <span className="text-gray-500 font-medium">Pfad:</span>
        {viewStack.map((level, index) => (
          <React.Fragment key={level.id || 'root'}>
            {index > 0 && <span className="text-gray-600">/</span>}
            <button 
              onClick={() => navigateToLevel(index)}
              className={`transition-colors px-2 py-1 rounded ${
                index === viewStack.length - 1 
                  ? 'bg-blue-500/10 text-blue-400 font-bold pointer-events-none' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {level.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* 2. Toolbar */}
      <div className="p-3 bg-gray-800/50 border-b border-gray-700 flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2">
          {/* Standard Nodes */}
          <button onClick={() => addNode("start")} className="px-3 py-1.5 text-xs font-bold rounded bg-red-500 hover:bg-red-600 text-white shadow transition-all active:scale-95">Start</button>
          <button onClick={() => addNode("story")} className="px-3 py-1.5 text-xs font-bold rounded bg-blue-500 hover:bg-blue-600 text-white shadow transition-all active:scale-95">Encounter</button>
          <button onClick={() => addNode("gateway")} className="px-3 py-1.5 text-xs font-bold rounded bg-yellow-500 hover:bg-yellow-600 text-black shadow transition-all active:scale-95">Decision</button>
          <button onClick={() => addNode("event")} className="px-3 py-1.5 text-xs font-bold rounded bg-purple-500 hover:bg-purple-600 text-white shadow transition-all active:scale-95">Event</button>
          <button onClick={() => addNode("note")} className="px-3 py-1.5 text-xs font-bold rounded bg-yellow-200 text-yellow-900 shadow">Notiz</button>
          <button onClick={() => addNode("npc")} className="px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 text-white shadow">NPC</button>
          <button onClick={() => addNode("combat")} className="px-3 py-1.5 text-xs font-bold rounded bg-red-700 text-white shadow">Kampf</button>
          <button onClick={() => addNode("location")} className="px-3 py-1.5 text-xs font-bold rounded bg-slate-600 text-white shadow">Ort</button>

          {/* NEU: Sub-Quest Button */}
          <div className="w-px h-6 bg-gray-600 mx-1"></div>
          <button onClick={() => addNode("questGroup")} className="px-3 py-1.5 text-xs font-bold rounded bg-orange-500 hover:bg-orange-600 text-white shadow transition-all active:scale-95 flex gap-1 items-center">
             <span>📂</span> Sub-Quest
          </button>
          
          <div className="w-px h-6 bg-gray-600 mx-1"></div>
          <button onClick={() => addNode("end")} className="px-3 py-1.5 text-xs font-bold rounded bg-red-900 hover:bg-red-800 text-white shadow transition-all active:scale-95">Ende</button>
        </div>

        <div className="flex items-center gap-3">
          {state.saving && <span className="text-xs text-blue-400 animate-pulse">Speichert...</span>}
          <button 
            onClick={() => dispatch({ type: 'TOGGLE_DELETE_MODE' })}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${state.deleteMode ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            {state.deleteMode ? 'Löschmodus AN' : 'Löschen'}
          </button>
        </div>
      </div>

      {/* 3. Canvas Area */}
      <div className="flex-1 relative bg-gray-900">
        {state.loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
            <div className="loading loading-spinner text-blue-500 loading-lg"></div>
          </div>
        )}

        <ReactFlow
          nodes={state.nodes}
          edges={state.edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          // Nur selektieren, wenn wir nicht im Delete Mode sind
          onNodeClick={(_, node) => !state.deleteMode && dispatch({ type: 'SET_SELECTED_NODE', payload: node.id })}
          onPaneClick={() => dispatch({ type: 'SET_SELECTED_NODE', payload: null })}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
        >
          <Background color="#334155" gap={20} size={1} variant={BackgroundVariant.Dots} />
          <Controls className="bg-gray-800 border-gray-700 fill-white text-white" />
        </ReactFlow>
      </div>

      {/* 4. Popups & Overlays */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Das neue Editor Popup */}
      {selectedNode && (
  <EditorPopup
    node={selectedNode}
    gameId={gameId} // <-- WICHTIG: Hier die gameId übergeben!
    onChange={updateNodeData}
    onClose={() => dispatch({ type: 'SET_SELECTED_NODE', payload: null })}
  />
)}

    </div>
  );
}