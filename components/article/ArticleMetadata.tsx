interface ArticleMetadataProps {
  title: string
  setTitle: (title: string) => void
  folderId: number | null
  setFolderId: (folderId: number | null) => void
  folders: any[]
}

export default function ArticleMetadata({
  title,
  setTitle,
  folderId,
  setFolderId,
  folders
}: ArticleMetadataProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-amber-200/50 font-serif text-xs mb-2">
          Titel *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Der Titel deines Artikels…"
          className="flex-1 bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 placeholder-amber-200/30 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50"
        />
      </div>
      
      <div>
        <label className="block text-amber-200/50 font-serif text-xs mb-2">
          Ordner
        </label>
        <select
          value={folderId || ''}
          onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
          className="flex-1 bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50"
        >
          <option value="">Unkategorisiert</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}