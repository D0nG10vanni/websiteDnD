'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import type { Root, Text, PhrasingContent } from 'mdast'
import 'katex/dist/katex.min.css'

type Props = {
  content: string
  className?: string
  onLinkClick?: (title: string) => void
}

// Remark plugin to handle wikilinks
const remarkWikiLinks: Plugin<[{ onLinkClick?: (title: string) => void }], Root> = (options = {}) => {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return

      const regex = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g
      const matches = [...node.value.matchAll(regex)]

      if (!matches.length) return

      const children: PhrasingContent[] = []
      let lastIndex = 0

      for (const match of matches) {
        const [fullMatch, target, , alias] = match
        const start = match.index || 0

        // Add text before the wikilink
        if (start > lastIndex) {
          children.push({
            type: 'text',
            value: node.value.slice(lastIndex, start),
          })
        }

        // Add the wikilink as HTML
        children.push({
          type: 'html',
          value: `<button class="wikilink-button" data-target="${target}">${alias || target}</button>`
        })

        lastIndex = start + fullMatch.length
      }

      // Add remaining text
      if (lastIndex < node.value.length) {
        children.push({
          type: 'text',
          value: node.value.slice(lastIndex),
        })
      }

      // Replace the text node with the new children
      parent.children.splice(index, 1, ...children)
    })
  }
}

export default function MarkdownRenderer({ content, className = '', onLinkClick }: Props) {
  const preprocessedContent = preprocessMarkdown(content)

  return (
    <article className={`prose prose-mystical dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm, 
          remarkMath,
          [remarkWikiLinks, { onLinkClick }]
        ]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          // Handle wikilink buttons
          button: ({ className, children, ...props }) => {
            if (className?.includes('wikilink-button')) {
              const target = (props as any)['data-target']
              return (
                <button
                  onClick={() => onLinkClick?.(target)}
                  className="text-amber-500 underline hover:text-amber-300 font-serif"
                >
                  {children}
                </button>
              )
            }
            return <button className={className} {...props}>{children}</button>
          },
          a: ({ href, children }) => {
            return (
              <a href={href} className="text-blue-500 underline hover:text-blue-400">
                {children}
              </a>
            )
          },
          blockquote: ({ children }) => {
            const childrenArray = React.Children.toArray(children)

            const extractText = (element: any): string => {
              if (typeof element === 'string') return element
              if (React.isValidElement(element)) {
                const el = element as React.ReactElement<any, any>
                if (el.props && el.props.children) {
                  if (Array.isArray(el.props.children)) {
                    return el.props.children.map(extractText).join('')
                  }
                  return extractText(el.props.children)
                }
              }
              return ''
            }

            const fullText = childrenArray.map(extractText).join(' ').trim()
            const calloutMatch = fullText.match(/^\[!([^\]]+)\](?:\s+(.*))?/)
            const calloutRegex = /^\[!([^\]]+)\]\s*(.*)/

            if (calloutMatch) {
              const [, type, title] = fullText.match(calloutRegex) || []
              const lines = fullText.split('\n')
              const contentLines = lines.slice(1).join('\n').trim()

              return (
                <div className={`callout callout-${type?.toLowerCase() || 'info'} border-l-4 p-4 my-6 rounded-r-md backdrop-blur-sm`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">ℹ️</span>
                    <div className="font-semibold">
                      {title || ''}
                    </div>
                  </div>
                  {contentLines && (
                    <div className="prose-sm">
                      {contentLines}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-700 dark:text-gray-300 dark:border-gray-600">
                {children}
              </blockquote>
            )
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent dark:via-gray-600" />
          ),
          code: (props: React.ComponentProps<'code'> & { inline?: boolean }) => {
            const { inline, className, children } = props;
            if (inline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              )
            }
            return (
              <code className={`${className} block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto`}>
                {children}
              </code>
            )
          },
          ul: ({ children }) => (
            <ul className="list-disc pl-6 my-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 my-4 space-y-1">
              {children}
            </ol>
          ),
          sup: ({ children }) => (
            <sup className="text-amber-500 hover:text-amber-400 cursor-pointer">
              {children}
            </sup>
          )
        }}
      >
        {preprocessedContent}
      </ReactMarkdown>
    </article>
  )
}

function preprocessMarkdown(md: string): string {
  return md
    .replace(/==([^=]+)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/°([^°]+)°/g, '<span class="author-info">$1</span>')
    .replace(/^>\s*\[!([^\]]+)\](.*)$/gm, '> [!$1]$2')
    .replace(/§([^§]+)§/g, (match, content) => {
      // Prüfen ob Zeitspanne (enthält "-")
      if (content.includes('-')) {
        const parts = content.split('-');
        if (parts.length === 2) {
          return `<span class="timeline-date range">Zeitspanne: Von ${parts[0].trim()} bis ${parts[1].trim()}</span>`;
        }
      }
      // Einzeldatum
      return `<span class="timeline-date single">Datum: ${content}</span>`;
    })
}
