'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'

type Props = {
  content: string
  className?: string
  onLinkClick?: (title: string) => void
}

export default function MarkdownRenderer({ content, className = '', onLinkClick }: Props) {
  const preprocessedContent = preprocessMarkdown(content)

 return (
  <article className={`prose prose-mystical dark:prose-invert max-w-none ${className}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
      components={{
        a: ({ href, children }) => {
            return (
            <a href={href} className="text-blue-500 underline hover:text-blue-400">
                {children}
            </a>
            )
        },
        text: ({ children }) => {
          const child = children as string

          const parts = []
          let lastIndex = 0
          const regex = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g
          let match

          while ((match = regex.exec(child)) !== null) {
            const [full, target, , alias] = match
            const index = match.index

            if (index > lastIndex) {
              parts.push(child.slice(lastIndex, index))
            }

            parts.push(
              <button
                key={index}
                onClick={() => onLinkClick?.(target)}
                className="text-amber-500 underline hover:text-amber-300 font-serif"
              >
                {alias || target}
              </button>
            )

            lastIndex = index + full.length
          }

          if (lastIndex < child.length) {
            parts.push(child.slice(lastIndex))
          }

          return <>{parts}</>
        },
          blockquote: ({ children, ...props }) => {
            // Convert children to string to check for callout syntax
            const childrenArray = React.Children.toArray(children)
            
            // Function to extract text from React elements recursively
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
            
            // Check for callout syntax [!type] Title or just [!type]
            const calloutMatch = fullText.match(/^\[!([^\]]+)\](?:\s+(.*))?/)
            
            const calloutRegex = /^\[!([^\]]+)\]\s*(.*)/

            if (calloutMatch) {
            const [, type, title] = fullText.match(calloutRegex) || []

            // Den restlichen Text ab Zeile 2 holen
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


            // Regular blockquote
            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-700 dark:text-gray-300 dark:border-gray-600">
                {children}
              </blockquote>
            )
          },
          // Enhanced table styling
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
          // Horizontal rule styling
          hr: () => (
            <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent dark:via-gray-600" />
          ),
          // Code block styling
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
          // Enhanced list styling
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
          // Footnote styling
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
    // Highlight: ==text== → <mark>text</mark>
    .replace(/==([^=]+)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
    
    // Strikethrough: ~~text~~
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    
    // Callouts: blockquote-style
    .replace(/^>\s*\[!([^\]]+)\](.*)$/gm, '> [!$1]$2')
}