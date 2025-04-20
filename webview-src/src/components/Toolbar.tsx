import { ThemeSelector } from './ThemeSelector'
import { CopyButton } from './CopyButton'
import { SettingsDrawer } from './SettingsDrawer'
import { Theme } from '../hooks/useThemeManager'
import { Space, Button } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useState } from 'react'

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
  const [settingsOpen, setSettingsOpen] = useState(false)

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
        <Button type="text" icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)} />
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
