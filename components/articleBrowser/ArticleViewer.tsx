'use client'

import { useEffect, useState } from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { supabase } from '@/lib/supabaseClient'
import type { Post } from '@/lib/types'

interface NpcTagInfo {
  id: number
  name: string
  race: string | null
  profession: string | null
  age: number | null
  location_id: number | null
  article_id: number | null
}

interface ArticleViewerProps {
  selected: Post | null
  articles: Post[]
  onSelectArticle: (article: Post) => void
  onEdit: (article: Post) => void // NEU: Prop für Edit
}

export function ArticleViewer({ selected, articles, onSelectArticle, onEdit }: ArticleViewerProps) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [npcInfo, setNpcInfo] = useState<NpcTagInfo | null>(null)
  const [locationName, setLocationName] = useState<string | null>(null)

  useEffect(() => {
    if (!selected) return
    // Wenn wir den Content lokal im selected Objekt haben (weil gerade bearbeitet), nutzen wir den
    // Ansonsten laden wir neu, falls nötig. 
    // Optimization: Hier prüfen wir, ob selected.content "vollständig" wirkt oder ob wir immer laden wollen.
    // Da supabase "posts" oft nur Auszüge liefert, laden wir sicherheitshalber nach, 
    // ABER wenn wir gerade editiert haben, wollen wir das Ergebnis sehen.
    
    // Simple Logik: Lade immer frisch aus DB für Konsistenz, außer wir optimieren später.
    setContent(null)
    setNpcInfo(null)
    setLocationName(null)
    setIsLoadingContent(true)
    ;(async () => {
      const [{ data, error }, { data: npcData }] = await Promise.all([
        supabase
          .from('posts')
          .select('content')
          .eq('id', selected.id)
          .single(),
        supabase
          .from('npcs')
          .select('id, name, race, profession, age, location_id, article_id')
          .eq('game_id', selected.game_id)
          .eq('name', selected.title)
          .maybeSingle(),
      ])

      if (error) {
        console.error(error)
        setContent('*Die Zeichen verblassen vor deinen Augen...*')
      } else {
        setContent(data.content)
      }

      const npc = (npcData as NpcTagInfo | null) ?? null
      setNpcInfo(npc)

      if (npc?.location_id != null) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('name')
          .eq('id', npc.location_id)
          .eq('game_id', selected.game_id)
          .maybeSingle()
        setLocationName(locationData?.name ?? null)
      }

      setIsLoadingContent(false)
    })()
  }, [selected])

  if (!selected) return null

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 shadow-[0_0_20px_rgba(0,0,0,0.5)] p-8 relative group">
      
      {/* Edit Button - Absolut positioniert oben rechts */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(selected)}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/30 rounded text-amber-200 text-xs font-serif transition-colors shadow-lg backdrop-blur-md"
        >
          <span>✎</span> Bearbeiten
        </button>
      </div>

      {isLoadingContent ? (
        <div className="text-center py-16 text-amber-200/50 italic font-serif">
          Die mystischen Runen enthüllen sich langsam…
        </div>
      ) : content ? (
        <>
          {npcInfo && (
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] px-2 py-1 rounded-full border border-amber-600/40 bg-amber-900/20 text-amber-100 uppercase tracking-wider">
                NPC
              </span>
              <span className="text-[10px] px-2 py-1 rounded-full border border-white/20 bg-black/40 text-gray-200">
                Name: {npcInfo.name}
              </span>
              {npcInfo.race && (
                <span className="text-[10px] px-2 py-1 rounded-full border border-white/20 bg-black/40 text-gray-200">
                  Rasse: {npcInfo.race}
                </span>
              )}
              {npcInfo.profession && (
                <span className="text-[10px] px-2 py-1 rounded-full border border-white/20 bg-black/40 text-gray-200">
                  Beruf: {npcInfo.profession}
                </span>
              )}
              {npcInfo.age !== null && (
                <span className="text-[10px] px-2 py-1 rounded-full border border-white/20 bg-black/40 text-gray-200">
                  Alter: {npcInfo.age}
                </span>
              )}
              {locationName && (
                <span className="text-[10px] px-2 py-1 rounded-full border border-white/20 bg-black/40 text-gray-200">
                  Heimat: {locationName}
                </span>
              )}
              {npcInfo.article_id !== null && (
                <span className="text-[10px] px-2 py-1 rounded-full border border-white/20 bg-black/40 text-gray-200">
                  Artikel-ID: {npcInfo.article_id}
                </span>
              )}
            </div>
          )}
          <h2 className="font-serif text-2xl text-center mb-6 text-amber-200 tracking-wider">
            <span className="text-amber-500 mr-3">❖</span>
            {selected.title}
            <span className="text-amber-500 ml-3">❖</span>
          </h2>
          <MarkdownRenderer
            content={content}
            onLinkClick={(title) => {
              const match = articles.find((a) => a.title === title)
              if (match) onSelectArticle(match)
              else alert(`Kein Artikel mit dem Titel „${title}" gefunden.`)
            }}
          />
          <div className="text-center text-xs text-amber-200/40 font-serif italic mt-4 border-t border-amber-900/20 pt-4">
            Aus dem Kodex, Folio {selected.id}
          </div>
        </>
      ) : null}
    </div>
  )
}