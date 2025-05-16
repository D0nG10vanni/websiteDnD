// app/api/games/[id]/validate-password/route.ts
import { NextResponse } from 'next/server'
import { fetchGameById } from '../../../../../lib/games'

export async function POST(
  request: Request,
  // ACHTUNG: params ist jetzt ein Promise!
  context: { params: Promise<{ id: string }> }
) {
  // erst auflösen …
  const { id: idParam } = await context.params
  const id = parseInt(idParam, 10)

  // … und dann weiter wie gehabt
  const { password } = await request.json()
  const game = await fetchGameById(id)
  if (!game) {
    return NextResponse.json({ message: 'Saga nicht gefunden' }, { status: 404 })
  }

  if (password === game.password) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set(`game-auth-${id}`, '1', {
      path: `/games/${id}`,
      maxAge: 60 * 60, // 1 Stunde
      httpOnly: true,
    })
    return res
  } else {
    return NextResponse.json(
      { message: 'Ungültiges Passwort' },
      { status: 401 }
    )
  }
}
