'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'  // Direkter Import wie in Upload-Seite
import type { Post } from '@/lib/types'

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

type Folder = { 
  id: number; 
  name: string; 
  parent_id: number | null; 
  game_id: number;
  creator_uuid: string;
};

export default function NeuerArtikelPage({ gameId = 1 }: { gameId?: number }) {
  const router = useRouter()
  // Entferne useSupabaseClient und useUser - verwende direkten supabase import

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
  const [userUuid, setUserUuid] = useState<string | null>(null)
  
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

  // Lade Benutzer und Ordner beim Mount - genau wie in der Upload-Seite
  useEffect(() => {
    fetchUserAndFolders();
  }, [gameId]);

  async function fetchUserAndFolders() {
    setIsLoadingFolders(true);
    try {
      console.log('Loading data for gameId:', gameId)
      
      // Benutzer abrufen - exakt wie in der Upload-Seite
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Fehler beim Abrufen des Benutzers:', userError)
        alert('Fehler beim Abrufen des Benutzers.');
        setIsLoadingFolders(false);
        return;
      }

      setUserUuid(user.id);

      // Ordner für das aktuelle Spiel abrufen - exakt wie in der Upload-Seite
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId)
        .order('name');
        
      console.log('Folders query result:', { foldersData, foldersError })
      
      if (foldersError) {
        console.error('Error fetching folders:', foldersError);
        alert('Fehler beim Laden der Ordner: ' + foldersError.message);
      } else {
        console.log('Loaded folders:', foldersData)
        setFolders(foldersData || []);
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
    } catch (err) {
      console.error('Error fetching user and folders:', err);
      alert('Fehler beim Laden der Daten.');
    }
    setIsLoadingFolders(false);
  }

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

  // Speichern - angepasst an die Upload-Seite
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Bitte gib einen Titel für den Artikel ein.')
      return
    }

    if (!userUuid) {
      alert('Du musst angemeldet sein, um Artikel zu erstellen.')
      return
    }

    setIsSaving(true)
    
    try {
      const folderName = folders.find(f => f.id === folderId)?.name ?? null;
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          creator: userUuid,  // Wie in der Upload-Seite
          game_id: gameId,
          folder_id: folderId,
          kategorie: folderName,  // Wie in der Upload-Seite
          created_at: new Date().toISOString(),
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

  // Loading Screen wie in der Upload-Seite
  if (isLoadingFolders) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-amber-200 font-serif text-lg">Lade Ordnerstruktur...</p>
          <div className="text-amber-300 text-xs font-serif opacity-50 mt-2">✧ Die Bibliothek öffnet sich ✧</div>
        </div>
      </div>
    )
  }

  // Fehler wenn gameId ungültig
  if (!gameId || isNaN(gameId) || gameId <= 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 flex items-center justify-center">
        <div className="text-center text-red-400">
          <h1 className="text-2xl font-bold">Ungültige Spiel-ID</h1>
          <p>Die angegebene Spiel-ID ist nicht gültig.</p>
          <p className="text-xs mt-2">Erhaltene ID: {gameId}</p>
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
            title={title}
            setTitle={setTitle}
            folderId={folderId}
            setFolderId={setFolderId}
            folders={folders}
            gameId={gameId}
            isLoadingFolders={isLoadingFolders}
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