'use client'

import { useState, useEffect, useMemo } from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { supabase } from '@/lib/supabaseClient'
import type { Post, Folder } from '@/lib/types'
import Link from 'next/link'

interface Props {
  articles: Post[]
  gameId: number
  isLoading: boolean
  onDeleteArticle: (id: number) => Promise<boolean>
  onAddArticle: (article: Post) => void
  onUpdateArticle: (article: Post) => void
}

interface PendingMove {
  articleId: number
  oldFolderId: number | null
  newFolderId: number | null
}

export default function ArticleBrowser({ 
  articles, 
  gameId, 
  isLoading: articlesLoading,
  onDeleteArticle,
  onAddArticle,
  onUpdateArticle 
}: Props) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [selected, setSelected] = useState<Post | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [query, setQuery] = useState<string>('')
  const [deleteMode, setDeleteMode] = useState(false)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<number>>(new Set())
  const [pendingMoves, setPendingMoves] = useState<PendingMove[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [draggedArticle, setDraggedArticle] = useState<Post | null>(null)

  useEffect(() => {
    if (!gameId) return
    ;(async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId)
      if (error) console.error('Fehler beim Laden der Ordner:', error)
      else setFolders(data || [])
    })()
  }, [gameId])

  const handleDelete = async (id: number) => {
    const success = await onDeleteArticle(id);
    if (success && selected?.id === id) {
      setSelected(null);
      setContent(null);
    }
  }

  const toggleFolder = (folderId: number) => {
    setCollapsedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const handleDragStart = (e: React.DragEvent, article: Post) => {
    setDraggedArticle(article)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', article.id.toString())
    
    // Visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedArticle(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetFolderId: number | null) => {
    e.preventDefault()
    
    if (!draggedArticle) return
    
    const currentFolderId = draggedArticle.folder_id
    
    // Keine Änderung wenn gleicher Ordner
    if (currentFolderId === targetFolderId) return
    
    // Prüfen ob bereits eine ausstehende Änderung für diesen Artikel existiert
    const existingMoveIndex = pendingMoves.findIndex(move => move.articleId === draggedArticle.id)
    
    if (existingMoveIndex >= 0) {
      // Bestehende Änderung aktualisieren
      setPendingMoves(prev => {
        const newMoves = [...prev]
        newMoves[existingMoveIndex].newFolderId = targetFolderId
        return newMoves
      })
    } else {
      // Neue ausstehende Änderung hinzufügen
      setPendingMoves(prev => [...prev, {
        articleId: draggedArticle.id,
        oldFolderId: currentFolderId,
        newFolderId: targetFolderId
      }])
    }

    // Visual feedback entfernen
    const dropZones = document.querySelectorAll('.drop-zone')
    dropZones.forEach(zone => zone.classList.remove('drop-active'))
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('drop-active')
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement && !e.currentTarget.contains(e.relatedTarget as Node)) {
      e.currentTarget.classList.remove('drop-active')
    }
  }

  const savePendingChanges = async () => {
    if (pendingMoves.length === 0) return
    
    setIsSaving(true)
    try {
      // Alle Änderungen an Supabase senden
      for (const move of pendingMoves) {
        const { error } = await supabase
          .from('posts')
          .update({ folder_id: move.newFolderId })
          .eq('id', move.articleId)
        
        if (error) {
          console.error('Fehler beim Verschieben des Artikels:', error)
          throw error
        }
      }
      
      // Lokale Artikel-Liste aktualisieren
      pendingMoves.forEach(move => {
        const article = articles.find(a => a.id === move.articleId)
        if (article) {
          article.folder_id = move.newFolderId ?? 0
          onUpdateArticle(article)
        }
      })
      
      // Ausstehende Änderungen zurücksetzen
      setPendingMoves([])
      
    } catch (error) {
      console.error('Fehler beim Speichern der Änderungen:', error)
      alert('Fehler beim Speichern der Änderungen. Bitte versuche es erneut.')
    } finally {
      setIsSaving(false)
    }
  }

  const discardPendingChanges = () => {
    setPendingMoves([])
  }

  const getEffectiveFolderId = (article: Post): number | null => {
    const pendingMove = pendingMoves.find(move => move.articleId === article.id)
    return pendingMove ? pendingMove.newFolderId : article.folder_id
  }

  const filtered = useMemo(
    () =>
      (articles ?? []).filter((a) =>
        [a.title, a.content]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [articles, query]
  )

  useEffect(() => {
    if (!selected) return
    setContent(null)
    setIsLoadingContent(true)
    ;(async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('content')
        .eq('id', selected.id)
        .single()
      if (error) {
        console.error(error)
        setContent('*Die Zeichen verblassen vor deinen Augen…*')
      } else {
        setContent(data.content)
      }
      setIsLoadingContent(false)
    })()
  }, [selected])

  // Reset selected article if it was deleted
  useEffect(() => {
    if (selected && !articles.find(a => a.id === selected.id)) {
      setSelected(null);
      setContent(null);
    }
  }, [articles, selected]);

  const folderMap = useMemo(() => {
    const map: Record<number, Folder & { children: Folder[] }> = {}
    folders.forEach((f) => {
      map[f.id] = { ...f, children: [] }
    })
    Object.values(map).forEach((f) => {
      if (f.parent_id != null && map[f.parent_id]) {
        map[f.parent_id].children.push(f)
      }
    })
    return map
  }, [folders])

  const rootFolders = useMemo(() => folders.filter((f) => f.parent_id == null), [folders])

  const articlesByFolder = useMemo(() => {
    const m: Record<number, Post[]> = {}
    filtered.forEach((a) => {
      const effectiveFolderId = getEffectiveFolderId(a)
      const id = effectiveFolderId ? Number(effectiveFolderId) : 0
      if (!isNaN(id)) {
        m[id] = m[id] || []
        m[id].push(a)
      }
    })
    return m
  }, [filtered, pendingMoves])

  const uncategorized = filtered.filter((a) => !getEffectiveFolderId(a))

  const renderArticleItem = (article: Post) => {
    const isPending = pendingMoves.some(move => move.articleId === article.id)
    
    return (
      <div 
        key={article.id} 
        className={`group flex items-center gap-2 py-2 px-3 rounded transition-all border-b border-amber-900/20 cursor-move select-none ${
          isPending ? 'bg-amber-900/30 border-amber-600/50' : 'hover:bg-amber-900/20'
        }`}
        draggable={!deleteMode}
        onDragStart={(e) => handleDragStart(e, article)}
        onDragEnd={handleDragEnd}
      >
        <div className="text-amber-500/50 text-xs mr-1">⋮⋮</div>
        <div className="truncate flex-1 min-w-0">
          <button
            onClick={() => setSelected(article)}
            className={`w-full text-left truncate font-serif text-sm transition-colors ${
              selected?.id === article.id 
                ? 'text-amber-200 font-medium' 
                : 'text-amber-300/70 hover:text-amber-200'
            } ${isPending ? 'text-amber-100' : ''}`}
            title={article.title}
          >
            <span className="text-amber-500/70 mr-2">✧</span>
            {article.title}
            {isPending && <span className="text-amber-400 ml-2 text-xs">●</span>}
          </button>
        </div>
        {deleteMode && (
          <button
            onClick={() => handleDelete(article.id)}
            className="opacity-0 group-hover:opacity-100 px-2 py-1 text-red-400 hover:text-red-300 transition-all"
            title="Artikel löschen"
          >
            ×
          </button>
        )}
      </div>
    )
  }

  const renderSubFolder = (folder: Folder & { children: Folder[] }, depth: number = 0) => {
    const items = articlesByFolder[folder.id] || []
    const isCollapsed = collapsedFolders.has(folder.id)
    const hasContent = items.length > 0 || folder.children.length > 0
    
    if (!hasContent) return null

    return (
      <div key={folder.id} className={`${depth > 0 ? 'ml-4 border-l border-amber-900/30 pl-3' : ''} mb-3`}>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => toggleFolder(folder.id)}
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
            onDrop={(e) => handleDrop(e, folder.id)}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            {items.length > 0 && (
              <div className="space-y-1">
                {items.slice(0, 15).map((article) => renderArticleItem(article))}
                {items.length > 15 && (
                  <div className="text-amber-500/60 text-xs italic px-3 py-2">
                    ... und {items.length - 15} weitere Artikel
                  </div>
                )}
              </div>
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
        onDrop={(e) => handleDrop(e, folder.id)}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-3">
          {/* Direkte Artikel in diesem Ordner */}
          {directItems.length > 0 && (
            <div>
              <div className="text-amber-400 text-sm font-serif mb-2 border-b border-amber-900/30 pb-1">
                Artikel in {folder.name}
              </div>
              <div className="space-y-1">
                {directItems.slice(0, 10).map((article) => renderArticleItem(article))}
                {directItems.length > 10 && (
                  <div className="text-amber-500/60 text-xs italic px-3 py-2">
                    ... und {directItems.length - 10} weitere Artikel
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Unterordner */}
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
    <div className="space-y-6">
      {/* Header mit Suche und Kontrollen */}
      <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-5">
        <h2 className="font-serif text-center text-xl text-amber-200 mb-4">
          <span className="text-amber-500">❖</span> ENCYCLOPAEDIA <span className="text-amber-500">❖</span>
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <input
            type="text"
            placeholder="Durchsuche die alten Texte…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 placeholder-amber-200/30 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50"
          />

          <div className="flex items-center gap-4">
            {/* Speicher-Kontrollen */}
            {pendingMoves.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-900/20 border border-amber-600/50 rounded-sm">
                <span className="text-amber-200 text-xs font-serif">
                  {pendingMoves.length} Änderung{pendingMoves.length !== 1 ? 'en' : ''}
                </span>
                <button
                  onClick={savePendingChanges}
                  disabled={isSaving}
                  className="px-2 py-1 bg-green-700 hover:bg-green-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                >
                  {isSaving ? '...' : '✓ Speichern'}
                </button>
                <button
                  onClick={discardPendingChanges}
                  className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white text-xs rounded transition-colors"
                >
                  ✕ Verwerfen
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <Link
                href={`/games/${gameId}/ArticleView/NeuerArtikel`}
                className="px-3 py-2 border border-amber-900/40 rounded-sm font-serif text-xs text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30 transition-colors"
              >
                ✎ Neuer Artikel
              </Link>
              <Link
                href={`/games/${gameId}/ArticleView/Ordnerstruktur`}
                className="px-3 py-2 border border-amber-900/40 rounded-sm font-serif text-xs text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30 transition-colors"
              >
                📁 Ordner
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-amber-200/50 font-serif text-xs">Löschmodus:</span>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={deleteMode}
                  onChange={(e) => setDeleteMode(e.target.checked)}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${
                  deleteMode ? 'bg-red-600' : 'bg-amber-900/50'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${
                    deleteMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
                <span className="ml-2 text-xs">🗑️</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Tab-Navigation und Inhalt */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 overflow-hidden">
        {articlesLoading ? (
          <div className="text-center py-12 text-amber-200/50 italic font-serif">
            Die alten Schriften werden aus den Archiven geholt…
          </div>
        ) : (
          <>
            {/* Tabs als horizontale Spalten */}
            <div className="grid auto-cols-fr grid-flow-col">
              {/* Root-Ordner als Tabs */}
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
              
              {/* Unkategorisierte Artikel */}
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
                      onDrop={(e) => handleDrop(e, null)}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                    >
                      <div className="space-y-1">
                        {uncategorized.slice(0, 15).map((article) => renderArticleItem(article))}
                        {uncategorized.length > 15 && (
                          <div className="text-amber-500/60 text-xs italic px-3 py-2">
                            ... und {uncategorized.length - 15} weitere Artikel
                          </div>
                        )}
                        {uncategorized.length === 0 && (
                          <div className="text-center py-8 text-amber-200/30 italic font-serif">
                            Ziehe Artikel hierher um sie zu entkategorisieren
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Ausgewählter Artikel */}
      {selected && (
        <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 shadow-[0_0_20px_rgba(0,0,0,0.5)] p-8">
          {isLoadingContent ? (
            <div className="text-center py-16 text-amber-200/50 italic font-serif">
              Die mystischen Runen enthüllen sich langsam…
            </div>
          ) : content ? (
            <>
              <h2 className="font-serif text-2xl text-center mb-6 text-amber-200 tracking-wider">
                <span className="text-amber-500 mr-3">❖</span>
                {selected.title}
                <span className="text-amber-500 ml-3">❖</span>
              </h2>
              <MarkdownRenderer
                content={content}
                onLinkClick={(title) => {
                  const match = articles.find((a) => a.title === title)
                  if (match) setSelected(match)
                  else alert(`Kein Artikel mit dem Titel „${title}" gefunden.`)
                }}
              />
              <div className="text-center text-xs text-amber-200/40 font-serif italic mt-4">
                Aus dem Kodex, Folio {selected.id}
              </div>
            </>
          ) : null}
        </div>
      )}

      <style jsx>{`
        .drop-zone.drop-active {
          background-color: rgba(251, 191, 36, 0.1);
          border-color: rgba(251, 191, 36, 0.3);
        }
      `}</style>
    </div>
  )
}