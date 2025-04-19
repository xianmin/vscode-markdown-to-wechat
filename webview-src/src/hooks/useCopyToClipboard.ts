import { useState, useRef } from 'react'
import { message } from 'antd'

export function useCopyToClipboard() {
  const [isCopying, setIsCopying] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = async () => {
    if (!containerRef.current || isCopying) {
      return
    }

    setIsCopying(true)

    try {
      // 复制渲染后的内容
      const container = containerRef.current

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

      // 使用 antd message 提示成功
      message.success('已复制内容到剪贴板，可直接粘贴到公众号')
    } catch (err) {
      // 使用 antd message 提示错误
      message.error(`复制失败: ${err instanceof Error ? err.message : String(err)}`)
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
