import ArticleBrowser from "../../components/ArticleBrowser.client"
import { fetchArticles } from "../../lib/articles"

export default async function Page() {
  const articles = (await fetchArticles()).map(article => ({
    id: article.id || 0, // Ensure id exists or provide a default value
    title: article.title,
    folder: article.folder,
  }))

  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      <div className="max-w-6xl mx-auto p-6 pt-12">
        <div className="card w-full bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body">
            <h1 className="card-title text-3xl font-serif text-center mx-auto mb-2">
              <span className="text-primary">✦</span> Das Kompendium <span className="text-primary">✦</span>
            </h1>
            
            <p className="text-center font-serif text-sm opacity-75 mb-8">
              Alte Schriften und vergessene Weisheiten
            </p>
            
            <div className="divider">✦ ✧ ✦</div>
            
            <main className="py-4">
              <ArticleBrowser articles={articles} />
            </main>
            
            <div className="divider">✦ ✧ ✦</div>
            
            <div className="flex justify-center mt-4">
              <a href="/ArticleView/Upload" className="btn btn-primary mr-4">
                <span className="font-serif">Artikel hochladen</span>
              </a>
              <a href="/ArticleView/NeuerArtikel" className="btn btn-primary">
                <span className="font-serif">Neuen Zauber verfassen</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8 text-xs opacity-70 font-serif">
          ✧ Ein Blick in die Geheimnisse der Vergangenheit ✧
        </div>
      </div>
    </div>
  )
}