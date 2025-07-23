import { useRouter } from 'next/navigation'

interface ArticleHeaderProps {
  onBack: () => void
}

export default function ArticleHeader({ onBack }: ArticleHeaderProps) {
  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-center text-xl text-amber-200">
          <span className="text-amber-500">❖</span> NEUER ARTIKEL <span className="text-amber-500">❖</span>
        </h2>
        <button
          onClick={onBack}
          className="px-3 py-2 border border-amber-900/40 rounded-sm font-serif text-xs text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30 transition-colors"
        >
          ← Zurück
        </button>
      </div>
    </div>
  )
}