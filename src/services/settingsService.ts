import * as vscode from 'vscode'

// 定义设置类型
export interface AppSettings {
  fontSize: string
  headingNumberingStyle: string
  primaryColor: string
  forceLineBreaks: boolean
  // 后续可添加更多设置
}

// 默认设置
export const defaultSettings: AppSettings = {
  fontSize: '',
  headingNumberingStyle: 'number-dot', // 默认使用数字点形式
  primaryColor: '', // 默认为空
  forceLineBreaks: false, // 默认不强制换行
}

// 配置键常量
const CONFIG_SECTION = 'markdown-to-wechat'
const FONT_SIZE_KEY = 'fontSize'
const HEADING_NUMBERING_STYLE_KEY = 'headingNumberingStyle'
const PRIMARY_COLOR_KEY = 'primaryColor'
const FORCE_LINE_BREAKS_KEY = 'forceLineBreaks'

// 设置管理服务
export class SettingsService {
  private context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  // 获取所有设置
  public getSettings(): AppSettings {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

    return {
      fontSize: config.get<string>(FONT_SIZE_KEY, defaultSettings.fontSize),
      headingNumberingStyle: config.get<string>(
        HEADING_NUMBERING_STYLE_KEY,
        defaultSettings.headingNumberingStyle
      ),
      primaryColor: config.get<string>(PRIMARY_COLOR_KEY, defaultSettings.primaryColor),
      forceLineBreaks: config.get<boolean>(FORCE_LINE_BREAKS_KEY, defaultSettings.forceLineBreaks),
    }
  }

  // 更新设置
  public async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

    // 更新字体大小
    if (newSettings.fontSize !== undefined) {
      await config.update(FONT_SIZE_KEY, newSettings.fontSize, true)
    }

    // 更新二级标题计数样式
    if (newSettings.headingNumberingStyle !== undefined) {
      await config.update(HEADING_NUMBERING_STYLE_KEY, newSettings.headingNumberingStyle, true)
    }

    // 更新主题颜色
    if (newSettings.primaryColor !== undefined) {
      await config.update(PRIMARY_COLOR_KEY, newSettings.primaryColor, true)
    }

    // 更新强制换行设置
    if (newSettings.forceLineBreaks !== undefined) {
      await config.update(FORCE_LINE_BREAKS_KEY, newSettings.forceLineBreaks, true)
    }

    // 返回更新后的设置
    return this.getSettings()
  }

  // 重置设置为默认值
  public async resetSettings(): Promise<AppSettings> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

    // 重置所有设置为默认值
    await config.update(FONT_SIZE_KEY, undefined, true) // undefined 表示恢复默认值
    await config.update(HEADING_NUMBERING_STYLE_KEY, undefined, true)
    await config.update(PRIMARY_COLOR_KEY, undefined, true)
    await config.update(FORCE_LINE_BREAKS_KEY, undefined, true)

    return this.getSettings()
  }

  // 验证字体大小值是否有效
  public isValidFontSize(fontSize: string): boolean {
    // 检查是否符合格式要求 (数字+px)
    const fontSizePattern = /^\d+px$/
    if (!fontSizePattern.test(fontSize)) {
      return false
    }

    // 提取数字部分
    const size = parseInt(fontSize)

    // 检查范围 (14-18px)
    return size >= 14 && size <= 18
  }
}
