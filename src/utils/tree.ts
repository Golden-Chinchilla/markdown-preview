import type { MarkdownFile, TreeNode } from '../types/docs'

export function buildTree(files: MarkdownFile[]) {
  const root: TreeNode = {
    id: 'root',
    name: 'root',
    path: '',
    type: 'folder',
    children: [],
  }
  const folders = new Map<string, TreeNode>([['', root]])

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean)
    let parent = root
    let currentPath = ''

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isFile = index === parts.length - 1

      if (isFile) {
        parent.children.push({
          id: file.path,
          name: part,
          path: file.path,
          type: 'file',
          children: [],
          file,
        })
        return
      }

      let folder = folders.get(currentPath)
      if (!folder) {
        folder = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: 'folder',
          children: [],
        }
        folders.set(currentPath, folder)
        parent.children.push(folder)
      }
      parent = folder
    })
  }

  sortTree(root)
  return root
}

export function filterTree(node: TreeNode, query: string): TreeNode {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return node
  }

  const nextChildren = node.children
    .map((child) => filterTree(child, query))
    .filter((child) => child.children.length > 0 || child.path.toLowerCase().includes(normalized))

  return {
    ...node,
    children: nextChildren,
  }
}

export function collectFolderIds(node: TreeNode): string[] {
  const folders: string[] = []
  for (const child of node.children) {
    if (child.type === 'folder') {
      folders.push(child.path)
      folders.push(...collectFolderIds(child))
    }
  }
  return folders
}

export function collectFiles(node: TreeNode): MarkdownFile[] {
  return node.children.flatMap((child) => (child.file ? [child.file] : collectFiles(child)))
}

function sortTree(node: TreeNode) {
  node.children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    return a.name.localeCompare(b.name, 'zh-Hans-CN', { numeric: true })
  })

  node.children.forEach(sortTree)
}
