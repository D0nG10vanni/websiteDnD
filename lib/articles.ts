// lib/articles.ts
import { supabase } from './supabaseClient'

export type Article = {
  id:           number
  title:        string
  category:     string  // das ist die Überkategorie
  subcategory?: string  // das ist die eigentliche Ordner-Kategorie
}

export async function fetchArticles(): Promise<Article[]> {
  // 1) Alle Posts mit folder_id
  const { data: posts, error: e1 } = await supabase
    .from('posts')
    .select('id, title, folder_id')
    .order('created_at', { ascending: false })

  if (e1) throw e1

  // 2) Alle Folder (inkl. parent_id)
  const { data: folders, error: e2 } = await supabase
    .from('folders')
    .select('id, name, parent_id')

  if (e2) throw e2

  // 3) Je Post Unter- und Über-Kategorie ermitteln
  return (posts ?? []).map((p: any) => {
    const folder = folders?.find(f => f.id === p.folder_id) || null
    const parent = folder && folder.parent_id
      ? folders!.find(f => f.id === folder.parent_id)
      : null

    return {
      id:       p.id,
      title:    p.title,
      category: parent?.name ?? folder?.name ?? 'Unkategorisiert',
      subcategory: parent ? folder!.name : undefined
    }
  })
}
