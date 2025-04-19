import { useState, useEffect } from 'react'
import { VSCodeAPI } from './useVSCodeMessaging'

// 定义主题类型
export interface Theme {
  id: string
  name: string
}

// 定义主题样式JSON类型
export interface ThemeStyleJson {
  [selector: string]: { [property: string]: string }
}

export function useThemeManager(vscode: VSCodeAPI) {
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentTheme, setCurrentTheme] = useState<string>('')
  const [themeStyles, setThemeStyles] = useState<ThemeStyleJson>({})

  // 监听主题消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data
      if (message.type === 'setThemes') {
        setThemes(message.themes)
        setCurrentTheme(message.currentTheme)

        // 处理主题样式JSON
        if (message.themeStylesJson) {
          setThemeStyles(message.themeStylesJson)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // 切换主题
  const changeTheme = (themeId: string) => {
    vscode.postMessage({
      type: 'setTheme',
      themeId,
    })
    setCurrentTheme(themeId)
  }

  // 获取主题样式
  const getThemeStyle = (selector: string, property: string): string => {
    return themeStyles[selector]?.[property] || ''
  }

  // 获取CSS变量的实际值
  const getCSSVariableValue = (variableName: string): string => {
    // 从:root选择器中查找变量定义
    if (themeStyles[':root']) {
      return themeStyles[':root'][variableName] || ''
    }
    return ''
  }

  // 处理CSS变量 - 将var(--xx)替换为实际值
  const processCSSVariables = (value: string): string => {
    if (!value.includes('var(--')) {
      return value
    }

    let processedValue = value
    const variableRegex = /var\((--[^)]+)\)/g
    let match

    while ((match = variableRegex.exec(value)) !== null) {
      const variableName = match[1]
      const variableValue = getCSSVariableValue(variableName)

      if (variableValue) {
        processedValue = processedValue.replace(`var(${variableName})`, variableValue)
      }
    }

    return processedValue
  }

  // 获取元素应该应用的所有样式
  const getStylesForElement = (element: Element): { [property: string]: string } => {
    const result: { [property: string]: string } = {}
    const tagName = element.tagName.toLowerCase()

    // 遍历所有选择器，找到匹配当前元素的
    for (const selector in themeStyles) {
      if (selectorMatchesElement(selector, element)) {
        const styles = themeStyles[selector as keyof typeof themeStyles]

        // 合并样式
        for (const [property, value] of Object.entries(styles)) {
          // 处理CSS变量
          const processedValue = processCSSVariables(value)
          result[property] = processedValue
        }
      }
    }

    return result
  }

  // 判断选择器是否匹配元素
  const selectorMatchesElement = (selector: string, element: Element): boolean => {
    // 简单选择器匹配逻辑
    const simpleSelectorMatch = (simpleSelector: string): boolean => {
      simpleSelector = simpleSelector.trim()

      // 标签选择器
      if (simpleSelector === element.tagName.toLowerCase()) {
        return true
      }

      // ID选择器
      if (simpleSelector.startsWith('#') && simpleSelector.substring(1) === element.id) {
        return true
      }

      // 类选择器
      if (
        simpleSelector.startsWith('.') &&
        element.classList.contains(simpleSelector.substring(1))
      ) {
        return true
      }

      // :root 伪类
      if (simpleSelector === ':root' && element === document.documentElement) {
        return true
      }

      // body 选择器特殊处理，应用到所有顶级元素
      if (
        simpleSelector === 'body' &&
        element.parentElement &&
        element.parentElement.tagName === 'DIV'
      ) {
        return true
      }

      return false
    }

    // 处理组合选择器
    const selectors = selector.split(',').map((s) => s.trim())
    return selectors.some((s) => {
      // 对于简单选择器，直接匹配
      if (!s.includes(' ') && !s.includes('>')) {
        return simpleSelectorMatch(s)
      }

      // 对于复合选择器，我们简化处理，只匹配元素的标签名
      return s.split(/[\s>+~]/).some((part) => simpleSelectorMatch(part))
    })
  }

  return {
    themes,
    currentTheme,
    themeStyles,
    changeTheme,
    getThemeStyle,
    getStylesForElement,
    selectorMatchesElement,
    processCSSVariables,
    getCSSVariableValue,
  }
}
