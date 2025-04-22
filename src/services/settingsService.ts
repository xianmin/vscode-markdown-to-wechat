import * as vscode from 'vscode'
import { ISettingsService } from '../core/interfaces/ISettingsService'
import { IEventBus } from '../core/interfaces/IEventBus'

// 定义设置类型
export interface AppSettings {
  fontSize: string
  headingNumberingStyle: string
  primaryColor: string
  forceLineBreaks: boolean
  // 后续可添加更多设置
}

// 默认设置
const defaultSettings: AppSettings = {
  fontSize: '',
  headingNumberingStyle: '',
  primaryColor: '',
  forceLineBreaks: false, // 默认不强制换行
}

// 配置键常量
const CONFIG_SECTION = 'markdown-to-wechat'
const FONT_SIZE_KEY = 'fontSize'
const HEADING_NUMBERING_STYLE_KEY = 'headingNumberingStyle'
const PRIMARY_COLOR_KEY = 'primaryColor'
const FORCE_LINE_BREAKS_KEY = 'forceLineBreaks'

/**
 * 设置服务实现
 */
export class SettingsService implements ISettingsService {
  /**
   * 扩展上下文
   */
  private readonly context: vscode.ExtensionContext

  /**
   * 事件总线
   */
  private readonly eventBus: IEventBus

  /**
   * 设置变更监听器
   */
  private readonly settingsChangedListeners: ((settings: AppSettings) => void)[] = []

  /**
   * 构造函数
   * @param context 扩展上下文
   * @param eventBus 事件总线
   */
  constructor(context: vscode.ExtensionContext, eventBus: IEventBus) {
    this.context = context
    this.eventBus = eventBus

    // 监听配置变更
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (
          e.affectsConfiguration(`${CONFIG_SECTION}.${FONT_SIZE_KEY}`) ||
          e.affectsConfiguration(`${CONFIG_SECTION}.${HEADING_NUMBERING_STYLE_KEY}`) ||
          e.affectsConfiguration(`${CONFIG_SECTION}.${PRIMARY_COLOR_KEY}`) ||
          e.affectsConfiguration(`${CONFIG_SECTION}.${FORCE_LINE_BREAKS_KEY}`)
        ) {
          const settings = this.getSettings()
          this.notifySettingsChanged(settings)
        }
      })
    )
  }

  /**
   * 获取当前设置
   * @returns 当前应用设置
   */
  getSettings(): AppSettings {
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

  /**
   * 更新设置
   * @param settings 要更新的设置
   * @returns 更新后的设置
   */
  async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
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

    // 获取更新后的设置
    const updatedSettings = this.getSettings()

    // 通知设置变更
    this.notifySettingsChanged(updatedSettings)

    return updatedSettings
  }

  /**
   * 重置设置为默认值
   * @returns 重置后的设置
   */
  async resetSettings(): Promise<AppSettings> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

    // 重置所有设置为默认值
    await config.update(FONT_SIZE_KEY, undefined, true)
    await config.update(HEADING_NUMBERING_STYLE_KEY, undefined, true)
    await config.update(PRIMARY_COLOR_KEY, undefined, true)
    await config.update(FORCE_LINE_BREAKS_KEY, undefined, true)

    // 获取重置后的设置
    const resetSettings = this.getSettings()

    // 通知设置变更
    this.notifySettingsChanged(resetSettings)

    return resetSettings
  }

  /**
   * 监听设置变更
   * @param listener 设置变更监听函数
   */
  onSettingsChanged(listener: (settings: AppSettings) => void): void {
    this.settingsChangedListeners.push(listener)
  }

  /**
   * 通知设置变更
   * @param settings 变更后的设置
   */
  private notifySettingsChanged(settings: AppSettings): void {
    // 通知所有监听器
    for (const listener of this.settingsChangedListeners) {
      try {
        listener(settings)
      } catch (error) {
        console.error('设置变更监听器异常:', error)
      }
    }

    // 通过事件总线广播
    this.eventBus.publish('settings.changed', settings)
  }
}
