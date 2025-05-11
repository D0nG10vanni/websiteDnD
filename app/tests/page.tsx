// app/page.tsx
import Link from "next/link";
import fs from "fs/promises";
import path from "path";

async function getAllMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return getAllMarkdownFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        return fullPath;
      } else {
        return [];
      }
    })
  );
  return files.flat();
}

export default async function Home() {
  const databaseDir = path.join(process.cwd(), "Database");
  const mdFilePaths = await getAllMarkdownFiles(databaseDir);

  // Gruppieren nach erstem Unterordner (oder "" für Root)
  const articlesByFolder: Record<string, { slug: string; title: string }[]> = {};

  mdFilePaths.forEach((fullPath) => {
    const relPath = path.relative(databaseDir, fullPath);         // z.B. "Gesellschaft/Der König.md"
    const parts = relPath.split(path.sep);                        // ["Gesellschaft", "Der König.md"]
    const fileName = parts.pop()!;                                // "Der König.md"
    const folder = parts.join("/") || "—";                        // "Gesellschaft" oder "" → "—"
    const name = fileName.replace(/\.md$/, "");                   // "Der König"
    const slug = encodeURIComponent(folder === "—" ? name : `${folder}/${name}`);

    if (!articlesByFolder[folder]) {
      articlesByFolder[folder] = [];
    }
    articlesByFolder[folder].push({ slug, title: name });
  });

  // Optional: Ordner alphabetisch sortieren
  const sortedFolders = Object.keys(articlesByFolder).sort((a, b) => a.localeCompare(b));

  return (
    <main className="flex min-h-screen p-8">
      {/* Linke Spalte: Artikel nach Ordnern */}
      <div className="w-1/3 bg-gray-800 p-4 rounded">
        <h2 className="text-xl font-bold mb-4 text-white">Alle Artikel</h2>

        {sortedFolders.map((folder) => (
          <div key={folder} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              {folder === "—" ? "Allgemein" : folder}
            </h3>
            <ul className="list-disc list-inside text-gray-200">
              {articlesByFolder[folder]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map(({ slug, title }) => (
                  <li key={slug}>
                    <Link href={`/tests/${slug}`} className="text-blue-400 hover:underline">
                      {title}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Rechte Spalte */}
      <div className="w-2/3 ml-6 bg-gray-900 p-4 rounded">
        {/* … dein sonstiger Content … */}
      </div>
    </main>
  );
}
