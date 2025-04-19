import * as vscode from 'vscode'
import { IPreviewService } from '../services/previewService'
import { Theme } from '../utils/themeManager'

/**
 * 主题命令处理类
 * 负责注册和处理主题相关的命令
 */
export class ThemeCommandHandler {
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
   * 注册主题相关命令
   * @param context 扩展上下文
   */
  public registerCommands(context: vscode.ExtensionContext): void {
    // 注册选择主题命令
    const selectThemeCommand = vscode.commands.registerCommand(
      'markdown-to-wechat.selectTheme',
      this.handleSelectThemeCommand.bind(this)
    )

    context.subscriptions.push(selectThemeCommand)
  }

  /**
   * 处理选择主题命令
   */
  private async handleSelectThemeCommand(): Promise<void> {
    // 获取所有可用主题
    const currentTheme = this.previewService.getCurrentTheme()
    const allThemes = this.previewService.getThemes()

    const themes = currentTheme
      ? [currentTheme, ...allThemes.filter((t: Theme) => t.id !== currentTheme.id)]
      : allThemes

    // 创建QuickPick项
    const themeItems = themes.map((theme: Theme) => ({
      label: theme.name,
      description: theme.id === this.previewService.getCurrentTheme()?.id ? '(当前)' : '',
      themeId: theme.id,
    }))

    // 显示QuickPick让用户选择主题
    const selected = await vscode.window.showQuickPick(themeItems, {
      placeHolder: '选择微信公众号预览主题',
    })

    if (selected) {
      this.previewService.setTheme(selected.themeId)
    }
  }
}
