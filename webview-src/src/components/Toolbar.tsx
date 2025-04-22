import { ThemeSelector } from './ThemeSelector'
import { CopyButton } from './CopyButton'
import { SettingsDrawer } from './SettingsDrawer'
import { Space, Button } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useState } from 'react'

export function Toolbar() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="toolbar">
      <Space>
        <h1>微信公众号预览</h1>

        <CopyButton />
      </Space>
      <div className="toolbar-actions">
        <ThemeSelector />
        <Button type="text" icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)} />
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
