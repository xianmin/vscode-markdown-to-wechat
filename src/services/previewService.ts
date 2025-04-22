import * as vscode from 'vscode'
import { IPreviewService } from '../core/interfaces/IPreviewService'
import { IWebViewService } from '../core/interfaces/IWebViewService'
import { IThemeService } from '../core/interfaces/IThemeService'
import { ISettingsService } from '../core/interfaces/ISettingsService'
import { IEventBus } from '../core/interfaces/IEventBus'
import { AppSettings } from '../services/SettingsService'

/**
 * 预览服务实现
 */
export class PreviewService implements IPreviewService {
  /**
   * WebView服务
   */
  private readonly webViewService: IWebViewService

  /**
   * 主题服务
   */
  private readonly themeService: IThemeService

  /**
   * 设置服务
   */
  private readonly settingsService: ISettingsService

  /**
   * 事件总线
   */
  private readonly eventBus: IEventBus

  /**
   * 上次的Markdown内容
   */
  private lastMarkdownContent: string = ''

  /**
   * 构造函数
   * @param webViewService WebView服务
   * @param themeService 主题服务
   * @param settingsService 设置服务
   * @param eventBus 事件总线
   */
  constructor(
    webViewService: IWebViewService,
    themeService: IThemeService,
    settingsService: ISettingsService,
    eventBus: IEventBus
  ) {
    this.webViewService = webViewService
    this.themeService = themeService
    this.settingsService = settingsService
    this.eventBus = eventBus

    // 注册WebView消息处理器
    this.webViewService.registerMessageHandler(this.handleWebViewMessage.bind(this))

    // 订阅主题变更事件
    this.eventBus.subscribe('theme.changed', (data: any) => {
      // 更新WebView内容
      this.refreshWebViewWithTheme(data.themeCSS)
      // 发送主题数据到WebView
      this.sendThemesToWebView()
    })

    // 订阅设置变更事件
    this.eventBus.subscribe('settings.changed', (settings: AppSettings) => {
      this.webViewService.postMessage({
        type: 'settings',
        settings,
      })
    })
  }

  /**
   * 显示预览面板
   * @param markdownContent Markdown内容
   */
  showPreview(markdownContent: string): void {
    this.lastMarkdownContent = markdownContent

    const currentTheme = this.themeService.getCurrentTheme()
    const themeCSS = this.themeService.getThemeCSS(currentTheme.id)

    // 创建WebView并设置内容
    const webviewPanel = this.webViewService.createWebView(
      '微信公众号预览',
      vscode.ViewColumn.Beside
    )
    webviewPanel.webview.html = this.webViewService.getWebViewContent(themeCSS)

    // 注册WebView准备好的消息处理
    this.eventBus.subscribe('webview.message', (message: any) => {
      if (message.type === 'webviewReady') {
        // WebView准备好后发送Markdown内容
        this.updatePreview(this.lastMarkdownContent)
        // 发送主题和设置信息
        this.sendThemesToWebView()
        this.sendSettingsToWebView()
      }
    })
  }

  /**
   * 更新预览内容
   * @param markdownContent 新的Markdown内容
   */
  updatePreview(markdownContent: string): void {
    this.lastMarkdownContent = markdownContent
    this.webViewService.postMessage({
      type: 'setMarkdown',
      content: markdownContent,
    })
  }

  /**
   * 处理WebView消息
   * @param message WebView消息
   */
  private handleWebViewMessage(message: any): void {
    switch (message.type) {
      case 'getThemes':
        this.sendThemesToWebView()
        break
      case 'setTheme':
        this.themeService
          .setTheme(message.themeId)
          .catch((err) => vscode.window.showErrorMessage(`设置主题失败: ${err.message}`))
        break
      case 'getSettings':
        this.sendSettingsToWebView()
        break
      case 'updateSettings':
        this.settingsService
          .updateSettings(message.settings)
          .catch((err) => vscode.window.showErrorMessage(`更新设置失败: ${err.message}`))
        break
      case 'showInfo':
        vscode.window.showInformationMessage(message.message)
        break
      case 'showError':
        vscode.window.showErrorMessage(message.message)
        break
    }
  }

  /**
   * 刷新WebView内容
   * @param themeCSS 主题CSS
   */
  private refreshWebViewWithTheme(themeCSS: string): void {
    const webviewPanel = this.webViewService.createWebView(
      '微信公众号预览',
      vscode.ViewColumn.Beside
    )
    webviewPanel.webview.html = this.webViewService.getWebViewContent(themeCSS)
  }

  /**
   * 发送主题列表到WebView
   */
  private sendThemesToWebView(): void {
    const currentTheme = this.themeService.getCurrentTheme()
    const themes = this.themeService.getThemes().map((theme) => ({
      id: theme.id,
      name: theme.name,
    }))

    this.webViewService.postMessage({
      type: 'setThemes',
      themes,
      currentTheme: currentTheme.id,
      themeStylesJson: this.themeService.getThemeAsJson(currentTheme.id),
    })
  }

  /**
   * 发送设置到WebView
   */
  private sendSettingsToWebView(): void {
    const settings = this.settingsService.getSettings()
    this.webViewService.postMessage({
      type: 'settings',
      settings,
    })
  }

  /**
   * 销毁预览服务
   */
  dispose(): void {
    this.webViewService.dispose()
  }
}
