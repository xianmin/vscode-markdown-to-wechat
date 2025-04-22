import { AppSettings } from '../../services/SettingsService'

/**
 * 设置服务接口
 * 负责管理应用设置
 */
export interface ISettingsService {
  /**
   * 获取当前设置
   * @returns 当前应用设置
   */
  getSettings(): AppSettings

  /**
   * 更新设置
   * @param settings 要更新的设置
   * @returns 更新后的设置
   */
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>

  /**
   * 重置设置为默认值
   * @returns 重置后的设置
   */
  resetSettings(): Promise<AppSettings>

  /**
   * 监听设置变更
   * @param listener 设置变更监听函数
   */
  onSettingsChanged(listener: (settings: AppSettings) => void): void
}
