import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type PlayerGroup = {
  player: {
    id: number | string;
    username: string;
    avatar_url?: string;
  };
  characters: any[];
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get('gameId');
    const gameId = Number(gameIdParam);

    if (!gameIdParam || Number.isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid gameId' }, { status: 400 });
    }

    const { data: charactersData, error: charactersError } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('game_id', gameId);

    if (charactersError) {
      return NextResponse.json({ error: charactersError.message }, { status: 500 });
    }

    const characters = charactersData || [];
    if (characters.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const playerIds = [...new Set(characters.map((char: any) => String(char.player_id)).filter(Boolean))];

    let usersByPlayerRef = new Map<string, string>();
    if (playerIds.length > 0) {
      const inList = playerIds.join(',');
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('Users')
        .select('id, player_id, username')
        .or(`id.in.(${inList}),player_id.in.(${inList})`);

      if (!usersError) {
        (usersData || []).forEach((u: any) => {
          if (u?.id != null && u?.username) usersByPlayerRef.set(String(u.id), u.username);
          if (u?.player_id != null && u?.username) usersByPlayerRef.set(String(u.player_id), u.username);
        });
      }
    }

    const groups: Record<string, PlayerGroup> = {};
    characters.forEach((char: any) => {
      const pId = char.player_id;
      const key = String(pId);
      const username = usersByPlayerRef.get(key) || `Spieler ${key}`;

      if (!groups[key]) {
        groups[key] = {
          player: {
            id: pId,
            username,
          },
          characters: [],
        };
      }

      groups[key].characters.push(char);
    });

    const sortedGroups = Object.values(groups).sort((a, b) =>
      a.player.username.localeCompare(b.player.username)
    );

    return NextResponse.json({ groups: sortedGroups });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
