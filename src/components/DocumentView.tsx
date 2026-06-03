import type { MouseEvent } from 'react'
import { ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import type { MarkdownFile } from '../types/docs'
import { resolveDocumentHref } from '../utils/links'
import { getTitleFromMarkdown, removeLeadingTitle } from '../utils/markdown'

type DocumentViewProps = {
  documentPaths: Set<string>
  file: MarkdownFile
  titleHeadingId?: string
  onNavigate: (path: string) => void
}

export function DocumentView({ documentPaths, file, titleHeadingId, onNavigate }: DocumentViewProps) {
  const renderedContent = removeLeadingTitle(file.content)

  const handleMarkdownLinkClick = (event: MouseEvent<HTMLAnchorElement>, href?: string) => {
    const nextPath = resolveDocumentHref({
      currentPath: file.path,
      documentPaths,
      href,
    })

    if (!nextPath) {
      return
    }

    event.preventDefault()
    onNavigate(nextPath)
  }

  return (
    <>
      <DocumentHeader file={file} titleHeadingId={titleHeadingId} />
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug, rehypeHighlight]}
          components={{
            a: ({ children, href }) => (
              <a href={href} target="_blank" rel="noreferrer" onClick={(event) => handleMarkdownLinkClick(event, href)}>
                {children}
              </a>
            ),
          }}
        >
          {renderedContent}
        </ReactMarkdown>
      </div>
    </>
  )
}

function DocumentHeader({ file, titleHeadingId }: { file: MarkdownFile; titleHeadingId?: string }) {
  const parts = file.path.split('/')
  const title = getTitleFromMarkdown(file.content) ?? file.name.replace(/\.(md|markdown|mdown|mkdn)$/i, '')

  return (
    <header className="document-header">
      <div className="breadcrumbs">
        {parts.map((part, index) => (
          <span key={`${part}-${index}`}>
            {index > 0 && <ChevronRight size={13} />}
            {part}
          </span>
        ))}
      </div>
      <div className="document-title-row">
        <div>
          <h2 id={titleHeadingId}>{title}</h2>
        </div>
        <div className="format-pill">Markdown</div>
      </div>
    </header>
  )
}
