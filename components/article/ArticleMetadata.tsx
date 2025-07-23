interface ArticleMetadataProps {
  title: string
  setTitle: (title: string) => void
  folderId: number | null
  setFolderId: (folderId: number | null) => void
  folders: Folder[]
  gameId: number
  isLoadingFolders?: boolean
}

type Folder = { 
  id: number; 
  name: string; 
  parent_id: number | null; 
  game_id: number;
  creator_uuid: string;
};

export default function ArticleMetadata({
  title,
  setTitle,
  folderId,
  setFolderId,
  folders,
  gameId,
  isLoadingFolders = false
}: ArticleMetadataProps) {
  
  // Ordner-Pfad-Funktion wie in der Upload-Seite
  const getFolderPath = (folder: Folder): string => {
    if (!folder.parent_id) return folder.name;
    const parent = folders.find(f => f.id === folder.parent_id);
    return parent ? `${getFolderPath(parent)} / ${folder.name}` : folder.name;
  };

  const renderFolderOptions = () => {
    const sortedFolders = [...folders].sort((a, b) => {
      const pathA = getFolderPath(a);
      const pathB = getFolderPath(b);
      return pathA.localeCompare(pathB);
    });

    return sortedFolders.map(folder => (
      <option key={folder.id} value={folder.id}>
        {getFolderPath(folder)}
      </option>
    ));
  };

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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-amber-200/50 font-serif text-xs">
            Ordner {isLoadingFolders && <span className="text-amber-400">⟳</span>}
          </label>
          {!isLoadingFolders && folders.length === 0 && (
            <a 
              href={`/games/${gameId}/ArticleView/Ordnerstruktur`}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              📁 Ordner erstellen
            </a>
          )}
        </div>
        <select
          value={folderId || ''}
          onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
          className="flex-1 bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50"
          disabled={isLoadingFolders}
        >
          <option value="">
            {isLoadingFolders 
              ? 'Lade Ordner...' 
              : folders.length === 0 
              ? 'Keine Ordner verfügbar' 
              : '✨ Unkategorisiert'
            }
          </option>
          {renderFolderOptions()}
        </select>
        {!isLoadingFolders && folders.length === 0 && (
          <div className="text-xs text-amber-600/60 mt-1">
            Erstelle zuerst Ordner im Ordner-Manager
          </div>
        )}
      </div>
    </div>
  )
}