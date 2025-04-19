import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export interface Theme {
  id: string
  name: string
  path: string
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
   * 获取默认主题
   */
  public getDefaultTheme(): Theme | undefined {
    // 尝试获取默认主题或返回第一个主题
    const defaultTheme = this.themes.find((t) => t.id === 'default')
    return defaultTheme || this.themes[0]
  }
}
