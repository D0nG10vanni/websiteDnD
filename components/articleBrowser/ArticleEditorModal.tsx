'use client'

import { useState, useEffect } from 'react'
import { Post, Folder } from '@/lib/types'
import MarkdownEditor from '../article/MarkdownEditor'
import ArticleMetadata from '../article/ArticleMetadata'
import LivePreview from '../article/LivePreview' // Neu importiert
import ArticleToolbar from '../article/ArticleToolbar' // Neu importiert
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
  
  // Standardmäßig Vorschau anzeigen für sofortiges Feedback
  const [showPreview, setShowPreview] = useState(true) 
  
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
    <div className="fixed top-50 inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[95vw] h-[90vh] flex flex-col bg-black/90 border border-amber-900/50 rounded-lg shadow-[0_0_50px_rgba(180,83,9,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-900/30 bg-amber-900/10 shrink-0">
          <h3 className="text-xl font-serif text-amber-200 flex items-center gap-2">
            <span className="text-amber-500">✎</span> 
            {title || 'Neuer Artikel'}
          </h3>
          
          {/* Toolbar direkt im Header integriert */}
          <div className="hidden md:block">
            <ArticleToolbar 
                showPreview={showPreview}
                setShowPreview={setShowPreview}
                lastSavedAt={null} // Optional: hier könnte ein Timestamp rein
                onSave={handleSave}
                isSaving={isSaving}
                canSave={!!title}
            />
          </div>

          <button 
            onClick={onClose}
            className="md:hidden text-amber-500 hover:text-amber-200 transition-colors px-2"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          <div className="max-w-7xl mx-auto space-y-6">
            <ArticleMetadata 
                title={title}
                setTitle={setTitle}
                folderId={folderId}
                setFolderId={setFolderId}
                folders={folders}
                gameId={gameId}
            />

            {/* Split View Container */}
            <div className={`grid gap-4 transition-all duration-300 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                
                {/* Editor Bereich */}
                <div className="flex flex-col gap-2">
                    <label className="text-amber-200/50 font-serif text-xs">Markdown Inhalt</label>
                    <MarkdownEditor 
                        content={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                            e.preventDefault()
                            handleSave()
                            }
                        }}
                    />
                </div>

                {/* Live Preview Bereich - Nur anzeigen wenn aktiviert */}
                {showPreview && (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                        <label className="text-amber-200/50 font-serif text-xs">Live Vorschau</label>
                        <div className="h-full">
                            <LivePreview 
                                content={content} 
                                onLinkClick={(link) => console.log("Link clicked:", link)} 
                            />
                        </div>
                    </div>
                )}
            </div>
          </div>

        </div>

        {/* Footer actions (Mobile only or redundant/sticky) */}
        <div className="p-4 border-t border-amber-900/30 bg-black/40 flex justify-between md:justify-end gap-3 shrink-0">
            {/* Mobile Toggle */}
            <div className="md:hidden flex items-center">
                <label className="flex items-center gap-2 text-amber-200/60 text-xs font-serif">
                    <input 
                        type="checkbox" 
                        checked={showPreview} 
                        onChange={(e) => setShowPreview(e.target.checked)}
                        className="rounded border-amber-900/50 bg-black/50 text-amber-600 focus:ring-amber-900"
                    />
                    Vorschau
                </label>
            </div>

            <div className="flex gap-3">
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
                    {isSaving ? 'Speichere...' : '💾 Speichern'}
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}