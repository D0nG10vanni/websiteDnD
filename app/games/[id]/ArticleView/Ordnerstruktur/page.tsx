'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { supabase } from '@/lib/supabaseClient'

type Folder = {
  id: number
  name: string
  parent_id: number | null
  game_id: number
}

const ItemType = 'FOLDER'

export default function FolderManagerPage() {
  const params = useParams()
  const gameId = parseInt(params.id as string, 10)

  const [folders, setFolders] = useState<Folder[]>([])
  const [newName, setNewName] = useState('')
  const [changes, setChanges] = useState<Record<number, number | null>>({})

  useEffect(() => {
    const fetchFolders = async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId)
      if (!error) setFolders(data || [])
    }
    fetchFolders()
  }, [gameId])

  const handleCreate = async () => {
    if (!newName.trim()) return
    const { data, error } = await supabase
      .from('folders')
      .insert({ name: newName.trim(), parent_id: null, game_id: gameId })
      .select()
      .single()
    if (!error && data) {
      setFolders((prev) => [...prev, data])
      setNewName('')
    }
  }

  const updateParentLocally = (draggedId: number, newParentId: number | null) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === draggedId ? { ...f, parent_id: newParentId } : f
      )
    )
    setChanges((prev) => ({ ...prev, [draggedId]: newParentId }))
  }

  const confirmChanges = async () => {
    const updates = Object.entries(changes)
    if (updates.length === 0) return

    const { error } = await supabase.from('folders').upsert(
      updates.map(([id, parent_id]) => {
        const folder = folders.find((f) => f.id === Number(id))
        return {
          id: folder!.id,
          parent_id,
          name: folder!.name,
          game_id: folder!.game_id,
        }
      }),
      { onConflict: 'id' }
    )

    if (!error) {
      setChanges({})
      alert('Struktur erfolgreich gespeichert.')
    } else {
      alert('Fehler beim Speichern: ' + error.message)
    }
  }

  const renderFolders = (parentId: number | null, depth = 0) => {
    const children = folders.filter((f) => f.parent_id === parentId)
    return children.map((folder) => (
      <DraggableFolder
        key={folder.id}
        folder={folder}
        depth={depth}
        onDrop={(draggedId) => updateParentLocally(draggedId, folder.id)}
        onDropToRoot={(draggedId) => updateParentLocally(draggedId, null)}
      >
        {renderFolders(folder.id, depth + 1)}
      </DraggableFolder>
    ))
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-base-200 p-6" data-theme="fantasy">
        <div className="max-w-xl mx-auto card bg-base-100 shadow-xl p-6 border border-primary/20">
          <h1 className="text-center text-2xl font-serif mb-4">📁 Ordner-Hierarchie</h1>
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Neuer Ordnername"
              className="input input-bordered w-full font-serif"
            />
            <button onClick={handleCreate} className="btn btn-primary font-serif">
              ✦ Erstellen
            </button>
          </div>

          <div>
            <DropZone onDrop={(id) => updateParentLocally(id, null)} isRoot />
            {renderFolders(null)}
          </div>

          {Object.keys(changes).length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={confirmChanges}
                className="btn btn-accent font-serif"
              >
                ✦ Struktur bestätigen ({Object.keys(changes).length} Änderungen)
              </button>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  )
}

function DraggableFolder({
  folder,
  depth,
  children,
  onDrop,
  onDropToRoot,
}: {
  folder: Folder
  depth: number
  children?: React.ReactNode
  onDrop: (draggedId: number) => void
  onDropToRoot: (draggedId: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  const [, drop] = useDrop({
    accept: ItemType,
    drop: (item: { id: number }) => {
      if (item.id !== folder.id) {
        onDrop(item.id)
      }
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: folder.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))

  return (
    <div className="mb-2 ml-2">
      <div
        ref={ref}
        className={`p-2 font-serif border rounded-md bg-amber-900/10 border-amber-700 cursor-move transition-all`}
        style={{ marginLeft: depth * 16, opacity: isDragging ? 0.3 : 1 }}
      >
        <span className="text-amber-500">✧</span> {folder.name}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  )
}

function DropZone({ onDrop, isRoot = false }: { onDrop: (id: number) => void; isRoot?: boolean }) {
  const [, drop] = useDrop({
    accept: ItemType,
    drop: (item: { id: number }) => onDrop(item.id),
  })

  // Type assertion to fix the ref type error
  return (
    <div
      ref={drop as unknown as React.RefCallback<HTMLDivElement>}
      className={`${
        isRoot ? 'mb-4 p-3 text-center' : 'my-1'
      } border border-dashed border-amber-700 rounded text-amber-400 font-serif text-sm`}
    >
      {isRoot ? 'Ziehe hierher, um Ordner auf oberster Ebene zu platzieren' : ''}
    </div>
  )
}
