'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import Link from "next/link";

export default function MarkdownEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [directory, setDirectory] = useState('');
  const [directories, setDirectories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        // Dies würde in einer API-Route erfolgen
        const response = await fetch('/api/directories');
        const data = await response.json();
        setDirectories(data.directories);
      } catch (error) {
        console.error('Fehler beim Laden der Verzeichnisse:', error);
        setMessage('Fehler beim Laden der Verzeichnisse');
      }
    };

    fetchDirectories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!title.trim()) {
      setMessage('Bitte geben Sie einen Titel ein');
      setIsLoading(false);
      return;
    }

    // Dateiname erstellen und Leerzeichen durch Unterstriche ersetzen
    const fileName = `${title.replace(/\s+/g, '_')}.md`;

    try {
      console.log('Sende Anfrage an API mit:', {
        fileName,
        content,
        directory
      });
      
      // API-Aufruf zum Speichern der Markdown-Datei
      const response = await fetch('/api/save-markdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          content,
          directory,
        }),
      });

      console.log('API-Antwort Status:', response.status);
      
      // Parsen der Antwort als Text für Debug-Zwecke
      const responseText = await response.text();
      console.log('API-Antwort Text:', responseText);
      
      // Versuchen, den Text als JSON zu parsen
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        console.error('Fehler beim Parsen der JSON-Antwort:', err);
        setMessage('Fehler: Server-Antwort ist kein gültiges JSON');
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        setMessage('Artikel wurde erfolgreich gespeichert!');
        // Optional: Formular zurücksetzen
        setTitle('');
        setContent('');
      } else {
        setMessage(`Fehler: ${data.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setMessage('Ein Fehler ist aufgetreten beim Speichern des Artikels');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Neuen Markdown-Artikel erstellen</h1>
      
      {message && (
        <div className={`p-4 mb-4 rounded-md ${message.includes('Fehler') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-control w-full max-w-xs">
          <label htmlFor="directory" className="label">
            <span className="label-text">Ordner auswählen</span>
          </label>
          <select
            id="directory"
            value={directory}
            onChange={(e) => setDirectory(e.target.value)}
            className="select select-bordered"
            required
          >
            <option value="">-- Bitte Ordner auswählen --</option>
            {directories.map((dir) => (
              <option key={dir} value={dir}>
            {dir}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titel
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Artikeltitel"
            required
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Inhalt (Markdown)
          </label>
          <div className="flex space-x-4">
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-1/2 p-2 border border-gray-300 rounded-md min-h-64 font-mono"
              placeholder="# Überschrift\n\nIhr Markdown-Inhalt hier..."
              required
            />
            <div className="w-1/2 p-4 border border-gray-300 rounded-md bg-gray-50 min-h-64 prose">
              {content && (
                <div dangerouslySetInnerHTML={{ 
                  __html: content ? require('marked').parse(content) : '' 
                }} />
              )}
            </div>
          </div>
        </div>           
        <div className="flex justify-between items-center mb-4">
            <Link
                href="/tests"            
                className="btn btn-primary">
                Zurück zur Artikelübersicht
            </Link>
            <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Speichern...' : 'Artikel speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}