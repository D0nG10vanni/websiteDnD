import { supabase } from './supabaseClient'

export type Article = {
  id:     number
  title:  string
  folder: string
}

export async function fetchArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('posts')              // ganz sicher lowercase
    .select('id, title, kategorie')
    .order('created_at', { ascending: false }) as { data: { id: number; title: string; folder: string }[] | null, error: any }

  if (error) {
    console.error(
      'Supabase-Fehler beim Laden der Artikel:',
      'code=',    error.code,
      'message=', error.message,
      'details=', error.details,
      'hint=',    error.hint
    )
    throw new Error(error.message)
  }

  console.log('✅ articles:', data)
    if (!data) {
        console.error('Supabase returned no data for articles')
        throw new Error('No data returned from Supabase')
    }
  if (!Array.isArray(data)) {
    throw new Error('Unexpected data format received from Supabase');
  }

  const articles: Article[] = data.map(item => ({
    id: item.id,
    title: item.title,
    folder: item.folder,
  }));

  return articles;
}
