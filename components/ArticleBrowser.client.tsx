// components/ArticleBrowser.client.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Post, Folder } from '@/lib/types'
import Link from 'next/link'
import { ArticleViewer } from './articleBrowser/ArticleViewer'
import { FolderView } from './articleBrowser/FolderView'
import { SidebarFolderList } from './articleBrowser/SidebarFolderList'

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
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Post | null>(null)
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
    
    if (currentFolderId === targetFolderId) return
    
    const existingMoveIndex = pendingMoves.findIndex(move => move.articleId === draggedArticle.id)
    
    if (existingMoveIndex >= 0) {
      setPendingMoves(prev => {
        const newMoves = [...prev]
        newMoves[existingMoveIndex].newFolderId = targetFolderId
        return newMoves
      })
    } else {
      setPendingMoves(prev => [...prev, {
        articleId: draggedArticle.id,
        oldFolderId: currentFolderId,
        newFolderId: targetFolderId
      }])
    }

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
      
      pendingMoves.forEach(move => {
        const article = articles.find(a => a.id === move.articleId)
        if (article) {
          article.folder_id = move.newFolderId ?? 0
          onUpdateArticle(article)
        }
      })
      
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
    if (selected && !articles.find(a => a.id === selected.id)) {
      setSelected(null);
    }
  }, [articles, selected]);

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
                href={`/games/${gameId}/ArticleView/WriteArticle`}
                className="px-3 py-2 border border-amber-900/40 rounded-sm font-serif text-xs text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30 transition-colors"
              >
              ✎ Neuer Artikel
              </Link>
              <Link
              href={`/games/${gameId}/ArticleView/NeuerArtikel`}
              className="px-3 py-2 border border-amber-900/40 rounded-sm font-serif text-xs text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30 transition-colors"
              >
              ⬆ Artikel hochladen
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
      <div className="flex gap-4">
        {/* Sidebar-Folderliste */}
        <div className="w-64 shrink-0">
          <SidebarFolderList
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
        </div>

        {/* FolderView bleibt rechts davon */}
        <div className="flex-1">
          <FolderView
            folders={folders}
            articles={articles}
            articlesByFolder={articlesByFolder}
            uncategorized={uncategorized}
            collapsedFolders={collapsedFolders}
            selectedId={selected?.id}
            deleteMode={deleteMode}
            pendingMoves={pendingMoves}
            onToggleFolder={toggleFolder}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onSelectArticle={setSelected}
            onDeleteArticle={handleDelete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      </div>

      {/* Ausgewählter Artikel */}
      <ArticleViewer
        selected={selected}
        articles={articles}
        onSelectArticle={setSelected}
      />

      <style jsx>{`
        .drop-zone.drop-active {
          background-color: rgba(251, 191, 36, 0.1);
          border-color: rgba(251, 191, 36, 0.3);
        }
      `}</style>
    </div>
  )
}