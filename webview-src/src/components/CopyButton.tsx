import { Button, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { useAppContext } from '../context/AppContext'
import { useState } from 'react'

export function CopyButton() {
  const [isCopying, setIsCopying] = useState<boolean>(false)
  const { markdown, html, isLoading } = useAppContext()

  const copyToClipboard = () => {
    try {
      setIsCopying(true)

      const clipboardContent = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([markdown || ''], { type: 'text/plain' }),
      })

      navigator.clipboard.write([clipboardContent])

      // 使用 antd message 提示成功
      message.success('已复制内容到剪贴板，可直接粘贴到公众号')
    } catch (err) {
      // 使用 antd message 提示错误
      message.error(`复制失败: ${err instanceof Error ? err.message : String(err)}`)
      console.error('复制错误:', err)
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <Button
      type="primary"
      icon={<CopyOutlined />}
      loading={isCopying}
      disabled={isLoading || !markdown}
      onClick={copyToClipboard}
    >
      {isCopying ? '复制中...' : '复制'}
    </Button>
  )
}
