import * as vscode from 'vscode'
import { WebviewContentProvider } from '../webview/contentProvider'

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

  /**
   * 构造函数
   * @param extensionUri 扩展URI
   */
  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri
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
      }
    )

    // 设置WebView的HTML内容
    this.previewPanel.webview.html = WebviewContentProvider.getWebviewContent(
      this.previewPanel.webview,
      this.extensionUri
    )

    // 注册消息处理
    this.registerMessageHandlers()

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
   */
  public registerMessageHandlers(): void {
    if (!this.previewPanel) {
      return
    }

    // 监听WebView发送的消息
    this.previewPanel.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case 'webviewReady':
          // WebView已准备好，发送Markdown内容
          if (vscode.window.activeTextEditor && this.previewPanel) {
            this.updatePreview(vscode.window.activeTextEditor.document.getText())
          }
          break
        case 'copyHtml':
          // 将HTML复制到剪贴板
          this.copyHtmlToClipboard(message.html)
          break
      }
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
