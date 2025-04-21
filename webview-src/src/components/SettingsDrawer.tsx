import { Drawer, Select, Space, Typography, Row, Col, Button, message, Divider, Input } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useAppContext } from '../context'
import { useState } from 'react'

const { Option } = Select
const { Title, Text } = Typography

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

// 预定义颜色选项
const colorOptions = [
  { label: '默认', value: '' },
  { label: '默认蓝', value: '#017fc0' },
  { label: '深沉绿', value: '#0e7a3b' },
  { label: '温暖橙', value: '#f26b24' },
  { label: '睿智紫', value: '#673ab7' },
  { label: '经典红', value: '#e53935' },
  { label: '稳重灰', value: '#607d8b' },
]

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { settings, updateSettings, saveSettings } = useAppContext()
  const [customColor, setCustomColor] = useState('')

  // 保存设置到VSCode
  const handleSaveSettings = () => {
    saveSettings()
    message.success('设置已保存')
    onClose()
  }

  // 颜色变更处理
  const handleColorChange = (value: string) => {
    updateSettings({ primaryColor: value })
  }

  // 自定义颜色变更
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value)
  }

  // 应用自定义颜色
  const applyCustomColor = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      updateSettings({ primaryColor: customColor })
      message.success('已应用自定义颜色')
    } else {
      message.error('请输入有效的十六进制颜色代码，例如 #ff0000')
    }
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
        {/* 样式设置组 */}
        <Title level={4} style={{ marginTop: 0, marginBottom: 0 }}>
          样式
          <Text type="secondary" style={{ marginBottom: 12, display: 'block', fontSize: '12px' }}>
            （注：设置样式会覆盖主题样式）
          </Text>
        </Title>

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
              <Option value="">默认</Option>
              <Option value="14px">更小 (14px)</Option>
              <Option value="15px">稍小 (15px)</Option>
              <Option value="16px">推荐 (16px)</Option>
              <Option value="17px">稍大 (17px)</Option>
              <Option value="18px">更大 (18px)</Option>
            </Select>
          </Col>
        </Row>

        {/* <Divider style={{ margin: '12px 0' }} /> */}

        <Row align="middle" justify="space-between">
          <Col>
            <Title level={5} style={{ margin: 0 }}>
              主题色
            </Title>
          </Col>
          <Col>
            <Select
              style={{ width: '120px' }}
              value={settings.primaryColor}
              onChange={handleColorChange}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Space style={{ padding: '0 8px 4px' }}>
                    <Input
                      placeholder="#自定义色值"
                      value={customColor}
                      onChange={handleCustomColorChange}
                      style={{ width: 120 }}
                    />
                    <Button type="primary" size="small" onClick={applyCustomColor}>
                      应用
                    </Button>
                  </Space>
                </>
              )}
            >
              {colorOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        background: option.value || '#f0f0f0',
                        marginRight: 8,
                        borderRadius: 4,
                      }}
                    />
                    {option.label}
                  </div>
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Divider style={{ margin: '20px 0' }} />

        {/* 功能设置组 */}
        <Title level={4} style={{ marginTop: 0, marginBottom: 12 }}>
          功能
        </Title>

        <Row align="middle" justify="space-between">
          <Col>
            <Title level={5} style={{ margin: 0 }}>
              标题编号
            </Title>
          </Col>
          <Col>
            <Select
              style={{ width: '120px' }}
              value={settings.headingNumberingStyle}
              onChange={(value) => updateSettings({ headingNumberingStyle: value })}
            >
              <Option value="">不使用</Option>
              <Option value="number-dot">1. 2. 3.</Option>
              <Option value="chinese-dot">一、二、三、</Option>
            </Select>
          </Col>
        </Row>
      </Space>
    </Drawer>
  )
}
