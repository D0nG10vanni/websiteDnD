'use client'

// app/games/new/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function NewGamePage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!name.trim()) {
      setError('Die Saga benötigt einen Namen, um in die Annalen einzugehen.')
      setIsLoading(false)
      return
    }

    if (!password.trim()) {
      setError('Bitte gib ein Passwort für die Saga an.')
      setIsLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('games')
      .insert({ name: name.trim(), password: password.trim(), active })
      .select('id')
      .single()

    setIsLoading(false)
    
    if (insertError) {
      setError(insertError.message)
      return
    }

    router.push('/games')
  }

  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      <div className="max-w-4xl mx-auto p-6 pt-16">
        <div className="card w-full max-w-md mx-auto bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body">
            <h1 className="card-title text-2xl font-serif text-center mx-auto mb-6">
              <span className="text-primary">✦</span> Eine neue Kampagne beginnen <span className="text-primary">✦</span>
            </h1>
            
            <div className="divider">✧ ✦ ✧</div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control w-full">
                <label htmlFor="name" className="label">
                  <span className="label-text font-serif">Name der Kampagne</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="z.B. Zeit des Sturms"
                  className="input input-bordered input-primary w-full bg-base-200 font-serif"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label htmlFor="password" className="label">
                  <span className="label-text font-serif">Geheime Losung</span>
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Das Passwort ist als Schutz gegen trolling gedacht"
                  className="input input-bordered input-primary w-full bg-base-200 font-serif"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="alert alert-error shadow-lg">
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-serif">{error}</span>
                  </div>
                </div>
              )}
               
              <div className="divider">✧ ✦ ✧</div>

              <div className="flex justify-between items-center gap-4">
                <Link href="/games" className="btn btn-ghost border border-base-300 font-serif flex-shrink-0">
                  Zurück zu den Chroniken
                </Link>
                
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="btn btn-primary font-serif flex-shrink-0">
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Die Feder schreibt...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✦</span>
                      In die Annalen eintragen
                      <span className="ml-2">✦</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <div className="text-center mt-8 text-xs opacity-70 font-serif">
              ✧ Jede große Geschichte beginnt mit dem ersten Kapitel ✧
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}