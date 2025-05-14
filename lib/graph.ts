// lib/graph.ts
import { supabase } from './supabaseClient'

export type GraphPost = { id: number; content: string }

export async function getGraphArticles(): Promise<GraphPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, content')
  
  if (error) {
    console.error('Supabase error fetching posts:', error)
    throw error
  }

  return data || []
}

const extractLinks = (content: string) => {
  const regex = /\[\[([^\|\]]+)(?:\|[^\]]+)?\]\]/g;
  const links = [];
  let match;
  while ((match = regex.exec(content))) {
    links.push(match[1].trim());
  }
  return [...new Set(links)];
};

const { data: posts } = await supabase
  .from('posts')
  .select('id, content');
const graph = (posts ?? []).map(p => ({
  id: String(p.id),
  connections: extractLinks(p.content)
}));