export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { fetchGames, Game } from '../../lib/games'

export default async function GamesPage() {
  const games: Game[] = await fetchGames()
  const activeGames = games.filter((game) => game.active)
  const inactiveGames = games.filter((game) => !game.active)

  const renderGameCard = (game: Game) => (
    <li key={game.id} className="card bg-base-200 shadow-md border border-primary/10 hover:shadow-lg transition-all">
      <div className="card-body p-4">
        <Link href={`/games/${game.id}`} className="card-title font-serif text-xl">
          <span className="text-primary mr-2">❧</span>
          {game.name}
        </Link>
        <p className="text-sm font-serif text-base-content/70">
          Begonnen: {new Date(game.created_at).toLocaleDateString()} —
          <span className={`ml-2 ${game.active ? 'text-success' : 'text-error'}`}>
            {game.active ? '✧ Aktive Saga' : '✧ Ruhende Saga'}
          </span>
        </p>
      </div>
    </li>
  )

  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      <div className="max-w-4xl mx-auto p-6 pt-12">
        <div className="card w-full bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body">
            <h1 className="card-title text-3xl font-serif text-center mx-auto mb-6">
              <span className="text-primary">✦</span> Die Chroniken der Abenteuer <span className="text-primary">✦</span>
            </h1>
            
            <div className="divider">✧ ✦ ✧</div>
            
            {games.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl opacity-20 mb-4">✦</div>
                <p className="font-serif text-base-content/60">
                  Noch keine Sagas wurden begonnen...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-lg text-success">Aktive Sagas</h2>
                    <span className="badge badge-success badge-outline">{activeGames.length}</span>
                  </div>
                  {activeGames.length === 0 ? (
                    <div className="text-sm text-base-content/60 italic p-4 border border-base-300 rounded-lg bg-base-200/40">
                      Keine aktive Saga vorhanden.
                    </div>
                  ) : (
                    <ul className="space-y-3">{activeGames.map(renderGameCard)}</ul>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-lg text-warning">Ruhende Sagas</h2>
                    <span className="badge badge-warning badge-outline">{inactiveGames.length}</span>
                  </div>
                  {inactiveGames.length === 0 ? (
                    <div className="text-sm text-base-content/60 italic p-4 border border-base-300 rounded-lg bg-base-200/40">
                      Keine ruhende Saga vorhanden.
                    </div>
                  ) : (
                    <ul className="space-y-3">{inactiveGames.map(renderGameCard)}</ul>
                  )}
                </section>
              </div>
            )}
            
            <div className="divider my-6">✧ ✦ ✧</div>
            
            <div className="flex justify-between items-center">
              <Link href="/" className="btn btn-ghost border border-base-300 font-serif">
                Zurück zum Grimoire
              </Link>
              
              <Link href={`/games/NeuesGame`} className="btn btn-primary font-serif">
                <span className="mr-2">✦</span>
                Neue Saga beginnen
                <span className="ml-2">✦</span>
              </Link>
            </div>
            
            <div className="text-center mt-8 text-xs opacity-70 font-serif">
              ✧ Geschichten, die auf ihre Erzählung warten ✧
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}