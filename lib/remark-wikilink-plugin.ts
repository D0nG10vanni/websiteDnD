import { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

export const wikiLinkPlugin: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'text', (node: any, index, parent) => {
      const regex = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g
      const matches = [...node.value.matchAll(regex)]

      if (!matches.length) return

      const children = []
      let lastIndex = 0

      for (const match of matches) {
        const [fullMatch, target, , alias] = match
        const start = match.index || 0

        if (start > lastIndex) {
          children.push({
            type: 'text',
            value: node.value.slice(lastIndex, start),
          })
        }

        children.push({
          type: 'mdxJsxFlowElement',
          name: 'WikiLink',
          attributes: [{ type: 'mdxJsxAttribute', name: 'title', value: target }],
          children: [{ type: 'text', value: alias || target }],
        })

        lastIndex = start + fullMatch.length
      }

      if (lastIndex < node.value.length) {
        children.push({
          type: 'text',
          value: node.value.slice(lastIndex),
        })
      }

      parent.children.splice(index!, 1, ...children)
    })
  }
}
