// lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Diese Env-Variablen musst du setzen: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl: string = process.env.SUPABASE_URL!
const supabaseServiceKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey
)
