// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode'
import { Container } from './infrastructure/container'
import { EventBus } from './infrastructure/EventBus'
import { CommandManager } from './infrastructure/CommandManager'
import { WebViewService } from './services/WebViewService'
import { ThemeService } from './services/ThemeService'
import { SettingsService } from './services/SettingsService'
import { PreviewService } from './services/PreviewService'
import { IEventBus } from './core/interfaces/IEventBus'
import { IWebViewService } from './core/interfaces/IWebViewService'
import { IThemeService } from './core/interfaces/IThemeService'
import { ISettingsService } from './core/interfaces/ISettingsService'
import { IPreviewService } from './core/interfaces/IPreviewService'

export function activate(context: vscode.ExtensionContext) {
  // 初始化ThemeService的全局存储路径
  ThemeService.initGlobalStorage(context)

  // 初始化默认的主题存储路径
  initializeDefaultThemesPath()

  // 创建并注册事件总线
  const eventBus = new EventBus()
  Container.register<IEventBus>('IEventBus', eventBus)

  // 创建并注册服务
  registerServices(context, eventBus)

  // 注册命令
  registerCommands(context)

  // 注册事件监听
  registerEventListeners(context)
}

/**
 * 注册所有服务
 * @param context 扩展上下文
 * @param eventBus 事件总线
 */
function registerServices(context: vscode.ExtensionContext, eventBus: IEventBus): void {
  // 创建设置服务
  const settingsService = new SettingsService(context, eventBus)
  Container.register<ISettingsService>('ISettingsService', settingsService)

  // 创建WebView服务
  const webViewService = new WebViewService(context.extensionUri, eventBus)
  Container.register<IWebViewService>('IWebViewService', webViewService)

  // 创建主题服务
  const themeService = new ThemeService(context.extensionUri.fsPath, eventBus)
  Container.register<IThemeService>('IThemeService', themeService)

  // 创建预览服务
  const previewService = new PreviewService(webViewService, themeService, settingsService, eventBus)
  Container.register<IPreviewService>('IPreviewService', previewService)
}

/**
 * 注册命令
 * @param context 扩展上下文
 */
function registerCommands(context: vscode.ExtensionContext): void {
  const commandManager = new CommandManager(context)
  const previewService = Container.resolve<IPreviewService>('IPreviewService')
  const themeService = Container.resolve<IThemeService>('IThemeService')

  // 注册预览命令
  commandManager.registerCommand('markdown-to-wechat.previewMarkdown', () => {
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
    previewService.showPreview(markdownContent)
  })

  // 注册选择主题命令
  commandManager.registerCommand('markdown-to-wechat.selectTheme', async () => {
    const currentTheme = themeService.getCurrentTheme()
    const allThemes = themeService.getThemes()

    // 创建快速选择项
    const themeItems = allThemes.map((theme) => ({
      label: theme.name,
      description: theme.id === currentTheme.id ? '(当前)' : '',
      themeId: theme.id,
    }))

    // 显示快速选择界面
    const selected = await vscode.window.showQuickPick(themeItems, {
      placeHolder: '选择微信公众号预览主题',
    })

    if (selected) {
      themeService.setTheme(selected.themeId)
    }
  })

  // 注册打开主题文件夹命令
  commandManager.registerCommand('markdown-to-wechat.openThemesFolder', () => {
    const themesPath = themeService.getUserThemesPath()

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
  })

  // 注册刷新主题列表命令
  commandManager.registerCommand('markdown-to-wechat.refreshThemes', () => {
    try {
      // 使用预览服务重新加载主题
      themeService.reloadThemes()
    } catch (error) {
      const err = error as Error
      vscode.window.showErrorMessage(`刷新主题列表失败: ${err.message}`)
    }
  })

  // 注册重置主题路径命令
  commandManager.registerCommand('markdown-to-wechat.resetThemesPath', async () => {
    try {
      // 获取默认路径
      const defaultPath = themeService.getDefaultThemesPath()

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
        themeService.reloadThemes()

        vscode.window.showInformationMessage(`主题路径已重置为: ${defaultPath}`)
      }
    } catch (error) {
      const err = error as Error
      vscode.window.showErrorMessage(`重置主题路径失败: ${err.message}`)
    }
  })
}

/**
 * 注册事件监听
 * @param context 扩展上下文
 */
function registerEventListeners(context: vscode.ExtensionContext): void {
  const previewService = Container.resolve<IPreviewService>('IPreviewService')

  // 监听编辑器变化事件
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === 'markdown') {
        // 自动更新预览
        previewService.updatePreview(editor.document.getText())
      }
    })
  )

  // 监听文档变化事件
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (
        vscode.window.activeTextEditor &&
        event.document === vscode.window.activeTextEditor.document &&
        event.document.languageId === 'markdown'
      ) {
        // 文档内容变化时自动更新预览
        previewService.updatePreview(event.document.getText())
      }
    })
  )
}

/**
 * 初始化默认的主题存储路径
 */
function initializeDefaultThemesPath(): void {
  try {
    // 获取配置
    const config = vscode.workspace.getConfiguration('markdown-to-wechat')
    const currentThemesPath = config.get<string>('themesStoragePath')
    const defaultPath = ThemeService.getDefaultUserThemesPath()

    // 无论如何，我们都希望确保这个配置值已设置
    // 如果未设置或为空，则设置为默认值
    if (!currentThemesPath || currentThemesPath.trim() === '') {
      // 更新全局设置
      config
        .update('themesStoragePath', defaultPath, vscode.ConfigurationTarget.Global)
        .then(undefined, (error) => {
          console.error('设置默认主题存储路径失败:', error)
        })
    }
  } catch (error) {
    const err = error as Error
    console.error('初始化默认主题路径失败:', err.message)
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  // 清理资源
  const previewService = Container.resolve<IPreviewService>('IPreviewService')
  previewService.dispose()
}
