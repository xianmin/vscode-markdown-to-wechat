// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode'
import { Container } from './infrastructure/Container'
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

/**
 * 扩展激活函数
 * @param context 扩展上下文
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    console.time('激活扩展')
    console.log('开始激活 Markdown to WeChat 扩展')

    // 初始化 ThemeService 的全局存储路径
    ThemeService.initGlobalStorage(context)

    // 创建并注册事件总线
    const eventBus = new EventBus()
    Container.register<IEventBus>('IEventBus', eventBus)

    // 注册所有服务
    await registerServices(context, eventBus)

    // 注册命令
    registerCommands(context)

    // 注册事件监听
    registerEventListeners(context)

    console.timeEnd('激活扩展')
    console.log('Markdown to WeChat 扩展已激活')
  } catch (error) {
    const err = error as Error
    vscode.window.showErrorMessage(`Markdown to WeChat 扩展激活失败: ${err.message}`)
    console.error('扩展激活失败:', err)
    throw error
  }
}

/**
 * 注册所有服务
 * @param context 扩展上下文
 * @param eventBus 事件总线
 */
async function registerServices(
  context: vscode.ExtensionContext,
  eventBus: IEventBus
): Promise<void> {
  try {
    console.time('注册服务')

    // 创建设置服务
    const settingsService = new SettingsService(context, eventBus)
    Container.register<ISettingsService>('ISettingsService', settingsService)

    // 创建WebView服务
    const webViewService = new WebViewService(context.extensionUri, eventBus)
    Container.register<IWebViewService>('IWebViewService', webViewService)

    // 创建主题服务 - ThemeService 会自行处理主题路径初始化
    const themeService = new ThemeService(context.extensionUri.fsPath, eventBus)
    Container.register<IThemeService>('IThemeService', themeService)

    // 创建预览服务
    const previewService = new PreviewService(
      webViewService,
      themeService,
      settingsService,
      eventBus
    )
    Container.register<IPreviewService>('IPreviewService', previewService)

    console.timeEnd('注册服务')
  } catch (error) {
    console.error('注册服务失败:', error)
    throw error
  }
}

/**
 * 注册命令
 * @param context 扩展上下文
 */
function registerCommands(context: vscode.ExtensionContext): void {
  try {
    console.time('注册命令')

    const commandManager = new CommandManager(context)
    const previewService = Container.resolve<IPreviewService>('IPreviewService')
    const themeService = Container.resolve<IThemeService>('IThemeService')

    // 注册预览命令
    commandManager.registerCommand('markdown-to-wechat.previewMarkdown', () => {
      try {
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
      } catch (error) {
        const err = error as Error
        vscode.window.showErrorMessage(`预览命令执行失败: ${err.message}`)
        console.error('预览命令执行失败:', err)
      }
    })

    // 注册选择主题命令
    commandManager.registerCommand('markdown-to-wechat.selectTheme', async () => {
      try {
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
      } catch (error) {
        const err = error as Error
        vscode.window.showErrorMessage(`选择主题失败: ${err.message}`)
        console.error('选择主题失败:', err)
      }
    })

    // 注册打开主题文件夹命令
    commandManager.registerCommand('markdown-to-wechat.openThemesFolder', () => {
      try {
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
      } catch (error) {
        const err = error as Error
        vscode.window.showErrorMessage(`打开主题文件夹失败: ${err.message}`)
        console.error('打开主题文件夹失败:', err)
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
        console.error('刷新主题列表失败:', err)
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
        console.error('重置主题路径失败:', err)
      }
    })

    console.timeEnd('注册命令')
  } catch (error) {
    console.error('注册命令失败:', error)
    throw error
  }
}

/**
 * 注册事件监听
 * @param context 扩展上下文
 */
function registerEventListeners(context: vscode.ExtensionContext): void {
  try {
    console.time('注册事件监听')

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

    console.timeEnd('注册事件监听')
  } catch (error) {
    console.error('注册事件监听失败:', error)
    throw error
  }
}

/**
 * 扩展停用函数
 */
export function deactivate(): void {
  console.log('开始清理 Markdown to WeChat 扩展资源')

  try {
    // 获取需要清理的服务
    const services = [
      Container.resolve<IPreviewService>('IPreviewService'),
      Container.resolve<IWebViewService>('IWebViewService'),
      // 可以根据需要添加其他需要清理的服务
    ]

    // 清理所有服务
    for (const service of services) {
      if (typeof service.dispose === 'function') {
        service.dispose()
      }
    }

    console.log('Markdown to WeChat 扩展资源已清理')
  } catch (error) {
    console.error('清理资源时出错:', error)
  }
}
