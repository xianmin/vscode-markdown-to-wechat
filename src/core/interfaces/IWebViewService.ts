import * as vscode from 'vscode'

/**
 * WebView服务接口
 * 负责管理WebView的生命周期和通信
 */
export interface IWebViewService {
  /**
   * 创建WebView面板
   * @param title 面板标题
   * @param viewColumn 显示列
   * @returns WebView面板实例
   */
  createWebView(title: string, viewColumn: vscode.ViewColumn): vscode.WebviewPanel

  /**
   * 获取WebView内容
   * @param customCSS 自定义CSS
   * @returns WebView HTML内容
   */
  getWebViewContent(customCSS?: string): string

  /**
   * 注册WebView消息处理器
   * @param handler 消息处理函数
   */
  registerMessageHandler(handler: (message: any) => void): void

  /**
   * 向WebView发送消息
   * @param message 消息对象
   */
  postMessage(message: any): void

  /**
   * 销毁WebView
   */
  dispose(): void
}
