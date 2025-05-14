'use client'

// app/games/new/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NewGamePage() {
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Bitte gib einen Spielnamen ein.')
      return
    }

    const { data, error: insertError } = await supabase
      .from('games')
      .insert({ name: name.trim(), active })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      return
    }

    router.push('/games')
  }

  return (
    <div className="flex justify-center mt-10">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title">Neues Spiel anlegen</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label htmlFor="name" className="label">
                <span className="label-text">Spielname</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="z.B. Meine Kampagne"
                className="input input-bordered w-full"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="cursor-pointer label">
                <span className="label-text">Aktiv</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                />
              </label>
            </div>

            {error && (
              <div className="text-error text-sm">
                {error}
              </div>
            )}

            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary">
                Spiel anlegen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}