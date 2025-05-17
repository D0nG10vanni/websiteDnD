import { ReactNode } from 'react'

export default function GameLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { id: string }
}) 
{
  // optional: hier schon dein Game-Header ziehen und rendern
  return (
    <div className="game-detail">
      {/* z.B. <GameHeader id={params.id} /> */}
      {children}
    </div>
  )
}