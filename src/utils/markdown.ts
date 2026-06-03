import GithubSlugger from 'github-slugger'
import type { HeadingNode } from '../types/docs'

export function getTitleFromMarkdown(markdown: string) {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim()
}

export function removeLeadingTitle(markdown: string) {
  return markdown.replace(/^#\s+.+(?:\r?\n)+/, '')
}

export function extractHeadingTree(markdown: string) {
  const slugger = new GithubSlugger()
  const flatHeadings = extractFlatHeadings(markdown).map((heading) => ({
    ...heading,
    id: slugger.slug(heading.text),
    children: [] as HeadingNode[],
  }))
  const root: HeadingNode[] = []
  const stack: HeadingNode[] = []

  for (const heading of flatHeadings) {
    while (stack.length > 0 && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop()
    }

    const parent = stack.at(-1)
    if (parent) {
      parent.children.push(heading)
    } else {
      root.push(heading)
    }

    stack.push(heading)
  }

  return root
}

export function extractDocumentHeadingTree(markdown: string) {
  const originalHeadings = extractHeadingTree(markdown)
  const contentWithoutTitle = removeLeadingTitle(markdown)

  if (contentWithoutTitle === markdown || originalHeadings[0]?.depth !== 1) {
    return originalHeadings
  }

  return [
    {
      ...originalHeadings[0],
      children: extractHeadingTree(contentWithoutTitle),
    },
  ]
}

function extractFlatHeadings(markdown: string) {
  const headings: Array<{ depth: 1 | 2 | 3; text: string }> = []
  let inFence = false

  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }

    if (inFence) {
      continue
    }

    const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) {
      continue
    }

    headings.push({
      depth: match[1].length as 1 | 2 | 3,
      text: stripInlineMarkdown(match[2]),
    })
  }

  return headings
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .trim()
}
