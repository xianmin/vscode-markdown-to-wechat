import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export interface Theme {
  id: string
  name: string
  path: string
}

export interface ThemeStyleJson {
  [key: string]: { [property: string]: string }
}

export class ThemeManager {
  private themesPath: string
  private themes: Theme[] = []

  constructor(extensionPath: string) {
    this.themesPath = path.join(extensionPath, 'media', 'themes')
    this.loadThemes()
  }

  /**
   * 加载所有主题文件
   */
  private loadThemes() {
    if (fs.existsSync(this.themesPath)) {
      const files = fs.readdirSync(this.themesPath)
      for (const file of files) {
        if (file.endsWith('.css')) {
          const id = path.basename(file, '.css')
          this.themes.push({
            id,
            name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
            path: path.join(this.themesPath, file),
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
}
