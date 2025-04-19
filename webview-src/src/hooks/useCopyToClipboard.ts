import { useState, useRef } from 'react'
import { message } from 'antd'

export function useCopyToClipboard() {
  const [isCopying, setIsCopying] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = async (markdownText?: string) => {
    if (!containerRef.current || isCopying) {
      return
    }

    setIsCopying(true)

    try {
      // 复制渲染后的内容
      const container = containerRef.current

      // 获取HTML内容
      const htmlContent = container.innerHTML

      console.log('htmlContent', htmlContent)

      // 判断是否支持新的Clipboard API
      if (navigator.clipboard && window.ClipboardItem) {
        // 使用现代Clipboard API创建剪贴板项
        const clipboardContent = new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([markdownText || ''], { type: 'text/plain' }),
        })

        await navigator.clipboard.write([clipboardContent])
      } else {
        // 回退到旧方法
        // 选择内容
        const selection = window.getSelection()
        const range = document.createRange()
        selection?.removeAllRanges()
        range.selectNodeContents(container)
        selection?.addRange(range)

        // 执行复制
        document.execCommand('copy')

        // 清除选择
        selection?.removeAllRanges()
      }

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

  return {
    isCopying,
    copyToClipboard,
    containerRef,
  }
}
