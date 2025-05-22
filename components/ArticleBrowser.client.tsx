'use client'

import { useState, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '@/lib/supabaseClient'
import type { Post, Folder } from '@/lib/types'
import Link from 'next/link'

interface Props {
  initialArticles: Post[]
  gameId?: number // ist aktuell noch optional, da ich in data database null values habe
}

export default function ArticleBrowser({ initialArticles, gameId }: Props) {
  const [articles, setArticles] = useState<Post[]>(initialArticles)
  const [folders, setFolders] = useState<Folder[]>([])
  const [selected, setSelected] = useState<Post | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState<string>('')
  const [deleteMode, setDeleteMode] = useState(false)

  const handleDelete = async (id: number) => {  
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) {
    console.error('Fehler beim Löschen:', error)
  } else {
    setArticles((prev) => prev.filter((a) => a.id !== id))
    if (selected?.id === id) setSelected(null)
  }
}

  // 1) Lade alle Ordner für den jeweiligen Baum des Spiels
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId)  // ← Filter nach game_id
      if (error) console.error(error)
      else setFolders(data || [])
    })()
  }, [gameId])

  // 2) Suche anwenden
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

  // 3) Markdown-Content laden, wenn ausgewählt
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
        console.error(error)
        setContent(
          '*Die Zeichen verblassen vor deinen Augen… Die alten Mächte verweigern dir dieses Wissen.*'
        )
      } else {
        setContent(data.content)
        console.log('Content loaded:', data.content)
      }
      setIsLoading(false)
    })()
  }, [selected])

  // 4) Baum-Struktur aufbauen: map + children
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

  // 5) Artikel pro Ordner sammeln
  const articlesByFolder = useMemo(() => {
    const m: Record<number, Post[]> = {}
    filtered.forEach((a) => {
      if (a.folder_id != null) {
        m[a.folder_id] = m[a.folder_id] || []
        m[a.folder_id].push(a)
      }
    })
    return m
  }, [filtered])

  const uncategorized = filtered.filter((a) => a.folder_id == null)

  // 6) Rekursives Rendern der Ordner
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
      {/* Sidebar */}
      <aside className="w-full lg:w-1/3 bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-5 overflow-y-auto max-h-[60vh]">
        <h2 className="font-serif text-center text-xl text-amber-200 mb-6">
          
          <span className="text-amber-500">❖</span> ENCYCLOPAEDIA <span className="text-amber-500">❖</span>
        </h2>
        {/* Suche */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Durchsuche die alten Texte…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-black/50 border border-amber-900/50 rounded-sm px-4 py-2 text-amber-100 placeholder-amber-200/30 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50"
          />
          <div className="absolute right-3 top-2 text-amber-500/50">✧</div>
        </div>

        {/* Ordner & Artikel */}
        {rootFolders.map((f) => renderFolder(folderMap[f.id]))}

        {/* Unkategorisierte Artikel */}
        {uncategorized.length > 0 && (
          <div className="mb-6">
            <h3 className="font-serif text-lg text-amber-500 mb-2 border-b border-amber-900/30 pb-1">
              <span className="text-amber-700">♦</span> Unkategorisiert
            </h3>
            <ul className="space-y-2 ml-4">
              {uncategorized.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => setSelected(a)}
                    className="font-serif text-sm text-amber-300/70 hover:text-amber-200"
                  >
                    <span className="text-amber-500/70 mr-1">✦</span> {a.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link
            href="/ArticleView/NeuerArtikel"
            className="inline-block px-4 py-2 border border-amber-900/40 rounded-sm font-serif text-xs text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30"
          >
            Neues Wissen verewigen
          </Link>
        </div>
        {/* Löschen-Checkbox */}
        <br/>
        <div className="text-center text-amber-200/50 font-serif text-xs italic mb-2">
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

      {/* Content-Bereich */}
      <section className="w-full lg:w-2/3 bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 shadow-[0_0_20px_rgba(0,0,0,0.5)] p-8">
        {!selected && (
          <div className="text-center py-16 text-amber-200/50 italic font-serif">
            Wähle eine der Schriften aus, um ihre Geheimnisse zu enthüllen.
          </div>
        )}

        {selected && isLoading && (
          <div className="text-center py-16 text-amber-200/50 italic font-serif">
            Die mystischen Runen enthüllen sich langsam…
          </div>
        )}

        {selected && content && !isLoading && (
          <>
            <h2 className="font-serif text-2xl text-center mb-6 text-amber-200 tracking-wider">
              <span className="text-amber-500 mr-3">❖</span>
              {selected.title}
              <span className="text-amber-500 ml-3">❖</span>
            </h2>

            <article className="prose prose-invert prose-xl leading-relaxed max-w-none
                                prose-headings:text-amber-300 prose-p:text-amber-100 prose-a:text-amber-400
                                hover:prose-a:text-amber-300 prose-strong:text-amber-200 prose-em:text-amber-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}
              >
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