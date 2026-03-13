import React, { useEffect, useState } from 'react';
import { Node } from 'reactflow';
import { supabase } from '@/lib/supabaseClient'; // Pfad ggf. anpassen!

export default function EditorPopup({
  node,
  gameId,
  onChange,
  onClose,
}: {
  node: Node;
  gameId: number;
  onChange: (id: string, newData: any) => void;
  onClose: () => void;
}) {
  // --- FORM STATES ---
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isDone, setIsDone] = useState(false);

  // --- LINK STATES ---
  const [linkedArticleId, setLinkedArticleId] = useState<number | ''>('');
  const [linkedNpcId, setLinkedNpcId] = useState<number | ''>('');
  const [linkedItemId, setLinkedItemId] = useState<number | ''>('');
  const [linkedLocationId, setLinkedLocationId] = useState<number | ''>('');
  const [logId, setLogId] = useState<number | ''>('');

  // --- DATA STATES (für Dropdowns) ---
  const [articles, setArticles] = useState<any[]>([]);
  const [npcs, setNpcs] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. Initial Values aus dem Node laden
  useEffect(() => {
    setLabel(node.data.label || '');
    setDescription(node.data.description || '');
    setColor(node.data.color || '#3b82f6');
    setImageUrl(node.data.image_url || '');
    setTagsInput(node.data.tags ? node.data.tags.join(', ') : '');
    setIsDone(node.data.done || false);
    
    setLinkedArticleId(node.data.linked_article_id || '');
    setLinkedNpcId(node.data.linked_npc_id || '');
    setLinkedItemId(node.data.linked_item_id || '');
    setLinkedLocationId(node.data.linked_location_id || '');
    setLogId(node.data.log_id || '');
  }, [node]);

  // 2. Dropdown-Daten aus Supabase laden
  useEffect(() => {
    const fetchLinkData = async () => {
      setIsLoadingData(true);
      try {
        const [
          { data: articleData },
          { data: npcData },
          { data: locationData },
          { data: logData }
          // Items haben aktuell kein game_id in deinem Schema, wir laden einfach alle oder lassen es weg, 
          // falls Items global sind. Ich lade sie hier einfach mal alle.
        ] = await Promise.all([
          supabase.from('posts').select('id, title').eq('game_id', gameId),
          supabase.from('npcs').select('id, name').eq('game_id', gameId),
          supabase.from('locations').select('id, name').eq('game_id', gameId),
          supabase.from('logs').select('id, content').eq('game_id', gameId).limit(50),
          supabase.from('items').select('id, name') 
        ]);

        if (articleData) setArticles(articleData);
        if (npcData) setNpcs(npcData);
        if (locationData) setLocations(locationData);
        if (logData) setLogs(logData);
        
        // Items separat laden (falls vorhanden)
        const { data: itemData } = await supabase.from('items').select('id, name');
        if (itemData) setItems(itemData);

      } catch (error) {
        console.error("Fehler beim Laden der Verknüpfungsdaten:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (gameId) fetchLinkData();
  }, [gameId]);

  const apply = () => {
    const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t !== '');
    
    onChange(node.id, { 
      label, 
      description, 
      color, 
      image_url: imageUrl, 
      tags: tagsArray, 
      done: isDone,
      linked_article_id: linkedArticleId === '' ? null : Number(linkedArticleId),
      linked_npc_id: linkedNpcId === '' ? null : Number(linkedNpcId),
      linked_item_id: linkedItemId === '' ? null : Number(linkedItemId),
      linked_location_id: linkedLocationId === '' ? null : Number(linkedLocationId),
      log_id: logId === '' ? null : Number(logId),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="rounded-xl border border-white/10 shadow-2xl bg-[#111827] text-sm w-[450px] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#1f2937] rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded text-gray-300">{node.type}</span>
            <h3 className="text-md font-bold text-[#facc15] font-serif tracking-wide">Node konfigurieren</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          
          {/* Status Checkbox */}
          <label className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors">
            <input 
              type="checkbox" 
              checked={isDone} 
              onChange={(e) => setIsDone(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900 bg-gray-900"
            />
            <span className="text-sm font-bold text-gray-200">Quest / Node abgeschlossen</span>
          </label>

          {/* Basis-Daten */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Titel / Label</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full bg-[#0a0f18] px-3 py-2 rounded-md text-sm text-white focus:ring-2 focus:ring-amber-500 border border-gray-700" />
          </div>

          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Beschreibung / DM Notizen</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-[#0a0f18] px-3 py-2 rounded-md text-sm text-white focus:ring-2 focus:ring-amber-500 border border-gray-700 resize-none" placeholder="Was passiert hier? Geheimnisse? DC Checks?" />
          </div>

          {/* --- NEU: VERKNÜPFUNGEN SECTION --- */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h4 className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-3 flex items-center justify-between">
              Verknüpfungen (Optional)
              {isLoadingData && <span className="text-[10px] text-gray-500 animate-pulse">Lade Daten...</span>}
            </h4>
            
            <div className="space-y-2">
              {/* Article Link */}
              <div className="flex items-center gap-2">
                <span className="w-6 text-center text-gray-400" title="Artikel">📄</span>
                <select value={linkedArticleId} onChange={(e) => setLinkedArticleId(e.target.value)} className="flex-1 bg-[#0a0f18] px-2 py-1.5 rounded-md text-sm text-gray-300 border border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                  <option value="">Kein Artikel verknüpft</option>
                  {articles.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>

              {/* NPC Link */}
              <div className="flex items-center gap-2">
                <span className="w-6 text-center text-gray-400" title="NPC">👤</span>
                <select value={linkedNpcId} onChange={(e) => setLinkedNpcId(e.target.value)} className="flex-1 bg-[#0a0f18] px-2 py-1.5 rounded-md text-sm text-gray-300 border border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                  <option value="">Kein NPC verknüpft</option>
                  {npcs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              {/* Location Link */}
              <div className="flex items-center gap-2">
                <span className="w-6 text-center text-gray-400" title="Location">🗺️</span>
                <select value={linkedLocationId} onChange={(e) => setLinkedLocationId(e.target.value)} className="flex-1 bg-[#0a0f18] px-2 py-1.5 rounded-md text-sm text-gray-300 border border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                  <option value="">Kein Ort verknüpft</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              {/* Item Link */}
              <div className="flex items-center gap-2">
                <span className="w-6 text-center text-gray-400" title="Item / Loot">🗡️</span>
                <select value={linkedItemId} onChange={(e) => setLinkedItemId(e.target.value)} className="flex-1 bg-[#0a0f18] px-2 py-1.5 rounded-md text-sm text-gray-300 border border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                  <option value="">Kein Item verknüpft</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              
              {/* Log Link */}
              <div className="flex items-center gap-2">
                <span className="w-6 text-center text-gray-400" title="Log">📜</span>
                <select value={logId} onChange={(e) => setLogId(e.target.value)} className="flex-1 bg-[#0a0f18] px-2 py-1.5 rounded-md text-sm text-gray-300 border border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 truncate">
                  <option value="">Kein Log-Eintrag verknüpft</option>
                  {logs.map(l => <option key={l.id} value={l.id}>{l.content?.substring(0, 40)}...</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Tags (Komma-getrennt)</label>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="z.B. wichtig, loot, bossfight" className="w-full bg-[#0a0f18] px-3 py-2 rounded-md text-sm text-white focus:ring-2 focus:ring-amber-500 border border-gray-700 font-mono text-xs" />
          </div>

          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Farbakzent</label>
            <div className="flex gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
              <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 bg-[#0a0f18] px-3 py-1 rounded-md text-sm text-white border border-gray-700 font-mono text-xs" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-3 bg-[#1f2937] rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Abbrechen</button>
          <button onClick={apply} className="px-6 py-2 text-sm font-bold bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-md shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all active:scale-95">Speichern</button>
        </div>

      </div>
    </div>
  );
}