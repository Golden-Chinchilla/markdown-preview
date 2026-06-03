import { BookOpenText, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react'
import type { ResolvedTheme } from '../hooks/useTheme'

type TopbarProps = {
  activePath?: string
  resolvedTheme: ResolvedTheme
  sidebarOpen: boolean
  onToggleTheme: () => void
  onToggleSidebar: () => void
}

export function Topbar({
  activePath,
  resolvedTheme,
  sidebarOpen,
  onToggleTheme,
  onToggleSidebar,
}: TopbarProps) {
  const themeLabel = resolvedTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'

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
      <div className="topbar-actions">
        <button
          className="icon-button"
          type="button"
          aria-label={themeLabel}
          title={themeLabel}
          onClick={onToggleTheme}
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={sidebarOpen ? '收起目录' : '展开目录'}
          title={sidebarOpen ? '收起目录' : '展开目录'}
          onClick={onToggleSidebar}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>
    </header>
  )
}
