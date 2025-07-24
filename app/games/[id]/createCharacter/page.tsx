// app/games/[gameId]/characters/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

export default function NewCharacterPage() {
  const router = useRouter()
  const params = useParams()
  const gameId = params?.gameId as string

  const [form, setForm] = useState({
    name: '',
    race: '',
    profession: '',
    background: '',
    alive: true,
    str: 5,
    dex: 5,
    body: 5,
    spd: 5,
    emp: 5,
    cra: 5,
    will: 5,
    luck: 5,
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const charId = uuidv4()

      const { data: user } = await supabase.auth.getUser()
      const playerId = user?.user?.id

      const { error: charError } = await supabase.from('characters').insert({
        id: charId,
        game_id: gameId,
        player_id: playerId,
        name: form.name,
        race: form.race,
        profession: form.profession,
        background: form.background,
        alive: form.alive
      })

      const { error: attrError } = await supabase.from('character_attributes').insert({
        character_id: charId,
        str: form.str,
        dex: form.dex,
        body: form.body,
        spd: form.spd,
        emp: form.emp,
        cra: form.cra,
        will: form.will,
        luck: form.luck
      })

      if (charError || attrError) throw charError || attrError

      router.push(`/games/${gameId}/characters`)
    } catch (err) {
      alert('Fehler beim Erstellen des Charakters.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-serif text-amber-200 mb-4">🛡 Neuer Charakter</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="name" placeholder="Name" onChange={handleChange} required className="input" />
          <input name="race" placeholder="Rasse" onChange={handleChange} required className="input" />
          <input name="profession" placeholder="Profession" onChange={handleChange} required className="input" />
          <input name="background" placeholder="Hintergrund" onChange={handleChange} className="input" />
        </div>

        <fieldset className="border border-amber-900/30 p-4 rounded">
          <legend className="text-sm text-amber-500 font-serif">Attribute</legend>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {['str','dex','body','spd','emp','cra','will','luck'].map(attr => (
              <input
                key={attr}
                type="number"
                name={attr}
                placeholder={attr.toUpperCase()}
                value={form[attr as keyof typeof form] as number}
                onChange={handleChange}
                className="input"
              />
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="alive" checked={form.alive} onChange={handleChange} />
          Lebendig
        </label>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? 'Speichern...' : 'Charakter erstellen'}
        </button>
      </form>

      <style jsx>{`
        .input {
          background: rgba(0,0,0,0.3);
          color: #fcd34d;
          border: 1px solid rgba(252, 211, 77, 0.3);
          border-radius: 4px;
          padding: 0.5rem;
        }
      `}</style>
    </div>
  )
}
