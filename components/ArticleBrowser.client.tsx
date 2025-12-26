// components/ArticleBrowser.client.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Post, Folder } from '@/lib/types'
import Link from 'next/link'
import { ArticleViewer } from './articleBrowser/ArticleViewer'
import { FolderTree } from './articleBrowser/FolderTree' // Neu
import { ArticleList } from './articleBrowser/ArticleList' // Neu

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
  isLoading: propsLoading, // Umbenannt um Konflikt zu vermeiden
  onDeleteArticle,
  onAddArticle,
  onUpdateArticle 
}: Props) {
  // --- State ---
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null) // null = Alle/Unkategorisiert Logik
  const [selectedArticle, setSelectedArticle] = useState<Post | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMoving, setIsMoving] = useState(false) // Für Ladeindikator beim Verschieben

  // --- Initial Data Loading ---
  useEffect(() => {
    if (!gameId) return
    ;(async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId)
        .order('name')
      
      if (error) console.error('Fehler beim Laden der Ordner:', error)
      else setFolders(data || [])
    })()
  }, [gameId])

  // --- Filter Logic ---
  const filteredArticles = useMemo(() => {
    let result = articles || []

    // 1. Suche hat Priorität
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase()
      return result.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.content.toLowerCase().includes(q)
      ).sort((a, b) => a.title.localeCompare(b.title))
    }

    // 2. Wenn keine Suche, filtere nach Ordner
    if (selectedFolderId === null) {
      // Option A: Zeige NUR Unkategorisierte, wenn kein Ordner gewählt? 
      // Option B: Zeige ALLE, wenn nichts gewählt?
      // Hier: Wir nutzen "Unkategorisiert" als expliziten Filter.
      // Wenn du einen "Alle Artikel" Button willst, bräuchte man eine separate ID (-1 o.ä.)
      return result.filter(a => !a.folder_id).sort((a, b) => a.title.localeCompare(b.title))
    } else {
      return result.filter(a => a.folder_id === selectedFolderId).sort((a, b) => a.title.localeCompare(b.title))
    }
  }, [articles, searchQuery, selectedFolderId])

  // --- Actions ---

  const handleFolderSelect = (id: number | null) => {
    setSelectedFolderId(id)
    setSearchQuery('') // Suche leeren für Fokus
    setSelectedArticle(null)
  }

  const handleArticleSelect = (article: Post) => {
    setSelectedArticle(article)
  }

  const handleDelete = async (id: number) => {
    if(!confirm("Diesen Artikel wirklich ins Nichts verbannen?")) return;
    
    const success = await onDeleteArticle(id)
    if (success && selectedArticle?.id === id) {
      setSelectedArticle(null)
    }
  }

  // Snappy Drag & Drop: Sofortiges Speichern
  const handleMoveArticle = async (articleId: number, targetFolderId: number | null) => {
    if (isMoving) return;

    // 1. Optimistisches Update im Parent State (damit es sich sofort anfühlt)
    const article = articles.find(a => a.id === articleId)
    if (!article || article.folder_id === targetFolderId) return

    // Update lokal
    const updatedArticle = { ...article, folder_id: targetFolderId || 0 } // 0 oder null je nach DB Schema
    onUpdateArticle(updatedArticle) // UI Update sofort
    
    setIsMoving(true)
    try {
      // 2. DB Update
      const { error } = await supabase
        .from('posts')
        .update({ folder_id: targetFolderId })
        .eq('id', articleId)

      if (error) throw error
    } catch (err) {
      console.error("Fehler beim Verschieben:", err)
      alert("Der Zauber ist fehlgeschlagen (Move failed).")
      // Revert logic wäre hier gut, aber keep it simple for now
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <div className="flex flex-col h-[85vh] bg-black/40 backdrop-blur-md border border-amber-900/40 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-amber-900/40 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-amber-200 tracking-widest text-lg">
            <span className="text-amber-600 mr-2">❖</span>
            ARCHIV
          </h2>
          {/* Action Buttons Compact */}
          <div className="flex gap-2 ml-4">
            <Link href={`/games/${gameId}/ArticleView/WriteArticle`} className="btn-icon" title="Neuer Artikel">
               ✎
            </Link>
            <Link href={`/games/${gameId}/ArticleView/NeuerArtikel`} className="btn-icon" title="Upload">
               ⬆
            </Link>
            <Link href={`/games/${gameId}/ArticleView/Ordnerstruktur`} className="btn-icon" title="Ordner verwalten">
               📁
            </Link>
          </div>
        </div>

        {/* Suche */}
        <div className="relative w-64">
           <input
            type="text"
            placeholder="Suche in den Schriften..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-amber-900/40 rounded px-3 py-1.5 text-sm text-amber-100 placeholder-amber-700/50 focus:outline-none focus:border-amber-500 font-serif"
          />
          {searchQuery && (
             <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1.5 text-amber-700 hover:text-amber-500">✕</button>
          )}
        </div>
      </div>

      {/* --- MAIN CONTENT (3 PANES) --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* PANE 1: Folder Tree */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-amber-900/30 flex flex-col bg-black/20 overflow-hidden`}>
           <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              <button 
                onClick={() => handleFolderSelect(null)}
                className={`w-full text-left px-3 py-2 rounded mb-1 text-sm font-serif transition-colors flex items-center gap-2
                  ${selectedFolderId === null && !searchQuery ? 'bg-amber-900/40 text-amber-100' : 'text-amber-400 hover:bg-amber-900/10'}
                `}
              >
                <span className="opacity-70">✧</span> Unkategorisiert
              </button>
              
              <div className="my-2 border-t border-amber-900/20"></div>

              <FolderTree 
                folders={folders} 
                selectedFolderId={selectedFolderId}
                onSelect={handleFolderSelect}
                onDropArticle={handleMoveArticle}
              />
           </div>
           <div className="p-2 border-t border-amber-900/30 text-[10px] text-amber-700 text-center font-serif">
             {folders.length} Ordner
           </div>
        </div>

        {/* PANE 2: Article List */}
        <div className="w-72 border-r border-amber-900/30 flex flex-col bg-black/10 shrink-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredArticles.length === 0 ? (
               <div className="p-8 text-center text-amber-500/30 text-xs italic font-serif">
                 {searchQuery ? 'Keine Ergebnisse' : 'Leere'}
               </div>
            ) : (
              <ArticleList 
                articles={filteredArticles}
                selectedId={selectedArticle?.id}
                onSelect={handleArticleSelect}
                onDelete={handleDelete}
              />
            )}
          </div>
          <div className="p-2 bg-black/20 border-t border-amber-900/30 flex justify-between items-center text-[10px] text-amber-600 font-serif">
             <span>{filteredArticles.length} Einträge</span>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hover:text-amber-300">
               {isSidebarOpen ? '« Seitenleiste' : '» Seitenleiste'}
             </button>
          </div>
        </div>

        {/* PANE 3: Viewer */}
        <div className="flex-1 bg-gradient-to-br from-black/5 to-amber-950/20 relative overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <ArticleViewer 
              selected={selectedArticle} 
              articles={articles} 
              onSelectArticle={handleArticleSelect} 
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .btn-icon {
          @apply w-8 h-8 flex items-center justify-center rounded border border-amber-900/30 text-amber-400 hover:bg-amber-900/40 hover:text-amber-100 transition-colors bg-black/30;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(146, 64, 14, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(146, 64, 14, 0.5);
        }
      `}</style>
    </div>
  )
}