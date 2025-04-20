import { useState, useEffect } from 'react'
import { VSCodeAPI } from './useVSCodeMessaging'
import { Theme, ThemeStyleJson } from './useThemeManager'
import { AppSettings } from '../types/settings'

export function useMessageListener(vscode: VSCodeAPI) {
  const [markdown, setMarkdown] = useState<string>('')
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentTheme, setCurrentTheme] = useState<string>('')
  const [themeStylesJson, setThemeStylesJson] = useState<ThemeStyleJson>({})
  const [settings, setSettings] = useState<AppSettings>({ fontSize: '16px' })

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
          if (message.themeStylesJson) {
            setThemeStylesJson(message.themeStylesJson)
          }
          break
        case 'settings':
          setSettings(message.settings)
          break
        default:
          console.log('未知消息类型', message.type)
      }
    }

    // 添加消息处理器
    window.addEventListener('message', handleMessage)

    // 页面加载后请求初始设置
    vscode.postMessage({ type: 'getSettings' })

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [vscode])

  return {
    markdown,
    themes,
    currentTheme,
    themeStylesJson,
    settings,
  }
}
