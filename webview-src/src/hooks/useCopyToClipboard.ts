import { useState, useRef } from 'react'
import { VSCodeAPI } from './useVSCodeMessaging'

export function useCopyToClipboard(vscode: VSCodeAPI) {
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

      vscode.postMessage({ type: 'showInfo', message: '已复制内容到剪贴板，可直接粘贴到公众号' })
    } catch (err) {
      vscode.postMessage({
        type: 'showError',
        message: `复制失败: ${err instanceof Error ? err.message : String(err)}`,
      })
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
