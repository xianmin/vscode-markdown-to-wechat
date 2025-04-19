import { Toolbar, Preview } from './components'
import { AppProvider, useAppContext } from './context'
import { VSCodeAPI } from './hooks'
import './App.css'

interface AppProps {
  vscode: VSCodeAPI
}

// 主应用组件
function App({ vscode }: AppProps) {
  return (
    <AppProvider vscode={vscode}>
      <AppContent />
    </AppProvider>
  )
}

// 内部内容组件，使用上下文
function AppContent() {
  const {
    html,
    isLoading,
    error,
    themes,
    currentTheme,
    isCopying,
    changeTheme,
    copyToClipboard,
    containerRef,
  } = useAppContext()

  return (
    <div className="app-container">
      <Toolbar
        themes={themes}
        currentTheme={currentTheme}
        onThemeChange={changeTheme}
        isLoading={isLoading}
        hasContent={!!html}
        isCopying={isCopying}
        onCopy={copyToClipboard}
      />

      <Preview html={html} isLoading={isLoading} error={error} containerRef={containerRef} />
    </div>
  )
}

export default App
