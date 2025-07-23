interface ArticleToolbarProps {
  showPreview: boolean
  setShowPreview: (show: boolean) => void
  lastSavedAt: Date | null
  onSave: () => void
  isSaving: boolean
  canSave: boolean
}

export default function ArticleToolbar({
  showPreview,
  setShowPreview,
  lastSavedAt,
  onSave,
  isSaving,
  canSave
}: ArticleToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-amber-200/50 font-serif text-xs">Live-Vorschau:</span>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
            />
            <div className={`w-10 h-5 rounded-full transition-colors ${
              showPreview ? 'bg-green-600' : 'bg-amber-900/50'
            }`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${
                showPreview ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
          </label>
        </div>
        
        {lastSavedAt && (
          <span className="text-amber-200/40 text-xs font-serif">
            Entwurf gespeichert: {lastSavedAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      <button
        onClick={onSave}
        disabled={isSaving || !canSave}
        className="px-3 py-2 border border-amber-900/40 rounded-sm font-serif text-xs text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Speichere...' : '💾 Artikel speichern'}
      </button>
    </div>
  )
}