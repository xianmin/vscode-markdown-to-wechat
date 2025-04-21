// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode'
import { PreviewService } from './services/previewService'
import { SettingsService } from './services/settingsService'
import { PreviewCommandHandler } from './commands/previewCommand'
import { ThemeCommandHandler } from './commands/themeCommand'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Markdown to WeChat extension is now active')

  // 创建服务
  const settingsService = new SettingsService(context)
  const previewService = new PreviewService(context.extensionUri)

  // 注册事件监听
  previewService.registerEventListeners(context)

  // 设置WebView消息处理
  previewService.onWebViewCreated((webviewPanel) => {
    // 发送初始设置给WebView
    const initialSettings = settingsService.getSettings()
    webviewPanel.webview.postMessage({
      type: 'settings',
      settings: initialSettings,
    })

    // 处理来自WebView的消息
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'updateSettings') {
        // 更新设置
        const updatedSettings = await settingsService.updateSettings(message.settings)
        // 广播更新后的设置给所有打开的WebView
        previewService.postMessageToAllWebViews({
          type: 'settings',
          settings: updatedSettings,
        })
      } else if (message.type === 'getSettings') {
        // WebView 请求获取设置
        const currentSettings = settingsService.getSettings()
        webviewPanel.webview.postMessage({
          type: 'settings',
          settings: currentSettings,
        })
      }
    })
  })

  // 监听配置变更事件
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      // 检查是否是我们的配置项发生了变化
      if (
        event.affectsConfiguration('markdown-to-wechat.fontSize') ||
        event.affectsConfiguration('markdown-to-wechat.headingNumberingStyle')
      ) {
        console.log('监测到设置变更')
        // 获取新的设置并广播
        const updatedSettings = settingsService.getSettings()
        console.log('新的设置值:', updatedSettings)

        // 广播到所有 WebView
        previewService.postMessageToAllWebViews({
          type: 'settings',
          settings: updatedSettings,
        })
      }
    })
  )

  // 创建命令处理器
  const previewCommandHandler = new PreviewCommandHandler(previewService)
  const themeCommandHandler = new ThemeCommandHandler(previewService)

  // 注册命令
  previewCommandHandler.registerCommands(context)
  themeCommandHandler.registerCommands(context)
}

// This method is called when your extension is deactivated
export function deactivate() {}
