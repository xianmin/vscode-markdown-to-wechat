import { createContext, useContext, ReactNode } from 'react'
import {
  useVSCodeMessaging,
  useMessageListener,
  useMarkdownProcessor,
  useThemeManager,
  useCopyToClipboard,
} from '../hooks'
import { VSCodeAPI } from '../hooks/useVSCodeMessaging'
import { Theme, ThemeStyleJson } from '../hooks/useThemeManager'

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

  // 处理Markdown
  const { html, isLoading, error, frontmatter } = useMarkdownProcessor(markdown, themeStylesJson)

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
  const mergedThemeStyles = Object.keys(themeStylesJson).length > 0 ? themeStylesJson : themeStyles

  const value = {
    markdown,
    html,
    isLoading,
    error,
    frontmatter,
    themes: mergedThemes,
    currentTheme: mergedCurrentTheme,
    themeStyles: mergedThemeStyles,
    isCopying,
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
