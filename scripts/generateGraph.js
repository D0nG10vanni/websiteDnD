// scripts/generateGraph.js
const fs   = require('fs');
const path = require('path');

// 1) Datenbank-Ordner und Ausgabe-Pfad definieren
const DB_DIR = path.resolve(process.cwd(), 'Database');
const OUT    = path.resolve(process.cwd(), 'public', 'graph.json');

// 2) Markdown-Dateien finden
function getMarkdownFiles(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getMarkdownFiles(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

// 3) Artikel-ID aus Dateiname
function articleId(filePath) {
  return path.basename(filePath, '.md');
}

// 4) Links in [[…]] extrahieren
function extractLinks(content) {
  const regex = /\[\[([^\|\]]+)(?:\|[^\]]+)?\]\]/g;
  const links = [];
  let match;
  while ((match = regex.exec(content))) {
    links.push(match[1].trim());
  }
  return Array.from(new Set(links));
}

// 5) Finde alle Markdown-Dateien
if (!fs.existsSync(DB_DIR)) {
  console.error('❌ Database-Ordner nicht gefunden unter:', DB_DIR);
  process.exit(1);
}
const files = getMarkdownFiles(DB_DIR);
console.log(`🔍 Gefundene Markdown-Dateien (${files.length}):`);

// 6) Baue das Graph-Array
const graph = files.map((file) => {
  const id = articleId(file);
    // an Stelle von: fs.readFileSync(file, 'utf8')
    const rawLatin1 = fs.readFileSync(file, 'latin1');
    // dann in einen echten UTF-8-String umwandeln:
    const text = Buffer.from(rawLatin1, 'binary').toString('utf8');
  const connections = extractLinks(text);
  return { id, connections };
});

console.log('\n📊 Berechneter Graph:');
console.log(JSON.stringify(graph, null, 2));

fs.writeFileSync(
  OUT,
  JSON.stringify(graph, null, 2),
  { encoding: 'utf8' }
);

console.log(`✅ graph.json erzeugt unter: ${OUT}`);
