import { useState, useEffect } from 'react'
import { VSCodeAPI } from './useVSCodeMessaging'
import { Theme } from './useThemeManager'

export function useMessageListener(vscode: VSCodeAPI) {
  const [markdown, setMarkdown] = useState<string>('')
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentTheme, setCurrentTheme] = useState<string>('')

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data
      switch (message.type) {
        case 'setMarkdown':
          setMarkdown(message.content)
          break
        case 'setThemes':
          setThemes(message.themes)
          setCurrentTheme(message.currentTheme)
          break
        default:
          console.log('未知消息类型', message.type)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [vscode])

  return {
    markdown,
    themes,
    currentTheme,
  }
}
