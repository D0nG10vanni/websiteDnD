'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Home, RefreshCw, FileText } from 'lucide-react'
import { remark } from 'remark'
import html from 'remark-html'

import ForceGraphComponent, { GraphNode, NODE_COLORS } from '@/components/Graphview/ForceGraph'
import type { Article } from '@/lib/articles'
import { fetchArticles } from '@/lib/articles'

// Hilfsfunktion: Markdown → HTML
async function markdownToHtml(markdown: string) {
  const result = await remark().use(html).process(markdown)
  return result.toString()
}

export default function SupabaseGraphPage() {
  // Artikel-Ladevorgang
  const [articles, setArticles]           = useState<Article[]>([])
  const [articlesLoading, setArtLoading]  = useState(true)
  const [articlesError, setArtError]      = useState<string | null>(null)

  useEffect(() => {
    fetchArticles()
      .then(setArticles)
      .catch(e => setArtError(e.message))
      .finally(() => setArtLoading(false))
  }, [])

  // Auswahl & Content
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [articleTitle, setArticleTitle]   = useState('')
  const [articleContent, setArticleContent] = useState<string>('')
  const [loadingArticle, setLoadingArticle] = useState(false)
  const [articleError, setArticleError]     = useState<string | null>(null)

  // Graph Daten-URL (mit Cache-Buster)
  const [graphDataUrl, setGraphDataUrl] = useState('/graph_with_pos.json')

  // Button-State
  const [updating, setUpdating]           = useState(false)
  const [updateError, setUpdateError]     = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Wenn ein Knoten gewählt wird, rendern wir den Artikel
  useEffect(() => {
    if (!selectedNode) {
      setArticleTitle('')
      setArticleContent('')
      setArticleError(null)
      return
    }
    const id = Number(selectedNode.id)
    const art = articles.find(a => a.id === id)
    if (!art) {
      setArticleError(`Kein Artikel für "${selectedNode.name}" gefunden.`)
      return
    }
    setLoadingArticle(true)
    setArticleError(null)
    setArticleTitle(art.title)
    markdownToHtml(art.content)
      .then(html => setArticleContent(html))
      .catch(e => setArticleError(e.message))
      .finally(() => setLoadingArticle(false))
  }, [selectedNode, articles])

  // Resize-Logic (unverändert)
  const [graphWidth, setGraphWidth]   = useState('50%')
  const resizeRef = useRef<HTMLDivElement>(null)
  const isResizingRef = useRef(false)
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!isResizingRef.current) return
      const container = document.getElementById('main-container')?.clientWidth || 0
      const newW = Math.min(Math.max(e.clientX, 200), container - 200)
      setGraphWidth(`${(newW / container) * 100}%`)
    }
    function onStop() {
      isResizingRef.current = false
      document.body.style.cursor = 'default'
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onStop)
    }
    function onStart() {
      isResizingRef.current = true
      document.body.style.cursor = 'col-resize'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onStop)
    }
    const el = resizeRef.current
    el?.addEventListener('mousedown', onStart)
    return () => el?.removeEventListener('mousedown', onStart)
  }, [])

  // Button-Handler: ruft unsere neue API-Route auf
  async function handleUpdate() {
    setUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(false)
    try {
      const res = await fetch('/api/update-graph', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unbekannter Fehler')
      }
      // Cache-Buster anfügen, damit der Graph neu geladen wird
      setGraphDataUrl(`/graph_with_pos.json?ts=${Date.now()}`)
      setUpdateSuccess(true)
    } catch (e: any) {
      setUpdateError(e.message)
    } finally {
      setUpdating(false)
      setTimeout(() => setUpdateSuccess(false), 3000)
    }
  }

  return (
    <main className="flex min-h-screen flex-col h-screen">
      <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold">D&D Lore Manager (Supabase)</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            <RefreshCw size={16} /> {updating ? 'Aktualisiere…' : 'Graph aktualisieren'}
          </button>
          <Link href="/">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              <Home size={18} /> Startseite
            </button>
          </Link>
        </div>
      </header>

      <div id="main-container" className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Graph-Bereich */}
        <div style={{ width: graphWidth }} className="h-[50vh] md:h-full p-4">
          <ForceGraphComponent
            dataUrl={graphDataUrl}
            height={typeof window !== 'undefined' ? window.innerHeight : 600}
            onNodeSelect={setSelectedNode}
          />
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              type !== 'default' && (
                <div key={type} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
                  <span className="capitalize text-sm">{type}</span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className="w-2 md:cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-10"
        />

        {/* Artikel-Anzeige */}
        <div style={{ width: `calc(100% - ${graphWidth})` }} className="h-[50vh] md:h-full p-4 border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50 overflow-auto">
          {articlesLoading && <p>Lade Artikel…</p>}
          {articlesError && <p className="text-red-600">{articlesError}</p>}

          {!selectedNode && !articlesLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <FileText size={48} strokeWidth={1.5} />
              <p className="mt-4 text-lg">Wähle einen Knoten aus</p>
            </div>
          )}

          {selectedNode && loadingArticle && <p>Artikel wird geladen…</p>}
          {selectedNode && articleError && <p className="text-red-600">{articleError}</p>}

          {selectedNode && !loadingArticle && !articleError && (
            <article className="prose max-w-none">
              <h2>{articleTitle}</h2>
              <div dangerouslySetInnerHTML={{ __html: articleContent }} />
            </article>
          )}
        </div>
      </div>
    </main>
  )
}
