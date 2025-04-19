import { useState, useEffect } from 'react'
import { VSCodeAPI } from './useVSCodeMessaging'

// 定义主题类型
export interface Theme {
  id: string
  name: string
}

export function useThemeManager(vscode: VSCodeAPI) {
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentTheme, setCurrentTheme] = useState<string>('')

  // 监听主题消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data
      if (message.type === 'setThemes') {
        setThemes(message.themes)
        setCurrentTheme(message.currentTheme)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // 切换主题
  const changeTheme = (themeId: string) => {
    vscode.postMessage({
      type: 'setTheme',
      themeId,
    })
    setCurrentTheme(themeId)
  }

  return {
    themes,
    currentTheme,
    changeTheme,
  }
}
