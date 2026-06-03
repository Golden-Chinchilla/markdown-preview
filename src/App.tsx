import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DocumentView } from './components/DocumentView'
import { EmptyDocument } from './components/EmptyStates'
import { Sidebar } from './components/Sidebar'
import { TableOfContents } from './components/TableOfContents'
import { Topbar } from './components/Topbar'
import { documents } from './data/documents'
import { useTheme } from './hooks/useTheme'
import type { HeadingNode } from './types/docs'
import { getAncestorFolderPaths } from './utils/links'
import { extractDocumentHeadingTree, getTitleFromMarkdown } from './utils/markdown'
import { buildTree, collectFiles, collectFolderIds, filterTree } from './utils/tree'

const documentTree = buildTree(documents)
const initialExpandedFolders = new Set(collectFolderIds(documentTree))
const documentPaths = new Set(documents.map((document) => document.path))

function App() {
  const [activePath, setActivePath] = useState(documents[0]?.path ?? '')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(initialExpandedFolders)
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeHeadingId, setActiveHeadingId] = useState('')
  const { resolvedTheme, toggleTheme } = useTheme()

  const filteredTree = useMemo(() => filterTree(documentTree, query), [query])
  const activeFile = useMemo(
    () => documents.find((file) => file.path === activePath) ?? documents[0],
    [activePath],
  )
  const activeTitle = useMemo(
    () => activeFile && (getTitleFromMarkdown(activeFile.content) ?? activeFile.name.replace(/\.(md|markdown|mdown|mkdn)$/i, '')),
    [activeFile],
  )
  const activeHeadings = useMemo(() => (activeFile ? extractDocumentHeadingTree(activeFile.content) : []), [activeFile])
  const activeHeadingIds = useMemo(() => activeHeadings.flatMap(flattenHeadingIds), [activeHeadings])
  const titleHeadingId = activeHeadings[0]?.depth === 1 ? activeHeadings[0].id : undefined
  const visibleFileCount = useMemo(() => collectFiles(filteredTree).length, [filteredTree])

  useEffect(() => {
    let frame = 0

    const updateActiveHeading = () => {
      frame = 0
      const headings = activeHeadingIds
        .map((id) => document.getElementById(id))
        .filter((heading): heading is HTMLElement => Boolean(heading))

      if (headings.length === 0) {
        setActiveHeadingId('')
        return
      }

      const topOffset = 92
      const currentHeading =
        headings
          .filter((heading) => heading.getBoundingClientRect().top <= topOffset)
          .at(-1) ?? headings[0]

      setActiveHeadingId((current) => (current === currentHeading.id ? current : currentHeading.id))
    }

    const scheduleUpdate = () => {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(updateActiveHeading)
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    document.querySelector('.preview-pane')?.addEventListener('scroll', scheduleUpdate, { passive: true })

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
      window.removeEventListener('scroll', scheduleUpdate)
      document.querySelector('.preview-pane')?.removeEventListener('scroll', scheduleUpdate)
    }
  }, [activeHeadingIds])

  const toggleFolder = (path: string) => {
    setExpandedFolders((current) => {
      const next = new Set(current)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const selectDocument = (path: string) => {
    setActivePath(path)
    setExpandedFolders((current) => {
      const next = new Set(current)
      getAncestorFolderPaths(path).forEach((folderPath) => next.add(folderPath))
      return next
    })
  }

  const selectHeading = (headingId: string) => {
    const heading = document.getElementById(headingId)
    if (!heading) {
      return
    }

    const previewPane = document.querySelector<HTMLElement>('.preview-pane')
    if (previewPane && previewPane.scrollHeight > previewPane.clientHeight) {
      const paneRect = previewPane.getBoundingClientRect()
      const headingRect = heading.getBoundingClientRect()
      previewPane.scrollTo({
        top: previewPane.scrollTop + headingRect.top - paneRect.top - 24,
        behavior: 'auto',
      })
    } else {
      window.scrollTo({
        top: window.scrollY + heading.getBoundingClientRect().top - 88,
        behavior: 'auto',
      })
    }

    setActiveHeadingId(headingId)
    heading.classList.remove('heading-flash')
    window.setTimeout(() => heading.classList.add('heading-flash'), 80)
    window.setTimeout(() => heading.classList.remove('heading-flash'), 1800)
  }

  return (
    <main className="app-shell">
      <Topbar
        activeLabel={activeTitle}
        resolvedTheme={resolvedTheme}
        sidebarOpen={sidebarOpen}
        onToggleTheme={toggleTheme}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />

      <section className="workspace">
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              className="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Sidebar
                documentsCount={documents.length}
                visibleFileCount={visibleFileCount}
                tree={filteredTree}
                query={query}
                expandedFolders={expandedFolders}
                activePath={activeFile?.path ?? ''}
                onQueryChange={setQuery}
                onToggleFolder={toggleFolder}
                onSelectFile={(file) => selectDocument(file.path)}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        <section className="preview-pane">
          <AnimatePresence mode="wait">
            {activeFile ? (
              <motion.div
                key={activeFile.path}
                className="preview-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                <article className="document">
                  <DocumentView
                    documentPaths={documentPaths}
                    file={activeFile}
                    titleHeadingId={titleHeadingId}
                    onNavigate={selectDocument}
                  />
                </article>
                <TableOfContents
                  activeHeadingId={activeHeadingId}
                  headings={activeHeadings}
                  onSelectHeading={selectHeading}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <EmptyDocument />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </section>
    </main>
  )
}

function flattenHeadingIds(heading: HeadingNode): string[] {
  return [heading.id, ...heading.children.flatMap(flattenHeadingIds)]
}

export default App
