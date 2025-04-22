import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { IThemeService } from '../core/interfaces/IThemeService'
import { IEventBus } from '../core/interfaces/IEventBus'

/**
 * 主题信息
 */
export interface Theme {
  id: string
  name: string
  path: string
}

/**
 * 主题样式JSON表示
 */
export interface ThemeStyleJson {
  [key: string]: { [property: string]: string }
}

/**
 * 主题服务实现
 */
export class ThemeService implements IThemeService {
  /**
   * 全局存储路径
   */
  private static globalStoragePath: string

  /**
   * 事件总线
   */
  private readonly eventBus: IEventBus

  /**
   * 默认主题路径
   */
  private defaultThemesPath: string

  /**
   * 用户主题路径
   */
  private userThemesPath: string = ''

  /**
   * 可用主题列表
   */
  private themes: Theme[] = []

  /**
   * 当前主题ID
   */
  private currentThemeId: string = 'default'

  /**
   * 初始化全局存储路径
   * @param context 扩展上下文
   */
  public static initGlobalStorage(context: vscode.ExtensionContext): void {
    // 使用扩展全局存储路径
    this.globalStoragePath = context.globalStorageUri.fsPath
  }

  /**
   * 获取默认的用户主题存储路径
   */
  public static getDefaultUserThemesPath(): string {
    if (!this.globalStoragePath) {
      throw new Error('全局存储路径尚未初始化，请先调用 initGlobalStorage 方法')
    }

    return path.join(this.globalStoragePath, 'themes')
  }

  /**
   * 构造函数
   * @param extensionPath 扩展路径
   * @param eventBus 事件总线
   */
  constructor(extensionPath: string, eventBus: IEventBus) {
    this.eventBus = eventBus
    this.defaultThemesPath = path.join(extensionPath, 'media', 'themes')

    if (!ThemeService.globalStoragePath) {
      throw new Error('全局存储路径尚未初始化，请先调用 ThemeService.initGlobalStorage')
    }

    // 初始化用户主题路径
    this.initializeUserThemesPath()

    // 确保用户主题文件夹存在并包含默认主题
    this.ensureUserThemesFolder()

    // 加载所有主题
    this.loadThemes()

    // 初始化当前主题
    this.initializeCurrentTheme()
  }

  /**
   * 初始化用户主题路径
   */
  private initializeUserThemesPath(): void {
    // 获取用户配置的主题存储路径
    const config = vscode.workspace.getConfiguration('markdown-to-wechat')
    const configThemesPath = config.get<string>('themesStoragePath')

    // 如果用户设置了有效的主题路径，则使用用户设置的路径，否则使用默认路径
    if (configThemesPath && configThemesPath.trim() !== '') {
      this.userThemesPath = configThemesPath
    } else {
      // 默认使用计算出的路径
      try {
        this.userThemesPath = ThemeService.getDefaultUserThemesPath()
      } catch (error) {
        // 如果获取默认路径失败，使用备选路径
        const err = error as Error
        console.error(`获取默认路径失败: ${err.message}`)
        this.userThemesPath = this.getFallbackPath()
      }

      // 自动设置配置值，确保用户能看到默认路径
      // 注意：这里不会覆盖用户的显式设置，只有当设置为空时才会设置
      if (!configThemesPath || configThemesPath.trim() === '') {
        config
          .update('themesStoragePath', this.userThemesPath, vscode.ConfigurationTarget.Global)
          .then(undefined, (error) => {
            console.error('更新主题路径配置失败:', error)
          })
      }
    }
  }

  /**
   * 初始化当前主题
   */
  private initializeCurrentTheme(): void {
    const config = vscode.workspace.getConfiguration('markdown-to-wechat')
    const configTheme = config.get<string>('theme')

    const defaultTheme = this.getDefaultTheme()
    if (configTheme && this.getThemeCSS(configTheme)) {
      this.currentThemeId = configTheme
    } else if (defaultTheme) {
      this.currentThemeId = defaultTheme.id
    }
  }

  /**
   * 获取备选路径
   */
  private getFallbackPath(): string {
    const tempDir = os.tmpdir()
    return path.join(tempDir, 'markdown-to-wechat-themes')
  }

  /**
   * 确保用户主题文件夹存在，并包含默认主题
   */
  private ensureUserThemesFolder(): void {
    try {
      // 如果用户主题文件夹不存在，创建它
      if (!fs.existsSync(this.userThemesPath)) {
        fs.mkdirSync(this.userThemesPath, { recursive: true })

        // 复制默认主题文件到用户主题文件夹
        this.copyDefaultThemesToUserFolder()

        // 显示通知告知用户主题存储位置
        vscode.window
          .showInformationMessage(`主题文件存储在: ${this.userThemesPath}`, '打开文件夹')
          .then((selection) => {
            if (selection === '打开文件夹') {
              vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(this.userThemesPath))
            }
          })
      } else {
        // 如果文件夹已存在，检查是否为空，如果为空，复制默认主题
        const files = fs.readdirSync(this.userThemesPath)
        if (files.length === 0) {
          this.copyDefaultThemesToUserFolder()
        }
      }
    } catch (error) {
      const err = error as Error
      const errorMsg = `无法创建主题文件夹: ${err.message}`
      console.error(errorMsg)
      vscode.window.showErrorMessage(errorMsg)

      // 尝试使用不同的路径作为备选
      this.tryFallbackPath()
    }
  }

  /**
   * 尝试使用备选路径
   */
  private tryFallbackPath(): void {
    try {
      // 使用临时目录作为备选
      this.userThemesPath = this.getFallbackPath()

      // 创建备选文件夹
      if (!fs.existsSync(this.userThemesPath)) {
        fs.mkdirSync(this.userThemesPath, { recursive: true })
        this.copyDefaultThemesToUserFolder()
      }

      // 更新配置
      vscode.workspace
        .getConfiguration('markdown-to-wechat')
        .update('themesStoragePath', this.userThemesPath, vscode.ConfigurationTarget.Global)

      vscode.window
        .showWarningMessage(`已使用备选路径存储主题: ${this.userThemesPath}`, '打开文件夹')
        .then((selection) => {
          if (selection === '打开文件夹') {
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(this.userThemesPath))
          }
        })
    } catch (error) {
      const err = error as Error
      vscode.window.showErrorMessage(`备选路径也失败了: ${err.message}`)
    }
  }

  /**
   * 复制默认主题到用户主题文件夹
   */
  private copyDefaultThemesToUserFolder(): void {
    try {
      if (!fs.existsSync(this.defaultThemesPath)) {
        return
      }

      const files = fs.readdirSync(this.defaultThemesPath)
      for (const file of files) {
        if (file.endsWith('.css')) {
          const sourcePath = path.join(this.defaultThemesPath, file)
          const targetPath = path.join(this.userThemesPath, file)
          fs.copyFileSync(sourcePath, targetPath)
        }
      }
    } catch (error) {
      const err = error as Error
      const errorMsg = `复制默认主题文件失败: ${err.message}`
      console.error(errorMsg)
      vscode.window.showErrorMessage(errorMsg)
    }
  }

  /**
   * 加载所有主题文件
   */
  private loadThemes(): void {
    this.themes = []

    // 检查用户主题文件夹是否有CSS文件
    const userThemesExist = this.checkThemesExist(this.userThemesPath)

    // 如果用户主题文件夹中没有CSS文件，则复制默认主题
    if (!userThemesExist) {
      this.copyDefaultThemesToUserFolder()
    }

    // 加载用户主题
    this.loadThemesFromFolder(this.userThemesPath)
  }

  /**
   * 检查指定文件夹中是否存在CSS文件
   * @param folderPath 文件夹路径
   */
  private checkThemesExist(folderPath: string): boolean {
    if (!fs.existsSync(folderPath)) {
      return false
    }

    const files = fs.readdirSync(folderPath)
    return files.some((file) => file.endsWith('.css'))
  }

  /**
   * 从指定文件夹加载主题
   * @param folderPath 文件夹路径
   * @param skipExisting 是否跳过已存在的主题
   */
  private loadThemesFromFolder(folderPath: string, skipExisting: boolean = false): void {
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath)
      for (const file of files) {
        if (file.endsWith('.css')) {
          const id = path.basename(file, '.css')

          // 如果设置了跳过已存在的主题且已经加载过该主题，则跳过
          if (skipExisting && this.themes.some((t) => t.id === id)) {
            continue
          }

          this.themes.push({
            id,
            name: id,
            path: path.join(folderPath, file),
          })
        }
      }
    }
  }

  /**
   * 获取当前主题
   * @returns 当前主题
   */
  getCurrentTheme(): Theme {
    const theme = this.getThemes().find((t) => t.id === this.currentThemeId)
    // 如果未找到当前主题，返回默认主题
    return theme || this.getDefaultTheme() || this.getThemes()[0]
  }

  /**
   * 设置主题
   * @param themeId 主题ID
   */
  async setTheme(themeId: string): Promise<void> {
    if (this.currentThemeId === themeId) {
      return
    }

    const themeCSS = this.getThemeCSS(themeId)
    if (!themeCSS) {
      throw new Error(`主题 "${themeId}" 不存在或无法加载`)
    }

    this.currentThemeId = themeId

    // 保存用户选择的主题
    await vscode.workspace.getConfiguration('markdown-to-wechat').update('theme', themeId, true)

    // 发布主题变更事件
    this.eventBus.publish('theme.changed', {
      themeId,
      themeCSS,
      themeJson: this.getThemeAsJson(themeId),
    })
  }

  /**
   * 获取所有可用主题
   * @returns 主题列表
   */
  getThemes(): Theme[] {
    return this.themes
  }

  /**
   * 重新加载主题
   */
  reloadThemes(): void {
    this.ensureUserThemesFolder()
    this.loadThemes()
    this.eventBus.publish('theme.reloaded', {
      themes: this.getThemes(),
    })
  }

  /**
   * 获取用户主题路径
   * @returns 用户主题文件夹路径
   */
  getUserThemesPath(): string {
    return this.userThemesPath
  }

  /**
   * 获取默认主题路径
   * @returns 默认主题文件夹路径
   */
  getDefaultThemesPath(): string {
    return ThemeService.getDefaultUserThemesPath()
  }

  /**
   * 获取主题CSS
   * @param themeId 主题ID
   * @returns 主题CSS内容
   */
  getThemeCSS(themeId: string): string {
    const theme = this.themes.find((t) => t.id === themeId)
    if (theme && fs.existsSync(theme.path)) {
      return fs.readFileSync(theme.path, 'utf8')
    }
    return ''
  }

  /**
   * 获取主题的JSON表示
   * @param themeId 主题ID
   * @returns 主题样式JSON
   */
  getThemeAsJson(themeId: string): ThemeStyleJson {
    const css = this.getThemeCSS(themeId)
    return this.cssToJson(css)
  }

  /**
   * 将CSS内容转换为JSON对象
   * @param css CSS内容
   */
  private cssToJson(css: string): ThemeStyleJson {
    const result: ThemeStyleJson = {}

    // 移除注释、换行等
    const cleanedCSS = css.replace(/\/\*[\s\S]*?\*\//g, '').trim()

    // 提取选择器和样式规则
    const blocks = cleanedCSS.match(/([^{]+){([^}]*)}/g) || []

    for (const block of blocks) {
      const [selector, styles] = block.split('{')
      const cleanSelector = selector.trim()
      const styleProperties: { [key: string]: string } = {}

      // 处理样式
      const styleRules = styles.replace('}', '').trim()
      const declarations = styleRules.split(';').filter(Boolean)

      for (const declaration of declarations) {
        const [property, value] = declaration.split(':').map((item) => item.trim())
        if (property && value) {
          styleProperties[property] = value
        }
      }

      // 多个选择器（以逗号分隔）分开处理
      const subSelectors = cleanSelector.split(',').map((s) => s.trim())
      for (const subSelector of subSelectors) {
        result[subSelector] = styleProperties
      }
    }

    return result
  }

  /**
   * 获取默认主题
   */
  private getDefaultTheme(): Theme | undefined {
    // 尝试获取默认主题或返回第一个主题
    const defaultTheme = this.themes.find((t) => t.id === '经典')
    return defaultTheme || this.themes[0]
  }
}
