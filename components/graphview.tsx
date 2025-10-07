import { useMemo, useState, useCallback } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

import ForceGraphComponent, { GraphData, GraphNode } from './Graphview/ForceGraph'
import MarkdownRenderer from './MarkdownRenderer'
import type { Folder, Post } from '@/lib/types'

const DEFAULT_NODE_COLOR = '#fbbf24'
const FOLDER_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#8b5cf6',
  '#f97316', '#06b6d4', '#84cc16', '#ec4899',
  '#6366f1', '#14b8a6'
]

const extractWikiLinks = (content: string): string[] => {
  const regex = /\[\[([^\]|]+)(\|[^\]]+)?\]\]/g
  const matches = [...content.matchAll(regex)]
  return matches.map(match => match[1].trim())
}

export interface GraphViewProps {
  articles: Post[]
  folders?: Folder[]
  onNodeClick?: (article: Post) => void
  width?: number | string
  height?: number
}

export default function GraphView({
  articles,
  folders = [],
  onNodeClick,
  width = '100%',
  height = 600
}: GraphViewProps) {
  const [activeArticle, setActiveArticle] = useState<Post | null>(null)

  const folderNameMap = useMemo(() => {
    return new Map(folders.map(folder => [folder.id, folder.name]))
  }, [folders])

  const usedFolderIds = useMemo(() => {
    return Array.from(
      new Set(
        articles
          .map(article => article.folder_id)
          .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id))
      )
    )
  }, [articles])

  const folderColorMap = useMemo(() => {
    const colorMap = new Map<number, string>()
    usedFolderIds.forEach((folderId, index) => {
      colorMap.set(folderId, FOLDER_COLORS[index % FOLDER_COLORS.length])
    })
    return colorMap
  }, [usedFolderIds])

  const articleByTitle = useMemo(() => {
    return new Map(articles.map(article => [article.title, article]))
  }, [articles])

  const graphData = useMemo<GraphData>(() => {
    const nodes = articles.map(article => {
      const folderId = typeof article.folder_id === 'number' ? article.folder_id : null
      const color = folderId !== null
        ? folderColorMap.get(folderId) ?? DEFAULT_NODE_COLOR
        : DEFAULT_NODE_COLOR

      return {
        id: article.title,
        name: article.title,
        type: folderId !== null ? (folderNameMap.get(folderId) ?? 'Ordner') : 'Unkategorisiert',
        color
      }
    })

    const uniqueLinks = new Set<string>()
    const links: GraphData['links'] = []

    articles.forEach(article => {
      const wikiLinks = extractWikiLinks(article.content)

      wikiLinks.forEach(targetTitle => {
        if (!articleByTitle.has(targetTitle) || targetTitle === article.title) {
          return
        }

        const key = article.title < targetTitle
          ? `${article.title}__${targetTitle}`
          : `${targetTitle}__${article.title}`

        if (uniqueLinks.has(key)) {
          return
        }

        uniqueLinks.add(key)
        links.push({ source: article.title, target: targetTitle, value: 1 })
      })
    })

    return { nodes, links }
  }, [articles, articleByTitle, folderColorMap, folderNameMap])

  const legendItems = useMemo(() => {
    const items = Array.from(folderColorMap.entries()).map(([folderId, color]) => ({
      key: folderId.toString(),
      label: folderNameMap.get(folderId) ?? 'Ordner',
      color
    }))

    if (articles.some(article => article.folder_id == null)) {
      items.push({ key: 'unassigned', label: 'Unkategorisiert', color: DEFAULT_NODE_COLOR })
    }

    return items
  }, [articles, folderColorMap, folderNameMap])

  const handleSelect = useCallback((node: GraphNode | null) => {
    if (!node) {
      setActiveArticle(null)
      return
    }

    const selectedArticle = articleByTitle.get(node.id)
    if (!selectedArticle) {
      setActiveArticle(null)
      return
    }

    setActiveArticle(selectedArticle)
    if (onNodeClick) {
      onNodeClick(selectedArticle)
    }
  }, [articleByTitle, onNodeClick])

  return (
    <div className="w-full space-y-4">
      <ForceGraphComponent
        graphData={graphData}
        height={height}
        width={width}
        onNodeSelect={handleSelect}
      />

      {legendItems.length > 0 && (
        <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-200">
          {legendItems.map(item => (
            <div key={item.key} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!activeArticle} onClose={() => setActiveArticle(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="max-w-3xl w-full bg-base-200 rounded-xl p-6 border border-amber-700 shadow-xl overflow-y-auto max-h-[80vh]">
            <div className="flex justify-between items-start mb-4">
              <Dialog.Title className="text-lg font-bold text-amber-300 font-serif">
                {activeArticle?.title}
              </Dialog.Title>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="text-amber-200 hover:text-amber-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="prose prose-invert max-w-none">
              {activeArticle ? (
                <MarkdownRenderer markdown={activeArticle.content} />
              ) : (
                <p className="text-sm text-amber-200/80">
                  Kein Artikel ausgewählt.
                </p>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
