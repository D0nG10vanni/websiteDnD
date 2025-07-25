import React, { useEffect, useState } from 'react';
import { Node } from 'reactflow';

export default function EditorPopup({
  node,
  onChange,
  onClose,
}: {
  node: Node;
  onChange: (id: string, newData: { label: string; color: string }) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(node.data.label || '');
  const [color, setColor] = useState(node.data.color || '#3b82f6');

  useEffect(() => {
    setLabel(node.data.label || '');
    setColor(node.data.color || '#3b82f6');
  }, [node]);

  const apply = () => {
    onChange(node.id, { label, color });
  };

  return (
    <div
      className="absolute z-50 rounded-xl border border-gray-700 shadow-xl backdrop-blur-xl bg-base-100 text-sm"
      style={{ left: node.position.x + 180, top: node.position.y }}
    >
      <div className="p-4 w-64">
        <div className="mb-4">
          <label className="text-xs text-gray-400 font-medium">Text</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Node label"
            className="w-full bg-base-200 mt-1 px-2 py-1 rounded text-xs focus:outline-none border border-gray-600"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-400 font-medium">Farbe</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded border-none cursor-pointer"
            />
            <span className="text-xs text-gray-500 font-mono">{color}</span>
          </div>
        </div>

        <div className="flex justify-between border-t border-gray-700 pt-2">
          <button
            onClick={apply}
            className="text-xs text-blue-500 hover:text-blue-400 font-medium"
          >
            Speichern
          </button>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-300 font-medium"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
