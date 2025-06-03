'use client'

import { useState } from 'react'
import StatBlockEditor from '@/components/StatBlockEditor'

type Character = {
  id: string
  name: string
  race: string
  profession: string
  stats: any
}

export default function ClientPage({
  user,
  characters = []
}: {
  user: any
  characters?: Character[]
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Willkommen!</h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow mb-6"
      >
        Neuen Charakter erstellen
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
              onClick={() => setShowModal(false)}
            >
              ✖
            </button>
            <StatBlockEditor />
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-2">Deine Charaktere</h2>
      {characters.length === 0 && <p className="text-gray-500">Noch keine Charaktere erstellt.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {characters.map((char) => (
          <div key={char.id} className="border rounded p-4 bg-gray-50">
            <h3 className="font-bold text-lg">{char.name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {char.race} – {char.profession}
            </p>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {JSON.stringify(char.stats, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
