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
  changeTheme: (themeId: string) => void
}

/**
 * 主题管理Hook，负责：
 * 1. 接收和管理来自VSCode的主题数据
 * 2. 提供主题切换功能
 */
export function useThemeManager(
  vscode: VSCodeAPI,
  initialThemes: Theme[],
  initialCurrentTheme: string
): ThemeManager {
  const [themes, setThemes] = useState<Theme[]>(initialThemes || [])
  const [currentTheme, setCurrentTheme] = useState<string>(initialCurrentTheme || '经典')

  // 当接收到新的主题数据时更新本地状态
  useEffect(() => {
    if (initialThemes.length > 0) {
      setThemes(initialThemes)
    }
  }, [initialThemes])

  useEffect(() => {
    if (initialCurrentTheme) {
      setCurrentTheme(initialCurrentTheme)
    }
  }, [initialCurrentTheme])

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
