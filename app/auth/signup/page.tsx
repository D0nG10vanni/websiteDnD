'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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

    // Supabase Auth SignUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }    // wird in auth.users.user_metadata gespeichert
      }
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      // Du kannst hier auch einen Redirect zu einem "Check your email"-Screen machen
      router.push('/auth/signin')
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Registrieren</h1>
      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Passwort</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded"
        >
          {loading ? 'Registrierung…' : 'Registrieren'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        Schon registriert?{' '}
        <a href="/auth/signin" className="text-blue-600 underline">Hier einloggen</a>
      </p>
    </main>
  )
}
