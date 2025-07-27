'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import type { Post } from '@/lib/types'
import type { Folder } from '@/lib/types'

// Komponenten
import ArticleHeader from '@/components/article/ArticleHeader'
import ArticleMetadata from '@/components/article/ArticleMetadata'
import ArticleToolbar from '@/components/article/ArticleToolbar'
import MarkdownEditor from '@/components/article/MarkdownEditor'
import LivePreview from '@/components/article/LivePreview'
import MarkdownHelp from '@/components/article/MarkdownHelp'
import ArticleFormStyles from '@/components/article/ArticleFormStyles'

// Custom Hook
import { useArticleDraft } from '@/components/article/useArticleDraft'

export default function NeuerArtikelPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = parseInt(params?.id as string, 10)
  const supabase = useSupabaseClient()
  const user = useUser()

  // State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [previewContent, setPreviewContent] = useState('')
  const [folderId, setFolderId] = useState<number | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [articles, setArticles] = useState<Post[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [isLoadingFolders, setIsLoadingFolders] = useState(true)
  
  // Refs für Live-Rendering
  const lastLineRef = useRef('')
  const currentLineIndexRef = useRef(0)

  // Custom Hook für Draft-Management
  useArticleDraft({
    gameId,
    title,
    content,
    folderId,
    setTitle,
    setContent,
    setFolderId,
    setPreviewContent
  })

  // Lade Ordner und Artikel beim Mount
  useEffect(() => {
    if (!gameId || isNaN(gameId)) {
      console.error('Invalid gameId:', gameId)
      return
    }

    const loadData = async () => {
      console.log('Loading data for gameId:', gameId)
      setIsLoadingFolders(true)
      
      try {
        // Ordner laden
        const { data: foldersData, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .eq('game_id', gameId)
        
        console.log('Folders query result:', { foldersData, foldersError })
        
        if (foldersError) {
          console.error('Fehler beim Laden der Ordner:', foldersError)
          alert('Fehler beim Laden der Ordner: ' + foldersError.message)
        } else {
          console.log('Loaded folders:', foldersData)
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
      } catch (error) {
        console.error('Unexpected error loading data:', error)
        alert('Ein unerwarteter Fehler ist beim Laden der Daten aufgetreten.')
      } finally {
        setIsLoadingFolders(false)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <ArticleHeader onBack={() => router.back()} />

        {/* Metadaten-Container */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-5">
          <ArticleMetadata
            gameId={gameId}
            title={title}
            setTitle={setTitle}
            folderId={folderId}
            setFolderId={setFolderId}
            folders={folders}
          />

          <ArticleToolbar
            showPreview={showPreview}
            setShowPreview={setShowPreview}
            lastSavedAt={lastSavedAt}
            onSave={handleSave}
            isSaving={isSaving}
            canSave={title.trim().length > 0}
          />
        </div>

        {/* Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Markdown Editor */}
          <MarkdownEditor
            content={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
          />

          {/* Live Preview */}
          {showPreview && (
            <LivePreview
              content={previewContent}
              onLinkClick={handleWikiLinkClick}
            />
          )}
        </div>

        {/* Markdown Hilfeleiste */}
        <MarkdownHelp />
      </div>

      {/* Styles */}
      <ArticleFormStyles />
    </div>
  )
}