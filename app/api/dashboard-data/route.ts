import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get('gameId');
    const gameId = Number(gameIdParam);

    if (!gameIdParam || Number.isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid gameId' }, { status: 400 });
    }

    const [
      { data: articles, error: articlesError },
      { data: folders, error: foldersError },
      { data: locations, error: locationsError },
      { data: npcs, error: npcsError },
      { data: gameData, error: gameError },
    ] = await Promise.all([
      supabaseAdmin.from('posts').select('*').eq('game_id', gameId),
      supabaseAdmin.from('folders').select('*').eq('game_id', gameId),
      supabaseAdmin.from('locations').select('id, name').eq('game_id', gameId),
      supabaseAdmin
        .from('npcs')
        .select('id, game_id, name, location_id, race, age, story, profession, article_id, usecase, goal')
        .eq('game_id', gameId),
      supabaseAdmin.from('games').select('name').eq('id', gameId).single(),
    ]);

    if (articlesError) return NextResponse.json({ error: `posts: ${articlesError.message}` }, { status: 500 });
    if (foldersError) return NextResponse.json({ error: `folders: ${foldersError.message}` }, { status: 500 });
    if (locationsError) return NextResponse.json({ error: `locations: ${locationsError.message}` }, { status: 500 });
    if (npcsError) return NextResponse.json({ error: `npcs: ${npcsError.message}` }, { status: 500 });
    if (gameError) return NextResponse.json({ error: `games: ${gameError.message}` }, { status: 500 });

    return NextResponse.json({
      articles: articles || [],
      folders: folders || [],
      locations: locations || [],
      npcs: npcs || [],
      gameName: gameData?.name || '',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
