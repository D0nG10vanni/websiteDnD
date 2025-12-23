// lib/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin' // Dein Import

export async function updateGameName(gameId: number, newName: string) {
  console.log("--- DEBUG START: updateGameName ---")
  console.log("1. Input:", { gameId, newName })

  const cookieStore = await cookies()
  const cookieName = `game-auth-${gameId}`
  const authCookie = cookieStore.get(cookieName)
  
  console.log(`2. Cookie Check: Suche nach '${cookieName}'`)
  console.log("   Gefundener Wert:", authCookie?.value)

  // Auth Check
  const isAuthed = authCookie?.value === '1'
  if (!isAuthed) {
    console.error("❌ FEHLER: Nicht autorisiert (Cookie fehlt oder falsch)")
    throw new Error('Nicht autorisiert! Bitte erst einloggen.')
  }

  console.log("3. Auth OK. Starte Supabase Update...")

  try {
    const { data, error, status, statusText } = await supabaseAdmin
      .from('games')
      .update({ name: newName })
      .eq('id', gameId)
      .select()

    if (error) {
      console.error("❌ SUPABASE FEHLER:", error)
      throw new Error(`DB Fehler: ${error.message}`)
    }
    
    console.log("✅ Update erfolgreich. Status:", status, statusText)
    console.log("   Daten:", data)

  } catch (err) {
    console.error("❌ KRITISCHER FEHLER beim Aufruf:", err)
    throw err
  }

  revalidatePath(`/games/${gameId}`)
}