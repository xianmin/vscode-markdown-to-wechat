import { ThemeSelector } from './ThemeSelector'
import { CopyButton } from './CopyButton'
import { Theme } from '../hooks/useThemeManager'
import { Space } from 'antd'

interface ToolbarProps {
  themes: Theme[]
  currentTheme: string
  onThemeChange: (themeId: string) => void
  isLoading: boolean
  hasContent: boolean
  isCopying: boolean
  onCopy: () => void
}

export function Toolbar({
  themes,
  currentTheme,
  onThemeChange,
  isLoading,
  hasContent,
  isCopying,
  onCopy,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <Space>
        <h1>微信公众号预览</h1>

        <CopyButton
          isLoading={isLoading}
          hasContent={hasContent}
          isCopying={isCopying}
          onCopy={onCopy}
        />
      </Space>
      <div className="toolbar-actions">
        <ThemeSelector themes={themes} currentTheme={currentTheme} onThemeChange={onThemeChange} />
      </div>
    </div>
  )
}
