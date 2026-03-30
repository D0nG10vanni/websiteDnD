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

    const { data: gameData, error: gameError } = await supabaseAdmin
      .from('games')
      .select('id, gamemaster_uuid')
      .eq('id', gameId)
      .single();

    if (gameError) {
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }

    if (!gameData) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    let gamemasterName: string | null = null;
    if (gameData.gamemaster_uuid) {
      const { data: gmData } = await supabaseAdmin
        .from('Users')
        .select('username')
        .eq('user_id', gameData.gamemaster_uuid)
        .single();

      gamemasterName = gmData?.username || null;
    }

    return NextResponse.json({
      gameId: gameData.id,
      gamemasterUuid: gameData.gamemaster_uuid,
      gamemasterName,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
