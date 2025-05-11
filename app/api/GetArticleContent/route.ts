import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Debugging-Funktion zum Protokollieren wichtiger Informationen
function debugLog(message: string, data?: any) {
  console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articlePath = searchParams.get('path');
  
  debugLog(`Anfrage für Artikelinhalt erhalten: ${articlePath}`);
  
  if (!articlePath) {
    return NextResponse.json({ error: 'Pfad fehlt' }, { status: 400 });
  }
  
  try {
    // Vollständigen Pfad abrufen
    const fullPath = path.join(process.cwd(), articlePath);
    debugLog(`Vollständiger Dateipfad: ${fullPath}`);
    
    // Sicherheitsüberprüfung: Stellen sicher, dass der Pfad innerhalb des Projektverzeichnisses liegt
    if (!fullPath.startsWith(process.cwd())) {
      debugLog(`Sicherheitsverletzung: Pfad außerhalb des Projektverzeichnisses`);
      return NextResponse.json(
        { error: 'Zugriff verweigert: Der Pfad muss im Projektverzeichnis liegen' }, 
        { status: 403 }
      );
    }
    
    // Prüfen, ob die Datei existiert
    if (!fs.existsSync(fullPath)) {
      debugLog(`Datei nicht gefunden: ${fullPath}`);
      
      // Versuche, die Datei mit .md-Erweiterung zu finden, falls sie fehlt
      const pathWithMd = fullPath.endsWith('.md') ? fullPath : `${fullPath}.md`;
      if (!fullPath.endsWith('.md') && fs.existsSync(pathWithMd)) {
        debugLog(`Datei mit .md-Erweiterung gefunden: ${pathWithMd}`);
        const content = fs.readFileSync(pathWithMd, 'utf8');
        const result = processFileContent(content, articlePath + '.md');
        return NextResponse.json(result);
      }
      
      return NextResponse.json(
        { error: 'Datei nicht gefunden', path: fullPath }, 
        { status: 404 }
      );
    }
    
    // Dateiinhalt lesen
    const content = fs.readFileSync(fullPath, 'utf8');
    debugLog(`Dateiinhalt gelesen, Länge: ${content.length} Zeichen`);
    
    const result = processFileContent(content, articlePath);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fehler beim Lesen des Artikels:', error);
    return NextResponse.json(
      { error: 'Fehler beim Lesen des Artikels', details: String(error) }, 
      { status: 500 }
    );
  }
}

// Hilfsfunktion zur Verarbeitung des Dateiinhalts
function processFileContent(content: string, articlePath: string) {
  // Metadaten extrahieren (falls vorhanden)
  const metadataMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const metadata = metadataMatch ? parseYamlMetadata(metadataMatch[1]) : {};
  
  // Inhalt ohne Frontmatter
  const textContent = metadataMatch 
    ? content.slice(metadataMatch[0].length).trim() 
    : content;
  
  debugLog(`Metadata extrahiert:`, metadata);
  
  return {
    content: textContent,
    metadata,
    path: articlePath
  };
}

// YAML-Frontmatter-Parser
function parseYamlMetadata(yamlString: string): Record<string, any> {
  const metadata: Record<string, any> = {};
  
  // Jede Zeile nach dem Schema "key: value" parsen
  yamlString.split('\n').forEach(line => {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      metadata[key.trim()] = value.trim();
    }
  });
  
  return metadata;
}