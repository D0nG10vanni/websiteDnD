export interface Post {
  id: number
  created_at: string
  title: string
  creator: number
  content: string
  kategorie: string
  game_id: number
  folder_id: number
}

export interface Game {
  id: number
  created_at: string
  active: boolean
  name: string
  password: string
  spieler: number
}

export interface Folder {
  id: number
  created_at: string | null
  name: string
  parent_id: number | null
}

export type User = { 
    id: string 
    username: string 
    banner_url?: string 
    avatar_url?: string 
    title?: string 
    level?: number 
    faction?: string 
    rank?: string 
    bio?: string 
    joined_date?: string 
    stats?: 
    { quests_completed?: number 
    fame_points?: number 
    wisdom_score?: number } 
    achievements?: 
    { icon: string 
        name: string 
        description: string }[] 
    timeline?: { 
        date: string 
        title: string 
        description: string }[] 
}
        
export type Character = { 
    id: string 
    name: string 
    portrait_url?: string 
    level?: number 
    class?: string 
    race?: string 
    specialization?: string 
    age?: number 
    traits?: { 
        name: string 
        rarity: number }[] 
}

