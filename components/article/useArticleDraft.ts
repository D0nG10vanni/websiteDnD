import { useEffect } from 'react'

interface ArticleDraft {
  title: string
  content: string
  folderId: number | null
  timestamp: string
}

interface UseArticleDraftProps {
  gameId: number
  title: string
  content: string
  folderId: number | null
  setTitle: (title: string) => void
  setContent: (content: string) => void
  setFolderId: (folderId: number | null) => void
  setPreviewContent: (content: string) => void
}

export function useArticleDraft({
  gameId,
  title,
  content,
  folderId,
  setTitle,
  setContent,
  setFolderId,
  setPreviewContent
}: UseArticleDraftProps) {
  // Auto-save Entwurf
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
        const draft = JSON.parse(savedDraft) as ArticleDraft
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
  }, [gameId, setTitle, setContent, setFolderId, setPreviewContent])
}