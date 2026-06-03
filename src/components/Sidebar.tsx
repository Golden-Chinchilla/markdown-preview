import { Search } from 'lucide-react'
import { FileTree } from './FileTree'
import { EmptyTree } from './EmptyStates'
import type { MarkdownFile, TreeNode } from '../types/docs'

type SidebarProps = {
  documentsCount: number
  visibleFileCount: number
  tree: TreeNode
  query: string
  expandedFolders: Set<string>
  activePath: string
  onQueryChange: (query: string) => void
  onToggleFolder: (path: string) => void
  onSelectFile: (file: MarkdownFile) => void
}

export function Sidebar({
  documentsCount,
  visibleFileCount,
  tree,
  query,
  expandedFolders,
  activePath,
  onQueryChange,
  onToggleFolder,
  onSelectFile,
}: SidebarProps) {
  return (
    <div className="sidebar-inner">
      <div className="sidebar-heading">
        <div>
          <span>目录</span>
          <strong>
            {visibleFileCount} / {documentsCount}
          </strong>
        </div>
      </div>

      <label className="search-field">
        <Search size={16} aria-hidden="true" />
        <input
          value={query}
          placeholder="搜索文件或路径"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <div className="tree-panel">
        {documentsCount === 0 ? (
          <EmptyTree />
        ) : tree.children.length === 0 ? (
          <div className="empty-small">没有匹配的文档</div>
        ) : (
          <FileTree
            nodes={tree.children}
            expandedFolders={expandedFolders}
            activePath={activePath}
            onToggleFolder={onToggleFolder}
            onSelectFile={onSelectFile}
          />
        )}
      </div>
    </div>
  )
}
