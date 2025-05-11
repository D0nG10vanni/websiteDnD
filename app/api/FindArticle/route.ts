import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Finde alle Markdown-Dateien im Database-Ordner und Unterordnern
function findAllMarkdownFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Rekursiver Aufruf für Unterordner
      findAllMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      // Markdown-Datei zur Liste hinzufügen
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Versuche, eine Datei zu finden, die dem Knoten-ID oder -Namen entspricht
function findArticleByIdOrName(id: string): string | null {
  const databasePath = path.join(process.cwd(), 'Database');
  const allFiles = findAllMarkdownFiles(databasePath);
  
  // Normalisiere die ID für den Vergleich
  const normalizedId = id.toLowerCase().trim();
  
  // Verschiedene Optionen für den Dateinamen ausprobieren
  for (const file of allFiles) {
    // Basisname der Datei (ohne Pfad und Endung)
    const baseName = path.basename(file, '.md');
    const normalizedBaseName = baseName.toLowerCase().trim();
    
    // Direkte Übereinstimmung mit der ID
    if (normalizedBaseName === normalizedId) {
      return file;
    }
    
    // ID mit Leerzeichen durch Unterstriche oder Bindestriche ersetzen
    if (normalizedBaseName === normalizedId.replace(/\s+/g, '_') ||
        normalizedBaseName === normalizedId.replace(/\s+/g, '-')) {
      return file;
    }
    
    // Übereinstimmung ohne Sonderzeichen
    if (normalizedBaseName.replace(/[^a-z0-9]/g, '') === normalizedId.replace(/[^a-z0-9]/g, '')) {
      return file;
    }
  }
  
  return null;
}

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  console.log('[DEBUG] findArticle id-Param:', id);

  if (!id) {
    return NextResponse.json({ error: 'ID fehlt' }, { status: 400 });
  }

  const candidateDirs = [
    path.join(process.cwd(), 'Database'),
    path.join(process.cwd(), 'database'),
    // …
  ];

  for (const dir of candidateDirs) {
    console.log('[DEBUG] Prüfe Existenz:', dir, fs.existsSync(dir));
    if (!fs.existsSync(dir)) continue;

    const files = findAllMarkdownFiles(dir);
    console.log('[DEBUG] Gefundene .md-Dateien in', dir, ':', files);

    const match = files.find(file => 
      id && path.basename(file, '.md').toLowerCase() === id.replace(/\.md$/i, '').toLowerCase()
    );
    if (match) {
      console.log('[DEBUG] Gefundene Datei:', match);
      return NextResponse.json({ path: match });
    }
  }

  // This block has been moved to the correct position above.
  
  if (!id) {
    return NextResponse.json({ error: 'ID fehlt' }, { status: 400 });
  }
  
  try {
    const articlePath = findArticleByIdOrName(id);
    
    if (!articlePath) {
      return NextResponse.json({ error: 'Artikel nicht gefunden' }, { status: 404 });
    }
    
    // Pfad relativ zum Projektverzeichnis
    const relativePath = path.relative(process.cwd(), articlePath);
    
    return NextResponse.json({ 
      path: relativePath.replace(/\\/g, '/'), // Normalisiere Pfadtrennzeichen für alle Plattformen
      id 
    });
  } catch (error) {
    console.error('Fehler beim Suchen des Artikels:', error);
    return NextResponse.json(
      { error: 'Fehler beim Suchen des Artikels' }, 
      { status: 500 }
    );
  }
}