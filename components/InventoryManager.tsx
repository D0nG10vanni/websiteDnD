'use client'

import { useState, useEffect, useMemo } from 'react'
import type { InventoryItem, BaseItem } from '@/lib/types' // Pfad anpassen

interface Props {
  characterId: string
  initialInventory?: InventoryItem[]
  onUpdate: () => void // Callback um die Eltern-Komponente neu zu laden
}

export default function InventoryManager({ characterId, initialInventory, onUpdate }: Props) {
  // State für die Liste der verfügbaren Items (für das Dropdown)
  const [availableItems, setAvailableItems] = useState<BaseItem[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>(() => initialInventory ?? [])
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [itemLoadError, setItemLoadError] = useState<string | null>(null)

  // 1. Alle möglichen Items laden (für das "Hinzufügen" Dropdown)
  useEffect(() => {
    async function fetchItems() {
      try {
        setItemLoadError(null)
        const response = await fetch('/api/items', { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok) {
          setItemLoadError(payload?.error || 'Item-Liste konnte nicht geladen werden')
          setAvailableItems([])
          return
        }

        const normalizedItems = ((payload?.items || []) as BaseItem[])
          .filter((item) => item && item.id != null && item.name)
          .map((item) => ({ ...item, id: Number(item.id) }))

        setAvailableItems(normalizedItems)
      } catch (err: any) {
        setItemLoadError(err?.message || 'Item-Liste konnte nicht geladen werden')
        setAvailableItems([])
      }
    }
    void fetchItems()
  }, [])

  useEffect(() => {
    if (availableItems.length > 0 || inventory.length === 0) return

    const fallbackMap = new Map<number, BaseItem>()
    inventory.forEach((entry) => {
      if (entry.items?.id != null) {
        fallbackMap.set(Number(entry.items.id), {
          ...entry.items,
          id: Number(entry.items.id),
        })
      }
    })

    const fallbackItems = Array.from(fallbackMap.values())
    if (fallbackItems.length > 0) {
      setAvailableItems(fallbackItems)
    }
  }, [availableItems.length, inventory])

  const fetchInventory = async () => {
    const response = await fetch(`/api/character-items?characterId=${characterId}`, { cache: 'no-store' })
    const payload = await response.json()

    if (!response.ok) {
      setErrorMessage(`Inventar konnte nicht geladen werden: ${payload?.error || 'Unbekannter Fehler'}`)
      return
    }

    setInventory((payload?.inventory as InventoryItem[]) || [])
  }

  useEffect(() => {
    if (!characterId) return
    void fetchInventory()
  }, [characterId])

  // ITEM HINZUFÜGEN
  const handleAddItem = async () => {
    if (!selectedItemId) return
    setLoading(true)
    setErrorMessage(null)
    
    const response = await fetch('/api/character-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId, itemId: Number(selectedItemId), quantity: 1, equipped: false }),
    })
    const payload = await response.json()

    if (!response.ok) {
      setErrorMessage(`Item konnte nicht vergeben werden: ${payload?.error || 'Unbekannter Fehler'}`)
      setLoading(false)
      return
    }

    setSelectedItemId('')
    await fetchInventory()
    onUpdate() // Optional: Eltern-Komponente neu laden
    setLoading(false)
  }

  // STATUS ÄNDERN (Equip / Unequip)
  const toggleEquip = async (invItem: InventoryItem) => {
    setErrorMessage(null)
    const response = await fetch('/api/character-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: invItem.id, equipped: !invItem.equipped }),
    })
    const payload = await response.json()
    if (!response.ok) {
      setErrorMessage(`Ausrüstungsstatus konnte nicht geändert werden: ${payload?.error || 'Unbekannter Fehler'}`)
      return
    }
    await fetchInventory()
    onUpdate()
  }

  // ITEM LÖSCHEN
  const deleteItem = async (id: number) => {
    if (!confirm('Gegenstand wirklich wegwerfen?')) return
    setErrorMessage(null)
    const response = await fetch('/api/character-items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const payload = await response.json()
    if (!response.ok) {
      setErrorMessage(`Item konnte nicht gelöscht werden: ${payload?.error || 'Unbekannter Fehler'}`)
      return
    }
    await fetchInventory()
    onUpdate()
  }

  // MENGE ÄNDERN
  const updateQuantity = async (id: number, current: number, change: number) => {
    const newQty = current + change
    if (newQty < 1) return deleteItem(id)
    
    setErrorMessage(null)
    const response = await fetch('/api/character-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity: newQty }),
    })
    const payload = await response.json()
    if (!response.ok) {
      setErrorMessage(`Menge konnte nicht geändert werden: ${payload?.error || 'Unbekannter Fehler'}`)
      return
    }
    await fetchInventory()
    onUpdate()
  }

  // Sortieren: Ausgerüstete zuerst
  const sortedInventory = [...inventory].sort((a, b) => 
    (a.equipped === b.equipped) ? 0 : a.equipped ? -1 : 1
  )

  const totalWeight = useMemo(() => {
    return sortedInventory.reduce((sum, entry) => {
      const itemWeight = Number(entry.items?.weight ?? 0)
      if (Number.isNaN(itemWeight)) return sum
      return sum + (itemWeight * (entry.quantity || 1))
    }, 0)
  }, [sortedInventory])

  const totalItemStacks = sortedInventory.length

  return (
    <div className="space-y-4 text-amber-50/90 p-3 bg-[#171109]/90 rounded-lg border border-amber-900/35">
      <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
        <h3 className="text-lg font-serif text-amber-500">Inventar & Ausrüstung</h3>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded border border-amber-900/30 bg-[#130d07] text-amber-100/80">
            {totalItemStacks} Items
          </span>
          <span className="px-2 py-0.5 rounded border border-amber-700/50 bg-amber-900/25 text-amber-200">
            Gewicht: {totalWeight.toFixed(1)} kg
          </span>
        </div>
      </div>

      {/* --- Add Item Section --- */}
      <div className="flex gap-2 items-end bg-[#21170d]/70 p-2.5 rounded border border-amber-900/30">
        <div className="flex-1">
          <label className="text-[11px] text-amber-200/60 uppercase tracking-wider mb-1 block">Gegenstand hinzufügen</label>
          <select 
            className="w-full bg-[#0f0905] border border-amber-900/35 rounded px-2 py-1.5 text-sm text-amber-50 focus:border-amber-500 focus:outline-none"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Wähle ein Item --</option>
            {availableItems.map(item => (
              <option key={item.id} value={String(item.id)}>
                {item.name} ({item.type})
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleAddItem}
          disabled={!selectedItemId || loading}
          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors"
        >
          {loading ? '...' : '+ Hinzufügen'}
        </button>
      </div>

      {errorMessage && (
        <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/50 rounded px-3 py-2">
          {errorMessage}
        </div>
      )}

      {itemLoadError && (
        <div className="text-xs text-amber-300 bg-amber-950/20 border border-amber-800/50 rounded px-3 py-2">
          Item-Liste konnte nicht geladen werden: {itemLoadError}
        </div>
      )}

      {/* --- Inventory List --- */}
      <div className="max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {sortedInventory.length === 0 && (
          <p className="text-amber-200/40 text-center italic py-4">Der Rucksack ist leer.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {sortedInventory.map((entry) => {
            const item = entry.items // Das verknüpfte Item Object
            if (!item) return null

            return (
              <div
                key={entry.id}
                className={`rounded border p-2.5 transition-all min-h-[112px] flex flex-col justify-between ${
                  entry.equipped
                    ? 'bg-amber-900/25 border-amber-600/50 shadow-[0_0_10px_rgba(245,158,11,0.14)]'
                    : 'bg-[#2a1f14] border-amber-900/30 hover:border-amber-700/45'
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleEquip(entry)}
                    title={entry.equipped ? 'Ablegen' : 'Ausrüsten'}
                    className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-colors shrink-0 ${
                      entry.equipped ? 'bg-amber-500 text-[#1d1308]' : 'bg-[#3a2a1a] text-amber-200/65 hover:bg-[#4a3420]'
                    }`}
                  >
                    {entry.equipped ? '⚔️' : '🎒'}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate text-amber-50/90">{entry.custom_name || item.name}</div>
                    <div className="text-[10px] uppercase text-amber-300/35 mt-0.5 truncate">{item.type}</div>
                    <div className="text-[11px] text-amber-100/60 mt-1 flex flex-wrap gap-x-2">
                      {item.damage && <span>Dmg: {item.damage}</span>}
                      {item.armor_sp && <span>SP: {item.armor_sp}</span>}
                      {item.weight && <span>{item.weight} kg</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 bg-[#120c06] rounded border border-amber-900/35">
                    <button
                      onClick={() => updateQuantity(entry.id, entry.quantity, -1)}
                      className="px-2 py-0.5 text-amber-200/70 hover:text-red-300 hover:bg-[#20150b] rounded-l"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono w-4 text-center text-amber-100/90">{entry.quantity}</span>
                    <button
                      onClick={() => updateQuantity(entry.id, entry.quantity, 1)}
                      className="px-2 py-0.5 text-amber-200/70 hover:text-emerald-300 hover:bg-[#20150b] rounded-r"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => deleteItem(entry.id)}
                    className="text-amber-200/30 hover:text-red-400 transition-colors p-1 text-sm"
                    title="Wegwerfen"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}