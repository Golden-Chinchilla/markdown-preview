import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, ListTree } from 'lucide-react'
import { clsx } from 'clsx'
import type { HeadingNode } from '../types/docs'

type TableOfContentsProps = {
  activeHeadingId: string
  headings: HeadingNode[]
  onSelectHeading: (id: string) => void
}

export function TableOfContents({ activeHeadingId, headings, onSelectHeading }: TableOfContentsProps) {
  const panelRef = useRef<HTMLElement>(null)
  const [collapsedHeadings, setCollapsedHeadings] = useState<Set<string>>(new Set())
  const activeAncestorIds = useMemo(() => getActiveAncestorIds(headings, activeHeadingId), [activeHeadingId, headings])
  const visibleCollapsedHeadings = useMemo(() => {
    const next = new Set(collapsedHeadings)
    activeAncestorIds.forEach((id) => next.delete(id))
    return next
  }, [activeAncestorIds, collapsedHeadings])

  useEffect(() => {
    if (!activeHeadingId) {
      return
    }

    const panel = panelRef.current
    const activeLink = panel?.querySelector<HTMLElement>(`[data-heading-id="${CSS.escape(activeHeadingId)}"]`)
    if (!panel || !activeLink) {
      return
    }

    const panelRect = panel.getBoundingClientRect()
    const linkRect = activeLink.getBoundingClientRect()
    const topDelta = linkRect.top - panelRect.top
    const bottomDelta = linkRect.bottom - panelRect.bottom

    if (topDelta < 8) {
      panel.scrollTo({ top: panel.scrollTop + topDelta - 8, behavior: 'auto' })
    } else if (bottomDelta > -8) {
      panel.scrollTo({ top: panel.scrollTop + bottomDelta + 8, behavior: 'auto' })
    }
  }, [activeHeadingId])

  if (headings.length === 0) {
    return null
  }

  const toggleHeading = (id: string) => {
    setCollapsedHeadings((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <aside className="toc-panel" aria-label="文档标题目录" ref={panelRef}>
      <div className="toc-heading">
        <ListTree size={16} />
        <span>本文目录</span>
      </div>
      <ul className="toc-list">
        {headings.map((heading) => (
          <TocItem
            key={heading.id}
            activeHeadingId={activeHeadingId}
            heading={heading}
            collapsedHeadings={visibleCollapsedHeadings}
            onSelectHeading={onSelectHeading}
            onToggleHeading={toggleHeading}
          />
        ))}
      </ul>
    </aside>
  )
}

function TocItem({
  activeHeadingId,
  heading,
  collapsedHeadings,
  onSelectHeading,
  onToggleHeading,
}: {
  activeHeadingId: string
  heading: HeadingNode
  collapsedHeadings: Set<string>
  onSelectHeading: (id: string) => void
  onToggleHeading: (id: string) => void
}) {
  const hasChildren = heading.children.length > 0
  const isCollapsed = collapsedHeadings.has(heading.id)

  return (
    <li>
      <div className={clsx('toc-row', `toc-depth-${heading.depth}`)}>
        {hasChildren ? (
          <button
            className="toc-toggle"
            type="button"
            aria-label={isCollapsed ? `展开 ${heading.text}` : `收起 ${heading.text}`}
            onClick={() => onToggleHeading(heading.id)}
          >
            <ChevronRight className={clsx('toc-chevron', !isCollapsed && 'is-open')} size={14} />
          </button>
        ) : (
          <span className="toc-toggle-spacer" />
        )}
        <button
          className={clsx('toc-link', heading.id === activeHeadingId && 'is-active')}
          type="button"
          title={heading.text}
          data-heading-id={heading.id}
          onClick={() => onSelectHeading(heading.id)}
        >
          {heading.text}
        </button>
      </div>

      {hasChildren && !isCollapsed && (
        <ul className="toc-list">
          {heading.children.map((child) => (
            <TocItem
              key={child.id}
              activeHeadingId={activeHeadingId}
              heading={child}
              collapsedHeadings={collapsedHeadings}
              onSelectHeading={onSelectHeading}
              onToggleHeading={onToggleHeading}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function getActiveAncestorIds(headings: HeadingNode[], activeHeadingId: string) {
  const ancestors: string[] = []

  const visit = (items: HeadingNode[], trail: string[]): boolean => {
    for (const item of items) {
      if (item.id === activeHeadingId) {
        ancestors.push(...trail)
        return true
      }

      if (visit(item.children, [...trail, item.id])) {
        return true
      }
    }

    return false
  }

  visit(headings, [])
  return ancestors
}
