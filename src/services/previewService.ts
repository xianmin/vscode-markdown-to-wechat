import * as vscode from 'vscode'
import { WebviewContentProvider } from '../webview/contentProvider'
import { Theme, ThemeManager } from '../utils/themeManager'

/**
 * 预览服务接口
 * 定义预览服务的公共方法
 */
export interface IPreviewService {
  /**
   * 显示预览面板
   * @param markdownContent Markdown 内容
   */
  showPreview(markdownContent: string): void

  /**
   * 更新预览内容
   * @param markdownContent 新的 Markdown 内容
   */
  updatePreview(markdownContent: string): void

  /**
   * 设置主题
   * @param themeId 主题ID
   */
  setTheme(themeId: string): void

  /**
   * 获取当前主题
   */
  getCurrentTheme(): Theme | undefined

  /**
   * 获取所有可用主题
   */
  getThemes(): Theme[]

  /**
   * 注册事件监听
   * @param context 扩展上下文
   */
  registerEventListeners(context: vscode.ExtensionContext): void

  /**
   * 注册消息处理
   */
  registerMessageHandlers(): void

  /**
   * 销毁预览服务
   */
  dispose(): void
}

/**
 * 预览服务实现
 * 负责管理预览面板和内容更新
 */
export class PreviewService implements IPreviewService {
  // 预览面板实例
  private previewPanel: vscode.WebviewPanel | undefined = undefined

  // 扩展URI，用于资源访问
  private readonly extensionUri: vscode.Uri

  // 主题管理器
  private readonly themeManager: ThemeManager

  // 当前主题ID
  private currentThemeId: string = 'default-light'

  /**
   * 构造函数
   * @param extensionUri 扩展URI
   */
  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri
    this.themeManager = new ThemeManager(extensionUri.fsPath)

    // 读取用户设置中的主题，如果有的话
    const config = vscode.workspace.getConfiguration('markdown-to-wechat')
    const configTheme = config.get<string>('theme')

    // 初始化主题
    const defaultTheme = this.themeManager.getDefaultTheme()
    if (configTheme && this.themeManager.getThemeCSS(configTheme)) {
      this.currentThemeId = configTheme
    } else if (defaultTheme) {
      this.currentThemeId = defaultTheme.id
    }
  }

  /**
   * 显示预览面板
   * @param markdownContent Markdown 内容
   */
  public showPreview(markdownContent: string): void {
    // 如果面板已经存在，则重用它
    if (this.previewPanel) {
      this.previewPanel.reveal(vscode.ViewColumn.Beside)
      // 发送新的Markdown内容到现有面板
      this.updatePreview(markdownContent)
      return
    }

    // 创建WebView面板
    this.previewPanel = vscode.window.createWebviewPanel(
      'markdownPreview',
      '微信公众号预览',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        // 限制WebView可以加载的资源范围
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
        retainContextWhenHidden: true, // 隐藏时保留上下文，减少重新加载问题
      }
    )

    // 存储当前内容以便在 WebView 准备好时使用
    const initialContent = markdownContent

    // 获取当前主题CSS
    const themeCSS = this.themeManager.getThemeCSS(this.currentThemeId)

    // 设置WebView的HTML内容
    this.previewPanel.webview.html = WebviewContentProvider.getWebviewContent(
      this.previewPanel.webview,
      this.extensionUri,
      themeCSS
    )

    // 注册消息处理
    this.registerMessageHandlers(initialContent)

    // 监听面板关闭事件
    this.previewPanel.onDidDispose(() => {
      this.previewPanel = undefined
    })
  }

  /**
   * 更新预览内容
   * @param markdownContent 新的 Markdown 内容
   */
  public updatePreview(markdownContent: string): void {
    if (this.previewPanel) {
      this.previewPanel.webview.postMessage({
        type: 'setMarkdown',
        content: markdownContent,
      })
    }
  }

  /**
   * 设置主题
   * @param themeId 主题ID
   */
  public setTheme(themeId: string): void {
    if (this.currentThemeId === themeId) {
      return
    }

    const themeCSS = this.themeManager.getThemeCSS(themeId)
    if (!themeCSS) {
      vscode.window.showWarningMessage(`主题 "${themeId}" 不存在或无法加载`)
      return
    }

    this.currentThemeId = themeId

    // 如果预览面板已打开，则更新主题
    if (this.previewPanel) {
      this.previewPanel.webview.html = WebviewContentProvider.getWebviewContent(
        this.previewPanel.webview,
        this.extensionUri,
        themeCSS
      )

      // 通知WebView主题已更改
      this.sendThemesToWebView()
    }

    // 保存用户选择的主题
    vscode.workspace.getConfiguration('markdown-to-wechat').update('theme', themeId, true)
  }

  /**
   * 获取当前主题
   */
  public getCurrentTheme(): Theme | undefined {
    const themes = this.themeManager.getThemes()
    return themes.find((t) => t.id === this.currentThemeId)
  }

  /**
   * 获取所有可用主题
   */
  public getThemes(): Theme[] {
    return this.themeManager.getThemes()
  }

  /**
   * 注册事件监听
   * @param context 扩展上下文
   */
  public registerEventListeners(context: vscode.ExtensionContext): void {
    // 监听编辑器变化事件
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this.previewPanel && editor.document.languageId === 'markdown') {
          // 自动更新预览
          this.updatePreview(editor.document.getText())
        }
      })
    )

    // 监听文档变化事件
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (
          this.previewPanel &&
          vscode.window.activeTextEditor &&
          event.document === vscode.window.activeTextEditor.document &&
          event.document.languageId === 'markdown'
        ) {
          // 文档内容变化时自动更新预览
          this.updatePreview(event.document.getText())
        }
      })
    )
  }

  /**
   * 注册消息处理
   * @param initialContent 初始的 Markdown 内容，用于 WebView 准备好时发送
   */
  public registerMessageHandlers(initialContent?: string): void {
    if (!this.previewPanel) {
      return
    }

    // 监听WebView发送的消息
    this.previewPanel.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case 'webviewReady':
          // WebView已准备好，发送Markdown内容
          if (initialContent) {
            // 使用传入的初始内容
            this.updatePreview(initialContent)
          } else if (vscode.window.activeTextEditor && this.previewPanel) {
            // 否则尝试使用当前编辑器内容
            this.updatePreview(vscode.window.activeTextEditor.document.getText())
          }
          break
        case 'getThemes':
          // 发送主题列表到WebView
          this.sendThemesToWebView()
          break
        case 'setTheme':
          // 更改主题
          this.setTheme(message.themeId)
          break
        case 'copyHtml':
          // 将HTML复制到剪贴板
          this.copyHtmlToClipboard(message.html)
          break
      }
    })
  }

  /**
   * 发送主题列表到WebView
   */
  private sendThemesToWebView(): void {
    if (!this.previewPanel) {
      return
    }

    const themes = this.themeManager.getThemes().map((theme) => ({
      id: theme.id,
      name: theme.name,
    }))

    this.previewPanel.webview.postMessage({
      type: 'setThemes',
      themes,
      currentTheme: this.currentThemeId,
    })
  }

  /**
   * 复制HTML到剪贴板
   * @param html HTML内容
   */
  private copyHtmlToClipboard(html: string): void {
    try {
      vscode.env.clipboard.writeText(html).then(() => {
        vscode.window.showInformationMessage('HTML已复制到剪贴板')
      })
    } catch (err) {
      const error = err as Error
      vscode.window.showErrorMessage(`复制失败: ${error.message}`)
    }
  }

  /**
   * 销毁预览服务
   */
  public dispose(): void {
    if (this.previewPanel) {
      this.previewPanel.dispose()
      this.previewPanel = undefined
    }
  }
}
