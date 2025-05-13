import ArticleBrowser from "../../../components/ArticleBrowserTEST.client"
import { fetchArticles } from "../../../lib/articlessb"

export default async function Page() {
  const articles = (await fetchArticles()).map(article => ({
    id: article.id || 0, // Ensure id exists or provide a default value
    title: article.title,
    folder: article.folder,
  }))

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">!!! TESTSEITE !!!</h1>
      <ArticleBrowser articles={articles} />
    </main>
  )
}
