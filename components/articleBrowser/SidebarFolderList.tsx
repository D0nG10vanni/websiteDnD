// SidebarFolderList.tsx
'use client'

import { Folder } from '@/lib/types'
import { useState } from 'react'

interface SidebarFolderListProps {
  folders: Folder[]
  selectedFolderId: number | null
  onSelectFolder: (id: number | null) => void
}

export function SidebarFolderList({ folders, selectedFolderId, onSelectFolder }: SidebarFolderListProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const toggle = (id: number) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const folderMap = folders.reduce((acc, f) => {
    acc[f.id] = { ...f, children: [] }
    return acc
  }, {} as Record<number, Folder & { children: Folder[] }>)

  folders.forEach(f => {
    if (f.parent_id && folderMap[f.parent_id]) {
      folderMap[f.parent_id].children.push(f)
    }
  })

  const renderFolder = (f: Folder & { children: Folder[] }, depth = 0) => {
    const isCollapsed = collapsed.has(f.id)
    const isSelected = f.id === selectedFolderId

    return (
      <div key={f.id} className={`ml-${depth * 2} mb-1`}>
        <button
          className={`flex items-center w-full text-left gap-2 px-2 py-1 text-sm font-serif rounded transition-colors hover:bg-amber-900/30 ${
            isSelected ? 'bg-amber-800/40 text-amber-200' : 'text-amber-300/80'
          }`}
          onClick={() => onSelectFolder(f.id)}
        >
          {f.children.length > 0 && (
            <span onClick={(e) => { e.stopPropagation(); toggle(f.id) }}>
              {isCollapsed ? '▶' : '▼'}
            </span>
          )}
          <span className="text-amber-600">◆</span>
          <span>{f.name}</span>
        </button>
        {!isCollapsed && f.children.map(child => renderFolder(folderMap[child.id], depth + 1))}
      </div>
    )
  }

  const rootFolders = folders.filter(f => f.parent_id == null)

  return (
    <aside className="bg-black/30 w-64 p-4 border-r border-amber-900/30 overflow-y-auto">
      <div className="text-amber-200 font-serif text-lg mb-4">📁 Ordner</div>
      {rootFolders.map(f => renderFolder(folderMap[f.id]))}
    </aside>
  )
}
