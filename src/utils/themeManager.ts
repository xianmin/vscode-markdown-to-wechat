import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface Theme {
  id: string
  name: string
  path: string
}

export interface ThemeStyleJson {
  [key: string]: { [property: string]: string }
}

export class ThemeManager {
  private defaultThemesPath: string
  private userThemesPath: string
  private themes: Theme[] = []
  private static globalStoragePath: string

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

  constructor(extensionPath: string) {
    this.defaultThemesPath = path.join(extensionPath, 'media', 'themes')

    if (!ThemeManager.globalStoragePath) {
      throw new Error('全局存储路径尚未初始化，请先调用 ThemeManager.initGlobalStorage')
    }

    // 获取用户配置的主题存储路径
    const config = vscode.workspace.getConfiguration('markdown-to-wechat')
    const configThemesPath = config.get<string>('themesStoragePath')

    // 如果用户设置了有效的主题路径，则使用用户设置的路径，否则使用默认路径
    if (configThemesPath && configThemesPath.trim() !== '') {
      this.userThemesPath = configThemesPath
    } else {
      // 默认使用计算出的路径
      try {
        this.userThemesPath = ThemeManager.getDefaultUserThemesPath()
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

    // 确保用户主题文件夹存在并包含默认主题
    this.ensureUserThemesFolder()

    // 加载所有主题（优先用户主题，然后是默认主题）
    this.loadThemes()
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
  private loadThemes() {
    this.themes = []

    // 先加载用户主题
    this.loadThemesFromFolder(this.userThemesPath)

    // 再加载默认主题（不重复添加）
    if (this.defaultThemesPath !== this.userThemesPath) {
      this.loadThemesFromFolder(this.defaultThemesPath, true)
    }
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
            name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
            path: path.join(folderPath, file),
          })
        }
      }
    }
  }

  /**
   * 获取所有可用主题
   */
  public getThemes(): Theme[] {
    return this.themes
  }

  /**
   * 获取指定主题的CSS内容
   * @param themeId 主题ID
   */
  public getThemeCSS(themeId: string): string {
    const theme = this.themes.find((t) => t.id === themeId)
    if (theme && fs.existsSync(theme.path)) {
      return fs.readFileSync(theme.path, 'utf8')
    }
    return ''
  }

  /**
   * 获取主题CSS转换为JSON格式
   * @param themeId 主题ID
   */
  public getThemeAsJson(themeId: string): ThemeStyleJson {
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
  public getDefaultTheme(): Theme | undefined {
    // 尝试获取默认主题或返回第一个主题
    const defaultTheme = this.themes.find((t) => t.id === 'default')
    return defaultTheme || this.themes[0]
  }

  /**
   * 获取用户主题文件夹路径
   */
  public getUserThemesPath(): string {
    return this.userThemesPath
  }

  /**
   * 重新加载主题
   */
  public reloadThemes(): void {
    this.loadThemes()
  }
}
