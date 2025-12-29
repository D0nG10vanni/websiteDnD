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
  game_id: number
  creator_uuid: string
  updated_at: string | null
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
    inventory?: InventoryItem[]; // Das neue Feld
}

// Basis Item Definition (aus der 'items' Tabelle)
export interface BaseItem {
  id: number;
  name: string;
  type: string;
  rarity: string;
  damage?: string;
  armor_sp?: number;
  weight?: number;
  price?: number;
  description?: string;
}

// Das Item im Inventar (aus der 'character_items' Tabelle)
export interface InventoryItem {
  id: number; // ID des character_items Eintrags
  item_id: number;
  quantity: number;
  equipped: boolean;
  custom_name?: string;
  // Hier joinen wir das eigentliche Item hinein
  items: BaseItem | null; 
}
