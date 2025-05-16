// /app/games/[id]/PasswordForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { id: number }

export default function PasswordForm({ id }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/games/${id}/validate-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.refresh()     // Seite neu laden, dann wird Cookie gelesen
    } else {
      setError('Falsches Passwort')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200" data-theme="fantasy">
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-sm bg-base-100 shadow-xl border border-primary/20 p-6"
      >
        <h2 className="card-title mb-4 text-xl font-serif text-center">
          Passwort erforderlich
        </h2>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Saga-Passwort"
          className="input input-bordered w-full mb-4"
        />

        {error && <p className="text-error text-sm mb-2">{error}</p>}

        <button type="submit" className="btn btn-primary w-full font-serif">
          Einloggen
        </button>
      </form>
    </div>
  )
}
