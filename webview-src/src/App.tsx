import { useEffect, useState } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import './App.css'

// VSCode API 类型定义
type VSCodeAPI = {
  postMessage: (message: any) => void
  getState: () => any
  setState: (state: any) => void
}

interface AppProps {
  vscode: VSCodeAPI
}

// 定义主题类型
interface Theme {
  id: string
  name: string
}

function App({ vscode }: AppProps) {
  const [markdown, setMarkdown] = useState<string>('')
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentTheme, setCurrentTheme] = useState<string>('')
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false)

  // 处理从VSCode接收的消息
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

    // 通知VSCode WebView已准备好接收数据
    vscode.postMessage({ type: 'webviewReady' })

    // 请求主题列表
    vscode.postMessage({ type: 'getThemes' })

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [vscode])

  // 当Markdown内容变化时，转换为HTML
  useEffect(() => {
    const convertMarkdown = async () => {
      if (!markdown) return

      setIsLoading(true)
      setError(null)

      try {
        const result = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(markdown)

        setHtml(result.toString())
      } catch (err) {
        setError(`转换失败: ${err instanceof Error ? err.message : String(err)}`)
        console.error('Markdown转换错误:', err)
      } finally {
        setIsLoading(false)
      }
    }

    convertMarkdown()
  }, [markdown])

  // 切换主题
  const handleThemeChange = (themeId: string) => {
    vscode.postMessage({
      type: 'setTheme',
      themeId,
    })
    setCurrentTheme(themeId)
    setShowThemeSelector(false)
  }

  return (
    <div className="app-container">
      <div className="toolbar">
        <h1>微信公众号预览</h1>
        <div className="toolbar-actions">
          <div className="theme-selector">
            <button
              className="theme-button"
              onClick={() => setShowThemeSelector(!showThemeSelector)}
            >
              主题: {themes.find((t) => t.id === currentTheme)?.name || '默认'}
            </button>
            {showThemeSelector && (
              <div className="theme-dropdown">
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`theme-item ${theme.id === currentTheme ? 'theme-item-active' : ''}`}
                    onClick={() => handleThemeChange(theme.id)}
                  >
                    {theme.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => vscode.postMessage({ type: 'copyHtml', html })}
            disabled={isLoading || !html}
          >
            复制HTML
          </button>
        </div>
      </div>

      <div className="preview-container">
        {isLoading && <div className="loading">正在转换...</div>}
        {error && <div className="error">{error}</div>}
        {html && <div className="preview-content" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  )
}

export default App
