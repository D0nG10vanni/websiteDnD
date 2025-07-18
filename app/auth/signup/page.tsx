'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      // Supabase Auth SignUp
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }    // wird in auth.users.user_metadata gespeichert
        }
      })

      if (error) {
        throw error
      }

      // Nur wenn User erfolgreich erstellt wurde
      if (data?.user) {
        // Explizit den Username in die Users Tabelle einfügen
        const { error: insertError } = await supabase
          .from('Users')  // Ohne Anführungszeichen probieren
          .upsert({
            user_id: data.user.id,
            email: data.user.email,
            username: username,  // Explizit den lokalen username verwenden
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (insertError) {
          console.error('Fehler beim Speichern des Users:', insertError)
          throw new Error(`Fehler beim Speichern: ${insertError.message}`)
        }

        console.log('User erfolgreich in Users Tabelle gespeichert:', {
          user_id: data.user.id,
          email: data.user.email,
          username: username
        })
      }

      // Redirect zu Sign In
      router.push('/auth/signin')

    } catch (error: any) {
      console.error('SignUp Fehler:', error)
      setErrorMsg(error.message || 'Ein unbekannter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 bg-[url('/parchment-bg.png')] bg-opacity-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-950 p-8 rounded-lg border border-amber-900 shadow-xl">
        <div>
          <h1 className="text-center text-3xl font-serif font-bold text-amber-200 mb-6">Der Bund der Abenteurer</h1>
          <h2 className="text-center text-xl font-medium text-amber-100">Aufnahme neuer Mitglieder</h2>
        </div>
        
        {errorMsg && (
          <div className="bg-red-900 bg-opacity-70 border border-red-700 text-amber-100 p-3 rounded-md shadow-md">
            <p>{errorMsg}</p>
          </div>
        )}
        
        <form onSubmit={handleSignUp} className="mt-8 space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-amber-200 font-medium">Euer Rufname</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-3 border border-amber-900 rounded-md bg-gray-800 text-amber-100 placeholder-gray-500 focus:ring-2 focus:ring-amber-700 focus:border-transparent"
                required
                placeholder="Rufname eingeben"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-amber-200 font-medium">Eure Botschaftsadresse</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 border border-amber-900 rounded-md bg-gray-800 text-amber-100 placeholder-gray-500 focus:ring-2 focus:ring-amber-700 focus:border-transparent"
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
                className="w-full p-3 border border-amber-900 rounded-md bg-gray-800 text-amber-100 placeholder-gray-500 focus:ring-2 focus:ring-amber-700 focus:border-transparent"
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-amber-700 text-amber-100 font-medium rounded-md bg-amber-900 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-700 transition-all duration-300 shadow-md"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Die Schriftrollen werden gesiegelt...
                </span>
              ) : (
                'Den Schwur leisten'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-amber-200">
            Bereits Mitglied des Bundes?{' '}
            <Link href="/auth/signin" className="text-amber-400 hover:text-amber-300 underline font-medium transition-colors duration-300">
              Zum Portal der Eingeweihten
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
