"use client";

import { useParams } from 'next/navigation'
import NeuerArtikelPage from './../../../../../components/WriteArticle'  // Angepasster Import-Pfad

export default function NeuerArtikelPageWrapper() {
  const params = useParams()
  const gameId = parseInt(params.id as string, 10)

  console.log('Wrapper params:', params)
  console.log('Wrapper gameId:', gameId)

  return (
    <NeuerArtikelPage gameId={gameId} />
  )
}