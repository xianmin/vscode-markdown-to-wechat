import {
  Drawer,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Button,
  message,
  Divider,
  ColorPicker,
  Flex,
} from 'antd'
import { SaveOutlined, UndoOutlined } from '@ant-design/icons'
import { useAppContext } from '../context'
import { defaultSettings } from '../hooks'
import type { Color } from 'antd/es/color-picker'

const { Option } = Select
const { Title, Text } = Typography

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

// 预定义推荐颜色
const presetColors = [
  '#D92662', // Pink
  '#D9269D', // Fuchsia
  '#9236A4', // Purple
  '#7540BF', // Violet
  '#524ED2', // Indigo
  '#3C71F7', // Blue
  '#017FC0', // Azure
  '#058686', // Cyan
  '#00895A', // Jade
  '#398712', // Green
  '#A5D601', // Lime
  '#F2DF0D', // Yellow
  '#FFBF00', // Amber
  '#FF9500', // Pumpkin
  '#D24317', // Orange
  '#CCC6B4', // Sand
  '#808080', // Grey
  '#6F7887', // Zinc
  '#525F7A', // Slate
]

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { settings, updateSettings, saveSettings } = useAppContext()

  // 保存设置到VSCode
  const handleSaveSettings = () => {
    saveSettings()
    message.success('设置已保存')
    onClose()
  }

  // 颜色变更处理
  const handleColorChange = (value: Color) => {
    if (value) {
      const colorHex = typeof value === 'string' ? value : value.toHexString()
      updateSettings({ primaryColor: colorHex })
    } else {
      // 清除颜色（恢复默认）
      updateSettings({ primaryColor: '' })
    }
  }

  // 确认重置所有设置
  const handleResetSettings = () => {
    // 直接修改设置状态
    updateSettings(defaultSettings)
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
        <Flex align="center" justify="space-between">
          <Title level={4} style={{ marginTop: 0, marginBottom: 12 }}>
            样式
          </Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            （注：设置样式会覆盖主题样式）
          </Text>
        </Flex>

        <Row align="middle" justify="space-between">
          <Col>
            <Title level={5} style={{ margin: 0 }}>
              主题色
            </Title>
          </Col>
          <Col>
            <ColorPicker
              value={settings.primaryColor || undefined}
              onChange={handleColorChange}
              presets={[
                {
                  label: '推荐颜色',
                  colors: presetColors,
                },
              ]}
              showText={(color) => {
                if (!color) return <span>默认</span>
                const hex = typeof color === 'string' ? color : color.toHexString()
                return <span>{hex || '默认'}</span>
              }}
              allowClear
              onClear={() => updateSettings({ primaryColor: '' })}
              size="middle"
            />
          </Col>
        </Row>

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

        <Divider style={{ margin: '20px 0' }} />

        {/* 重置按钮 */}
        <Button icon={<UndoOutlined />} onClick={handleResetSettings} block danger>
          重置所有设置
        </Button>
      </Space>
    </Drawer>
  )
}
