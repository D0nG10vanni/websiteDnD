// Update the import path if '@/lib/games' does not exist; for example, if the file is at 'lib/games.ts' relative to the project root, use:
import { fetchGameById, Game } from '../../../lib/games'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type Props = { params: { id: string } }

export default async function GameDetailPage({ params }: Props) {
  const id = parseInt(params.id, 10)
  const game: Game | null = await fetchGameById(id)
  if (!game) notFound()

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{game.name}</h1>
      <dl className="space-y-2">
        <div>
          <dt className="font-semibold">ID</dt>
          <dd>{game.id}</dd>
        </div>
        <div>
          <dt className="font-semibold">Status</dt>
          <dd>{game.active ? 'Aktiv' : 'Inaktiv'}</dd>
        </div>
        <div>
          <dt className="font-semibold">Erstellt am</dt>
          <dd>{new Date(game.created_at).toLocaleString()}</dd>
        </div>
      </dl>
      <div className="mt-6">
        <Link href="/games" className="text-blue-600 hover:underline">← Zur Übersicht</Link>
      </div>
    </main>
  )
}