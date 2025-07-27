import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Node,
  Edge,
  NodeProps,
  NodeTypes,
  Connection,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { supabase } from '@/lib/supabaseClient';
import EditorPopup from './editorPopup';

const StartNode = ({ data }: NodeProps) => (
  <div className="p-2 rounded-full text-white text-xs shadow relative" style={{ background: data.color || "#22c55e" }}>
    ● {data.label || "Start"}
    <Handle type="source" position={Position.Right} />
  </div>
);

const StoryNode = ({ data }: NodeProps) => (
  <div className="p-2 rounded text-white text-sm shadow relative" style={{ background: data.color || "#3b82f6" }}>
    🗺 {data.label}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

const GatewayNode = ({ data }: NodeProps) => (
  <div className="p-2 rounded text-white text-sm shadow relative" style={{ background: data.color || "#facc15" }}>
    🔀 {data.label || "Decision"}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
  </div>
);

const EventNode = ({ data }: NodeProps) => (
  <div className="p-2 rounded text-white text-sm shadow relative" style={{ background: data.color || "#a855f7" }}>
    ✴ {data.label}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

const nodeTypes: NodeTypes = {
  start: StartNode,
  story: StoryNode,
  gateway: GatewayNode,
  event: EventNode,
};

export default function StoryFlowDesigner({ gameId = 1 }: { gameId?: number }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const computeEdges = useCallback((nodeList: Node[]): Edge[] => {
    const nodeMap = new Map(nodeList.map((n) => [n.id, n]));
    return nodeList.flatMap((target) => {
      const row = target as any;
      const preds = row?.data?.predecessors || [];
      return preds.map((sourceId: string) => {
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

  useEffect(() => {
    const loadData = async () => {
      const { data, error } = await supabase
        .from("story")
        .select("*")
        .eq("game_id", gameId);

      if (error) {
        console.error("Fehler beim Laden der Story:", error);
        return;
      }

      const loadedNodes: Node[] = data.map((row) => ({
        id: row.id,
        type: row.type,
        position: row.position,
        data: {
          label: row.label,
          color: row.color,
          predecessors: row.predecessors || [],
        },
      }));

      setNodes(loadedNodes);
      setEdges(computeEdges(loadedNodes));
    };

    loadData();
  }, [gameId, computeEdges]);

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const updated = applyNodeChanges(changes, nds);
      setEdges(computeEdges(updated));
      return updated;
    });
  }, [computeEdges]);

  const saveAllPositions = async () => {
    for (const node of nodes) {
      await supabase.from("story")
        .update({ position: node.position })
        .eq("id", node.id);
    }
  };

  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onEdgeClick = useCallback(async (event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));

    const { data, error } = await supabase
      .from("story")
      .select("predecessors")
      .eq("id", edge.target)
      .single();

    if (error) return;

    const updatedPredecessors = (data?.predecessors || []).filter((id: string) => id !== edge.source);

    await supabase
      .from("story")
      .update({ predecessors: updatedPredecessors })
      .eq("id", edge.target);
  }, []);

  const onConnect: OnConnect = useCallback(async (connection: Connection) => {
    const targetId = connection.target;
    const sourceId = connection.source;
    if (!targetId || !sourceId) return;

    setNodes((nds) => {
      const updated = nds.map((n) =>
        n.id === targetId ? {
          ...n,
          data: {
            ...n.data,
            predecessors: [...(n.data.predecessors || []), sourceId],
          },
        } : n
      );
      setEdges(computeEdges(updated));
      return updated;
    });

    const { data, error } = await supabase
      .from("story")
      .select("predecessors")
      .eq("id", targetId)
      .single();

    if (error) return;

    const updatedPredecessors = [...(data?.predecessors || []), sourceId];
    await supabase.from("story")
      .update({ predecessors: updatedPredecessors })
      .eq("id", targetId);
  }, [computeEdges]);

  const addNode = async (type: keyof typeof nodeTypes) => {
    const id = uuidv4();
    const newNode: Node = {
      id,
      type: String(type),
      position: { x: 200, y: 200 },
      data: {
        label: `${type} node`,
        color: "#3b82f6",
        predecessors: [],
      },
    };
    setNodes((nds) => {
      const updated = [...nds, newNode];
      setEdges(computeEdges(updated));
      return updated;
    });
    await supabase.from("story").insert({
      id,
      game_id: gameId,
      label: newNode.data.label,
      color: newNode.data.color,
      type,
      position: newNode.position,
      predecessors: [],
    });
  };

  const updateNodeData = (id: string, newData: { label: string; color: string }) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...newData } } : n)));
  };

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  return (
    <div className="w-full h-[700px] border rounded flex flex-col">
      <div className="p-2 border-b flex gap-2 bg-base-200 justify-between items-center">
        <div className="flex gap-2">
          <button onClick={() => addNode("start")} className="btn btn-sm btn-success">+ Start</button>
          <button onClick={() => addNode("story")} className="btn btn-sm btn-primary">+ Story</button>
          <button onClick={() => addNode("gateway")} className="btn btn-sm btn-warning">+ Gateway</button>
          <button onClick={() => addNode("event")} className="btn btn-sm btn-secondary">+ Event</button>
        </div>
        <button onClick={saveAllPositions} className="btn btn-sm btn-outline">Positionen speichern</button>
      </div>
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeDoubleClick={(_, node) => setSelectedNodeId(node.id)}
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
        {selectedNode && (
          <EditorPopup
            node={selectedNode}
            onChange={updateNodeData}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}