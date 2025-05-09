import { useState, useCallback, useEffect } from 'react'
import { VSCodeAPI } from './useVSCodeMessaging'
import { AppSettings } from '../types/settings'

export const defaultSettings: AppSettings = {
  fontSize: '',
  headingNumberingStyle: '',
  primaryColor: '',
  forceLineBreaks: false,
  imageDomain: '',
  enableReferenceLinks: false,
}

/**
 * 设置管理器Hook
 * @param vscode VSCode API实例
 * @param initialSettings 初始设置值
 * @returns 设置管理器对象
 */
export function useSettingsManager(vscode: VSCodeAPI, initialSettings: AppSettings) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings || defaultSettings)

  // 当接收到新的设置时更新本地状态
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings)
    }
  }, [initialSettings])

  /**
   * 更新设置
   * @param newSettings 新的设置或部分设置
   */
  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      setSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings, ...newSettings }

        return updatedSettings
      })
    },
    [vscode]
  )

  /**
   * 保存设置到VSCode
   */
  const saveSettings = useCallback(() => {
    vscode.postMessage({
      type: 'updateSettings',
      settings: settings,
    })
  }, [vscode, settings])

  return {
    settings,
    updateSettings,
    saveSettings,
  }
}
