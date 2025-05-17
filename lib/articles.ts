// lib/articles.ts
import { supabase } from './supabaseClient'
import type { Post } from './types'

export type Article = {
  id:           number
  title:        string
  content:      string        // neu
  category:     string        // Überkategorie
  subcategory?: string        // Ordner-Kategorie
}

export async function fetchArticlesByGameId(gameId: number): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('game_id', gameId)

  if (error) throw error
  return data || []
}


export async function fetchArticlesWithFolders(gameId: number): Promise<Article[]> {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('game_id', gameId);

  if (error) throw error;

  const { data: folders, error: e2 } = await supabase
    .from('folders')
    .select('id, name, parent_id');

  if (e2) throw e2;

  return (posts ?? []).map((p: any) => {
    const folder = folders?.find(f => f.id === p.folder_id) || null;
    const parent = folder && folder.parent_id
      ? folders!.find(f => f.id === folder.parent_id)
      : null;

    return {
      id:          p.id,
      title:       p.title,
      content:     p.content,                            // neu
      category:    parent?.name ?? folder?.name ?? 'Unkategorisiert',
      subcategory: parent ? folder!.name : undefined
    };
  });
}
