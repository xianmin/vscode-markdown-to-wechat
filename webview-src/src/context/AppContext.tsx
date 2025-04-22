import { createContext, useContext, ReactNode } from 'react'
import {
  useVSCodeMessaging,
  useMessageListener,
  useMarkdownProcessor,
  useThemeManager,
  useSettingsManager,
} from '../hooks'
import { VSCodeAPI } from '../hooks/useVSCodeMessaging'
import { Theme } from '../hooks/useThemeManager'
import { AppSettings } from '../types/settings'

// 定义上下文类型
interface AppContextType {
  markdown: string
  html: string
  isLoading: boolean
  error: string | null
  frontmatter: string | null
  themes: Theme[]
  currentTheme: string
  settings: AppSettings
  updateSettings: (newSettings: Partial<AppSettings>) => void
  saveSettings: () => void
  changeTheme: (themeId: string) => void
}

// 创建上下文
const AppContext = createContext<AppContextType | undefined>(undefined)

// 上下文提供者组件
interface AppProviderProps {
  children: ReactNode
  vscode: VSCodeAPI
}

export function AppProvider({ children, vscode }: AppProviderProps) {
  // 初始化VSCode消息服务
  useVSCodeMessaging(vscode)

  // 从消息中获取数据
  const {
    markdown,
    themes: themesFromMessage,
    currentTheme: currentThemeFromMessage,
    themeStylesJson,
    settings: settingsFromMessage,
  } = useMessageListener(vscode)

  // 设置管理
  const { settings, updateSettings, saveSettings } = useSettingsManager(vscode, settingsFromMessage)

  // 处理 Markdown
  const { html, isLoading, error, frontmatter } = useMarkdownProcessor(
    markdown,
    themeStylesJson,
    settings
  )

  // 管理主题
  const { themes, currentTheme, changeTheme } = useThemeManager(
    vscode,
    themesFromMessage,
    currentThemeFromMessage
  )

  const value = {
    markdown,
    html,
    isLoading,
    error,
    frontmatter,
    themes,
    currentTheme,
    changeTheme,
    settings,
    updateSettings,
    saveSettings,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// 自定义Hook，用于访问上下文
export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
