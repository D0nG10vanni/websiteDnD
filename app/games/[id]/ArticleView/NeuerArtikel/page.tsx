"use client";

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Folder, X, Save, Sparkles, ScrollText, FolderPlus, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Folder = { 
  id: number; 
  name: string; 
  parent_id: number | null; 
  game_id: number;
  creator_uuid: string;
};

type UploadItem = {
  file: File;
  folderId: number | null;
  name: string;
};

export default function MysticalArticleUpload({ gameId = 1 }: { gameId?: number }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserAndFolders();
  }, [gameId]);

  async function fetchUserAndFolders() {
    setIsLoading(true);
    try {
      // Benutzer abrufen
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setMessage('Fehler beim Abrufen des Benutzers.');
        setIsLoading(false);
        return;
      }

      setUserUuid(user.id);

      // Ordner für das aktuelle Spiel abrufen
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('game_id', gameId)
        .order('name');
        
      if (error) {
        console.error('Error fetching folders:', error);
        setMessage('Fehler beim Laden der Ordner.');
      } else {
        setFolders(data || []);
      }
    } catch (err) {
      console.error('Error fetching user and folders:', err);
      setMessage('Fehler beim Laden der Daten.');
    }
    setIsLoading(false);
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

  const updateItemName = (index: number, name: string) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, name } : item
    ));
  };

  async function uploadFiles() {
    if (items.length === 0) return;
    
    setUploading(true);
    setMessage('');
    
    try {
      const uploadPromises = items.map(async (item) => {
        const text = await item.file.text();
        const folderName = folders.find(f => f.id === item.folderId)?.name ?? null;
        
        const { error } = await supabase.from('posts').insert({
          title: item.name,
          content: text,
          creator: userUuid,
          game_Id: gameId,
          folder_id: item.folderId,
          kategorie: folderName,
          created_at: new Date().toISOString(),
        });
        
        if (error) {
          throw new Error(`Fehler beim Hochladen von "${item.name}": ${error.message}`);
        }
      });
      
      await Promise.all(uploadPromises);
      
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

  if (isLoading) {
    return (
      <>
        {/* Floating Embers */}
        <div className="floating-embers fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {Array.from({length: 12}).map((_, i) => (
            <div 
              key={i}
              className="ember absolute bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full animate-float opacity-0" 
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 4 + 's',
                animationDuration: (Math.random() * 2 + 3) + 's'
              }}
            />
          ))}
        </div>

        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900/30 relative overflow-hidden flex flex-col items-center justify-center">
          {/* Atmospheric Background Effects */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>

          <div className="text-center relative z-10">
            <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-orange-200 font-serif text-lg">Lade magische Ordnerstruktur...</p>
            <div className="text-orange-300 text-xs font-serif opacity-50 mt-2">✧ Die Geister sammeln sich ✧</div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0% { 
              transform: translateY(100vh) translateX(0px) rotate(0deg);
              opacity: 0;
            }
            10% { opacity: 0.8; }
            50% { 
              opacity: 1;
              transform: translateY(50vh) translateX(10px) rotate(180deg);
            }
            90% { opacity: 0.8; }
            100% { 
              transform: translateY(-10px) translateX(30px) rotate(360deg);
              opacity: 0;
            }
          }
          
          .animate-float {
            animation: float linear infinite;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      {/* Floating Embers */}
      <div className="floating-embers fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {Array.from({length: 12}).map((_, i) => (
          <div 
            key={i}
            className="ember absolute bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full animate-float opacity-0" 
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 4 + 's',
              animationDuration: (Math.random() * 2 + 3) + 's'
            }}
          />
        ))}
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900/30 relative overflow-hidden">
        {/* Atmospheric Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto p-6 pt-12 z-10">
          {/* Enhanced Header */}
          <div className="text-center mb-12">
            <div className="relative group perspective-1000 mb-8">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/30 via-red-500/20 to-yellow-500/30 rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-all duration-700 animate-pulse"></div>
              
              <div className="flex items-center justify-center mb-6 relative">
                <ScrollText className="w-12 h-12 text-yellow-400 mr-4 animate-pulse" />
                <h1 className="text-5xl lg:text-6xl font-serif font-bold leading-tight">
                  <span className="bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                    Kompendium Archiv
                  </span>
                </h1>
                <Sparkles className="w-12 h-12 text-yellow-400 ml-4 animate-pulse" />
              </div>
            </div>
            
            <div className="h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent my-6"></div>
            
            <p className="text-orange-200 text-xl font-serif italic leading-relaxed max-w-3xl mx-auto">
              Bringe deine <span className="text-orange-300 font-semibold">mystischen Schriften</span> in die digitale Bibliothek
              <br />
              <span className="text-orange-200/80 text-lg block mt-2">
                ✧ Für Sammler des Wissens und Hüter der Geschichten ✧
              </span>
            </p>
          </div>

          {/* Enhanced Status Message */}
          {message && (
            <div className="mb-8 max-w-4xl mx-auto">
              <div className={`card shadow-2xl border-2 transform-gpu transition-all duration-500 hover:scale-102 ${
                message.includes('Fehler') 
                  ? 'bg-gradient-to-br from-red-100/90 to-red-50/80 border-red-400 backdrop-blur-sm' 
                  : 'bg-gradient-to-br from-green-100/90 to-green-50/80 border-green-400 backdrop-blur-sm'
              }`}>
                <div className="card-body p-6">
                  <div className="flex items-center font-serif text-lg">
                    <span className="mr-3 text-2xl">
                      {message.includes('Fehler') ? '⚠️' : '✅'}
                    </span>
                    <span className={message.includes('Fehler') ? 'text-red-800' : 'text-green-800'}>
                      {message}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Enhanced Folder Overview */}
            <div className="lg:col-span-1">
              <div className="card bg-gradient-to-br from-base-100/15 to-base-100/5 backdrop-blur-lg shadow-2xl border border-orange-500/30 hover:border-orange-400/50 transition-all duration-500 transform-gpu hover:scale-102 hover:shadow-orange-500/20">
                <div className="card-body p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold font-serif flex items-center bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                      <Folder className="w-7 h-7 mr-3 text-orange-400" />
                      Verfügbare Ordner
                    </h2>
                    <a 
                      href="/folder-manager" 
                      className="p-2 text-orange-400 hover:text-orange-300 transition-all duration-300 hover:scale-110 transform-gpu"
                      title="Ordner verwalten"
                    >
                      <Settings className="w-6 h-6" />
                    </a>
                  </div>
                  
                  {/* Folder List */}
                  <div className="max-h-80 overflow-y-auto space-y-3">
                    {folders.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="relative group">
                          <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Folder className="w-16 h-16 text-orange-400 mx-auto mb-4 relative animate-pulse" />
                        </div>
                        <p className="text-orange-200 font-serif text-lg mb-4">Noch keine Ordner vorhanden</p>
                        <a 
                          href="/folder-manager" 
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-orange-100 rounded-lg hover:from-orange-500 hover:to-red-500 transition-all duration-300 font-serif shadow-lg hover:shadow-xl hover:shadow-orange-500/30 transform-gpu hover:scale-105"
                        >
                          <FolderPlus className="w-5 h-5 mr-2" />
                          Ordner erstellen
                        </a>
                      </div>
                    ) : (
                      folders
                        .sort((a, b) => getFolderPath(a).localeCompare(getFolderPath(b)))
                        .map(folder => (
                          <div key={folder.id} className="group">
                            <div className="flex items-center p-3 bg-gradient-to-r from-orange-50/10 to-amber-50/10 backdrop-blur-sm rounded-lg border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 transform-gpu hover:scale-102">
                              <Folder className="w-5 h-5 mr-3 text-orange-400 flex-shrink-0 group-hover:text-orange-300 transition-colors duration-300" />
                              <span className="font-serif text-orange-200 truncate group-hover:text-orange-100 transition-colors duration-300" title={getFolderPath(folder)}>
                                {getFolderPath(folder)}
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  {folders.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-orange-500/30">
                      <a 
                        href="/folder-manager" 
                        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-orange-100 rounded-lg hover:from-orange-500 hover:to-red-500 transition-all duration-300 font-serif shadow-lg hover:shadow-xl hover:shadow-orange-500/30 transform-gpu hover:scale-105"
                      >
                        <Settings className="w-5 h-5 mr-2" />
                        Ordner verwalten
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Upload Area */}
            <div className="lg:col-span-2">
              <div className="card bg-gradient-to-br from-base-100/15 to-base-100/5 backdrop-blur-lg shadow-2xl border border-orange-500/30 hover:border-orange-400/50 transition-all duration-500 transform-gpu hover:scale-102 hover:shadow-orange-500/20">
                <div className="card-body p-6">
                  {/* Enhanced Drag & Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-3 border-dashed rounded-xl p-12 text-center transition-all duration-500 mb-8 group overflow-hidden ${
                      isDragActive 
                        ? 'border-orange-400 bg-gradient-to-br from-orange-500/20 to-red-500/20 scale-102' 
                        : 'border-orange-500/60 bg-gradient-to-br from-orange-500/5 to-red-500/5 hover:bg-gradient-to-br hover:from-orange-500/10 hover:to-red-500/10 hover:border-orange-400/80'
                    }`}
                  >
                    {/* Background Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    
                    <div className="relative z-10">
                      <Upload className={`w-20 h-20 mx-auto mb-6 transition-all duration-500 ${
                        isDragActive ? 'text-orange-300 scale-110 animate-bounce' : 'text-orange-400 group-hover:text-orange-300 group-hover:scale-110'
                      }`} />
                      
                      <h3 className="text-2xl font-serif font-bold mb-4">
                        <span className="bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                          Markdown-Dateien hochladen
                        </span>
                      </h3>
                      
                      <p className="text-orange-200 font-serif text-lg mb-6 leading-relaxed">
                        {isDragActive 
                          ? <span className="text-orange-300 font-semibold">Dateien hier ablegen... ✨</span>
                          : <>
                              Ziehe <span className="text-orange-300 font-semibold">.md Dateien</span> hierher oder klicke zum Auswählen
                              <br />
                              <span className="text-orange-300/80 text-base italic">Die Magie des Wissens wartet</span>
                            </>
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
                        className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-orange-100 rounded-lg hover:from-orange-500 hover:to-red-500 transition-all duration-300 font-serif text-lg shadow-lg hover:shadow-xl hover:shadow-orange-500/30 transform-gpu hover:scale-105 relative overflow-hidden group"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative flex items-center">
                          <span className="mr-3 text-xl">📜</span>
                          Dateien auswählen
                          <span className="ml-3 text-xl">✨</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Selected Files */}
                  {items.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold font-serif mb-6 flex items-center">
                        <span className="bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                          Ausgewählte Artikel ({items.length})
                        </span>
                        <FileText className="w-6 h-6 ml-3 text-orange-400" />
                      </h3>
                      
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {items.map((item, index) => (
                          <div key={index} className="card bg-gradient-to-r from-orange-50/10 to-amber-50/10 backdrop-blur-sm border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 transform-gpu hover:scale-102">
                            <div className="card-body p-4">
                              <div className="flex items-start space-x-4 mb-4">
                                <FileText className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItemName(index, e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800/50 border border-orange-500/30 rounded-lg font-serif text-orange-200 placeholder-orange-400/50 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all duration-300"
                                    placeholder="Artikelname"
                                  />
                                  <p className="text-xs text-orange-300/70 mt-2 font-serif">
                                    📊 {(item.file.size / 1024).toFixed(1)} KB • 📄 {item.file.name}
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeItem(index)}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-300 transform-gpu hover:scale-110"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <Folder className="w-5 h-5 text-orange-400" />
                                <select
                                  value={item.folderId ?? ''}
                                  onChange={e => updateItemFolder(index, e.target.value ? Number(e.target.value) : null)}
                                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-orange-500/30 rounded-lg font-serif text-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all duration-300"
                                >
                                  <option value="">✨ Kein Ordner</option>
                                  {renderFolderOptions()}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={uploadFiles}
                          disabled={uploading}
                          className="px-10 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-orange-100 rounded-lg hover:from-orange-500 hover:to-red-500 transition-all duration-300 font-serif text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-orange-500/30 transform-gpu hover:scale-105 relative overflow-hidden group"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                          <span className="relative">
                            {uploading ? (
                              <div className="flex items-center">
                                <div className="w-5 h-5 border-2 border-orange-200 border-t-transparent rounded-full animate-spin mr-3"></div>
                                <span>Archiviere magische Schriften...</span>
                                <span className="ml-3">✨</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Save className="w-6 h-6 mr-3" />
                                <span>Im Kompendium archivieren ({items.length})</span>
                                <span className="ml-3 text-xl">🏛️</span>
                              </div>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Help Section */}
          <div className="mt-12 card bg-gradient-to-br from-base-100/10 to-base-100/5 backdrop-blur-lg shadow-2xl border border-orange-500/20 hover:border-orange-400/40 transition-all duration-500 transform-gpu hover:scale-102 hover:shadow-orange-500/10">
            <div className="card-body p-8">
              <h3 className="text-2xl font-bold font-serif mb-6 flex items-center justify-center">
                <span className="bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                  💡 Zaubersprüche des Uploads
                </span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 text-orange-200 font-serif">
                <div className="card bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 transform-gpu hover:scale-105">
                  <div className="card-body p-4">
                    <h4 className="font-semibold mb-3 text-orange-300 text-lg flex items-center">
                      <span className="mr-2">📁</span>
                      Ordner zuweisen
                    </h4>
                    <p className="text-sm leading-relaxed">
                      Weise jedem Artikel einen Ordner zu, um sie besser zu organisieren. Ordner können im Ordner-Manager verwaltet werden.
                    </p>
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 transform-gpu hover:scale-105">
                  <div className="card-body p-4">
                    <h4 className="font-semibold mb-3 text-orange-300 text-lg flex items-center">
                      <span className="mr-2">✍️</span>
                      Artikelname bearbeiten
                    </h4>
                    <p className="text-sm leading-relaxed">
                      Bearbeite den Namen jedes Artikels, um ihn klarer zu kennzeichnen. Der Name wird im Kompendium angezeigt.
                    </p>
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 transform-gpu hover:scale-105">
                  <div className="card-body p-4">
                    <h4 className="font-semibold mb-3 text-orange-300 text-lg flex items-center">
                      <span className="mr-2">📜</span>
                      Markdown-Dateien
                    </h4>
                    <p className="text-sm leading-relaxed">
                      Lade Markdown-Dateien (.md) hoch, die automatisch in Artikel umgewandelt werden. Ideal für Textdokumente und Notizen.
                    </p>
                  </div>
                  <div className="card-footer bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-200 text-xs font-serif p-3 rounded-b-lg">
                    <span className="italic">Die Magie des Wissens entfaltet sich in jedem Wort...</span>
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 transform-gpu hover:scale-105">
                  <div className="card-body p-4">
                    <h4 className="font-semibold mb-3 text-orange-300 text-lg flex items-center">
                      <span className="mr-2">⚙️</span>
                      Einstellungen
                    </h4>
                    <p className="text-sm leading-relaxed">
                      Passe die Ordnerstruktur und Upload-Einstellungen im Ordner-Manager an, um dein Kompendium zu optimieren.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .floating-embers {
          pointer-events: none;
        }
        
        .ember {
          animation: float linear infinite;
        }
        
        @keyframes float {
          0% { 
            transform: translateY(100vh) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: 0.8; }
          50% { 
            opacity: 1;
            transform: translateY(50vh) translateX(10px) rotate(180deg);
          }
          90% { opacity: 0.8; }
          100% { 
            transform: translateY(-10px) translateX(30px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
// Floating embers and atmospheric effects
// are implemented using CSS animations and React state management.      
