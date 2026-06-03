import { BookOpenText, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

type TopbarProps = {
  activePath?: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Topbar({ activePath, sidebarOpen, onToggleSidebar }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <BookOpenText aria-hidden="true" size={20} />
        </div>
        <div>
          <h1>Marktab</h1>
          <p>{activePath ?? '没有找到 Markdown 文档'}</p>
        </div>
      </div>
      <button
        className="icon-button"
        type="button"
        aria-label={sidebarOpen ? '收起目录' : '展开目录'}
        title={sidebarOpen ? '收起目录' : '展开目录'}
        onClick={onToggleSidebar}
      >
        {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
      </button>
    </header>
  )
}
