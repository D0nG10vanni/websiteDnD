// components/ArticleBrowser/FolderView.tsx
'use client'

import { Post, Folder } from '@/lib/types'
import { ArticleList } from './ArticleList'

interface FolderViewProps {
  folders: Folder[]
  articles: Post[]
  articlesByFolder: Record<number, Post[]>
  uncategorized: Post[]
  collapsedFolders: Set<number>
  selectedId?: number
  deleteMode: boolean
  pendingMoves: Array<{ articleId: number; oldFolderId: number | null; newFolderId: number | null }>
  onToggleFolder: (folderId: number) => void
  onDrop: (e: React.DragEvent, targetFolderId: number | null) => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onSelectArticle: (article: Post) => void
  onDeleteArticle: (id: number) => void
  onDragStart: (e: React.DragEvent, article: Post) => void
  onDragEnd: (e: React.DragEvent) => void
}

export function FolderView({
  folders,
  articles,
  articlesByFolder,
  uncategorized,
  collapsedFolders,
  selectedId,
  deleteMode,
  pendingMoves,
  onToggleFolder,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onSelectArticle,
  onDeleteArticle,
  onDragStart,
  onDragEnd
}: FolderViewProps) {
  const folderMap = folders.reduce((map, folder) => {
    map[folder.id] = { ...folder, children: [] }
    return map
  }, {} as Record<number, Folder & { children: Folder[] }>)

  Object.values(folderMap).forEach((f) => {
    if (f.parent_id != null && folderMap[f.parent_id]) {
      folderMap[f.parent_id].children.push(f)
    }
  })

  const rootFolders = folders.filter((f) => f.parent_id == null)

  const renderSubFolder = (folder: Folder & { children: Folder[] }, depth: number = 0) => {
    const items = articlesByFolder[folder.id] || []
    const isCollapsed = collapsedFolders.has(folder.id)
    const hasContent = items.length > 0 || folder.children.length > 0
    
    if (!hasContent) return null

    return (
      <div key={folder.id} className={`${depth > 0 ? 'ml-4 border-l border-amber-900/30 pl-3' : ''} mb-3`}>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => onToggleFolder(folder.id)}
            className="flex items-center gap-2 font-serif text-sm text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <span className="transform transition-transform text-xs">
              {isCollapsed ? '▶' : '▼'}
            </span>
            <span className="text-amber-600">◆</span>
            <span className="font-medium">{folder.name}</span>
            <span className="text-amber-600/60 text-xs">
              ({items.length})
            </span>
          </button>
        </div>

        {!isCollapsed && (
          <div 
            className="space-y-1 drop-zone rounded-md min-h-[50px] transition-colors"
            onDrop={(e) => onDrop(e, folder.id)}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
          >
            {items.length > 0 && (
              <ArticleList
                articles={items}
                selectedId={selectedId}
                deleteMode={deleteMode}
                pendingMoves={pendingMoves}
                onSelect={onSelectArticle}
                onDelete={onDeleteArticle}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            )}
            
            {folder.children.length > 0 && (
              <div className="mt-3 space-y-2">
                {folder.children.map((child) => renderSubFolder(folderMap[child.id], depth + 1))}
              </div>
            )}
            
            {items.length === 0 && folder.children.length === 0 && (
              <div className="text-center py-4 text-amber-500/30 text-xs italic">
                Ziehe Artikel hierher
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTabContent = (folder: Folder & { children: Folder[] }) => {
    const directItems = articlesByFolder[folder.id] || []
    
    return (
      <div 
        className="bg-black/20 rounded-lg border border-amber-900/30 p-4 min-h-[300px] drop-zone transition-colors"
        onDrop={(e) => onDrop(e, folder.id)}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        <div className="space-y-3">
          {directItems.length > 0 && (
            <div>
              <div className="text-amber-400 text-sm font-serif mb-2 border-b border-amber-900/30 pb-1">
                Artikel in {folder.name}
              </div>
              <ArticleList
                articles={directItems}
                selectedId={selectedId}
                deleteMode={deleteMode}
                pendingMoves={pendingMoves}
                onSelect={onSelectArticle}
                onDelete={onDeleteArticle}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            </div>
          )}
          
          {folder.children.length > 0 && (
            <div>
              {directItems.length > 0 && <div className="border-t border-amber-900/30 pt-3 mt-3"></div>}
              <div className="space-y-3">
                {folder.children.map((child) => renderSubFolder(folderMap[child.id]))}
              </div>
            </div>
          )}
          
          {directItems.length === 0 && folder.children.length === 0 && (
            <div className="text-center py-8 text-amber-200/30 italic font-serif">
              Ziehe Artikel in diesen Bereich
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid auto-cols-fr grid-flow-col">
      {rootFolders.map((folder) => (
        <div key={folder.id} className="border-r border-amber-900/30 last:border-r-0">
          <div className="bg-amber-900/20 border-b border-amber-900/30 p-3 text-center">
            <div className="font-serif text-amber-200 font-medium">
              <span className="text-amber-500">♦</span> {folder.name}
            </div>
            <div className="text-amber-600/60 text-xs mt-1">
              {(articlesByFolder[folder.id]?.length || 0) + 
               folderMap[folder.id]?.children.reduce((acc, child) => 
                 acc + (articlesByFolder[child.id]?.length || 0), 0) || 0} Artikel
            </div>
          </div>
          <div className="p-4">
            {renderTabContent(folderMap[folder.id])}
          </div>
        </div>
      ))}
      
      {(uncategorized.length > 0 || rootFolders.length === 0) && (
        <div className="border-r border-amber-900/30 last:border-r-0">
          <div className="bg-amber-900/20 border-b border-amber-900/30 p-3 text-center">
            <div className="font-serif text-amber-200 font-medium">
              <span className="text-amber-500">♦</span> Unkategorisiert
            </div>
            <div className="text-amber-600/60 text-xs mt-1">
              {uncategorized.length} Artikel
            </div>
          </div>
          <div className="p-4">
            <div 
              className="bg-black/20 rounded-lg border border-amber-900/30 p-4 min-h-[300px] drop-zone transition-colors"
              onDrop={(e) => onDrop(e, null)}
              onDragOver={onDragOver}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
            >
              {uncategorized.length > 0 ? (
                <ArticleList
                  articles={uncategorized}
                  selectedId={selectedId}
                  deleteMode={deleteMode}
                  pendingMoves={pendingMoves}
                  onSelect={onSelectArticle}
                  onDelete={onDeleteArticle}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              ) : (
                <div className="text-center py-8 text-amber-200/30 italic font-serif">
                  Ziehe Artikel hierher um sie zu entkategorisieren
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}