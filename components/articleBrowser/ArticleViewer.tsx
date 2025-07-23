// components/ArticleBrowser/ArticleViewer.tsx
'use client'

import { useEffect, useState } from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { supabase } from '@/lib/supabaseClient'
import type { Post } from '@/lib/types'

interface ArticleViewerProps {
  selected: Post | null
  articles: Post[]
  onSelectArticle: (article: Post) => void
}

export function ArticleViewer({ selected, articles, onSelectArticle }: ArticleViewerProps) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)

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

  if (!selected) return null

  return (
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
              if (match) onSelectArticle(match)
              else alert(`Kein Artikel mit dem Titel „${title}" gefunden.`)
            }}
          />
          <div className="text-center text-xs text-amber-200/40 font-serif italic mt-4">
            Aus dem Kodex, Folio {selected.id}
          </div>
        </>
      ) : null}
    </div>
  )
}