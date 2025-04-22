import { Toolbar, Preview } from './components'
import { AppProvider } from './context'
import { VSCodeAPI } from './hooks'
import { App as AntdApp } from 'antd'
import './App.css'

interface AppProps {
  vscode: VSCodeAPI
}

// 主应用组件
function App({ vscode }: AppProps) {
  return (
    <AppProvider vscode={vscode}>
      <AntdApp>
        <div className="app-container">
          <Toolbar />

          <div className="app-content">
            <Preview />
          </div>
        </div>
      </AntdApp>
    </AppProvider>
  )
}

export default App
