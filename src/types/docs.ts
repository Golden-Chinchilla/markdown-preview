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

export type HeadingNode = {
  id: string
  text: string
  depth: 1 | 2 | 3
  children: HeadingNode[]
}
