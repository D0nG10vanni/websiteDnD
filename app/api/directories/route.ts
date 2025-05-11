import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    console.log('API-Anfrage für Verzeichnisse erhalten');
    
    // Basisverzeichnis, in dem sich alle Ihre Markdown-Unterordner befinden
    const baseDir = path.join(process.cwd(), 'Database');
    console.log(`Suche nach Verzeichnissen in: ${baseDir}`);
    
    // Stellen Sie sicher, dass das Verzeichnis existiert
    try {
      await fs.access(baseDir);
      console.log('Database-Verzeichnis gefunden');
    } catch (err) {
      console.log('Database-Verzeichnis nicht gefunden, erstelle es...');
      await fs.mkdir(baseDir, { recursive: true });
      return NextResponse.json({ directories: [''] });
    }
    
    // Lesen Sie die Verzeichnisse im Basisverzeichnis
    const files = await fs.readdir(baseDir, { withFileTypes: true });
    console.log(`Gefundene Dateien/Verzeichnisse: ${files.length}`);
    
    // Filtern Sie nach Verzeichnissen und erstellen Sie die vollständigen Pfade
    const directories = files
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log(`Gefundene Hauptverzeichnisse: ${directories.join(', ') || 'keine'}`);
    
    // Durchsuchen Sie rekursiv die Unterverzeichnisse
    const allDirectories = [''];  // Leerer String für das Hauptverzeichnis
    
    for (const dir of directories) {
      allDirectories.push(dir);
      
      try {
        // Finden Sie Unterverzeichnisse
        const subDirPath = path.join(baseDir, dir);
        const subDirs = await fs.readdir(subDirPath, { withFileTypes: true });
        
        for (const subDir of subDirs.filter(d => d.isDirectory())) {
          allDirectories.push(`${dir}/${subDir.name}`);
          console.log(`Unterverzeichnis gefunden: ${dir}/${subDir.name}`);
        }
      } catch (err) {
        console.error(`Fehler beim Lesen von Unterverzeichnissen in ${dir}:`, err);
        // Weiter zum nächsten Verzeichnis
      }
    }
    
    console.log(`Alle gefundenen Verzeichnisse: ${allDirectories.join(', ')}`);
    return NextResponse.json({ directories: allDirectories });
  } catch (error) {
    console.error('Fehler beim Lesen der Verzeichnisse:', error);
    return NextResponse.json(
      { error: 'Fehler beim Lesen der Verzeichnisse', details: String(error) },
      { status: 500 }
    );
  }
}