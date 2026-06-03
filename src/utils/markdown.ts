export function getTitleFromMarkdown(markdown: string) {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim()
}
