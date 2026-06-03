import { AnimatePresence, motion } from 'framer-motion'
import { clsx } from 'clsx'
import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react'
import type { MarkdownFile, TreeNode } from '../types/docs'

type FileTreeProps = {
  nodes: TreeNode[]
  expandedFolders: Set<string>
  activePath: string
  onToggleFolder: (path: string) => void
  onSelectFile: (file: MarkdownFile) => void
}

type TreeRowProps = Omit<FileTreeProps, 'nodes'> & {
  node: TreeNode
  level: number
}

export function FileTree({
  nodes,
  expandedFolders,
  activePath,
  onToggleFolder,
  onSelectFile,
}: FileTreeProps) {
  return (
    <ul className="tree-list">
      {nodes.map((node) => (
        <TreeRow
          key={node.id}
          node={node}
          level={0}
          expandedFolders={expandedFolders}
          activePath={activePath}
          onToggleFolder={onToggleFolder}
          onSelectFile={onSelectFile}
        />
      ))}
    </ul>
  )
}

function TreeRow({
  node,
  level,
  expandedFolders,
  activePath,
  onToggleFolder,
  onSelectFile,
}: TreeRowProps) {
  const isFolder = node.type === 'folder'
  const isOpen = expandedFolders.has(node.path)
  const isActive = node.file?.path === activePath

  return (
    <li>
      <button
        className={clsx('tree-row', isActive && 'is-active')}
        type="button"
        style={{ paddingLeft: 10 + level * 18 }}
        onClick={() => (isFolder ? onToggleFolder(node.path) : node.file && onSelectFile(node.file))}
        title={node.path}
      >
        {isFolder ? (
          <ChevronRight className={clsx('chevron', isOpen && 'is-open')} size={15} />
        ) : (
          <span className="chevron-spacer" />
        )}
        <span className="tree-icon">
          {isFolder ? isOpen ? <FolderOpen size={16} /> : <Folder size={16} /> : <FileText size={16} />}
        </span>
        <span className="tree-name">{node.name}</span>
      </button>

      {isFolder && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.ul
              className="tree-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
            >
              {node.children.map((child) => (
                <TreeRow
                  key={child.id}
                  node={child}
                  level={level + 1}
                  expandedFolders={expandedFolders}
                  activePath={activePath}
                  onToggleFolder={onToggleFolder}
                  onSelectFile={onSelectFile}
                />
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      )}
    </li>
  )
}
