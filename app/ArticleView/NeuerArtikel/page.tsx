'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MarkdownEditor() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    if (!title.trim() || !content.trim()) {
      setMessage('Bitte alle Felder ausfüllen')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/save-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      })

      const text = await response.text()
      let data: any = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch (err) {
        console.error('Invalid JSON response from /api/save-articles:', text)
        setMessage('Server-Antwort ungültig')
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        const errMsg = data.error || response.statusText
        setMessage(`Fehler: ${errMsg}`)
      } else {
        setMessage('Artikel erfolgreich gespeichert!')
        setTitle('')
        setContent('')
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      setMessage('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200" data-theme="fantasy">
      <div className="max-w-4xl mx-auto p-6 pt-12">
        <div className="card w-full bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body">
            <h1 className="card-title text-3xl font-serif text-center mx-auto mb-6">
              <span className="text-primary">✦</span> Das Grimoire <span className="text-primary">✦</span>
            </h1>
            
            {message && (
              <div className={`alert ${message.includes('Fehler') ? 'alert-error' : 'alert-success'} shadow-lg mb-6`}>
                <div>
                  {message.includes('Fehler') ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{message}</span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-serif text-lg">Titel des Zaubers</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input input-bordered input-primary w-full bg-base-200 font-serif"
                  placeholder="Gib dem Zauber einen Namen..."
                  required
                />
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-serif text-lg">Inhalt des Zaubers (Markdown)</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="textarea textarea-bordered textarea-primary w-full h-64 font-mono bg-base-200"
                  placeholder="# Überschrift&#10;&#10;Schreibe deinen Zauber hier..."
                  required
                />
              </div>
              
              <div className="divider">✦ ✧ ✦</div>
              
              <div className="flex justify-between items-center">
                <Link href="/ArticleView" className="btn btn-ghost border border-base-300">
                  <span className="font-serif">Zurück zum Kompendium</span>
                </Link>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="btn btn-primary">
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span className="font-serif">Verzaubere...</span>
                    </>
                  ) : (
                    <span className="font-serif">Im Grimoire festhalten</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="text-center mt-8 text-xs opacity-70 font-serif">
          ✧ Verfasst mit alten Tinten und Pergament ✧
        </div>
      </div>
    </div>
  )
}