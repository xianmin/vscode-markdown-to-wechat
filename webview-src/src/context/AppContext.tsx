import { createContext, useContext, ReactNode, useState } from 'react'
import {
  useVSCodeMessaging,
  useMessageListener,
  useMarkdownProcessor,
  useThemeManager,
  useCopyToClipboard,
} from '../hooks'
import { VSCodeAPI } from '../hooks/useVSCodeMessaging'
import { Theme, ThemeStyleJson } from '../hooks/useThemeManager'

// 设置类型定义
export interface AppSettings {
  fontSize: string
  // 后续可以添加更多设置项
}

// 默认设置
const defaultSettings: AppSettings = {
  fontSize: '16px',
}

// 定义上下文类型
interface AppContextType {
  markdown: string
  html: string
  isLoading: boolean
  error: string | null
  frontmatter: string | null
  themes: Theme[]
  currentTheme: string
  themeStyles: ThemeStyleJson
  isCopying: boolean
  settings: AppSettings
  updateSettings: (newSettings: Partial<AppSettings>) => void
  changeTheme: (themeId: string) => void
  copyToClipboard: () => void
  containerRef: React.RefObject<HTMLDivElement>
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
    themes: messageThemes,
    currentTheme: messageCurrentTheme,
    themeStylesJson,
  } = useMessageListener(vscode)

  // 用户设置
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  // 更新设置的方法
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }))
  }

  // 合并设置到主题样式
  const mergedThemeStyles = {
    ...themeStylesJson,
    body: {
      ...(themeStylesJson.body || {}),
      fontSize: settings.fontSize,
    },
  }

  // 处理Markdown
  const { html, isLoading, error, frontmatter } = useMarkdownProcessor(markdown, mergedThemeStyles)

  // 管理主题
  const themeManager = useThemeManager(vscode)
  const { themes, currentTheme, changeTheme, themeStyles } = themeManager

  // 复制功能
  const { isCopying, copyToClipboard: _copyToClipboard, containerRef } = useCopyToClipboard()

  // 包装复制函数，传递markdown原文本
  const copyToClipboard = () => {
    _copyToClipboard(markdown)
  }

  // 合并值
  const mergedThemes = messageThemes.length > 0 ? messageThemes : themes
  const mergedCurrentTheme = messageCurrentTheme || currentTheme
  const finalThemeStyles =
    Object.keys(themeStylesJson).length > 0
      ? mergedThemeStyles
      : {
          ...themeStyles,
          body: {
            ...(themeStyles.body || {}),
            fontSize: settings.fontSize,
          },
        }

  const value = {
    markdown,
    html,
    isLoading,
    error,
    frontmatter,
    themes: mergedThemes,
    currentTheme: mergedCurrentTheme,
    themeStyles: finalThemeStyles,
    isCopying,
    settings,
    updateSettings,
    changeTheme,
    copyToClipboard,
    containerRef,
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
