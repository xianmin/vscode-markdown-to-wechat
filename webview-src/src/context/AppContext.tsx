import { createContext, useContext, ReactNode } from 'react'
import {
  useVSCodeMessaging,
  useMessageListener,
  useMarkdownProcessor,
  useThemeManager,
  useCopyToClipboard,
} from '../hooks'
import { VSCodeAPI } from '../hooks/useVSCodeMessaging'
import { Theme } from '../hooks/useThemeManager'

// 定义上下文类型
interface AppContextType {
  markdown: string
  html: string
  isLoading: boolean
  error: string | null
  themes: Theme[]
  currentTheme: string
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
  useVSCodeMessaging(vscode)
  const {
    markdown,
    themes: messageThemes,
    currentTheme: messageCurrentTheme,
  } = useMessageListener(vscode)
  const { html, isLoading, error } = useMarkdownProcessor(markdown)
  const { themes, currentTheme, changeTheme } = useThemeManager(vscode)
  const { isCopying, copyToClipboard, containerRef } = useCopyToClipboard(vscode)

  // 合并值
  const mergedThemes = messageThemes.length > 0 ? messageThemes : themes
  const mergedCurrentTheme = messageCurrentTheme || currentTheme

  const value = {
    markdown,
    html,
    isLoading,
    error,
    themes: mergedThemes,
    currentTheme: mergedCurrentTheme,
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
