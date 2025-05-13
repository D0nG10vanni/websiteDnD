'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import { supabase } from '../lib/supabaseClient'

type ArticleMeta = { id: number; title: string; folder: string }

export default function ArticleBrowser({ articles }: { articles: ArticleMeta[] }) {
  const [selected, setSelected] = useState<ArticleMeta | null>(null)
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    if (!selected) return
    setContent(null)
    ;(async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('content')
        .eq('id', selected.id)
        .single()

      if (error) {
        console.error('Fehler beim Laden des Artikels:', error)
        setContent('Fehler beim Laden des Artikels.')
      } else {
        setContent(data.content)
      }
    })()
  }, [selected])

  // Gruppierung nach Ordner/Kategorie
  const byFolder = articles.reduce<Record<string, ArticleMeta[]>>((acc, art) => {
    (acc[art.folder] ||= []).push(art)
    return acc
  }, {})

  return (
    <div className="flex min-h-[80vh]">
      {/* Sidebar */}
      <aside className="w-1/3 bg-gray-800 p-6 rounded-lg overflow-auto">
        {Object.entries(byFolder).map(([folder, list]) => (
          <div key={folder} className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">{folder}</h3>
            <ul>
              {list.map((art) => (
                <li key={art.id}>
                  <button
                    onClick={() => setSelected(art)}
                    className="text-blue-400 hover:text-blue-500 underline"
                  >
                    {art.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      {/* Content */}
      <section className="w-2/3 ml-6">
        {!selected && <p className="text-gray-500">Bitte wähle einen Artikel aus.</p>}
        {selected && content === null && <p className="text-gray-400">Lade Artikel…</p>}
        {content && (
          <div className="bg-gray-900 p-8 rounded-2xl shadow-xl overflow-auto max-h-[80vh]">
            <article className="prose prose-lg prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                {content}
              </ReactMarkdown>
            </article>
          </div>
        )}
      </section>
    </div>
  )
}
