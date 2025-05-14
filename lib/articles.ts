// lib/articles.ts
import { supabase } from './supabaseClient'

export type Article = {
  id:           number
  title:        string
  content:      string        // neu
  category:     string        // Überkategorie
  subcategory?: string        // Ordner-Kategorie
}

export async function fetchArticles(): Promise<Article[]> {
  // wir nehmen jetzt auch content mit
  const { data: posts, error: e1 } = await supabase
    .from('posts')
    .select('id, title, content, folder_id')
    .order('created_at', { ascending: false })

  if (e1) throw e1

  const { data: folders, error: e2 } = await supabase
    .from('folders')
    .select('id, name, parent_id')

  if (e2) throw e2

  return (posts ?? []).map((p: any) => {
    const folder = folders?.find(f => f.id === p.folder_id) || null
    const parent = folder && folder.parent_id
      ? folders!.find(f => f.id === folder.parent_id)
      : null

    return {
      id:          p.id,
      title:       p.title,
      content:     p.content,                            // neu
      category:    parent?.name ?? folder?.name ?? 'Unkategorisiert',
      subcategory: parent ? folder!.name : undefined
    }
  })
}
