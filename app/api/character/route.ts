import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const data = await req.json()

  const { data: inserted, error } = await supabase
    .from('characters')
    .insert([{
      game_id: data.game_id,
      name: data.name,
      race: data.race,
      profession: data.profession,
      background: data.background,
      stats: data.stats
    }])

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, character: inserted }, { status: 200 })
}
