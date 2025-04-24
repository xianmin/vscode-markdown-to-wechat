import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { IThemeService, ThemeMetadata } from '../core/interfaces/IThemeService'
import { IEventBus } from '../core/interfaces/IEventBus'

/**
 * 主题信息
 */
export interface Theme {
  id: string
  name: string
  path: string
  author?: string
  description?: string
  version?: string
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
   * 复制custom.css到用户主题文件夹
   */
  private copyCustomThemeToUserFolder(): void {
    try {
      const sourcePath = path.join(this.defaultThemesPath, 'custom.css')
      const targetPath = path.join(this.userThemesPath, 'custom.css')

      // 只有当源文件存在且目标文件不存在时才复制
      if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath)
      }
    } catch (error) {
      const err = error as Error
      const errorMsg = `复制custom.css文件失败: ${err.message}`
      console.error(errorMsg)
      vscode.window.showErrorMessage(errorMsg)
    }
  }

  /**
   * 确保用户主题文件夹存在
   */
  private ensureUserThemesFolder(): void {
    try {
      // 如果用户主题文件夹不存在，创建它
      if (!fs.existsSync(this.userThemesPath)) {
        fs.mkdirSync(this.userThemesPath, { recursive: true })

        // 复制custom.css到用户主题文件夹
        this.copyCustomThemeToUserFolder()

        // 显示通知告知用户主题存储位置
        vscode.window
          .showInformationMessage(`主题文件存储在: ${this.userThemesPath}`, '打开文件夹')
          .then((selection) => {
            if (selection === '打开文件夹') {
              vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(this.userThemesPath))
            }
          })
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
        this.copyCustomThemeToUserFolder()
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
   * 加载所有主题文件
   */
  private loadThemes(): void {
    this.themes = []

    // 先从内置路径加载主题（扩展目录中的主题）
    if (fs.existsSync(this.defaultThemesPath)) {
      this.loadThemesFromFolder(this.defaultThemesPath)
    }

    // 检查用户主题文件夹是否存在
    let userThemesExist = fs.existsSync(this.userThemesPath)

    // 如果用户主题文件夹不存在，创建它
    if (!userThemesExist) {
      try {
        fs.mkdirSync(this.userThemesPath, { recursive: true })
        userThemesExist = true

        // 复制custom.css到用户主题文件夹
        this.copyCustomThemeToUserFolder()

        // 显示通知告知用户主题存储位置
        vscode.window
          .showInformationMessage(`主题文件存储在: ${this.userThemesPath}`, '打开文件夹')
          .then((selection) => {
            if (selection === '打开文件夹') {
              vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(this.userThemesPath))
            }
          })
      } catch (error) {
        const err = error as Error
        console.error(`创建用户主题文件夹失败: ${err.message}`)
        this.tryFallbackPath()
      }
    }

    // 如果用户主题文件夹存在，加载用户主题（会覆盖同名的内置主题）
    if (userThemesExist) {
      this.loadThemesFromFolder(this.userThemesPath, true)
    }
  }

  /**
   * 从指定文件夹加载主题
   * @param folderPath 文件夹路径
   * @param overrideExisting 是否覆盖已存在的主题
   */
  private loadThemesFromFolder(folderPath: string, overrideExisting: boolean = false): void {
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath)
      for (const file of files) {
        if (file.endsWith('.css')) {
          const id = path.basename(file, '.css')

          // 检查主题是否已存在
          const existingIndex = this.themes.findIndex((t) => t.id === id)
          const cssPath = path.join(folderPath, file)

          // 读取CSS内容
          const cssContent = fs.readFileSync(cssPath, 'utf8')

          // 提取主题元数据
          const metadata = this.extractThemeMetadata(cssContent)

          const theme: Theme = {
            id,
            name: metadata.name || id,
            path: cssPath,
            author: metadata.author,
            description: metadata.description,
            version: metadata.version,
          }

          if (existingIndex >= 0) {
            // 如果主题已存在且允许覆盖，则替换
            if (overrideExisting) {
              this.themes[existingIndex] = theme
            }
          } else {
            // 如果主题不存在，则添加
            this.themes.push(theme)
          }
        }
      }
    }
  }

  /**
   * 从CSS内容中提取主题元数据
   * @param cssContent CSS内容
   * @returns 主题元数据
   */
  private extractThemeMetadata(cssContent: string): ThemeMetadata {
    const metadata: ThemeMetadata = {}

    // 元数据正则表达式
    const metadataRegex = {
      name: /@theme-name:\s*(.+?)(?:\r|\n|$)/,
      author: /@theme-author:\s*(.+?)(?:\r|\n|$)/,
      description: /@theme-description:\s*(.+?)(?:\r|\n|$)/,
      version: /@theme-version:\s*(.+?)(?:\r|\n|$)/,
    }

    // 提取第一个注释块
    const commentBlockRegex = /\/\*\*([\s\S]*?)\*\//
    const commentBlock = cssContent.match(commentBlockRegex)

    if (commentBlock && commentBlock[1]) {
      const commentContent = commentBlock[1]

      // 提取各项元数据
      Object.keys(metadataRegex).forEach((key) => {
        const match = commentContent.match(metadataRegex[key as keyof typeof metadataRegex])
        if (match && match[1]) {
          metadata[key as keyof ThemeMetadata] = match[1].trim()
        }
      })
    }

    return metadata
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

    // 获取当前主题
    const currentTheme = this.getCurrentTheme()

    // 发布主题变更事件
    this.eventBus.publish('theme.changed', {
      themeId,
      themeCSS,
      themeJson: this.getThemeAsJson(themeId),
      themeName: currentTheme.name,
      themeAuthor: currentTheme.author,
      themeDescription: currentTheme.description,
      themeVersion: currentTheme.version,
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

    // 获取当前主题
    const currentTheme = this.getCurrentTheme()

    // 发布主题重新加载事件
    this.eventBus.publish('theme.reloaded', {
      themes: this.getThemes(),
      currentThemeId: this.currentThemeId,
      currentThemeName: currentTheme.name,
      currentThemeAuthor: currentTheme.author,
      currentThemeDescription: currentTheme.description,
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
    const defaultTheme = this.themes.find((t) => t.id === 'default')
    return defaultTheme || this.themes[0]
  }
}
