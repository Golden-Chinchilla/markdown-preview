import { FileText } from 'lucide-react'

export function EmptyTree() {
  return (
    <div className="empty-tree">
      <FileText size={24} />
      <p>src/content/docs 里还没有文档</p>
    </div>
  )
}

export function EmptyDocument() {
  return (
    <div className="empty-preview">
      <FileText size={30} />
      <h2>没有 Markdown 文档</h2>
      <p>把 Markdown 文件放到 src/content/docs 目录后重新启动或构建即可。</p>
    </div>
  )
}
