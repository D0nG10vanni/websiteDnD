'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import type { Post } from '@/lib/types'

export default function NeuerArtikelPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = parseInt(params?.id as string, 10)
  const supabase = useSupabaseClient()
  const user = useUser()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [previewContent, setPreviewContent] = useState('')
  const [folderId, setFolderId] = useState<number | null>(null)
  const [folders, setFolders] = useState<any[]>([])
  const [articles, setArticles] = useState<Post[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastLineRef = useRef('')
  const currentLineIndexRef = useRef(0)

  // Lade Ordner und Artikel beim Mount
  useEffect(() => {
    if (!gameId || isNaN(gameId)) return

    const loadData = async () => {
      // Ordner laden
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId)
      
      if (foldersError) {
        console.error('Fehler beim Laden der Ordner:', foldersError)
      } else {
        setFolders(foldersData || [])
      }

      // Artikel laden (für Wiki-Links)
      const { data: articlesData, error: articlesError } = await supabase
        .from('posts')
        .select('*')
        .eq('game_id', gameId)
      
      if (articlesError) {
        console.error('Fehler beim Laden der Artikel:', articlesError)
      } else {
        setArticles(articlesData || [])
      }
    }

    loadData()
  }, [gameId, supabase])

  // Live-Rendering bei Enter-Taste
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    
    // Prüfe ob Enter gedrückt wurde (neue Zeile hinzugefügt)
    const lines = newContent.split('\n')
    const currentLineIndex = lines.length - 1
    const currentLine = lines[currentLineIndex] || ''
    const previousLine = lines[currentLineIndex - 1] || ''
    
    // Wenn eine neue Zeile erstellt wurde (Enter gedrückt) oder die aktuelle Zeile leer ist
    if (currentLineIndex > currentLineIndexRef.current || currentLine === '') {
      // Render bis zur vorherigen Zeile (die gerade abgeschlossen wurde)
      const contentToRender = lines.slice(0, currentLineIndex).join('\n')
      setPreviewContent(contentToRender)
      currentLineIndexRef.current = currentLineIndex
    }
    
    // Für bestimmte Markdown-Elemente sofort rendern
    if (shouldInstantRender(currentLine, previousLine)) {
      setPreviewContent(newContent)
    }
    
    lastLineRef.current = currentLine
  }

  // Bestimme ob sofortiges Rendering nötig ist
  const shouldInstantRender = (currentLine: string, previousLine: string): boolean => {
    // Headers
    if (currentLine.match(/^#{1,6}\s/)) return true
    // Listen
    if (currentLine.match(/^[\s]*[-*+]\s/) || currentLine.match(/^[\s]*\d+\.\s/)) return true
    // Blockquotes
    if (currentLine.match(/^>\s/)) return true
    // Code blocks
    if (currentLine.match(/^```/)) return true
    // Horizontale Linien
    if (currentLine.match(/^---+$/) || currentLine.match(/^\*\*\*+$/)) return true
    // Tabellen
    if (currentLine.includes('|')) return true
    // Wiki-Links
    if (currentLine.includes('[[') && currentLine.includes(']]')) return true
    
    return false
  }

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // Kurze Verzögerung um sicherzustellen, dass der Content aktualisiert wurde
      setTimeout(() => {
        const lines = content.split('\n')
        const completedContent = lines.slice(0, -1).join('\n')
        if (completedContent.trim()) {
          setPreviewContent(completedContent)
        }
      }, 10)
    }
    
    // Tab-Unterstützung für Einrückungen
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      setContent(newContent)
      
      // Cursor nach dem Tab positionieren
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  // Handle Wiki-Link Navigation
  const handleWikiLinkClick = (title: string) => {
    const matchedArticle = articles.find(a => a.title === title)
    if (matchedArticle) {
      // Navigiere zum Artikel (optional: öffne in neuem Tab)
      if (confirm(`Zum Artikel "${title}" navigieren? (Ungespeicherte Änderungen gehen verloren)`)) {
        router.push(`/games/${gameId}/ArticleView`)
      }
    } else {
      // Frage ob neuer Artikel erstellt werden soll
      if (confirm(`Artikel "${title}" existiert nicht. Als Wiki-Link markieren?`)) {
        // Füge den Link zum aktuellen Content hinzu
        setContent(prev => prev + `\n\n[[${title}]]`)
      }
    }
  }

  // Speichern
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Bitte gib einen Titel für den Artikel ein.')
      return
    }

    if (!user) {
      alert('Du musst angemeldet sein, um Artikel zu erstellen.')
      return
    }

    setIsSaving(true)
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          game_id: gameId,
          folder_id: folderId,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Fehler beim Speichern:', error)
        alert('Fehler beim Speichern des Artikels: ' + error.message)
      } else {
        setLastSavedAt(new Date())
        alert('Artikel erfolgreich gespeichert!')
        
        // Zurück zur Artikel-Übersicht
        router.push(`/games/${gameId}/ArticleView`)
      }
    } catch (error) {
      console.error('Unerwarteter Fehler:', error)
      alert('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save Entwurf (optional)
  useEffect(() => {
    const saveDraft = () => {
      if (title || content) {
        localStorage.setItem(`article_draft_${gameId}`, JSON.stringify({
          title,
          content,
          folderId,
          timestamp: new Date().toISOString()
        }))
      }
    }

    const timer = setTimeout(saveDraft, 2000)
    return () => clearTimeout(timer)
  }, [title, content, folderId, gameId])

  // Lade Entwurf beim Mount
  useEffect(() => {
    const draftKey = `article_draft_${gameId}`
    const savedDraft = localStorage.getItem(draftKey)
    
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        const draftAge = Date.now() - new Date(draft.timestamp).getTime()
        
        // Nur laden wenn Entwurf weniger als 24h alt ist
        if (draftAge < 24 * 60 * 60 * 1000) {
          if (confirm('Es wurde ein gespeicherter Entwurf gefunden. Möchtest du ihn laden?')) {
            setTitle(draft.title || '')
            setContent(draft.content || '')
            setFolderId(draft.folderId || null)
            setPreviewContent(draft.content || '')
          }
        } else {
          // Alten Entwurf löschen
          localStorage.removeItem(draftKey)
        }
      } catch (error) {
        console.error('Fehler beim Laden des Entwurfs:', error)
      }
    }
  }, [gameId])

  if (isNaN(gameId)) {
    return (
      <div className="min-h-screen bg-base-200 p-6 flex items-center justify-center">
        <div className="text-center text-error">
          <h1 className="text-2xl font-bold">Ungültige Spiel-ID</h1>
          <p>Die angegebene Spiel-ID ist nicht gültig.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-amber-900 to-amber-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-serif text-2xl text-amber-200">
              <span className="text-amber-500">✎</span> Neuer Artikel verfassen
            </h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-amber-900/40 rounded-sm font-serif text-sm text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30 transition-colors"
            >
              ← Zurück
            </button>
          </div>

          {/* Artikel-Metadaten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-300 text-sm font-serif mb-2">
                Titel *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Der Titel deines Artikels…"
                className="w-full bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 placeholder-amber-200/30 font-serif focus:outline-none focus:ring-1 focus:ring-amber-700/50"
              />
            </div>
            
            <div>
              <label className="block text-amber-300 text-sm font-serif mb-2">
                Ordner
              </label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 font-serif focus:outline-none focus:ring-1 focus:ring-amber-700/50"
              >
                <option value="">Unkategorisiert</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-amber-900/30">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${
                  showPreview ? 'bg-amber-600' : 'bg-amber-900/50'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${
                    showPreview ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
                <span className="text-amber-300 text-sm font-serif">Live-Vorschau</span>
              </label>
              
              {lastSavedAt && (
                <span className="text-amber-400/60 text-xs font-serif">
                  Entwurf gespeichert: {lastSavedAt.toLocaleTimeString()}
                </span>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="px-6 py-2 bg-amber-700 hover:bg-amber-600 disabled:bg-amber-900/50 text-white font-serif rounded-sm transition-colors disabled:cursor-not-allowed"
            >
              {isSaving ? 'Speichere...' : '💾 Artikel speichern'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Markdown Editor */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-amber-200">
                <span className="text-amber-500">⌨</span> Markdown Editor
              </h2>
              <div className="text-amber-400/60 text-xs">
                Drücke Enter für Live-Rendering
              </div>
            </div>
            
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder={`Beginne hier mit dem Schreiben deines Artikels...

Beispiele:
# Großer Titel
## Untertitel
### Kleinerer Titel

**Fetter Text** und *kursiver Text*

- Aufzählungspunkt
- Noch ein Punkt

[[Wiki-Link zu anderem Artikel]]

> Ein Zitat oder wichtiger Hinweis

\`\`\`
Code-Block
\`\`\`

| Tabelle | Spalte 2 |
|---------|----------|
| Zeile 1 | Wert     |`}
              className="w-full h-[600px] bg-black/30 border border-amber-900/30 rounded-sm p-4 text-amber-100 placeholder-amber-200/20 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-700/50"
              spellCheck={false}
            />
            
            <div className="mt-2 text-amber-400/60 text-xs font-serif">
              Tipp: Verwende [[Artikelname]] für Wiki-Links zu anderen Artikeln
            </div>
          </div>

          {/* Live Preview */}
          {showPreview && (
            <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg text-amber-200">
                  <span className="text-amber-500">👁</span> Live-Vorschau
                </h2>
                <div className="text-amber-400/60 text-xs">
                  {previewContent.split('\n').length} Zeilen gerendert
                </div>
              </div>
              
              <div className="h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {previewContent.trim() ? (
                  <MarkdownRenderer
                    content={previewContent}
                    onLinkClick={handleWikiLinkClick}
                    className="prose-mystical-preview"
                  />
                ) : (
                  <div className="text-center py-12 text-amber-200/30 italic font-serif">
                    <div className="text-4xl mb-4">📜</div>
                    <p>Deine Worte werden hier erscheinen,</p>
                    <p>sobald du zu schreiben beginnst...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Markdown Hilfeleiste */}
        <div className="mt-6 bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/20 p-4">
          <details className="group">
            <summary className="cursor-pointer text-amber-300 font-serif text-sm hover:text-amber-200 transition-colors">
              <span className="text-amber-500">❓</span> Markdown-Hilfe anzeigen
            </summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-amber-300 font-semibold mb-2">Überschriften</div>
                <div className="text-amber-200/70 font-mono space-y-1">
                  <div># Titel 1</div>
                  <div>## Titel 2</div>
                  <div>### Titel 3</div>
                </div>
              </div>
              <div>
                <div className="text-amber-300 font-semibold mb-2">Formatierung</div>
                <div className="text-amber-200/70 font-mono space-y-1">
                  <div>**fett**</div>
                  <div>*kursiv*</div>
                  <div>~~durchgestrichen~~</div>
                  <div>`code`</div>
                </div>
              </div>
              <div>
                <div className="text-amber-300 font-semibold mb-2">Listen</div>
                <div className="text-amber-200/70 font-mono space-y-1">
                  <div>- Punkt 1</div>
                  <div>- Punkt 2</div>
                  <div>1. Nummeriert</div>
                  <div>2. Liste</div>
                </div>
              </div>
              <div>
                <div className="text-amber-300 font-semibold mb-2">Links</div>
                <div className="text-amber-200/70 font-mono space-y-1">
                  <div>[[Wiki Link]]</div>
                  <div>[Link](URL)</div>
                  <div>[[Artikel|Alias]]</div>
                </div>
              </div>
              <div>
                <div className="text-amber-300 font-semibold mb-2">Sonstiges</div>
                <div className="text-amber-200/70 font-mono space-y-1">
                  <div>&gt; Zitat</div>
                  <div>---</div>
                  <div>```code```</div>
                </div>
              </div>
              <div>
                <div className="text-amber-300 font-semibold mb-2">Tabellen</div>
                <div className="text-amber-200/70 font-mono space-y-1">
                  <div>| A | B |</div>
                  <div>|---|---|</div>
                  <div>| 1 | 2 |</div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.5);
        }
        
        :global(.prose-mystical-preview) {
          color: rgb(251 191 36 / 0.9);
        }
        :global(.prose-mystical-preview h1, .prose-mystical-preview h2, .prose-mystical-preview h3) {
          color: rgb(251 191 36);
          border-bottom: 1px solid rgb(251 191 36 / 0.3);
          padding-bottom: 0.5rem;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        :global(.prose-mystical-preview p) {
          margin: 1rem 0;
          line-height: 1.6;
        }
        :global(.prose-mystical-preview ul, .prose-mystical-preview ol) {
          color: rgb(251 191 36 / 0.8);
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        :global(.prose-mystical-preview li) {
          margin: 0.5rem 0;
        }
        :global(.prose-mystical-preview blockquote) {
          border-left: 4px solid rgb(251 191 36 / 0.4);
          background: rgb(0 0 0 / 0.2);
          padding: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }
        :global(.prose-mystical-preview code) {
          background: rgb(0 0 0 / 0.4);
          color: rgb(251 191 36 / 0.9);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }
        :global(.prose-mystical-preview pre) {
          background: rgb(0 0 0 / 0.4);
          border: 1px solid rgb(251 191 36 / 0.3);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        :global(.prose-mystical-preview pre code) {
          background: transparent;
          padding: 0;
        }
        :global(.prose-mystical-preview table) {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        :global(.prose-mystical-preview th, .prose-mystical-preview td) {
          border: 1px solid rgb(251 191 36 / 0.3);
          padding: 0.5rem;
          text-align: left;
        }
        :global(.prose-mystical-preview th) {
          background: rgb(0 0 0 / 0.3);
          font-weight: bold;
        }
        :global(.prose-mystical-preview hr) {
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, rgb(251 191 36 / 0.4), transparent);
          margin: 2rem 0;
        }
      `}</style>
    </div>
  )
}