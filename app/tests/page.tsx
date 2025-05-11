// app/tests/page.tsx
import ArticleBrowser from "../../components/ArticleBrowser.client";
import { fetchArticles } from "../../lib/articles";

export default async function Page() {
  const articles = await fetchArticles();

  return (
    <main className="p-8">
      <ArticleBrowser articles={articles} />
    </main>
  );
}
