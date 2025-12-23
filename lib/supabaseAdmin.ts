import { createClient } from '@supabase/supabase-js'

// 1. Variablen laden
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Achte auf den Namen!

// 2. Sicherheitscheck (hilft beim Debuggen)
if (!supabaseUrl) {
  throw new Error('❌ FEHLER: NEXT_PUBLIC_SUPABASE_URL fehlt in .env.local')
}
if (!supabaseServiceKey) {
  throw new Error('❌ FEHLER: SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local')
}

// 3. Client erstellen
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)