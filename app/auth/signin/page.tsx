'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Wenn schon eingeloggt, direkt zum Dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/')  // oder dein Dashboard
    })
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      // Erfolg → Weiterleiten ins geschützte Dashboard
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 bg-[url('/parchment-bg.png')] bg-opacity-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-950 p-8 rounded-lg border border-purple-900 shadow-xl">
        <div>
          <h1 className="text-center text-3xl font-serif font-bold text-amber-200 mb-6">Portal der Eingeweihten</h1>
        </div>
        
        {errorMsg && (
          <div className="bg-red-900 bg-opacity-70 border border-red-700 text-amber-100 p-3 rounded-md shadow-md">
            <p>{errorMsg}</p>
          </div>
        )}
        
        <form onSubmit={handleSignIn} className="mt-8 space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-amber-200 font-medium">Eure Botschaftsadresse</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 border border-purple-900 rounded-md bg-gray-800 text-amber-100 placeholder-gray-500 focus:ring-2 focus:ring-purple-700 focus:border-transparent"
                required
                placeholder="botschaft@reichkunde.de"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-amber-200 font-medium">Euer geheimes Losungswort</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 border border-purple-900 rounded-md bg-gray-800 text-amber-100 placeholder-gray-500 focus:ring-2 focus:ring-purple-700 focus:border-transparent"
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-purple-700 text-amber-100 font-medium rounded-md bg-purple-900 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all duration-300 shadow-md"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Die Siegel werden geprüft...
                </span>
              ) : (
                'Das Portal öffnen'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-amber-200">
            Noch kein Mitglied des Bundes?{' '}
            <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 underline font-medium transition-colors duration-300">
              Aufnahmeantrag stellen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}