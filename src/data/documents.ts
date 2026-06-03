import type { MarkdownFile } from '../types/docs'

const markdownModules = import.meta.glob('../content/docs/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

export const documents: MarkdownFile[] = Object.entries(markdownModules)
  .map(([modulePath, content]) => {
    const path = modulePath.replace('../content/docs/', '')
    const name = path.split('/').at(-1) ?? path

    return {
      id: path,
      name,
      path,
      content,
    }
  })
  .sort((a, b) => a.path.localeCompare(b.path, 'zh-Hans-CN', { numeric: true }))
