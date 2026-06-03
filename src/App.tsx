import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DocumentView } from './components/DocumentView'
import { EmptyDocument } from './components/EmptyStates'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { documents } from './data/documents'
import { buildTree, collectFiles, collectFolderIds, filterTree } from './utils/tree'

const documentTree = buildTree(documents)
const initialExpandedFolders = new Set(collectFolderIds(documentTree))

function App() {
  const [activePath, setActivePath] = useState(documents[0]?.path ?? '')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(initialExpandedFolders)
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const filteredTree = useMemo(() => filterTree(documentTree, query), [query])
  const activeFile = useMemo(
    () => documents.find((file) => file.path === activePath) ?? documents[0],
    [activePath],
  )
  const visibleFileCount = useMemo(() => collectFiles(filteredTree).length, [filteredTree])

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

  return (
    <main className="app-shell">
      <Topbar
        activePath={activeFile?.path}
        sidebarOpen={sidebarOpen}
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
                onSelectFile={(file) => setActivePath(file.path)}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        <section className="preview-pane">
          <AnimatePresence mode="wait">
            {activeFile ? (
              <motion.article
                key={activeFile.path}
                className="document"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                <DocumentView file={activeFile} />
              </motion.article>
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

export default App
