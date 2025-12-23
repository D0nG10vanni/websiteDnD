import { cookies } from 'next/headers'
import PasswordForm from '../../../components/PasswordForm'
import { fetchGameById } from '../../../lib/games'
import { notFound } from 'next/navigation'
import Link from 'next/link'
// Importiere den neuen Editor Component
import GameHeaderEditor from '../../../components/GameHeaderEditor' 

type Props = { params: { id: string } }

export default async function GameDetailPage({ params }: Props) {
  // --- Next.js 15 Anpassung: params müssen awaitet werden ---
  const { id } = await params // Falls du Next.js 15 nutzt, hier await hinzufügen
  const gameId = parseInt(id, 10)
  
  const game = await fetchGameById(gameId)
  if (!game) {
    return notFound()
  }

  // 1) Cookie auslesen
  const cookieStore = await cookies()
  const isAuthed = cookieStore.get(`game-auth-${id}`)?.value === '1'

  // 2) wenn nicht authed -> Passwort-Form anzeigen
  if (!isAuthed) {
    return <PasswordForm id={gameId} />
  }

  // 3) wenn authed -> ursprüngliches UI
  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      <div className="max-w-4xl mx-auto p-6 pt-12">
        <div className="card w-full bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body">
            
            {/* HIER WURDE GEÄNDERT: Statt h1 nun der Editor Component */}
            <GameHeaderEditor 
              gameId={game.id} 
              initialName={game.name} 
            />
            
            <div className="divider">✧ ✦ ✧</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Add grid content here if needed */}
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
              <Link href="/games" className="btn btn-ghost border border-base-300 font-serif">
                <span className="mr-2">←</span>
                Zurück zur Übersicht
              </Link>
              
              <Link href={`/games/${game.id}/logs`} className="btn btn-primary font-serif">
                <span className="mr-2">✦</span>
                Diese Saga fortführen
                <span className="ml-2">✦</span>
              </Link>
              
              <Link href={`/games/${game.id}/ArticleView`} className="btn btn-secondary font-serif">
                <span className="mr-2">✧</span>
                Zum Kompendium
                <span className="ml-2">✧</span>
              </Link>
            </div>
            <div className="text-center mt-8 text-xs opacity-70 font-serif">
              ✧ In den Annalen für die Ewigkeit festgehalten ✧
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}