"use client";

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Folder, Plus, X, Save, Sparkles, ScrollText, FolderPlus } from 'lucide-react';

// Mock Supabase für Demo-Zwecke
const mockSupabase = {
  from: (_table: string) => ({
    select: (_fields: unknown) => Promise.resolve({ data: mockFolders, error: null }),
    insert: (_data: unknown) => Promise.resolve({ error: null })
  })
};

// Mock-Daten für Demo
const mockFolders = [
  { id: 1, name: 'Alchemie & Transmutation', parent_id: null },
  { id: 2, name: 'Alte Weisheiten', parent_id: null },
  { id: 3, name: 'Mystische Geschichten', parent_id: null },
  { id: 4, name: 'Zaubersprüche', parent_id: null },
  { id: 5, name: 'Kräuterkunde', parent_id: null },
  { id: 6, name: 'Grundlagen', parent_id: 5 },
  { id: 7, name: 'Fortgeschritten', parent_id: 5 }
];

type Folder = { id: number; name: string; parent_id: number | null };
type UploadItem = {
  file: File;
  folderId: number | null;
  name: string;
};

export default function MysticalArticleUpload() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState<number | null>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  async function fetchFolders() {
    try {
      // In echter Implementierung: const { data, error } = await supabase.from('folders').select('id, name, parent_id');
      const { data, error } = await mockSupabase.from('folders').select('id, name, parent_id');
      if (error) console.error('Error fetching folders:', error);
      else setFolders(data || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
      // Fallback zu Mock-Daten
      setFolders(mockFolders);
    }
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    
    try {
      // In echter Implementierung: const { error } = await supabase.from('folders').insert([{ name: newFolderName.trim(), parent_id: newFolderParent }]);
      const { error } = await mockSupabase.from('folders').insert([{ name: newFolderName.trim(), parent_id: newFolderParent }]);
      
      if (error) {
        console.error('Error creating folder:', error);
        setMessage('Fehler beim Erstellen des Ordners');
      } else {
        // Mock: Neuen Ordner zur Liste hinzufügen
        const newFolder = {
          id: Math.max(...folders.map(f => f.id)) + 1,
          name: newFolderName.trim(),
          parent_id: newFolderParent
        };
        setFolders(prev => [...prev, newFolder]);
        setNewFolderName('');
        setNewFolderParent(null);
        setShowCreateFolder(false);
        setMessage(`Ordner "${newFolder.name}" erfolgreich erstellt! ✨`);
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setMessage('Fehler beim Erstellen des Ordners');
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const markdownFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.md') || 
      file.type === 'text/markdown' ||
      file.type === 'text/plain'
    );
    
    const newItems = markdownFiles.map(file => ({
      file,
      folderId: null as number | null,
      name: file.name.replace(/\.md$/, '')
    }));
    
    setItems(prev => [...prev, ...newItems]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newItems = files.map(file => ({
        file,
        folderId: null as number | null,
        name: file.name.replace(/\.md$/, '')
      }));
      setItems(prev => [...prev, ...newItems]);
    }
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemFolder = (index: number, folderId: number | null) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, folderId } : item
    ));
  };

  async function uploadFiles() {
    if (items.length === 0) return;
    
    setUploading(true);
    setMessage('');
    
    try {
      for (const item of items) {
        const text = await item.file.text();
        const folderName = folders.find(f => f.id === item.folderId)?.name ?? null;
        
        // In echter Implementierung:
        // const { error } = await supabase.from('posts').insert({
        //   title: item.name,
        //   content: text,
        //   creator: 1,
        //   Game_ID: 1,
        //   folder_id: item.folderId,
        //   kategorie: folderName,
        // });
        
        // Mock für Demo
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Mock upload:', { title: item.name, folder: folderName });
      }
      
      setMessage(`Alle ${items.length} Artikel erfolgreich im Kompendium archiviert! ✨`);
      setItems([]);
    } catch (err: any) {
      console.error('Upload error', err);
      setMessage(`Fehler beim Hochladen: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  }

  const getFolderPath = (folder: Folder): string => {
    if (!folder.parent_id) return folder.name;
    const parent = folders.find(f => f.id === folder.parent_id);
    return parent ? `${getFolderPath(parent)} / ${folder.name}` : folder.name;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-amber-900 to-orange-950">
      {/* Pergament-Textur fehlt noch */}

      <div className="relative max-w-6xl mx-auto p-6 pt-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ScrollText className="w-10 h-10 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold text-yellow-400 font-serif tracking-wider">
              Kompendium Archiv
            </h1>
            <Sparkles className="w-10 h-10 text-yellow-400 ml-3" />
          </div>
          <p className="text-amber-200 text-lg font-serif italic">
            Artikel per Drag & Drop in die mystische Bibliothek hochladen
          </p>
        </div>

        {/* Status-Nachricht */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            message.includes('Fehler') 
              ? 'bg-red-100 border-red-400 text-red-700' 
              : 'bg-green-100 border-green-400 text-green-700'
          }`}>
            <div className="flex items-center font-serif">
              <span className="mr-2">
                {message.includes('Fehler') ? '⚠️' : '✅'}
              </span>
              {message}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ordner-Verwaltung */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-xl border-4 border-amber-800 p-6">
              <h2 className="text-xl font-bold text-amber-900 font-serif mb-4 flex items-center">
                <Folder className="w-6 h-6 mr-2" />
                Ordnerstruktur
              </h2>
              
              {/* Bestehende Ordner */}
              <div className="mb-4 max-h-64 overflow-y-auto">
                <ul className="space-y-2">
                  {folders.map(folder => (
                    <li key={folder.id} className="flex items-center text-amber-800 font-serif">
                      <Folder className="w-4 h-4 mr-2 text-amber-600" />
                      <span className="text-sm">{getFolderPath(folder)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Neuen Ordner erstellen */}
              {!showCreateFolder ? (
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-amber-700 text-amber-100 rounded-lg hover:bg-amber-800 transition-colors font-serif"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Neuen Ordner erstellen
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Ordnername"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    className="w-full px-3 py-2 bg-amber-50 border-2 border-amber-300 rounded-lg focus:border-amber-600 font-serif text-amber-900"
                  />
                  <select
                    value={newFolderParent ?? ''}
                    onChange={e => setNewFolderParent(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-amber-50 border-2 border-amber-300 rounded-lg focus:border-amber-600 font-serif text-amber-900"
                  >
                    <option value="">Hauptordner</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {getFolderPath(folder)}
                      </option>
                    ))}
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={createFolder}
                      className="flex-1 px-3 py-2 bg-amber-700 text-amber-100 rounded-lg hover:bg-amber-800 transition-colors font-serif text-sm"
                    >
                      Erstellen
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateFolder(false);
                        setNewFolderName('');
                        setNewFolderParent(null);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-serif text-sm"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload-Bereich */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-xl border-4 border-amber-800 p-6">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-3 border-dashed rounded-lg p-8 text-center transition-all duration-300 mb-6 ${
                  isDragActive 
                    ? 'border-amber-600 bg-amber-200' 
                    : 'border-amber-400 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <Upload className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                <h3 className="text-xl font-serif text-amber-900 mb-2">
                  Markdown-Dateien hochladen
                </h3>
                <p className="text-amber-700 font-serif mb-4">
                  {isDragActive 
                    ? 'Dateien hier ablegen...' 
                    : 'Ziehe .md Dateien hierher oder klicke zum Auswählen'
                  }
                </p>
                <input
                  type="file"
                  multiple
                  accept=".md,.markdown,text/markdown,text/plain"
                  onChange={handleFileInput}
                  className="hidden"
                  id="fileInput"
                />
                <button
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className="px-6 py-3 bg-amber-700 text-amber-100 rounded-lg hover:bg-amber-800 transition-colors font-serif"
                >
                  Dateien auswählen
                </button>
              </div>

              {/* Ausgewählte Dateien */}
              {items.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-amber-900 font-serif mb-4">
                    Ausgewählte Artikel ({items.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 bg-amber-100 p-3 rounded-lg border border-amber-300">
                        <FileText className="w-5 h-5 text-amber-700 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-amber-900 truncate">{item.name}</p>
                          <p className="text-xs text-amber-600">{(item.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <select
                          value={item.folderId ?? ''}
                          onChange={e => updateItemFolder(index, e.target.value ? Number(e.target.value) : null)}
                          className="px-2 py-1 bg-amber-50 border border-amber-300 rounded text-sm font-serif text-amber-900"
                        >
                          <option value="">Kein Ordner</option>
                          {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>
                              {getFolderPath(folder)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={uploadFiles}
                      disabled={uploading}
                      className="px-8 py-3 bg-amber-700 text-amber-100 rounded-lg hover:bg-amber-800 transition-colors font-serif disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-amber-200 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Archiviere...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Save className="w-5 h-5 mr-2" />
                          Im Kompendium archivieren
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs opacity-70 text-amber-200 font-serif">
          ✧ Verwaltet mit mystischen Kräften und digitaler Magie ✧
        </div>
      </div>
    </div>
  );
}