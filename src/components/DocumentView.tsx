import { ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import type { MarkdownFile } from '../types/docs'
import { getTitleFromMarkdown } from '../utils/markdown'

type DocumentViewProps = {
  file: MarkdownFile
}

export function DocumentView({ file }: DocumentViewProps) {
  return (
    <>
      <DocumentHeader file={file} />
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug, rehypeHighlight]}
          components={{
            a: ({ children, href }) => (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {file.content}
        </ReactMarkdown>
      </div>
    </>
  )
}

function DocumentHeader({ file }: DocumentViewProps) {
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
          <h2>{title}</h2>
          <p>{file.path}</p>
        </div>
        <div className="format-pill">Markdown</div>
      </div>
    </header>
  )
}
