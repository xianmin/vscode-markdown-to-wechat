import { ThemeSelector } from './ThemeSelector'
import { CopyButton } from './CopyButton'
import { Theme } from '../hooks/useThemeManager'

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
      <h1>微信公众号预览</h1>
      <div className="toolbar-actions">
        <ThemeSelector themes={themes} currentTheme={currentTheme} onThemeChange={onThemeChange} />

        <CopyButton
          isLoading={isLoading}
          hasContent={hasContent}
          isCopying={isCopying}
          onCopy={onCopy}
        />
      </div>
    </div>
  )
}
