import * as vscode from 'vscode'
import { IPreviewService } from '../services/previewService'

/**
 * 预览命令处理类
 * 负责注册和处理预览相关的命令
 */
export class PreviewCommandHandler {
  /**
   * 预览服务实例
   */
  private readonly previewService: IPreviewService

  /**
   * 构造函数
   * @param previewService 预览服务实例
   */
  constructor(previewService: IPreviewService) {
    this.previewService = previewService
  }

  /**
   * 注册预览命令
   * @param context 扩展上下文
   */
  public registerCommands(context: vscode.ExtensionContext): void {
    // 注册预览命令
    const previewCommand = vscode.commands.registerCommand(
      'markdown-to-wechat.previewMarkdown',
      this.handlePreviewCommand.bind(this)
    )

    context.subscriptions.push(previewCommand)
  }

  /**
   * 处理预览命令
   */
  private handlePreviewCommand(): void {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showErrorMessage('请先打开一个Markdown文件')
      return
    }

    const document = editor.document
    if (document.languageId !== 'markdown') {
      vscode.window.showErrorMessage('当前文件不是Markdown文件')
      return
    }

    // 获取文档内容
    const markdownContent = document.getText()

    // 显示预览
    this.previewService.showPreview(markdownContent)
  }
}
