// components/GameHeaderEditor.tsx
'use client'

import { useState } from 'react'
import { updateGameName } from '../lib/actions' // Pfad angepasst auf relativen Import

type Props = {
  gameId: number
  initialName: string
}

export default function GameHeaderEditor({ gameId, initialName }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setIsLoading(true)
    try {
      await updateGameName(gameId, name)
      setIsEditing(false)
    } catch (error) {
      alert('Fehler beim Speichern')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col items-center gap-2 mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input input-bordered input-primary w-full max-w-md text-center font-serif text-xl"
          autoFocus
        />
        <div className="flex gap-2">
          <button 
            onClick={handleSave} 
            disabled={isLoading}
            className="btn btn-sm btn-primary"
          >
            {isLoading ? 'Speichert...' : 'Speichern'}
          </button>
          <button 
            onClick={() => {
              setIsEditing(false)
              setName(initialName) // Reset bei Abbruch
            }}
            className="btn btn-sm btn-ghost"
          >
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative flex justify-center items-center mb-4">
      <h1 className="card-title text-3xl font-serif text-center">
        <span className="text-primary">✦</span> {initialName}{' '}
        <span className="text-primary">✦</span>
      </h1>
      
      {/* Bearbeiten Button (erscheint beim Hovern oder immer sichtbar auf Mobile) */}
      <button
        onClick={() => setIsEditing(true)}
        className="btn btn-ghost btn-circle btn-sm absolute -right-12 opacity-50 hover:opacity-100 transition-opacity"
        title="Namen bearbeiten"
      >
        ✏️
      </button>
    </div>
  )
}