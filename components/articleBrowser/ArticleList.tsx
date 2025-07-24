// components/ArticleBrowser/ArticleList.tsx
'use client'

import { Post } from '@/lib/types'
import { useState, useMemo } from 'react'

interface ArticleListProps {
  articles: Post[]
  selectedId?: number
  deleteMode: boolean
  pendingMoves: Array<{ articleId: number; oldFolderId: number | null; newFolderId: number | null }>
  onSelect: (article: Post) => void
  onDelete: (id: number) => void
  onDragStart: (e: React.DragEvent, article: Post) => void
  onDragEnd: (e: React.DragEvent) => void
}

export function ArticleList({
  articles,
  selectedId,
  deleteMode,
  pendingMoves,
  onSelect,
  onDelete,
  onDragStart,
  onDragEnd
}: ArticleListProps) {
  const grouped = useMemo(() => {
    const m: Record<string, Post[]> = {}
    articles.forEach((a) => {
      const key = a.title[0]?.toUpperCase() || '?'
      m[key] = m[key] || []
      m[key].push(a)
    })
    return m
  }, [articles])

  const renderArticleItem = (article: Post) => {
    const isPending = pendingMoves.some(move => move.articleId === article.id)

    return (
      <div 
        key={article.id} 
        className={`group flex items-center gap-2 py-2 px-3 rounded transition-all border-b border-amber-900/20 cursor-move select-none ${
          isPending ? 'bg-amber-900/30 border-amber-600/50' : 'hover:bg-amber-900/20'
        }`}
        draggable={!deleteMode}
        onDragStart={(e) => onDragStart(e, article)}
        onDragEnd={onDragEnd}
      >
        <div className="text-amber-500/50 text-xs mr-1">⋮⋮</div>
        <div className="truncate flex-1 min-w-0">
          <button
            onClick={() => onSelect(article)}
            className={`w-full text-left truncate font-serif text-sm transition-colors ${
              selectedId === article.id 
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
            onClick={() => onDelete(article.id)}
            className="opacity-0 group-hover:opacity-100 px-2 py-1 text-red-400 hover:text-red-300 transition-all"
            title="Artikel löschen"
          >
            ×
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {Object.entries(grouped).sort().map(([letter, group]) => (
        <div key={letter}>
          <div className="text-amber-500/70 text-xs uppercase font-serif mb-1 pl-1">
            {letter}
          </div>
          <div className="space-y-1">
            {group.slice(0, 15).map(renderArticleItem)}
            {group.length > 15 && (
              <div className="text-amber-500/60 text-xs italic px-3 py-2">
                ... und {group.length - 15} weitere Artikel
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}