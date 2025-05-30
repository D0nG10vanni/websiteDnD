"use client";

import { useParams } from 'next/navigation'
import FolderManager from '../../../../../components/folderManager'

export default function FolderManagerPage() {
  const params = useParams()
  const gameId = parseInt(params.id as string, 10)

  return (
    <FolderManager gameId={gameId} />
  )
}