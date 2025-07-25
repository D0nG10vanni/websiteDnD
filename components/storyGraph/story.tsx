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
import EditorPopup from "./editorPopup";


const StartNode = ({ data }: NodeProps) => (
  <div className="p-2 rounded-full text-white text-xs shadow relative" style={{ background: data.color || "#dc2626" }}>
    ● {data.label || "Start"}
    <Handle type="source" position={Position.Right} />
  </div>
);

const EndNode = ({ data }: NodeProps) => (
  <div className="p-2 rounded-full text-white text-xs shadow relative" style={{ background: data.color || "#22c55e" }}>
    ● {data.label || "End"}
    <Handle type="target" position={Position.Left} />
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
  end: EndNode,
};

const initialNodes: Node[] = [
  { id: "start", type: "start", position: { x: 0, y: 150 }, data: { label: "Start", color: "#22c55e" } },
  { id: "story1", type: "story", position: { x: 150, y: 150 }, data: { label: "Find the Village", color: "#3b82f6" } },
  { id: "gate1", type: "gateway", position: { x: 320, y: 150 }, data: { label: "Decision", color: "#facc15" } },
  { id: "event1", type: "event", position: { x: 500, y: 50 }, data: { label: "Bandit Ambush", color: "#a855f7" } },
  { id: "story2", type: "story", position: { x: 500, y: 250 }, data: { label: "Negotiate with Leader", color: "#3b82f6" } },
  { id: "story3", type: "story", position: { x: 700, y: 150 }, data: { label: "Report Back to Town", color: "#3b82f6" } },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "start", target: "story1", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e2", source: "story1", target: "gate1", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e3", source: "gate1", target: "event1", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e4", source: "gate1", target: "story2", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e5", source: "event1", target: "story3", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e6", source: "story2", target: "story3", markerEnd: { type: MarkerType.ArrowClosed } },
];


export default function StoryFlowDesigner() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const updated = applyNodeChanges(changes, nds);
      setEdges((eds) =>
        eds.map((edge) => {
          const sourceNode = updated.find((n) => n.id === edge.source);
          const targetNode = updated.find((n) => n.id === edge.target);
          if (!sourceNode || !targetNode) return edge;
          if (sourceNode.type !== "gateway") return edge;
          const fromTop = targetNode.position.y < sourceNode.position.y;
          return { ...edge, sourceHandle: fromTop ? "top" : "bottom" };
        })
      );
      return updated;
    });
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;
      const fromTop = targetNode.position.y < sourceNode.position.y;
      setEdges((eds) => addEdge({ ...connection, sourceHandle: fromTop ? "top" : "bottom" }, eds));
    },
    [nodes]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    },
    []
  );

  const onNodeDoubleClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const updateNodeData = (id: string, newData: { label: string; color: string }) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...newData } } : n)));
  };

  const addNode = (type: keyof typeof nodeTypes) => {
    const id = uuidv4();
    const typeStr = String(type);
    const baseNode: Node = {
      id,
      type: typeStr,
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
      data: { label: `${typeStr[0].toUpperCase() + typeStr.slice(1)} Node`, color: "#3b82f6" },
    };
    setNodes((prev) => [...prev, baseNode]);
  };

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  return (
    <div className="w-full h-[700px] border rounded flex flex-col">
      <div className="p-2 border-b flex gap-2 bg-base-200">
        <button onClick={() => addNode("start" as any)} className="btn btn-sm btn-success">+ Start</button>
        <button onClick={() => addNode("story" as any)} className="btn btn-sm btn-primary">+ Story</button>
        <button onClick={() => addNode("gateway" as any)} className="btn btn-sm btn-warning">+ Gateway</button>
        <button onClick={() => addNode("event" as any)} className="btn btn-sm btn-secondary">+ Event</button>
        <button onClick={() => addNode("end" as any)} className="btn btn-sm btn-info">+ End</button>
      </div>
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeDoubleClick={onNodeDoubleClick}
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
