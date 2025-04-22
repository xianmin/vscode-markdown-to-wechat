import * as vscode from 'vscode'
import { IWebViewService } from '../core/interfaces/IWebViewService'
import { IEventBus } from '../core/interfaces/IEventBus'
import { WebviewContentProvider } from '../webview/contentProvider'

/**
 * WebView服务实现
 */
export class WebViewService implements IWebViewService {
  /**
   * WebView面板实例
   */
  private webviewPanel: vscode.WebviewPanel | undefined

  /**
   * 扩展URI
   */
  private readonly extensionUri: vscode.Uri

  /**
   * 事件总线
   */
  private readonly eventBus: IEventBus

  /**
   * 消息处理器列表
   */
  private readonly messageHandlers: ((message: any) => void)[] = []

  /**
   * 是否为开发模式
   */
  private readonly isDevelopmentMode: boolean

  /**
   * 构造函数
   * @param extensionUri 扩展URI
   * @param eventBus 事件总线
   */
  constructor(extensionUri: vscode.Uri, eventBus: IEventBus) {
    this.extensionUri = extensionUri
    this.eventBus = eventBus
    this.isDevelopmentMode = process.env.VSCODE_DEBUG_MODE === 'true'
  }

  /**
   * 创建WebView面板
   * @param title 面板标题
   * @param viewColumn 显示列
   * @returns WebView面板实例
   */
  createWebView(title: string, viewColumn: vscode.ViewColumn): vscode.WebviewPanel {
    // 如果面板已存在，直接展示
    if (this.webviewPanel) {
      this.webviewPanel.reveal(viewColumn)
      return this.webviewPanel
    }

    // 创建新的WebView面板
    this.webviewPanel = vscode.window.createWebviewPanel('markdownPreview', title, viewColumn, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
      retainContextWhenHidden: true,
    })

    // 处理WebView消息
    this.webviewPanel.webview.onDidReceiveMessage(this.handleWebViewMessage.bind(this))

    // 处理WebView关闭事件
    this.webviewPanel.onDidDispose(() => {
      this.webviewPanel = undefined
      this.eventBus.publish('webview.disposed', {})
    })

    return this.webviewPanel
  }

  /**
   * 获取WebView内容
   * @param customCSS 自定义CSS
   * @returns WebView HTML内容
   */
  getWebViewContent(customCSS?: string): string {
    if (!this.webviewPanel) {
      throw new Error('WebView未创建')
    }

    return WebviewContentProvider.getWebviewContent(
      this.webviewPanel.webview,
      this.extensionUri,
      customCSS,
      this.isDevelopmentMode
    )
  }

  /**
   * 注册WebView消息处理器
   * @param handler 消息处理函数
   */
  registerMessageHandler(handler: (message: any) => void): void {
    this.messageHandlers.push(handler)
  }

  /**
   * 处理WebView消息
   * @param message 消息对象
   */
  private handleWebViewMessage(message: any): void {
    // 分发消息给所有处理器
    for (const handler of this.messageHandlers) {
      try {
        handler(message)
      } catch (error) {
        console.error('WebView消息处理异常:', error)
      }
    }

    // 通过事件总线广播消息
    this.eventBus.publish('webview.message', message)
  }

  /**
   * 向WebView发送消息
   * @param message 消息对象
   */
  postMessage(message: any): void {
    if (this.webviewPanel) {
      this.webviewPanel.webview.postMessage(message)
    }
  }

  /**
   * 销毁WebView
   */
  dispose(): void {
    if (this.webviewPanel) {
      this.webviewPanel.dispose()
      this.webviewPanel = undefined
    }
  }
}
