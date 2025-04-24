export interface Theme {
  id: string
  name: string
  path: string
  author?: string
  description?: string
  version?: string
}

export interface ThemeStyleJson {
  [key: string]: { [property: string]: string }
}

/**
 * 主题元数据
 */
export interface ThemeMetadata {
  name?: string
  author?: string
  description?: string
  version?: string
}

/**
 * 主题服务接口
 * 负责管理和切换主题
 */
export interface IThemeService {
  /**
   * 获取当前主题
   * @returns 当前主题
   */
  getCurrentTheme(): Theme

  /**
   * 设置主题
   * @param themeId 主题ID
   */
  setTheme(themeId: string): Promise<void>

  /**
   * 获取所有可用主题
   * @returns 主题列表
   */
  getThemes(): Theme[]

  /**
   * 重新加载主题
   */
  reloadThemes(): void

  /**
   * 获取用户主题路径
   * @returns 用户主题文件夹路径
   */
  getUserThemesPath(): string

  /**
   * 获取默认主题路径
   * @returns 默认主题文件夹路径
   */
  getDefaultThemesPath(): string

  /**
   * 获取主题CSS
   * @param themeId 主题ID
   * @returns 主题CSS内容
   */
  getThemeCSS(themeId: string): string

  /**
   * 获取主题的JSON表示
   * @param themeId 主题ID
   * @returns 主题样式JSON
   */
  getThemeAsJson(themeId: string): ThemeStyleJson
}
