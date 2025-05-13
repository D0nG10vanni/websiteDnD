export const dynamic = 'force-dynamic';
// app/database/[...slug]/page.tsx
import fs from 'fs'
import path from 'path'
import { compileMDX } from '@next/mdx/server'
import type { Metadata } from 'next'

// 1) find all .md-Dateien rekursiv und baue generateStaticParams
export async function generateStaticParams() {
  const root = path.join(process.cwd(), 'content/database')

  function walk(dir: string, parent: string[] = []): { slug: string[] }[] {
    let out: { slug: string[] }[] = []
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      if (fs.statSync(full).isDirectory()) {
        out = out.concat(walk(full, [...parent, name]))
      } else if (name.endsWith('.md')) {
        out.push({ slug: [...parent, name.replace(/\.md$/, '')] })
      }
    }
    return out
  }

  return walk(root)
}

// 2) optional: metadata aus frontmatter ziehen
export async function generateMetadata({ params: { slug } }: { params: { slug: string[] } }): Promise<Metadata> {
  const file = path.join(process.cwd(), 'Database', ...slug) + '.md'
  const source = fs.readFileSync(file, 'utf8')
  const { frontmatter } = await compileMDX({ source })
  return {
    title: frontmatter.title ?? slug.join(' – '),
    description: frontmatter.description,
  }
}

// 3) die Seite selbst
export default async function Page({ params: { slug } }: { params: { slug: string[] } }) {
  const file = path.join(process.cwd(), 'content/database', ...slug) + '.md'
  const source = fs.readFileSync(file, 'utf8')

  // compileMDX liefert dir schon ein React-Element zurück
  const { content } = await compileMDX({ source })

  return (
    <main className="prose mx-auto py-8">
      {/* Hier wird dein .md gerendert */}
      {content}
    </main>
  )
}
