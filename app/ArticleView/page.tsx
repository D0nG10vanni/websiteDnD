import ArticleBrowser from '@/components/ArticleBrowser.client'
import { fetchArticles } from '@/lib/articles'
import Link from 'next/link'

export default async function Page() {
  const articles = await fetchArticles()

  return (
    <div className="min-h-screen bg-[#121017] bg-[url('/textures/parchment-dark.png')] bg-repeat" data-theme="dark">
      <div className="max-w-7xl mx-auto p-6 pt-12">
        <div className="backdrop-blur-sm bg-black/30 rounded-lg border border-amber-900/30 shadow-[0_0_15px_rgba(255,215,0,0.15)]">
          <div className="p-8">
            <h1 className="text-3xl font-serif text-center mx-auto mb-6 text-amber-100">
              <span className="text-amber-500">✦</span> 
              <span className="tracking-widest">GRIMOIRE ARCANUM</span> 
              <span className="text-amber-500">✦</span>
            </h1>
            
            <div className="flex justify-center space-x-4 opacity-70 my-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-700 to-transparent my-auto"></div>
              <span className="text-amber-500 font-serif">✧ ✦ ✧</span>
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-700 to-transparent my-auto"></div>
            </div>
            
            <ArticleBrowser articles={articles} />
            
            <div className="flex flex-col sm:flex-row gap-6 mt-8 w-full justify-center items-center">
              <Link
                href="/ArticleView/NeuerArtikel"
                className="px-6 py-3 bg-amber-900/30 hover:bg-amber-900/50 text-amber-200 border border-amber-700/50 rounded-sm font-serif tracking-wider flex-1 w-full sm:w-auto text-center shadow-[0_0_10px_rgba(255,170,0,0.1)]"
              >
                Neuen Zauber verzeichnen
              </Link>
              <Link
                href="/ArticleView/Upload"
                className="px-6 py-3 bg-amber-900/30 hover:bg-amber-900/50 text-amber-200 border border-amber-700/50 rounded-sm font-serif tracking-wider flex-1 w-full sm:w-auto text-center shadow-[0_0_10px_rgba(255,170,0,0.1)]"
              >
                Alte Schrift entziffern
              </Link>
            </div>
            
            <div className="flex justify-center space-x-4 opacity-70 my-8">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-700 to-transparent my-auto"></div>
              <span className="text-amber-500 font-serif">✧ ✦ ✧</span>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-700 to-transparent my-auto"></div>
            </div>

            <div className="text-center mt-4 text-xs text-amber-200/70 font-serif italic">
              ✧ "Die Geheimnisse der Vergangenheit flüstern durch die Zeitalter zu jenen, die zu hören wissen." ✧
              <br /> ~ Aus den verlorenen Texten von Avallach
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}