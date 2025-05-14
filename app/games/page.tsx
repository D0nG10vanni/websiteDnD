export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { fetchGames, Game } from '../../lib/games'

export default async function GamesPage() {
  const games: Game[] = await fetchGames()
  console.log('🎮 GamesPage got:', games)

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Spiele-Übersicht</h1>
      <ul className="space-y-4">
        {games.map(game => (
          <React.Fragment key={game.id}>
            <li className="p-4 border rounded hover:bg-gray-50">
              <Link href={`/games/${game.id}`} className="text-xl font-medium">
                {game.name}
              </Link>
              <p className="text-sm text-gray-500">
                Erstellt: {new Date(game.created_at).toLocaleDateString()} — {game.active ? 'Aktiv' : 'Inaktiv'}
              </p>
            </li>
            
          </React.Fragment>
        ))}
      </ul>
            <Link href={`/games/NeuesGame`} className="text-xl font-medium">
              <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">  
                Neue Kampagne
              </button>
            </Link>
    </main>
  )
}
