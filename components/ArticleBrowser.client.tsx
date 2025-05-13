// components/ArticleBrowser.client.tsx
"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import wikiLink from "remark-wiki-link";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeReact from "rehype-react";
import { createElement } from "react";
import Link from "next/link";
import type { Article } from "../lib/articles";

export default function ArticleBrowser({ articles }: { articles: Article[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/GetArticleContent?slug=${encodeURIComponent(selected)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        return res.text();
      })
      .then(setContent)
      .catch((e: Error) => setContent(`⚠️ ${e.message}`));
  }, [selected]);

  // Gruppierung wie gehabt
  const byFolder = articles.reduce<Record<string, Article[]>>((acc, art) => {
    (acc[art.folder] ||= []).push(art);
    return acc;
  }, {});

  return (
    <div className="flex min-h-[80vh]">
      {/* ───────────── Sidebar ───────────── */}
      <aside className="w-1/3 bg-gray-800 p-6 rounded-lg overflow-auto">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Alle Artikel</h2>
            <Link
                href="/ArticleView/NeuerArtikel"            
                className="text-blue-400 hover:text-blue-500 underline">
                Neuer Artikel
            </Link>
        </div>
        {Object.entries(byFolder).map(([folder, list]) => (
          <div key={folder} className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">
              {folder}
            </h3>
            <ul className="list-disc list-inside text-gray-200 space-y-1">
              {list
                .sort((a, b) => a.title.localeCompare(b.title))
                .map(({ slug, title }) => (
                  <li key={slug}>
                   <button
                       onClick={() => setSelected(slug)}
                        className="text-blue-400 hover:text-blue-500 underline">
                        {title}
                   </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </aside>

      {/* ───────────── Content ───────────── */}
      <section className="w-2/3 ml-6">
        {!selected ? (
          <p className="text-gray-500">Bitte wähle einen Artikel aus.</p>
        ) : !content ? (
          <p className="text-gray-400">Lade Artikel…</p>
        ) : (
          <div className="bg-gray-900 p-8 rounded-2xl shadow-xl overflow-auto max-h-[80vh]">
            <article className="prose prose-lg prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[
                  remarkGfm,
                  [wikiLink, { hrefTemplate: ([page]: [string]) => `/tests/${encodeURIComponent(page)}` }],
                ]}
                rehypePlugins={[
                  rehypeRaw,
                  rehypeHighlight,
                  [
                    rehypeReact,
                    {
                      createElement,
                      components: {
                        a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
                          <Link
                            href={href as string}
                            className="underline hover:text-blue-300"
                          >
                            {children}
                          </Link>
                        ),
                      },
                    },
                  ],
                ]}
              >
                {content}
              </ReactMarkdown>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
