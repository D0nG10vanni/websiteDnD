// Verbesserte StoryFlowDesigner.tsx mit besserer State-Management und Error-Handling
import React, { useCallback, useEffect, useState, useReducer, useMemo } from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { supabase } from '@/lib/supabaseClient';
// import EditorPopup from './editorPopup';

// Types
interface StoryNodeData {
  label: string;
  color: string;
  predecessors: string[];
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

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    
    case 'SET_NODES_AND_EDGES':
      return { 
        ...state, 
        nodes: action.payload.nodes, 
        edges: action.payload.edges,
        loading: false,
        error: null
      };
    
    case 'UPDATE_NODES':
      return { ...state, nodes: action.payload };
    
    case 'UPDATE_EDGES':
      return { ...state, edges: action.payload };
    
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNodeId: action.payload };
    
    case 'TOGGLE_DELETE_MODE':
      return { ...state, deleteMode: !state.deleteMode };
    
    case 'ADD_NODE':
      return { 
        ...state, 
        nodes: [...state.nodes, action.payload],
        error: null
      };
    
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
    
    default:
      return state;
  }
};

// Node Components
const StartNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className="p-2 rounded-full text-white text-xs shadow relative" style={{ background: data.color || "#ef4444" }}>
    ● {data.label || "Start"}
    <Handle type="source" position={Position.Right} />
  </div>
);

const StoryNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className="p-2 rounded text-white text-sm shadow relative" style={{ background: data.color || "#3b82f6" }}>
    🗺 {data.label}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

const GatewayNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className="p-2 rounded text-white text-sm shadow relative" style={{ background: data.color || "#facc15" }}>
    🔀 {data.label || "Decision"}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
  </div>
);

const EventNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className="p-2 rounded text-white text-sm shadow relative" style={{ background: data.color || "#a855f7" }}>
    ✴ {data.label}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

const EndNode = ({ data }: NodeProps<StoryNodeData>) => (
  <div className="p-2 rounded-full text-white text-xs shadow relative" style={{ background: data.color || "#ef4444" }}>
    🏁 {data.label || "End"}
    <Handle type="target" position={Position.Left} />
  </div>
);

const baseTypes = {
  start: StartNode,
  story: StoryNode,
  gateway: GatewayNode,
  event: EventNode,
  end: EndNode,
};

// Helper function to create wrapped node types
const createWrappedTypes = (deleteMode: boolean, onDelete: (id: string) => void) => 
  Object.fromEntries(
    Object.entries(baseTypes).map(([key, Comp]) => [
      key,
      (props: NodeProps<StoryNodeData>) => (
        <div className="relative">
          <Comp {...props} />
          {deleteMode && (
            <button
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(props.id);
              }}
              title="Node löschen"
            >
              ×
            </button>
          )}
        </div>
      ),
    ])
  );

// Custom hook for debounced save
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Toast notification component (simple implementation)
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
    <div className="flex justify-between items-center">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">×</button>
    </div>
  </div>
);

export default function StoryFlowDesigner({ gameId = 1 }: { gameId?: number }) {
  const initialState: AppState = {
    nodes: [],
    edges: [],
    selectedNodeId: null,
    deleteMode: false,
    loading: true,
    error: null,
    saving: false,
  };

  const [state, dispatch] = useReducer(appReducer, initialState);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Memoized edge computation
  const computeEdges = useCallback((nodeList: StoryNode[]): Edge[] => {
    const nodeMap = new Map(nodeList.map((n) => [n.id, n]));
    return nodeList.flatMap((target) => {
      const predecessors = target.data.predecessors || [];
      return predecessors.map((sourceId: string) => {
        const source = nodeMap.get(sourceId);
        const sourceY = source?.position?.y ?? 0;
        const targetY = target.position.y;
        const sourceHandle = sourceY < targetY ? "bottom" : sourceY > targetY ? "top" : undefined;
        return {
          id: `${sourceId}->${target.id}`,
          source: sourceId,
          target: target.id,
          sourceHandle,
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: true,
          type: "smoothstep",
        };
      });
    });
  }, []);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Error handler
  const handleError = useCallback((error: any, message: string) => {
    console.error(message, error);
    dispatch({ type: 'SET_ERROR', payload: message });
    showToast(message, 'error');
  }, [showToast]);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const { data, error } = await supabase
          .from("story")
          .select("*")
          .eq("game_id", gameId);

        if (error) throw error;

        const loadedNodes: StoryNode[] = (data || []).map((row) => ({
          id: row.id,
          type: row.type,
          position: row.position || { x: 200, y: 200 },
          data: {
            label: row.label || `${row.type} node`,
            color: row.color || "#3b82f6",
            predecessors: Array.isArray(row.predecessors) ? row.predecessors : [],
          },
        }));

        const edges = computeEdges(loadedNodes);
        dispatch({ type: 'SET_NODES_AND_EDGES', payload: { nodes: loadedNodes, edges } });
        
      } catch (error) {
        handleError(error, "Fehler beim Laden der Story");
      }
    };

    loadData();
  }, [gameId, computeEdges, handleError]);

  // Debounced auto-save for positions
  const debouncedNodes = useDebounce(state.nodes, 1000);
  
  useEffect(() => {
    if (debouncedNodes.length > 0 && !state.loading) {
      savePositions(debouncedNodes);
    }
  }, [debouncedNodes, state.loading]);

  // Save positions to database
  const savePositions = async (nodes: StoryNode[]) => {
    if (state.saving) return;
    
    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      
      // Parallel updates for better performance
      const updates = nodes.map(node => 
        supabase
          .from("story")
          .update({ position: node.position })
          .eq("id", node.id)
      );
      
      const results = await Promise.allSettled(updates);
      const failed = results.filter(result => result.status === 'rejected');
      
      if (failed.length > 0) {
        throw new Error(`${failed.length} Position updates failed`);
      }
      
    } catch (error) {
      handleError(error, "Fehler beim Speichern der Positionen");
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  // Handle node changes with edge recomputation
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    const updatedNodes = applyNodeChanges(changes, state.nodes) as StoryNode[];
    const updatedEdges = computeEdges(updatedNodes);
    
    dispatch({ type: 'UPDATE_NODES', payload: updatedNodes });
    dispatch({ type: 'UPDATE_EDGES', payload: updatedEdges });
  }, [state.nodes, computeEdges]);

  // Handle edge changes
  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    const updatedEdges = applyEdgeChanges(changes, state.edges);
    dispatch({ type: 'UPDATE_EDGES', payload: updatedEdges });
  }, [state.edges]);

  // Handle edge deletion
  const onEdgeClick = useCallback(async (event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    
    try {
      // Optimistic update
      dispatch({ type: 'UPDATE_EDGES', payload: state.edges.filter((e) => e.id !== edge.id) });
      
      const { data, error } = await supabase
        .from("story")
        .select("predecessors")
        .eq("id", edge.target)
        .single();

      if (error) throw error;

      const updatedPredecessors = (data?.predecessors || []).filter((id: string) => id !== edge.source);

      await supabase
        .from("story")
        .update({ predecessors: updatedPredecessors })
        .eq("id", edge.target);

      // Update local state
      dispatch({ 
        type: 'UPDATE_NODE_DATA', 
        payload: { id: edge.target, data: { predecessors: updatedPredecessors } }
      });

    } catch (error) {
      handleError(error, "Fehler beim Löschen der Verbindung");
      // Revert optimistic update
      const recomputedEdges = computeEdges(state.nodes);
      dispatch({ type: 'UPDATE_EDGES', payload: recomputedEdges });
    }
  }, [state.edges, state.nodes, computeEdges, handleError]);

  // Handle new connections
  const onConnect: OnConnect = useCallback(async (connection: Connection) => {
    const { target: targetId, source: sourceId } = connection;
    if (!targetId || !sourceId) return;

    try {
      // Optimistic update
      const updatedNodes = state.nodes.map((n) =>
        n.id === targetId ? {
          ...n,
          data: {
            ...n.data,
            predecessors: [...(n.data.predecessors || []), sourceId],
          },
        } : n
      );
      
      const updatedEdges = computeEdges(updatedNodes);
      dispatch({ type: 'UPDATE_NODES', payload: updatedNodes });
      dispatch({ type: 'UPDATE_EDGES', payload: updatedEdges });

      // Database update
      const { data, error } = await supabase
        .from("story")
        .select("predecessors")
        .eq("id", targetId)
        .single();

      if (error) throw error;

      const updatedPredecessors = [...(data?.predecessors || []), sourceId];
      await supabase.from("story")
        .update({ predecessors: updatedPredecessors })
        .eq("id", targetId);

    } catch (error) {
      handleError(error, "Fehler beim Erstellen der Verbindung");
      // Revert optimistic update
      const recomputedEdges = computeEdges(state.nodes);
      dispatch({ type: 'SET_NODES_AND_EDGES', payload: { nodes: state.nodes, edges: recomputedEdges } });
    }
  }, [state.nodes, computeEdges, handleError]);

  // Add new node
  const addNode = async (type: keyof typeof baseTypes) => {
    const id = uuidv4();
    const newNode: StoryNode = {
      id,
      type,
      position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
      data: {
        label: `${type} node`,
        color: getDefaultColor(type),
        predecessors: [],
      },
    };

    try {
      // Optimistic update
      dispatch({ type: 'ADD_NODE', payload: newNode });
      
      const { error } = await supabase.from("story").insert({
        id,
        game_id: gameId,
        label: newNode.data.label,
        color: newNode.data.color,
        type,
        position: newNode.position,
        predecessors: [],
      });

      if (error) throw error;
      
      showToast(`${type} Node wurde hinzugefügt`, 'success');
      
    } catch (error) {
      // Revert optimistic update
      dispatch({ type: 'DELETE_NODE', payload: id });
      handleError(error, "Fehler beim Hinzufügen des Nodes");
    }
  };

  // Delete node
  const deleteNode = async (nodeId?: string) => {
    const idToDelete = nodeId || state.selectedNodeId;
    if (!idToDelete) return;

    try {
      // Optimistic update
      dispatch({ type: 'DELETE_NODE', payload: idToDelete });
      
      await supabase.from("story").delete().eq("id", idToDelete);
      
      showToast('Node wurde gelöscht', 'success');
      
    } catch (error) {
      handleError(error, "Fehler beim Löschen des Nodes");
      // Would need to reload data to revert properly
    }
  };

  // Get default color for node type
  const getDefaultColor = (type: string): string => {
    const colors = {
      start: "#ef4444",
      story: "#3b82f6", 
      gateway: "#facc15",
      event: "#a855f7",
      end: "#ef4444"
    };
    return colors[type as keyof typeof colors] || "#3b82f6";
  };

  // Update node data
  // const updateNodeData = useCallback(async (id: string, newData: { label: string; color: string }) => {
  //   try {
  //     // Optimistic update
  //     dispatch({ type: 'UPDATE_NODE_DATA', payload: { id, data: newData } });
  //     
  //     await supabase
  //       .from("story")
  //       .update(newData)
  //       .eq("id", id);
  //       
  //     showToast('Node wurde aktualisiert', 'success');
  //     
  //   } catch (error) {
  //     handleError(error, "Fehler beim Aktualisieren des Nodes");
  //   }
  // }, [handleError, showToast]);

  // Create wrapped node types
  const wrappedTypes = useMemo(() => 
    createWrappedTypes(state.deleteMode, deleteNode), 
    [state.deleteMode]
  );

  const selectedNode = state.selectedNodeId ? state.nodes.find((n) => n.id === state.selectedNodeId) : null;
  
  console.log('🔍 Debug Info:');
  console.log('  - selectedNodeId:', state.selectedNodeId);
  console.log('  - nodes array length:', state.nodes.length);
  console.log('  - selectedNode object:', selectedNode);
  console.log('  - nodes ids:', state.nodes.map(n => n.id));

  if (state.loading) {
    return (
      <div className="w-full h-[700px] border rounded flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Story wird geladen...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[700px] border rounded flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)}
        />
      )}
      {/* Editor Popup - OUTSIDE the ReactFlow container */}
      {selectedNode && (
        <div style={{ 
          position: 'fixed', 
          top: '100px', 
          left: '100px', 
          right: '100px',
          bottom: '100px',
          zIndex: 99999, 
          background: 'rgba(255, 0, 0, 0.9)', 
          padding: '40px',
          border: '10px solid yellow',
          fontSize: '24px',
          color: 'white',
          fontWeight: 'bold'
        }}>
          <h1 style={{ fontSize: '48px', textAlign: 'center' }}>
            🚨 POPUP IST DA! 🚨
          </h1>
          <p>Node ID: {selectedNode.id}</p>
          <p>Node Type: {selectedNode.type}</p>
          <p>Node Label: {selectedNode.data.label}</p>
          <button 
            onClick={() => dispatch({ type: 'SET_SELECTED_NODE', payload: null })}
            style={{ 
              fontSize: '24px', 
              padding: '20px', 
              background: 'blue', 
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            SCHLIESSEN
          </button>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="p-2 border-b flex gap-2 bg-base-200 justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => addNode("start")} className="btn btn-sm btn-error">+ Start</button>
          <button onClick={() => addNode("story")} className="btn btn-sm btn-primary">+ Encounter</button>
          <button onClick={() => addNode("gateway")} className="btn btn-sm btn-warning">+ Decision</button>
          <button onClick={() => addNode("event")} className="btn btn-sm btn-secondary">+ Development</button>
          <button onClick={() => addNode("end")} className="btn btn-sm btn-error">+ End</button>
        </div>
        
        <div className="flex gap-2 items-center">
          {state.saving && (
            <span className="text-sm text-gray-500 flex items-center">
              <div className="loading loading-spinner loading-xs mr-1"></div>
              Speichert...
            </span>
          )}
          
          <button 
            onClick={() => dispatch({ type: 'TOGGLE_DELETE_MODE' })} 
            className={`btn btn-sm ${state.deleteMode ? 'btn-error' : 'btn-outline'}`}
            title={state.deleteMode ? 'Löschmodus deaktivieren' : 'Löschmodus aktivieren'}
          >
            {state.deleteMode ? '🗑 Löschmodus AN' : '🗑 Löschmodus'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="p-2 bg-red-100 border-b border-red-300 text-red-700 text-sm">
          ⚠ {state.error}
          <button 
            onClick={() => dispatch({ type: 'SET_ERROR', payload: null })} 
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      {/* React Flow */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={state.nodes}
          edges={state.edges}
          nodeTypes={wrappedTypes}
          onNodeDoubleClick={(_, node) => {
            console.log('🖱️ Double click detected on node:', node.id);
            console.log('📋 Current state.selectedNodeId:', state.selectedNodeId);
            dispatch({ type: 'SET_SELECTED_NODE', payload: node.id });
            console.log('📤 Dispatched SET_SELECTED_NODE with:', node.id);
          }}
          onNodeClick={(_, node) => {
            console.log('🖱️ Single click on node:', node.id);
          }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          fitView
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 1, stroke: "#999" },
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
          
      </div>
    </div>
  );
}