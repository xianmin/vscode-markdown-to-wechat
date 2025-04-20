import { Drawer, Select, Space, Typography, Row, Col } from 'antd'
import { useAppContext } from '../context'

const { Option } = Select
const { Title } = Typography

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { settings, updateSettings } = useAppContext()

  return (
    <Drawer title="设置" placement="right" onClose={onClose} open={open} width={300}>
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
