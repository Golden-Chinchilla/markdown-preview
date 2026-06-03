export function resolveDocumentHref({
  currentPath,
  documentPaths,
  href,
}: {
  currentPath: string
  documentPaths: Set<string>
  href?: string
}) {
  if (!href || isExternalHref(href)) {
    return null
  }

  const hrefWithoutHash = href.split('#')[0]?.split('?')[0] ?? ''
  if (!hrefWithoutHash) {
    return null
  }

  const basePath = currentPath.includes('/') ? currentPath.slice(0, currentPath.lastIndexOf('/')) : ''
  const normalized = normalizeRelativePath(
    hrefWithoutHash.startsWith('/') ? hrefWithoutHash.slice(1) : `${basePath}/${hrefWithoutHash}`,
  )
  const candidates = getDocumentCandidates(normalized)

  return candidates.find((candidate) => documentPaths.has(candidate)) ?? null
}

export function getAncestorFolderPaths(filePath: string) {
  const parts = filePath.split('/').filter(Boolean)
  return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/'))
}

function getDocumentCandidates(path: string) {
  const normalized = path.replace(/\/+$/, '')

  if (/\.(md|markdown|mdown|mkdn)$/i.test(normalized)) {
    return [normalized]
  }

  return [`${normalized}/README.md`, `${normalized}/readme.md`, `${normalized}.md`]
}

function normalizeRelativePath(path: string) {
  const parts: string[] = []

  for (const part of path.split('/')) {
    if (!part || part === '.') {
      continue
    }

    if (part === '..') {
      parts.pop()
      continue
    }

    parts.push(decodeURIComponent(part))
  }

  return parts.join('/')
}

function isExternalHref(href: string) {
  return /^(https?:|mailto:|tel:|#)/i.test(href)
}
