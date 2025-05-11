import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Explizite Fehlerbehandlung beim Parsen des Requests
    let reqData;
    try {
      reqData = await request.json();
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json(
        { error: 'Ungültiges JSON-Format in der Anfrage' },
        { status: 400 }
      );
    }
    
    const { fileName, content, directory } = reqData;
    
    // Validieren der Eingabe
    if (!fileName || !content) {
      return NextResponse.json(
        { error: 'Dateiname und Inhalt sind erforderlich' },
        { status: 400 }
      );
    }
    
    console.log(`Speichern von ${fileName} in Verzeichnis ${directory || 'root'}`);
    
    // Basisverzeichnis, in dem sich alle Ihre Markdown-Dateien befinden
    const baseDir = path.join(process.cwd(), 'Database');
    
    // Vollständiger Pfad zum Speichern der Datei
    const dirPath = directory ? path.join(baseDir, directory) : baseDir;
    const filePath = path.join(dirPath, fileName);
    
    console.log(`Vollständiger Pfad: ${filePath}`);
    
    // Stellen Sie sicher, dass das Basisverzeichnis existiert
    try {
      await fs.access(baseDir);
    } catch {
      console.log('Erstelle Basisverzeichnis Database');
      await fs.mkdir(baseDir, { recursive: true });
    }
    
    // Stellen Sie sicher, dass das Zielverzeichnis existiert
    try {
      await fs.access(dirPath);
    } catch {
      console.log(`Erstelle Verzeichnis ${dirPath}`);
      await fs.mkdir(dirPath, { recursive: true });
    }
    
    // Speichern der Datei
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`Datei erfolgreich gespeichert: ${filePath}`);
    
    // Erfolgreiche Antwort
    return NextResponse.json({ 
      success: true, 
      filePath: directory ? `${directory}/${fileName}` : fileName 
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Markdown-Datei:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Datei', details: String(error) },
      { status: 500 }
    );
  }
}