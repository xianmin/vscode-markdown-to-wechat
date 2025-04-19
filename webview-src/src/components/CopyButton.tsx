import { Button } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

interface CopyButtonProps {
  isLoading: boolean
  hasContent: boolean
  isCopying: boolean
  onCopy: () => void
}

export function CopyButton({ isLoading, hasContent, isCopying, onCopy }: CopyButtonProps) {
  return (
    <Button
      type="primary"
      icon={<CopyOutlined />}
      loading={isCopying}
      disabled={isLoading || !hasContent}
      onClick={onCopy}
    >
      {isCopying ? '复制中...' : '复制'}
    </Button>
  )
}
