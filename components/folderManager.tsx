// components/FolderManager.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
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

function DraggableFolder({
  folder,
  depth,
  children,
  deleteMode,
  onDrop,
  onDropToRoot,
  onDelete,
  onRename,
}: {
  folder: Folder
  depth: number
  children?: React.ReactNode
  deleteMode: boolean
  onDrop: (draggedId: number) => void
  onDropToRoot: (draggedId: number) => void
  onDelete: () => void
  onRename: (newName: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(folder.name)
  const [isHovered, setIsHovered] = useState(false)



  const [{ isOverDrop }, drop] = useDrop({
    accept: ItemType,
    drop: (item: { id: number }) => {
      if (item.id !== folder.id) {
        onDrop(item.id)
      }
    },
    collect: (monitor) => ({
      isOverDrop: monitor.isOver(),
    }),
  })

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: folder.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditName(folder.name)
  }

  const handleEditSave = () => {
    if (editName.trim() && editName.trim() !== folder.name) {
      onRename(editName.trim())
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditName(folder.name)
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  // Combine drag and drop refs
  const combinedRef = (node: HTMLDivElement | null) => {
    ref.current = node
    drag(drop(node))
  }

  return (
    <div
      ref={combinedRef}
      style={{
        opacity: isDragging ? 0.6 : 1,
        marginLeft: depth * 32,
        transform: isDragging ? 'rotate(2deg)' : 'none',
        transition: 'all 0.2s ease'
      }}
      className={`group flex items-center justify-between p-3 my-2 rounded-lg border-2 transition-all duration-300 cursor-move ${
        isOverDrop 
          ? 'border-success bg-success/20 shadow-lg transform scale-[1.02]' 
          : isHovered 
          ? 'border-primary bg-primary/10 shadow-lg transform scale-[1.02]' 
          : 'border-base-300 bg-base-100 hover:border-primary/50 hover:shadow-md'
      } ${isDragging ? 'shadow-2xl border-primary' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        </div>
        
        {isEditing ? (
          <input
            type="text"
            value={editName}
            autoFocus
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={handleKeyPress}
            className="input input-bordered input-primary input-sm flex-1 bg-base-200"
            placeholder="Ordnername eingeben..."
          />
        ) : (
          <span
            className="font-semibold text-base-content text-lg cursor-pointer hover:text-primary transition-colors"
            onDoubleClick={handleEditStart}
            title="Doppelklick zum Umbenennen"
          >
            {folder.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!deleteMode && !isEditing && (
          <button
            onClick={handleEditStart}
            className="btn btn-ghost btn-sm btn-circle tooltip tooltip-left"
            data-tip="Umbenennen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        
        {deleteMode && (
          <button
            onClick={onDelete}
            className="btn btn-error btn-sm btn-circle tooltip tooltip-left"
            data-tip="Löschen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      
      {children && <div className="w-full">{children}</div>}
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
        isRoot ? 'mb-8 p-8' : 'my-3 p-4'
      } border-2 border-dashed rounded-xl transition-all duration-300 ${
        isOver 
          ? 'border-primary bg-primary/20 shadow-inner scale-[1.02]' 
          : 'border-base-300 bg-base-200/50 hover:border-primary/50'
      }`}
    >
      {isRoot && (
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📁</div>
          <div className="text-base-content/70 font-medium">
            <span className="text-primary text-xl">↓</span> 
            <span className="mx-2">Ziehe Ordner hierher für die oberste Ebene</span> 
            <span className="text-primary text-xl">↓</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FolderManager({ gameId }: { gameId: number }) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [newName, setNewName] = useState('')
  const [changes, setChanges] = useState<Record<number, number | null>>({})
  const [userUuid, setUserUuid] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserAndFolders = async () => {
      setIsLoading(true)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      
      if (userError || !user) {
        alert('Fehler beim Abrufen des Benutzers.')
        setIsLoading(false)
        return
      }

      setUserUuid(user.id)

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId)
        
      if (!error) setFolders(data || [])
      setIsLoading(false)
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

    const getDescendants = (parentId: number): number[] => {
      const children = folders.filter(f => f.parent_id === parentId)
      const descendants = [parentId]
      children.forEach(child => {
        descendants.push(...getDescendants(child.id))
      })
      return descendants
    }

    const toDelete = getDescendants(folderId)

    const { error } = await supabase
      .from('folders')
      .delete()
      .in('id', toDelete)

    if (!error) {
      setFolders(prev => prev.filter(f => !toDelete.includes(f.id)))
      setChanges(prev => {
        const newChanges = { ...prev }
        toDelete.forEach(id => delete newChanges[id])
        return newChanges
      })
    } else {
      alert('Fehler beim Löschen: ' + error.message)
    }
  }

  const handleRenameFolder = async (folderId: number, newName: string) => {
    if (!newName.trim()) return

    const { error } = await supabase
      .from('folders')
      .update({ name: newName.trim() })
      .eq('id', folderId)

    if (!error) {
      setFolders(prev => 
        prev.map(f => f.id === folderId ? { ...f, name: newName.trim() } : f)
      )
    } else {
      alert('Fehler beim Umbenennen: ' + error.message)
    }
  }

  const updateParentLocally = (draggedId: number, newParentId: number | null) => {
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
      // Success toast would be better than alert
      const toast = document.createElement('div')
      toast.className = 'toast toast-top toast-end'
      toast.innerHTML = '<div class="alert alert-success"><span>Struktur erfolgreich gespeichert!</span></div>'
      document.body.appendChild(toast)
      setTimeout(() => document.body.removeChild(toast), 3000)
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
        onRename={(newName) => handleRenameFolder(folder.id, newName)}
      >
        {renderFolders(folder.id, depth + 1)}
      </DraggableFolder>
    ))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/70">Lade Ordnerstruktur...</p>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-base-content mb-2">📂 Ordner-Manager</h1>
          <p className="text-base-content/70">Verwalte deine Spielordner mit Drag & Drop</p>
        </div>

        {/* Control Panel */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-64">
                <label className="label">
                  <span className="label-text font-medium">Neuen Ordner erstellen</span>
                </label>
                <div className="join w-full">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ordnername eingeben..."
                    className="input input-bordered join-item flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="btn btn-primary join-item"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Erstellen
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteMode(!deleteMode)}
                  className={`btn ${deleteMode ? 'btn-error' : 'btn-ghost'} tooltip`}
                  data-tip={deleteMode ? 'Löschmodus deaktivieren' : 'Löschmodus aktivieren'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleteMode ? 'Löschmodus AN' : 'Löschmodus'}
                </button>

                <button
                  onClick={confirmChanges}
                  disabled={Object.keys(changes).length === 0}
                  className={`btn tooltip ${
                    Object.keys(changes).length === 0 
                      ? 'btn-disabled' 
                      : 'btn-success'
                  }`}
                  data-tip="Änderungen in der Datenbank speichern"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Speichern {Object.keys(changes).length > 0 && `(${Object.keys(changes).length})`}
                </button>
              </div>
            </div>

            {Object.keys(changes).length > 0 && (
              <div className="alert alert-info mt-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Du hast {Object.keys(changes).length} ungespeicherte Änderung(en). Vergiss nicht zu speichern!</span>
              </div>
            )}
          </div>
        </div>

        {/* Folder Structure */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              Deine Ordner
            </h2>

            <DropZone onDrop={(draggedId) => updateParentLocally(draggedId, null)} isRoot />
            
            <div className="space-y-2">
              {folders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-base-content/50 text-lg">Noch keine Ordner vorhanden</p>
                  <p className="text-base-content/40">Erstelle deinen ersten Ordner oben!</p>
                </div>
              ) : (
                renderFolders(null)
              )}
            </div>
          </div>
        </div>

        {/* Help Card */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-lg">💡 Tipps zur Bedienung</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🖱️ Drag & Drop</h4>
                <p className="text-base-content/70">Ziehe Ordner per Drag & Drop, um sie zu verschieben oder zu verschachteln.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">✏️ Umbenennen</h4>
                <p className="text-base-content/70">Doppelklick auf einen Ordnernamen oder nutze den Bearbeiten-Button.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🗑️ Löschen</h4>
                <p className="text-base-content/70">Aktiviere den Löschmodus, um Ordner zu entfernen.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">💾 Speichern</h4>
                <p className="text-base-content/70">Änderungen werden erst nach dem Klick auf "Speichern" dauerhaft übernommen.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}