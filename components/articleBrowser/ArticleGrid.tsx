'use client'


import { Folder, Post } from '@/lib/types'
import { useState, useMemo } from 'react'

interface ArticleGridProps {
  articles: Post[]
  onSelect: (article: Post) => void
  sortBy: 'alpha' | 'newest' | 'oldest'
}

export function ArticleGrid({ articles, onSelect, sortBy }: ArticleGridProps) {
  const sorted = useMemo(() => {
    const a = [...articles]
    if (sortBy === 'alpha') a.sort((a, b) => a.title.localeCompare(b.title))
    if (sortBy === 'newest') a.sort((a, b) => b.id - a.id)
    if (sortBy === 'oldest') a.sort((a, b) => a.id - b.id)
    return a
  }, [articles, sortBy])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {sorted.map(article => (
        <div
          key={article.id}
          onClick={() => onSelect(article)}
          className="bg-black/40 border border-amber-900/30 rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer"
        >
          <div className="font-serif text-amber-300 text-sm mb-2 truncate">
            ✧ {article.title}
          </div>
          <div className="text-xs text-amber-500 line-clamp-3">
            {article.content.slice(0, 150)}
          </div>
        </div>
      ))}
    </div>
  )
}