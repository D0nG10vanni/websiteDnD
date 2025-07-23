import { useRef } from 'react'

interface MarkdownEditorProps {
  content: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export default function MarkdownEditor({ content, onChange, onKeyDown }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-amber-200 font-medium">
          <span className="text-amber-500">⌨</span> Editor
        </h3>
        <div className="text-amber-600/60 text-xs">
          Drücke Enter für Live-Rendering
        </div>
      </div>
      
      <textarea
        ref={textareaRef}
        value={content}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={`Beginne hier mit dem Schreiben...

# Großer Titel
## Untertitel
### Kleinerer Titel

**Fetter Text** und *kursiver Text*

- Aufzählungspunkt
- Noch ein Punkt

[[Wiki-Link zu anderem Artikel]]

> Ein Zitat oder wichtiger Hinweis

\`\`\`
Code-Block
\`\`\`

| Tabelle | Spalte 2 |
|---------|----------|
| Zeile 1 | Wert     |`}
        className="w-full h-[400px] bg-black/50 border border-amber-900/50 rounded-sm p-3 text-amber-100 placeholder-amber-200/30 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-700/50"
        spellCheck={false}
      />
      
      <div className="mt-2 text-amber-600/60 text-xs font-serif">
        Tipp: Verwende [[Artikelname]] für Wiki-Links zu anderen Artikeln
      </div>
    </div>
  )
}