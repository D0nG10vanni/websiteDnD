import ArticleBrowser from '@/components/ArticleBrowser.client'
import { fetchArticlesByGameId } from '@/lib/articles'
import { fetchGameById } from '@/lib/games'
import Link from 'next/link'

type Props = { params: { id: string } }

export default async function Page({ params }: Props) {
  const gameId = parseInt(params.id, 10)
  const articles = await fetchArticlesByGameId(gameId)
  const game = await fetchGameById(gameId)

// MUSS NOCH GEMACHT WERDEN: Nur Artikel zeigen, die zu dem jeweiligen Spiel gehören

  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      <div className="max-w-7xl mx-auto p-6 pt-12">
        <div className="card w-full bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body">
            <h1 className="card-title text-3xl font-serif text-center mx-auto mb-6">
              <span className="text-primary">✦</span> ENCYCLOPAEDIA <span className="text-primary">✦</span>
            </h1>  
            <div className="divider">✧ ✦ ✧</div>  
            <h1 className="card-title text-xl font-serif text-center mx-auto mb-3">
              <span className="text-primary">✧</span> Es gibt {articles.length} Artikel zum Spiel "{game ? game.name : 'Unbekannt'}" <span className="text-primary">✧</span>
            </h1>
            <ArticleBrowser 
                initialArticles={articles}
                gameId={gameId} />
              <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center items-center">
                <Link
                  href="/games/[gameId]"
                  as={`/games/${gameId}`}
                  className="btn btn-primary flex-1 w-full sm:w-auto"
                >
                  Zurück zur Spielübersicht
                </Link>
                <Link
                  href="/ArticleView/Upload"
                  className="btn btn-primary flex-1 w-full sm:w-auto"
                >
                  Neuen Artikel hochladen
                </Link>
              </div>
            <div className="divider mt-8">✧ ✦ ✧</div>

            <div className="text-center mt-4 text-xs opacity-70 font-serif">
              ✧ "Das ist meine Geschichte, nicht deine. Du musst mich sie zu Ende erzählen lassen." ✧
              <br /> ~ Cirilla Fiona Elen Riannon
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}