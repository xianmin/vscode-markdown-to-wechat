import { useEffect } from 'react'

// VSCode API 类型定义
export type VSCodeAPI = {
  postMessage: (message: any) => void
  getState: () => any
  setState: (state: any) => void
}

export function useVSCodeMessaging(vscode: VSCodeAPI) {
  useEffect(() => {
    // 通知VSCode WebView已准备好接收数据
    vscode.postMessage({ type: 'webviewReady' })

    // 请求主题列表
    vscode.postMessage({ type: 'getThemes' })
  }, [vscode])

  const showInfo = (message: string) => {
    vscode.postMessage({ type: 'showInfo', message })
  }

  const showError = (message: string) => {
    vscode.postMessage({ type: 'showError', message })
  }

  return {
    vscode,
    showInfo,
    showError,
  }
}
