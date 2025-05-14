// components/ArticleBrowser.client.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import { supabase } from '@/lib/supabaseClient'
import type { Article } from '@/lib/articles'
import Link from 'next/link'

export default function ArticleBrowser({ articles }: { articles: Article[] }) {
  const [selected, setSelected] = useState<Article | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery]         = useState<string>('') // ermöglicht die Suche

  // Filter vor dem Gruppieren
  const filtered = useMemo(() => 
    articles.filter(a =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.content.toLowerCase().includes(query.toLowerCase())
    )
  , [articles, query])

  useEffect(() => {
    if (!selected) return
    setContent(null)
    setIsLoading(true)
    
    ;(async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('content')
        .eq('id', selected.id)
        .single()

      if (error) {
        console.error('Fehler beim Laden des Zaubers:', error)
        setContent('*Das Pergament scheint beschädigt zu sein...*')
      } else {
        setContent(data.content)
      }
      setIsLoading(false)
    })()
  }, [selected])

  // Gruppieren nach Überkategorie
  const byCategory = filtered.reduce<Record<string, Article[]>>((acc, art) => {
  ;(acc[art.category] ||= []).push(art)
  return acc
  }, {})

    return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="w-full lg:w-1/3 card bg-base-200 shadow-lg border border-primary/10">
        <div className="card-body p-4">
          <h2 className="card-title font-serif text-center text-xl mb-4">
            <span className="text-primary">✧</span> Inhaltsverzeichnis <span className="text-primary">✧</span>
          </h2>

          {/* Such-Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Suche Titel & Text…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          <div className="overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-primary scrollbar-track-base-300">
            {Object.entries(byCategory).map(([cat, list]) => {
              // Extrahiere eindeutige Unterkategorien aus der Artikelliste
              const subs = Array.from(new Set(list.map(a => a.subcategory).filter(Boolean)));

              return (
                <div key={cat} className="mb-6">
                  <h3 className="font-serif text-lg text-primary mb-2 border-b border-primary/20 pb-1">
                    {cat}
                  </h3>

                    {/* Falls keine Unterkategorien, zeige alle Artikel */}
                    {subs.length === 0 ? (
                      <ul className="menu menu-compact">
                        {list.map(a => (
                          <li key={a.id}>
                            <button 
                              onClick={() => setSelected(a)}
                              className={`font-serif text-sm ${selected?.id === a.id ? 'bg-primary/20 text-primary' : ''}`}
                            >
                              <span className="text-primary">✦</span> {a.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      // Mit Unterkategorien
                      subs.map(sub => (
                        <div key={sub} className="mb-3 ml-2">
                          <div className="font-serif text-sm mb-1 text-primary/80">
                            <span className="text-primary/70">✧</span> {sub}
                          </div>
                          <ul className="menu menu-compact">
                            {list
                              .filter(a => a.subcategory === sub)
                              .map(a => (
                                <li key={a.id}>
                                  <button
                                    onClick={() => setSelected(a)}
                                    className={`font-serif text-xs ml-2 ${selected?.id === a.id ? 'bg-primary/20 text-primary' : ''}`}
                                  >
                                    <span className="text-primary/60">❧</span> {a.title}
                                  </button>
                                </li>
                              ))}
                          </ul>
                        </div>
                      ))
                    )}
                </div>
              )
            })}

            {filtered.length === 0 && (
              <p className="text-center italic text-sm opacity-50">
                Keine Artikel gefunden.
              </p>
            )}
          </div>

          <div className="divider divider-vertical my-3">✧</div>

          <Link href="/" className="btn btn-ghost btn-sm mx-auto font-serif text-xs border border-base-300">
            Zurück zur Startseite
          </Link>
        </div>
      </aside>

      {/* Content-Bereich */}
      <section className="w-full lg:w-2/3 card bg-base-100 shadow-xl border border-primary/20">
        <div className="card-body">
          {!selected && (
            <div className="text-center py-12">
              <div className="text-5xl opacity-20 mb-4">✦</div>
              <p className="font-serif text-base-content/60">
                Wähle eine Seite aus der Encyclopaedia aus, um sie zu lesen.
              </p>
            </div>
          )}
          
          {selected && isLoading && (
            <div className="text-center py-12">
              <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
              <p className="font-serif text-base-content/60">
                Das alte Pergament wird entziffert...
              </p>
            </div>
          )}
          
          {selected && content && !isLoading && (
            <>
              <h2 className="card-title font-serif text-2xl text-center mx-auto mb-4">
                <span className="text-primary mr-2">✦</span>
                {selected.title}
                <span className="text-primary ml-2">✦</span>
              </h2>
              
              <div className="divider">✧</div>
              
              <article className="prose prose-sm md:prose-base lg:prose-lg prose-headings:font-serif prose-headings:text-primary max-w-none">
                <div className="font-serif">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </article>
              <div className="divider mt-4">✧</div>
              <div className="text-center text-xs opacity-60 font-serif">
                Aus den alten Schriften, Seite {selected.id}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}