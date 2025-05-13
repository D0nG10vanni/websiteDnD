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

export interface Article {
  slug: string;
  title: string;
  folder: string;
}

export async function fetchArticles(): Promise<Article[]> {
  const databaseDir = path.join(process.cwd(), "Database");
  const paths = await getAllMarkdownFiles(databaseDir);

  return paths.map((fullPath) => {
    const rel = path.relative(databaseDir, fullPath);       // z.B. "Gesellschaft/Der König.md"
    const parts = rel.split(path.sep);
    const file = parts.pop()!;                              // "Der König.md"
    const folder = parts.join("/") || "Allgemein";         // Ordnername oder "Allgemein"
    const title = file.replace(/\.md$/, "");                // "Der König"
    const slug = `${folder}/${title}`;                   // "Gesellschaft/Der König"  
    const title_raw = `${title}`                        // reine titel mit .md
    return { slug, title, folder, title_raw };
  });
}
