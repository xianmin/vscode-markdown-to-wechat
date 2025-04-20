import { Drawer, Select, Space, Typography, Row, Col, Button, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useAppContext } from '../context'

const { Option } = Select
const { Title } = Typography

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { settings, updateSettings, saveSettings } = useAppContext()

  // 保存设置到VSCode
  const handleSaveSettings = () => {
    saveSettings()
    message.success('设置已保存')
    onClose()
  }

  // 自定义标题栏，包含保存按钮
  const drawerTitle = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <span>设置</span>
      <Button type="primary" icon={<SaveOutlined />} size="small" onClick={handleSaveSettings}>
        保存
      </Button>
    </div>
  )

  return (
    <Drawer
      title={drawerTitle}
      placement="right"
      onClose={onClose}
      open={open}
      width={300}
      extra={false}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={5} style={{ margin: 0 }}>
              字号
            </Title>
          </Col>
          <Col>
            <Select
              style={{ width: '120px' }}
              value={settings.fontSize}
              onChange={(value) => updateSettings({ fontSize: value })}
            >
              <Option value="14px">更小 (14px)</Option>
              <Option value="15px">稍小 (15px)</Option>
              <Option value="16px">推荐 (16px)</Option>
              <Option value="17px">稍大 (17px)</Option>
              <Option value="18px">更大 (18px)</Option>
            </Select>
          </Col>
        </Row>
      </Space>
    </Drawer>
  )
}
