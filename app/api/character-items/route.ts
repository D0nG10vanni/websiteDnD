import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');

    if (!characterId) {
      return NextResponse.json({ error: 'characterId is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('character_items')
      .select(`
        id,
        item_id,
        quantity,
        equipped,
        custom_name,
        items:items(*)
      `)
      .eq('character_id', characterId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inventory: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const characterId = body?.characterId;
    const itemId = Number(body?.itemId);

    if (!characterId || Number.isNaN(itemId)) {
      return NextResponse.json({ error: 'characterId and itemId are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('character_items')
      .insert({
        character_id: characterId,
        item_id: itemId,
        quantity: Number(body?.quantity ?? 1),
        equipped: Boolean(body?.equipped ?? false),
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body?.id);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (body.equipped !== undefined) updates.equipped = Boolean(body.equipped);
    if (body.quantity !== undefined) updates.quantity = Number(body.quantity);
    if (body.custom_name !== undefined) updates.custom_name = body.custom_name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('character_items')
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body?.id);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('character_items')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
