'use client'

import { useState, useEffect } from 'react'
import { Post, Folder } from '@/lib/types'
import MarkdownEditor from '../article/MarkdownEditor'
import ArticleMetadata from '../article/ArticleMetadata'
import { articleTheme } from '../article/articleTheme'

interface ArticleEditorModalProps {
  article: Post
  folders: Folder[]
  gameId: number
  isOpen: boolean
  onClose: () => void
  onSave: (updatedArticle: Post) => Promise<void>
}

export function ArticleEditorModal({ 
  article, 
  folders, 
  gameId, 
  isOpen, 
  onClose, 
  onSave 
}: ArticleEditorModalProps) {
  const [title, setTitle] = useState(article.title)
  const [content, setContent] = useState(article.content)
  const [folderId, setFolderId] = useState<number | null>(article.folder_id ?? null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Reset state when article changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(article.title)
      setContent(article.content)
      setFolderId(article.folder_id ?? null)
    }
  }, [article, isOpen])

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedArticle: Post = {
        ...article,
        title,
        content,
        folder_id: folderId
      }
      await onSave(updatedArticle)
      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
      alert("Speichern fehlgeschlagen.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-black/90 border border-amber-900/50 rounded-lg shadow-[0_0_50px_rgba(180,83,9,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-900/30 bg-amber-900/10">
          <h3 className="text-xl font-serif text-amber-200">
            <span className="text-amber-500 mr-2">✎</span> 
            Artikel bearbeiten
          </h3>
          <button 
            onClick={onClose}
            className="text-amber-500 hover:text-amber-200 transition-colors px-2"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          
          <ArticleMetadata 
            title={title}
            setTitle={setTitle}
            folderId={folderId}
            setFolderId={setFolderId}
            folders={folders}
            gameId={gameId}
          />

          <div className="space-y-2">
            <label className="text-amber-200/50 font-serif text-xs">Inhalt</label>
            <MarkdownEditor 
              content={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                // Optional: Ctrl+S to save
                if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-amber-900/30 bg-black/40 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded border border-amber-900/30 text-amber-400 hover:text-amber-200 hover:bg-amber-900/20 transition-colors font-serif text-sm"
          >
            Abbrechen
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded bg-amber-700 hover:bg-amber-600 text-white font-serif text-sm shadow-lg disabled:opacity-50 transition-all"
          >
            {isSaving ? 'Speichere...' : '💾 Änderungen speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}