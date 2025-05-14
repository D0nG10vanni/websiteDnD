// app/api/save-articles/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(request: Request) {
  console.log('💾 save-articles POST handler gestartet');

  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    console.error('❌ JSON-Parsing fehlgeschlagen:', err);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, content } = body;
  if (!title || !content) {
    console.error('❌ Fehlende Felder:', body);
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  }

  try {
    // Achte auf lowercase table-name, falls deine Tabelle "posts" heißt:
    const { data, error } = await supabase
      .from('posts')               // <-- hier lowercase
      .insert([{ title, content, creator: 1 , "Game_ID": 1 }])
      .select()
      .single();    

    if (error) {
      console.error('❌ Supabase-Insert-Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Artikel gespeichert:', data);
    return NextResponse.json({ article: data }, { status: 200 });
  } catch (err) {
    console.error('❌ Unerwarteter Fehler:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
