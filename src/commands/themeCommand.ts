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

    // 注册打开主题文件夹命令
    const openThemesFolderCommand = vscode.commands.registerCommand(
      'markdown-to-wechat.openThemesFolder',
      this.handleOpenThemesFolderCommand.bind(this)
    )

    // 注册刷新主题列表命令
    const refreshThemesCommand = vscode.commands.registerCommand(
      'markdown-to-wechat.refreshThemes',
      this.handleRefreshThemesCommand.bind(this)
    )

    // 注册重置主题路径命令
    const resetThemesPathCommand = vscode.commands.registerCommand(
      'markdown-to-wechat.resetThemesPath',
      this.handleResetThemesPathCommand.bind(this)
    )

    context.subscriptions.push(
      selectThemeCommand,
      openThemesFolderCommand,
      refreshThemesCommand,
      resetThemesPathCommand
    )
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

  /**
   * 处理打开主题文件夹命令
   */
  private handleOpenThemesFolderCommand(): void {
    const themesPath = this.previewService.getUserThemesPath()

    if (themesPath) {
      // 使用 vscode.Uri.file 创建文件路径的 URI
      const folderUri = vscode.Uri.file(themesPath)

      // 使用 VS Code 打开文件夹
      vscode.commands.executeCommand('revealFileInOS', folderUri).then(undefined, (err) => {
        vscode.window.showErrorMessage(`无法打开主题文件夹: ${err.message}`)
      })
    } else {
      vscode.window.showErrorMessage('未找到主题文件夹路径')
    }
  }

  /**
   * 处理刷新主题列表命令
   */
  private handleRefreshThemesCommand(): void {
    try {
      // 使用预览服务重新加载主题
      this.previewService.reloadThemes()

      // 显示成功消息
      vscode.window.showInformationMessage('主题列表已刷新')
    } catch (error) {
      const err = error as Error
      vscode.window.showErrorMessage(`刷新主题列表失败: ${err.message}`)
    }
  }

  /**
   * 处理重置主题路径命令
   */
  private async handleResetThemesPathCommand(): Promise<void> {
    try {
      // 获取默认路径
      const defaultPath = this.previewService.getDefaultThemesPath()

      // 提示用户确认
      const result = await vscode.window.showWarningMessage(
        `是否将主题路径重置为默认值: ${defaultPath}？`,
        { modal: true },
        '是',
        '否'
      )

      if (result === '是') {
        // 更新配置
        await vscode.workspace
          .getConfiguration('markdown-to-wechat')
          .update('themesStoragePath', defaultPath, vscode.ConfigurationTarget.Global)

        // 重新加载主题
        this.previewService.reloadThemes()

        vscode.window.showInformationMessage(`主题路径已重置为: ${defaultPath}`)
      }
    } catch (error) {
      const err = error as Error
      vscode.window.showErrorMessage(`重置主题路径失败: ${err.message}`)
    }
  }
}
