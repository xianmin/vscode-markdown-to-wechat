import { useState, useEffect } from 'react'
import { VSCodeAPI } from './useVSCodeMessaging'

// 定义主题类型
export interface Theme {
  id: string
  name: string
}

// 定义主题样式JSON类型
export interface ThemeStyleJson {
  [selector: string]: { [property: string]: string }
}

// 定义useThemeManager返回类型
export interface ThemeManager {
  themes: Theme[]
  currentTheme: string
  themeStyles: ThemeStyleJson
  changeTheme: (themeId: string) => void
  getCSSVariableValue: (variableName: string) => string
}

/**
 * 主题管理Hook，负责：
 * 1. 接收和管理来自VSCode的主题数据
 * 2. 提供主题切换功能
 * 3. 提供原始主题样式数据
 */
export function useThemeManager(vscode: VSCodeAPI): ThemeManager {
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentTheme, setCurrentTheme] = useState<string>('')
  const [themeStyles, setThemeStyles] = useState<ThemeStyleJson>({})

  // 监听主题消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data
      if (message.type === 'setThemes') {
        setThemes(message.themes)
        setCurrentTheme(message.currentTheme)

        // 处理主题样式JSON
        if (message.themeStylesJson) {
          setThemeStyles(message.themeStylesJson)
        }
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

  // 获取CSS变量的实际值
  const getCSSVariableValue = (variableName: string): string => {
    // 从:root选择器中查找变量定义
    if (themeStyles[':root']) {
      return themeStyles[':root'][variableName] || ''
    }
    return ''
  }

  return {
    themes,
    currentTheme,
    themeStyles,
    changeTheme,
    getCSSVariableValue,
  }
}
