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
    // Nur onChange aufrufen - das macht bereits das DB-Update
    onChange(node.id, { label, color });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      apply();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="rounded-xl border border-gray-700 shadow-xl bg-base-100 text-sm"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="p-4 w-64">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
            <h3 className="text-sm font-medium">Node bearbeiten</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 text-lg leading-none"
              title="Schließen (Esc)"
            >
              ×
            </button>
          </div>

          {/* Label Input */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-medium block mb-1">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Node label"
              className="w-full bg-base-200 px-2 py-1 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
              autoFocus
            />
          </div>

          {/* Color Input */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-medium block mb-1">
              Farbe
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-mono flex-1">{color}</span>
            </div>
            
            {/* Color Presets */}
            <div className="flex gap-1 mt-2">
              {[
                '#ef4444', // red
                '#3b82f6', // blue  
                '#facc15', // yellow
                '#a855f7', // purple
                '#10b981', // green
                '#f97316', // orange
              ].map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  className="w-6 h-6 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between border-t border-gray-700 pt-3">
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-300 font-medium px-3 py-1 rounded hover:bg-gray-700 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={apply}
              className="text-xs text-blue-500 hover:text-blue-400 font-medium px-3 py-1 rounded hover:bg-blue-900 hover:bg-opacity-30 transition-colors"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}