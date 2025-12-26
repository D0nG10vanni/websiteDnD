'use client'

import { Post } from '@/lib/types'

interface ArticleListProps {
  articles: Post[]
  selectedId?: number
  onSelect: (article: Post) => void
  onDelete: (id: number) => void
}

export function ArticleList({ articles, selectedId, onSelect, onDelete }: ArticleListProps) {
  
  const handleDragStart = (e: React.DragEvent, article: Post) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', article.id.toString())
    // Optional: Custom Ghost Image
  }

  return (
    <div className="divide-y divide-amber-900/20">
      {articles.map(article => (
        <div
          key={article.id}
          draggable
          onDragStart={(e) => handleDragStart(e, article)}
          onClick={() => onSelect(article)}
          className={`
            group relative flex flex-col p-3 cursor-pointer transition-all border-l-2 select-none
            ${selectedId === article.id 
              ? 'bg-amber-900/30 border-amber-500' 
              : 'border-transparent hover:bg-amber-900/10 hover:border-amber-900/50'}
          `}
        >
          <div className="flex justify-between items-start gap-2">
            <div className={`font-serif text-sm font-medium truncate ${selectedId === article.id ? 'text-amber-200' : 'text-amber-300'}`}>
              {article.title}
            </div>
          </div>
          
          <div className="text-[10px] text-amber-500/50 truncate font-sans mt-1 pr-4">
             {article.content.slice(0, 60).replace(/[#*_`\[\]]/g, '')}...
          </div>

          {/* Quick Delete Button (Hover only) */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(article.id); }}
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-amber-800 hover:text-red-500 transition-opacity p-1"
            title="Löschen"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}