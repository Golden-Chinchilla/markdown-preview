export type MarkdownFile = {
  id: string
  name: string
  path: string
  content: string
}

export type TreeNode = {
  id: string
  name: string
  path: string
  type: 'folder' | 'file'
  children: TreeNode[]
  file?: MarkdownFile
}
