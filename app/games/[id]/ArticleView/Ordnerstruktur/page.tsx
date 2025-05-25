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
  creator_uuid: string
}

const ItemType = 'FOLDER'

export default function FolderManagerPage() {
  const params = useParams()
  const gameId = parseInt(params.id as string, 10)

  const [folders, setFolders] = useState<Folder[]>([])
  const [newName, setNewName] = useState('')
  const [changes, setChanges] = useState<Record<number, number | null>>({})
  const [userUuid, setUserUuid] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState(false)

  useEffect(() => {
    const fetchUserAndFolders = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        alert('Fehler beim Abrufen des Benutzers.')
        return
      }

      setUserUuid(user.id)

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId)
      if (!error) setFolders(data || [])
    }

    fetchUserAndFolders()
  }, [gameId])

  const handleCreate = async () => {
    if (!newName.trim() || !userUuid) return
    const { data, error } = await supabase
      .from('folders')
      .insert({
        name: newName.trim(),
        parent_id: null,
        game_id: gameId,
        creator_uuid: userUuid,
      })
      .select()
      .single()

    if (!error && data) {
      setFolders((prev) => [...prev, data])
      setNewName('')
    } else {
      alert('Fehler beim Erstellen: ' + error?.message)
    }
  }

  const handleDelete = async (folderId: number) => {
    // Check if folder has children
    const hasChildren = folders.some(f => f.parent_id === folderId)
    if (hasChildren) {
      if (!confirm('Dieser Ordner enthält Unterordner. Alle Unterordner werden ebenfalls gelöscht. Fortfahren?')) {
        return
      }
    } else {
      if (!confirm('Ordner wirklich löschen?')) {
        return
      }
    }

    // Get all descendants to delete
    const getDescendants = (parentId: number): number[] => {
      const children = folders.filter(f => f.parent_id === parentId)
      const descendants = [parentId]
      children.forEach(child => {
        descendants.push(...getDescendants(child.id))
      })
      return descendants
    }

    const toDelete = getDescendants(folderId)

    // Delete from database
    const { error } = await supabase
      .from('folders')
      .delete()
      .in('id', toDelete)

    if (!error) {
      setFolders(prev => prev.filter(f => !toDelete.includes(f.id)))
      // Remove any pending changes for deleted folders
      setChanges(prev => {
        const newChanges = { ...prev }
        toDelete.forEach(id => delete newChanges[id])
        return newChanges
      })
    } else {
      alert('Fehler beim Löschen: ' + error.message)
    }
  }

  const updateParentLocally = (draggedId: number, newParentId: number | null) => {
    // Prevent circular references
    if (newParentId !== null) {
      const isCircular = (checkId: number, targetId: number): boolean => {
        const folder = folders.find(f => f.id === checkId)
        if (!folder || folder.parent_id === null) return false
        if (folder.parent_id === targetId) return true
        return isCircular(folder.parent_id, targetId)
      }

      if (isCircular(newParentId, draggedId)) {
        alert('Zirkuläre Referenz nicht erlaubt!')
        return
      }
    }

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
          creator_uuid: folder!.creator_uuid,
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
        deleteMode={deleteMode}
        onDrop={(draggedId) => updateParentLocally(draggedId, folder.id)}
        onDropToRoot={(draggedId) => updateParentLocally(draggedId, null)}
        onDelete={() => handleDelete(folder.id)}
      >
        {renderFolders(folder.id, depth + 1)}
      </DraggableFolder>
    ))
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-amber-950/20 via-black to-amber-900/10 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-amber-200 mb-2 tracking-wider">
              <span className="text-amber-500">❖</span> SYSTEMATISIERUNG <span className="text-amber-500">❖</span>
            </h1>
            <p className="text-amber-200/60 font-serif text-sm italic">
              Ordne die Archive nach deinem Willen
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-8 shadow-[0_0_30px_rgba(0,0,0,0.7)]">
            
            {/* Create New Folder */}
            <div className="mb-8">
              <h2 className="font-serif text-lg text-amber-300 mb-4 border-b border-amber-900/30 pb-2">
                <span className="text-amber-700">♦</span> Neues Archiv erstellen
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name des neuen Archives…"
                  className="flex-1 bg-black/50 border border-amber-900/50 rounded-sm px-4 py-2 text-amber-100 placeholder-amber-200/30 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button 
                  onClick={handleCreate} 
                  className="px-6 py-2 bg-amber-900/20 border border-amber-700/50 rounded-sm font-serif text-sm text-amber-200 hover:bg-amber-900/40 hover:border-amber-600 transition-all duration-200"
                >
                  <span className="text-amber-500">✦</span> Manifestieren
                </button>
              </div>
            </div>

            {/* Delete Mode Toggle */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-lg text-amber-300 border-b border-amber-900/30 pb-2">
                <span className="text-amber-700">♦</span> Archiv-Struktur
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-amber-200/60 font-serif text-sm">Archive vernichten?</span>
                <label className="cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="toggle toggle-error toggle-sm"
                    checked={deleteMode}
                    onChange={(e) => setDeleteMode(e.target.checked)}
                  />
                  <span className="text-amber-200 font-serif text-sm">🗑️</span>
                </label>
              </div>
            </div>

            {/* Folder Structure */}
            <div className="min-h-[200px]">
              <DropZone onDrop={(id) => updateParentLocally(id, null)} isRoot />
              {folders.length === 0 ? (
                <div className="text-center py-12 text-amber-200/40 italic font-serif">
                  Noch keine Archive vorhanden. Erstelle dein erstes Archiv oben.
                </div>
              ) : (
                renderFolders(null)
              )}
            </div>

            {/* Confirm Changes */}
            {Object.keys(changes).length > 0 && (
              <div className="mt-8 p-4 bg-amber-900/10 border border-amber-700/30 rounded-sm">
                <div className="text-center">
                  <p className="text-amber-200/80 font-serif text-sm mb-3">
                    <span className="text-amber-500">⚠</span> Unbestätigte Änderungen: {Object.keys(changes).length}
                  </p>
                  <button
                    onClick={confirmChanges}
                    className="px-8 py-2 bg-amber-700/20 border border-amber-600/50 rounded-sm font-serif text-sm text-amber-200 hover:bg-amber-700/40 hover:border-amber-500 transition-all duration-200"
                  >
                    <span className="text-amber-400">✦</span> Struktur in Stein meißeln
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

function DraggableFolder({
  folder,
  depth,
  children,
  deleteMode,
  onDrop,
  onDropToRoot,
  onDelete,
}: {
  folder: Folder
  depth: number
  children?: React.ReactNode
  deleteMode: boolean
  onDrop: (draggedId: number) => void
  onDropToRoot: (draggedId: number) => void
  onDelete: () => void
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
    <div className="mb-3">
      <div className="flex items-center gap-2" style={{ marginLeft: depth * 24 }}>
        <div
          ref={ref}
          className={`flex-1 p-3 font-serif border rounded-sm bg-black/30 border-amber-800/40 cursor-move transition-all duration-200 hover:bg-black/40 hover:border-amber-700/60 ${
            isDragging ? 'opacity-30 scale-95' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-500/80">
              {depth === 0 ? '📁' : '📂'}
            </span>
            <span className="text-amber-200 text-sm">
              {folder.name}
            </span>
          </div>
        </div>
        
        {deleteMode && (
          <button
            onClick={onDelete}
            className="p-2 bg-red-900/20 border border-red-700/50 rounded-sm text-red-300 hover:bg-red-900/40 hover:border-red-600 transition-all duration-200 shrink-0"
            title="Archiv vernichten"
          >
            🗑️
          </button>
        )}
      </div>
      
      {children && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </div>
  )
}

function DropZone({ onDrop, isRoot = false }: { onDrop: (id: number) => void; isRoot?: boolean }) {
  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    drop: (item: { id: number }) => onDrop(item.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  return (
    <div
      ref={drop as unknown as React.RefCallback<HTMLDivElement>}
      className={`${
        isRoot ? 'mb-6 p-4 text-center' : 'my-2 p-2'
      } border-2 border-dashed rounded-sm transition-all duration-200 ${
        isOver 
          ? 'border-amber-500/80 bg-amber-900/20' 
          : 'border-amber-700/40 bg-amber-900/5'
      }`}
    >
      {isRoot && (
        <div className="text-amber-300/70 font-serif text-sm italic">
          <span className="text-amber-500">↓</span> Ziehe Archive hierher, um sie auf der obersten Ebene zu platzieren <span className="text-amber-500">↓</span>
        </div>
      )}
    </div>
  )
}