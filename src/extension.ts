// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode'
import { PreviewService } from './services/previewService'
import { PreviewCommandHandler } from './commands/previewCommand'
import { ThemeCommandHandler } from './commands/themeCommand'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Markdown to WeChat extension is now active')

  // 创建预览服务
  const previewService = new PreviewService(context.extensionUri)

  // 注册事件监听
  previewService.registerEventListeners(context)

  // 创建命令处理器
  const previewCommandHandler = new PreviewCommandHandler(previewService)
  const themeCommandHandler = new ThemeCommandHandler(previewService)

  // 注册命令
  previewCommandHandler.registerCommands(context)
  themeCommandHandler.registerCommands(context)
}

// This method is called when your extension is deactivated
export function deactivate() {}
