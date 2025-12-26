// components/articleBrowser/FolderTree.tsx
'use client'

import { useState } from 'react'
import { Folder } from '@/lib/types'

// 1. Rekursiver Typ für den Baum
type FolderNode = Folder & { children: FolderNode[] }

interface FolderTreeProps {
  folders: Folder[]
  selectedFolderId: number | null
  onSelect: (id: number) => void
  onDropArticle: (articleId: number, folderId: number) => void
}

export function FolderTree({ folders, selectedFolderId, onSelect, onDropArticle }: FolderTreeProps) {
  // 2. Map mit dem korrekten rekursiven Typ initialisieren
  const folderMap = folders.reduce((acc, f) => {
    // @ts-ignore - wir initialisieren children leer, das passt runtime-technisch
    acc[f.id] = { ...f, children: [] }
    return acc
  }, {} as Record<number, FolderNode>)

  // 3. Baum aufbauen: Wichtig ist, dass wir die Referenzen aus der Map nutzen
  folders.forEach(f => {
    if (f.parent_id && folderMap[f.parent_id]) {
      // WICHTIG: Wir pushen folderMap[f.id] (den Node), nicht f (das rohe Objekt)
      folderMap[f.parent_id].children.push(folderMap[f.id])
    }
  })

  // Nur Root-Ordner rendern (die keinen Parent haben)
  const rootFolders = folders
    .filter(f => f.parent_id == null)
    .map(f => folderMap[f.id]) // Auch hier: Die Nodes aus der Map nehmen

  return (
    <div className="space-y-0.5 select-none">
      {rootFolders.map(f => (
        <FolderItem 
          key={f.id} 
          folder={f} 
          selectedId={selectedFolderId}
          onSelect={onSelect}
          onDropArticle={onDropArticle}
        />
      ))}
    </div>
  )
}

// 4. Props Interface angepasst auf FolderNode
function FolderItem({ 
  folder, 
  selectedId, 
  onSelect,
  onDropArticle
}: { 
  folder: FolderNode, 
  selectedId: number | null,
  onSelect: (id: number) => void,
  onDropArticle: (aid: number, fid: number) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const isSelected = selectedId === folder.id

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const articleId = e.dataTransfer.getData('text/plain')
    if (articleId) {
      onDropArticle(parseInt(articleId), folder.id)
    }
  }

  return (
    <div className="pl-2">
      <div 
        className={`
          group flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all
          ${isSelected ? 'bg-amber-900/60 text-amber-100' : 'text-amber-400 hover:bg-amber-900/20 hover:text-amber-200'}
          ${isDragOver ? 'ring-1 ring-amber-500 bg-amber-900/40' : ''}
        `}
        onClick={() => onSelect(folder.id)}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
          className={`w-4 h-4 flex items-center justify-center rounded hover:bg-amber-500/20 mr-1 ${folder.children.length === 0 ? 'invisible' : ''}`}
        >
          <span className="text-[10px] transform transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▶
          </span>
        </button>
        
        <span className="text-amber-600/80 text-xs">📁</span>
        <span className="font-serif text-sm truncate flex-1 pt-0.5">{folder.name}</span>
      </div>

      {isOpen && folder.children.length > 0 && (
        <div className="border-l border-amber-900/20 ml-3">
          {folder.children.map(child => (
            <FolderItem 
              key={child.id} 
              folder={child} // Hier gab es den Fehler: child ist jetzt korrekt ein FolderNode
              selectedId={selectedId} 
              onSelect={onSelect}
              onDropArticle={onDropArticle}
            />
          ))}
        </div>
      )}
    </div>
  )
}