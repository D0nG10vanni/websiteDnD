export default function MarkdownHelp() {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/20 p-4">
      <details className="group">
        <summary className="cursor-pointer text-amber-200/50 font-serif text-xs hover:text-amber-200 transition-colors">
          <span className="text-amber-500">❓</span> Markdown-Hilfe anzeigen
        </summary>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-amber-200 font-semibold mb-2">Überschriften</div>
            <div className="text-amber-200/70 font-mono space-y-1">
              <div># Titel 1</div>
              <div>## Titel 2</div>
              <div>### Titel 3</div>
            </div>
          </div>
          <div>
            <div className="text-amber-200 font-semibold mb-2">Formatierung</div>
            <div className="text-amber-200/70 font-mono space-y-1">
              <div>**fett**</div>
              <div>*kursiv*</div>
              <div>~~durchgestrichen~~</div>
              <div>`code`</div>
            </div>
          </div>
          <div>
            <div className="text-amber-200 font-semibold mb-2">Listen</div>
            <div className="text-amber-200/70 font-mono space-y-1">
              <div>- Punkt 1</div>
              <div>- Punkt 2</div>
              <div>1. Nummeriert</div>
              <div>2. Liste</div>
            </div>
          </div>
          <div>
            <div className="text-amber-200 font-semibold mb-2">Links</div>
            <div className="text-amber-200/70 font-mono space-y-1">
              <div>[[Wiki Link]]</div>
              <div>[Link](URL)</div>
              <div>[[Artikel|Alias]]</div>
            </div>
          </div>
          <div>
            <div className="text-amber-200 font-semibold mb-2">Sonstiges</div>
            <div className="text-amber-200/70 font-mono space-y-1">
              <div>&gt; Zitat</div>
              <div>---</div>
              <div>```code```</div>
            </div>
          </div>
          <div>
            <div className="text-amber-200 font-semibold mb-2">Tabellen</div>
            <div className="text-amber-200/70 font-mono space-y-1">
              <div>| A | B |</div>
              <div>|---|---|</div>
              <div>| 1 | 2 |</div>
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}