'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import type { InventoryItem, BaseItem } from '@/lib/types' // Pfad anpassen

interface Props {
  characterId: string
  initialInventory?: InventoryItem[]
  onUpdate: () => void // Callback um die Eltern-Komponente neu zu laden
}

export default function InventoryManager({ characterId, initialInventory = [], onUpdate }: Props) {
  const supabase = useSupabaseClient()
  
  // State für die Liste der verfügbaren Items (für das Dropdown)
  const [availableItems, setAvailableItems] = useState<BaseItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)

  // 1. Alle möglichen Items laden (für das "Hinzufügen" Dropdown)
  useEffect(() => {
    async function fetchItems() {
      const { data } = await supabase.from('items').select('*').order('name')
      if (data) setAvailableItems(data)
    }
    fetchItems()
  }, [supabase])

  // ITEM HINZUFÜGEN
  const handleAddItem = async () => {
    if (!selectedItemId) return
    setLoading(true)
    
    const { error } = await supabase
      .from('character_items')
      .insert({
        character_id: characterId,
        item_id: Number(selectedItemId),
        quantity: 1,
        equipped: false
      })

    if (!error) {
      setSelectedItemId('')
      onUpdate() // Liste neu laden
    }
    setLoading(false)
  }

  // STATUS ÄNDERN (Equip / Unequip)
  const toggleEquip = async (invItem: InventoryItem) => {
    await supabase
      .from('character_items')
      .update({ equipped: !invItem.equipped })
      .eq('id', invItem.id)
    onUpdate()
  }

  // ITEM LÖSCHEN
  const deleteItem = async (id: number) => {
    if (!confirm('Gegenstand wirklich wegwerfen?')) return
    await supabase.from('character_items').delete().eq('id', id)
    onUpdate()
  }

  // MENGE ÄNDERN
  const updateQuantity = async (id: number, current: number, change: number) => {
    const newQty = current + change
    if (newQty < 1) return deleteItem(id)
    
    await supabase
      .from('character_items')
      .update({ quantity: newQty })
      .eq('id', id)
    onUpdate()
  }

  // Sortieren: Ausgerüstete zuerst
  const sortedInventory = [...initialInventory].sort((a, b) => 
    (a.equipped === b.equipped) ? 0 : a.equipped ? -1 : 1
  )

  return (
    <div className="space-y-6 text-slate-200 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
      <h3 className="text-xl font-serif text-amber-500 border-b border-slate-700 pb-2">Inventar & Ausrüstung</h3>

      {/* --- Add Item Section --- */}
      <div className="flex gap-2 items-end bg-slate-800/50 p-3 rounded border border-slate-700">
        <div className="flex-1">
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Gegenstand hinzufügen</label>
          <select 
            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-amber-500 focus:outline-none"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(Number(e.target.value))}
            disabled={loading}
          >
            <option value="">-- Wähle ein Item --</option>
            {availableItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.type})
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleAddItem}
          disabled={!selectedItemId || loading}
          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-bold transition-colors"
        >
          {loading ? '...' : '+ Hinzufügen'}
        </button>
      </div>

      {/* --- Inventory List --- */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedInventory.length === 0 && (
          <p className="text-slate-500 text-center italic py-4">Der Rucksack ist leer.</p>
        )}

        {sortedInventory.map((entry) => {
          const item = entry.items // Das verknüpfte Item Object
          if (!item) return null

          return (
            <div 
              key={entry.id} 
              className={`flex items-center gap-3 p-3 rounded border transition-all ${
                entry.equipped 
                  ? 'bg-amber-900/20 border-amber-600/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
            >
              {/* Icon / Status */}
              <button 
                onClick={() => toggleEquip(entry)}
                title={entry.equipped ? "Ablegen" : "Ausrüsten"}
                className={`w-8 h-8 rounded flex items-center justify-center text-lg transition-colors ${
                  entry.equipped ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {entry.equipped ? '⚔️' : '🎒'}
              </button>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className={`font-bold truncate ${entry.equipped ? 'text-amber-100' : 'text-slate-300'}`}>
                    {entry.custom_name || item.name}
                  </span>
                  <span className="text-[10px] uppercase text-slate-500 ml-2">{item.type}</span>
                </div>
                <div className="text-xs text-slate-400 truncate flex gap-3">
                   {item.damage && <span>Dmg: {item.damage}</span>}
                   {item.armor_sp && <span>SP: {item.armor_sp}</span>}
                   {item.weight && <span>{item.weight} kg</span>}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1 bg-slate-950 rounded border border-slate-700">
                <button 
                  onClick={() => updateQuantity(entry.id, entry.quantity, -1)}
                  className="px-2 py-1 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-l"
                >-</button>
                <span className="text-xs font-mono w-4 text-center">{entry.quantity}</span>
                <button 
                  onClick={() => updateQuantity(entry.id, entry.quantity, 1)}
                  className="px-2 py-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-r"
                >+</button>
              </div>

              {/* Delete */}
              <button 
                onClick={() => deleteItem(entry.id)}
                className="text-slate-600 hover:text-red-500 transition-colors p-1"
                title="Wegwerfen"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}