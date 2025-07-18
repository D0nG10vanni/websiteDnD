'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useUserCharacters, type Character } from '@/lib/characterService'
import StatBlockEditor from '@/components/StatBlockEditor'

export default function UserHomepage() {
  const { user } = useAuth()
  const { characters, loading, error, refetch } = useUserCharacters(user?.id)
  const [showModal, setShowModal] = useState(false)

  // Character Status Badge
  const getStatusBadge = (character: Character) => {
    if (!character.alive) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">💀 Verstorben</span>
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✨ Lebendig</span>
  }

  // Character Card Component
  const CharacterCard = ({ character }: { character: Character }) => (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{character.name}</h3>
          <p className="text-sm text-gray-600">
            Level {character.level} {character.race} {character.profession}
          </p>
          {character.background && (
            <p className="text-xs text-gray-500 mt-1">Hintergrund: {character.background}</p>
          )}
        </div>
        {getStatusBadge(character)}
      </div>

      {/* Stats Preview */}
      {character.stats && typeof character.stats === 'object' && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">Hauptattribute:</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {Object.entries(character.stats).slice(0, 6).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-1 rounded text-center">
                <div className="font-medium">{key.toUpperCase()}</div>
                <div className="text-gray-600">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-gray-400 border-t pt-2 mt-3">
        <div>Erstellt: {new Date(character.created_at).toLocaleDateString('de-DE')}</div>
        {character.updated_at !== character.created_at && (
          <div>Zuletzt bearbeitet: {new Date(character.updated_at).toLocaleDateString('de-DE')}</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
          Bearbeiten
        </button>
        <button className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors">
          Details
        </button>
      </div>
    </div>
  )

  if (!user) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Nicht angemeldet</h2>
          <p className="text-gray-500">Bitte melde dich an, um deine Charaktere zu sehen.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header mit User-Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Willkommen zurück, {user.user_metadata?.username || user.user_metadata?.name || user.email?.split('@')[0] || 'Abenteurer'}!
        </h1>
        <p className="text-gray-600">Hier sind deine D&D Charaktere und Abenteuer.</p>
      </div>

      {/* Create Character Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          Neuen Charakter erstellen
        </button>
      </div>

      {/* Character Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-black text-xl font-bold"
              onClick={() => setShowModal(false)}
            >
              ✖
            </button>
            <StatBlockEditor />
          </div>
        </div>
      )}

      {/* Characters Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Deine Charaktere</h2>
          {characters.length > 0 && (
            <div className="text-sm text-gray-500">
              {characters.length} Charakter{characters.length !== 1 ? 'e' : ''} gefunden
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Lade deine Charaktere...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <span>⚠️</span>
              <span className="font-medium">Fehler beim Laden der Charaktere:</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && characters.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Noch keine Charaktere erstellt</h3>
            <p className="text-gray-500 mb-4">
              Erstelle deinen ersten D&D Charakter und beginne dein Abenteuer!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Jetzt Charakter erstellen
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

      {/* Stats Section */}
      {characters.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiken</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{characters.length}</div>
              <div className="text-sm text-gray-500">Charaktere</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {characters.filter(c => c.alive).length}
              </div>
              <div className="text-sm text-gray-500">Lebendig</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(characters.reduce((sum, c) => sum + c.level, 0) / characters.length) || 0}
              </div>
              <div className="text-sm text-gray-500">Ø Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {new Set(characters.map(c => c.race)).size}
              </div>
              <div className="text-sm text-gray-500">Rassen</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}