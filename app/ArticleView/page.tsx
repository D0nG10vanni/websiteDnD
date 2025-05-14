import ArticleBrowser from '@/components/ArticleBrowser.client'
import { fetchArticles } from '@/lib/articles'

export default async function Page() {
  const articles = await fetchArticles()

  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      <div className="max-w-7xl mx-auto p-6 pt-12">
        <div className="card w-full bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body">
            <h1 className="card-title text-3xl font-serif text-center mx-auto mb-6">
              <span className="text-primary">✦</span> Das Kompendium <span className="text-primary">✦</span>
            </h1>
            
            <div className="divider">✧ ✦ ✧</div>
            
            <ArticleBrowser articles={articles} />
            
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