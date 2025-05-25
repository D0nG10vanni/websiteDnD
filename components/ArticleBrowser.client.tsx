'use client'

import { useState, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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

  const filtered = useMemo(
    () =>
      articles.filter((a) =>
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
      const id = a.folder_id ? Number(a.folder_id) : 0
      if (!isNaN(id)) {
        m[id] = m[id] || []
        m[id].push(a)
      }
    })
    return m
  }, [filtered])

  const uncategorized = filtered.filter((a) => !a.folder_id)

  const renderFolder = (f: Folder & { children: Folder[] }) => {
    const items = articlesByFolder[f.id] || []

    return (
      <div key={f.id} className="mb-6">
        <h3 className="font-serif text-lg text-amber-500 mb-2 border-b border-amber-900/30 pb-1">
          <span className="text-amber-700">♦</span> {f.name}
        </h3>
        <ul className="space-y-2 ml-4">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-2">
              <div className="truncate flex-1 min-w-0">
                <button
                  onClick={() => setSelected(a)}
                  className={`w-full text-left truncate font-serif text-sm py-1 hover:text-amber-200 ${
                    selected?.id === a.id ? 'text-amber-200' : 'text-amber-300/70'
                  }`}
                >
                  <span className="text-amber-500/70 mr-1">✦</span> {a.title}
                </button>
              </div>
              {deleteMode && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="btn btn-xs btn-outline btn-error shrink-0 tooltip tooltip-left"
                  data-tip="Löschen"
                >
                  🗑️
                </button>
              )}
            </li>
          ))}
        </ul>
        {f.children.length > 0 && (
          <div className="pl-6">
            {f.children.map((child) => renderFolder(folderMap[child.id]))}
          </div>
        )}
        
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="w-full lg:w-1/3 bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-5 overflow-y-auto max-h-[60vh]">
        <h2 className="font-serif text-center text-xl text-amber-200 mb-6">
          <span className="text-amber-500">❖</span> ENCYCLOPAEDIA <span className="text-amber-500">❖</span>
        </h2>

        <input
          type="text"
          placeholder="Durchsuche die alten Texte…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full mb-6 bg-black/50 border border-amber-900/50 rounded-sm px-4 py-2 text-amber-100 placeholder-amber-200/30 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50"
        />

        {articlesLoading ? (
          <div className="text-center py-8 text-amber-200/50 italic font-serif">
            Die alten Schriften werden aus den Archiven geholt…
          </div>
        ) : (
          <>
            {(rootFolders.length > 0 ? rootFolders : folders).map((f) =>
              renderFolder(folderMap[f.id])
            )}

            {uncategorized.length > 0 && (
              <div className="mb-6">
                <h3 className="font-serif text-lg text-amber-500 mb-2 border-b border-amber-900/30 pb-1">
                  <span className="text-amber-700">♦</span> Unkategorisiert
                </h3>
                <ul className="space-y-2 ml-4">
                  {uncategorized.map((a) => (
                    <li key={a.id} className="flex items-center gap-2">
                      <div className="truncate flex-1 min-w-0">
                        <button
                          onClick={() => setSelected(a)}
                          className={`w-full text-left truncate font-serif text-sm py-1 hover:text-amber-200 ${
                            selected?.id === a.id ? 'text-amber-200' : 'text-amber-300/70'
                          }`}
                        >
                          <span className="text-amber-500/70 mr-1">✦</span> {a.title}
                        </button>
                      </div>
                      {deleteMode && (
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="btn btn-xs btn-outline btn-error shrink-0 tooltip tooltip-left"
                          data-tip="Löschen"
                        >
                          🗑️
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {articles.length === 0 && (
              <div className="text-center py-8 text-amber-200/50 italic font-serif">
                Noch keine Schriften in diesem Archiv vorhanden.
              </div>
            )}
          </>
        )}

        <div className="mt-4 text-center space-y-2">
          <Link
            href={`/games/${gameId}/ArticleView/NeuerArtikel`}
            className="inline-block px-4 py-2 border border-amber-900/40 rounded-sm font-serif text-xs text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30"
          >
            Neuen Artikel erstellen
          </Link>
          <Link
            href={`/games/${gameId}/ArticleView/Ordnerstruktur`}
            className="inline-block px-4 py-2 border border-amber-900/40 rounded-sm font-serif text-xs text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30"
          >
            Systematisierung modifizieren
          </Link>
        </div>

        <div className="text-center text-amber-200/50 font-serif text-xs italic mt-4">
          Artikel löschen? Aktiviere den Modus:
        </div>
        <div className="flex items-center justify-center mb-4">
          <label className="label cursor-pointer">
            <input
              type="checkbox"
              className="toggle toggle-error toggle-sm"
              checked={deleteMode}
              onChange={(e) => setDeleteMode(e.target.checked)}
            />
            <span className="label-text mr-3 text-amber-200 font-serif text-sm">🗑️</span>
          </label>
        </div>
      </aside>

      <section className="w-full lg:w-2/3 bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 shadow-[0_0_20px_rgba(0,0,0,0.5)] p-8">
        {!selected && (
          <div className="text-center py-16 text-amber-200/50 italic font-serif">
            Wähle eine der Schriften aus, um ihre Geheimnisse zu enthüllen.
          </div>
        )}
        {selected && isLoadingContent && (
          <div className="text-center py-16 text-amber-200/50 italic font-serif">
            Die mystischen Runen enthüllen sich langsam…
          </div>
        )}
        {selected && content && !isLoadingContent && (
          <>
            <h2 className="font-serif text-2xl text-center mb-6 text-amber-200 tracking-wider">
              <span className="text-amber-500 mr-3">❖</span>
              {selected.title}
              <span className="text-amber-500 ml-3">❖</span>
            </h2>
            <article className="prose prose-invert prose-xl leading-relaxed max-w-none
                                prose-headings:text-amber-300 prose-p:text-amber-100 prose-a:text-amber-400
                                hover:prose-a:text-amber-300 prose-strong:text-amber-200 prose-em:text-amber-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </article>
            <div className="text-center text-xs text-amber-200/40 font-serif italic mt-4">
              Aus dem Kodex, Folio {selected.id}
            </div>
          </>
        )}
      </section>
    </div>
  )
}