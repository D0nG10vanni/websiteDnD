'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useUserCharacters, type Character } from '@/lib/characterService'
import StatBlockEditor from '@/components/StatBlockEditor'

// Hilfskomponente für Attribute
const StatBox = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-slate-900/50 border border-slate-700 p-2 rounded flex flex-col items-center justify-center min-w-[3rem]">
    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label.slice(0, 3)}</span>
    <span className="text-lg font-bold text-amber-50 font-serif">{String(value)}</span>
  </div>
)

export default function UserHomepage() {
  const { user } = useAuth()
  const { characters, loading, error, refetch } = useUserCharacters(user?.id)
  const [showModal, setShowModal] = useState(false)

  // Status Badge mit Fantasy-Touch
  const getStatusBadge = (character: Character) => {
    if (!character.alive) {
      return (
        <span className="px-3 py-1 bg-red-900/30 border border-red-800 text-red-400 text-xs rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(220,38,38,0.2)]">
          💀 <span className="font-serif tracking-wide">Gefallen</span>
        </span>
      )
    }
    return (
      <span className="px-3 py-1 bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-xs rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
        ✨ <span className="font-serif tracking-wide">Lebendig</span>
      </span>
    )
  }

  // Character Card Component
  const CharacterCard = ({ character }: { character: Character }) => (
    <div className="group relative bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-amber-500/50 overflow-hidden flex flex-col h-full">
      {/* Dekorativer Glow Effekt */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

      <div className="relative z-10 flex flex-col h-full">
        
        {/* NEU: Spiel / Kampagne Badge */}
        <div className="flex justify-between items-start mb-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/80 border border-slate-700 text-[10px] uppercase tracking-widest text-amber-500/80 font-bold mb-1">
            <span>🎲</span>
            {/* Hier greifen wir auf den geladenen Namen zu */}
            <span>{character.games?.name || 'Heimatlos'}</span>
          </div>
          {getStatusBadge(character)}
        </div>

        <div className="mb-4">
          <h3 className="font-serif text-xl font-bold text-amber-50 group-hover:text-amber-400 transition-colors truncate">
            {character.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
            <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300 border border-slate-600 font-mono">
              Lvl {character.level}
            </span>
            <span className="truncate">{character.race} {character.profession}</span>
          </div>
        </div>

        {/* Background Story Snippet */}
        {character.background && (
          <div className="mb-4 text-xs text-slate-400 italic border-l-2 border-slate-600 pl-3 py-1 line-clamp-2">
            "{character.background}"
          </div>
        )}

        {/* Stats Preview - Schiebt den Rest nach unten (flex-grow) */}
        <div className="flex-grow">
          {character.stats && typeof character.stats === 'object' && (
            <div className="mb-5">
              <div className="grid grid-cols-6 gap-2">
                {Object.entries(character.stats).slice(0, 6).map(([key, value]) => (
                  <StatBox key={key} label={key} value={value} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info & Buttons */}
        <div className="mt-auto">
          <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest mb-4 border-t border-slate-700/50 pt-2">
            <span>Erstellt: {new Date(character.created_at).toLocaleDateString('de-DE')}</span>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold px-3 py-2 rounded text-sm transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95">
              Bearbeiten
            </button>
            <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded text-sm transition-colors border border-slate-600 hover:border-slate-500">
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Nicht angemeldet State
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md p-8 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-serif font-bold text-amber-50 mb-2">Die Tore sind verschlossen</h2>
          <p className="text-slate-400">Bitte tritt ein (Login), um Einsicht in deine Chroniken zu erhalten.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30">
      {/* Background Texture Overlay (Optional, für mehr Tiefe) */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-50 pointer-events-none" />

      <div className="relative p-6 max-w-7xl mx-auto z-10">
        
        {/* Header Section */}
        <div className="mb-12 border-b border-slate-800 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <p className="text-amber-500 text-sm font-bold tracking-widest uppercase mb-2">Die Chroniken von</p>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 filter drop-shadow-sm">
                {user.user_metadata?.username || user.user_metadata?.name || user.email?.split('@')[0] || 'Reisender'}
              </h1>
              <p className="text-slate-400 mt-2 max-w-2xl">
                Verwalte deine Helden, studiere ihre Werte und bereite dich auf das nächste Abenteuer vor.
              </p>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/30 font-bold transition-all hover:scale-105 flex items-center gap-2 group"
            >
              <span className="text-xl group-hover:rotate-90 transition-transform duration-300">⚔️</span>
              Neuen Helden erschaffen
            </button>
          </div>
        </div>

        {/* Character Modal in UserHomepage */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                onClick={() => setShowModal(false)}
              >
                ✖
              </button>
              
              <h2 className="text-2xl font-serif text-amber-50 mb-6 border-b border-slate-800 pb-2">
                Neuen Charakter schmieden
              </h2>
              
              {/* HIER ÜBERGIBST DU JETZT DIE FUNKTIONEN */}
              <StatBlockEditor 
                onSuccess={() => {
                  setShowModal(false); // Modal schließen
                  refetch(); // Liste neu laden!
                }}
                onCancel={() => setShowModal(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-serif font-bold text-slate-100">Deine Helden</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
            {characters.length > 0 && (
              <span className="text-xs font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded">
                {characters.length} EINTRÄGE
              </span>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
              <div className="animate-spin text-amber-500 text-4xl mb-4 inline-block">🔮</div>
              <p className="text-slate-400 font-serif text-lg">Konsultiere die Sphären...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-6 mb-8 flex items-start gap-4">
              <div className="text-2xl">🔥</div>
              <div>
                <h3 className="text-red-400 font-bold mb-1">Ein Fluch liegt auf der Verbindung</h3>
                <p className="text-red-300/80 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && characters.length === 0 && (
            <div className="text-center py-20 px-4 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-700 transition-colors">
              <div className="text-6xl mb-6 opacity-50 grayscale">📜</div>
              <h3 className="text-2xl font-serif font-bold text-slate-300 mb-2">Das Buch ist leer</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Noch hat kein Held seinen Fuß in diese Welt gesetzt. Es ist an der Zeit, eine Legende zu beginnen.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="text-amber-400 hover:text-amber-300 font-bold border-b-2 border-amber-500/30 hover:border-amber-500 transition-all pb-1"
              >
                Erschaffe den Ersten &rarr;
              </button>
            </div>
          )}

          {/* Characters Grid */}
          {!loading && !error && characters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
          )}
        </div>

        {/* Campaign Stats Section */}
        {characters.length > 0 && (
          <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-serif font-bold text-slate-300 mb-6 flex items-center gap-2">
              <span>📊</span> Kampagnen-Statistiken
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="text-3xl font-bold text-amber-500 font-serif mb-1">{characters.length}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Gesamt</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="text-3xl font-bold text-emerald-500 font-serif mb-1">
                  {characters.filter(c => c.alive).length}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Überlebende</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="text-3xl font-bold text-indigo-400 font-serif mb-1">
                  {Math.round(characters.reduce((sum, c) => sum + c.level, 0) / characters.length) || 0}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Ø Stufe</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="text-3xl font-bold text-purple-400 font-serif mb-1">
                  {new Set(characters.map(c => c.race)).size}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Völker</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}