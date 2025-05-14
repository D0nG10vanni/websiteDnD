// app/ArticleView/Upload/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { supabase } from '@/lib/supabaseClient';

type Folder = { id: number; name: string; parent_id: number | null };
type UploadItem = {
  fileHandle: FileSystemFileHandle | File;
  folderId: number | null;
};

export default function UploadPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState<number | null>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFolders();
  }, []);

  async function fetchFolders() {
    const { data, error } = await supabase
      .from('folders')
      .select('id, name, parent_id');
    if (error) console.error('Error fetching folders:', error);
    else setFolders(data || []);
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    const { error } = await supabase
      .from('folders')
      .insert([{ name: newFolderName.trim(), parent_id: newFolderParent }]);
    if (error) console.error('Error creating folder:', error);
    else {
      setNewFolderName('');
      setNewFolderParent(null);
      fetchFolders();
    }
  }

  const onDrop = (
    accepted: (FileSystemFileHandle | File)[],
    rejected: FileRejection[]
  ) => {
    // Map each accepted to an UploadItem wrapper
    const newItems = accepted.map(handle => ({ fileHandle: handle, folderId: null }));
    setItems(prev => [...prev, ...newItems]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: true,
    accept: { 'text/markdown': ['.md'] },
  });

  async function uploadFiles() {
    setUploading(true);
    setMessage('');
    for (const item of items) {
      try {
        const { fileHandle, folderId } = item;
        // Unwrap real File from FileSystemFileHandle if needed
        let file: File;
        if ('getFile' in fileHandle) {
          file = await (fileHandle as FileSystemFileHandle).getFile();
        } else {
          file = fileHandle as File;
        }
        const text = await file.text();
        const folderName = folders.find(f => f.id === folderId)?.name ?? null;
        const { error } = await supabase
          .from('posts')
          .insert({
            title: file.name.replace(/\.md$/, ''),
            content: text,
            creator: 1,
            Game_ID: 1,
            folder_id: folderId,
            kategorie: folderName,
          });
        if (error) throw error;
      } catch (err: any) {
        console.error('Upload error', err);
        setMessage(`Fehler beim Hochladen: ${err.message || err}`);
        setUploading(false);
        return;
      }
    }
    setMessage('Alle Dateien erfolgreich hochgeladen!');
    setItems([]);
    setUploading(false);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Artikel per Drag & Drop hochladen</h1>
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Ordnerstruktur verwalten</h2>
        <ul className="list-disc pl-5 mb-4">
          {folders.map(f => (
            <li key={f.id}>
              {f.name}
              {f.parent_id ? ` (unter ${folders.find(p => p.id === f.parent_id)?.name})` : ''}
            </li>
          ))}
        </ul>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Neuer Ordnername"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className="border p-1 flex-grow rounded"
          />
          <select
            value={newFolderParent ?? ''}
            onChange={e => setNewFolderParent(e.target.value ? Number(e.target.value) : null)}
            className="border p-1 rounded"
          >
            <option value="">Kein Elternordner</option>
            {folders.map(fld => (
              <option key={fld.id} value={fld.id}>{fld.name}</option>
            ))}
          </select>
          <button onClick={createFolder} className="btn btn-primary">Ordner erstellen</button>
        </div>
      </section>
      <section {...getRootProps()} className="border-2 border-dashed p-6 text-center mb-6 rounded">
        <input
          {...getInputProps()}
          multiple
          // @ts-ignore
          webkitdirectory="true"
          // @ts-ignore
          directory=""
        />
        {isDragActive ? <p>Dateien hierher ziehen...</p> : <p>Ziehe Markdown-Dateien hierher oder klicke zum Auswählen</p>}
      </section>
      {items.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Ausgewählte Dateien</h2>
          <ul className="space-y-2 mb-4">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center space-x-4">
                <span>{'name' in item.fileHandle ? item.fileHandle.name : 'Unbekannt'}</span>
                <select
                  value={item.folderId ?? ''}
                  onChange={e => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setItems(prev => prev.map((x,j) => j === idx ? { fileHandle: x.fileHandle, folderId: id } : x));
                  }}
                  className="border p-1 rounded"
                >
                  <option value="">Kein Ordner</option>
                  {folders.map(fld => (
                    <option key={fld.id} value={fld.id}>{fld.name}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          <button onClick={uploadFiles} disabled={uploading} className="btn btn-primary">
            {uploading ? 'Hochladen...' : 'Hochladen'}
          </button>
        </section>
      )}
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}