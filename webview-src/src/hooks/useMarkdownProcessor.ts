import { useState, useEffect } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { ThemeStyleJson, useThemeManager } from './useThemeManager'
import { VSCodeAPI } from './useVSCodeMessaging'

export function useMarkdownProcessor(
  markdown: string,
  themeStyles: ThemeStyleJson = {},
  vscode?: VSCodeAPI
) {
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // 获取主题管理器的方法
  const themeManager = vscode ? useThemeManager(vscode) : null
  const { getStylesForElement, selectorMatchesElement } = themeManager || {
    getStylesForElement: null,
    selectorMatchesElement: null,
  }

  // 当Markdown内容或主题样式变化时，转换为HTML
  useEffect(() => {
    const convertMarkdown = async () => {
      if (!markdown) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // 移除Front Matter
        const contentWithoutFrontMatter = removeFrontMatter(markdown)

        const result = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(contentWithoutFrontMatter)

        // 生成HTML并应用内联样式处理
        const rawHtml = result.toString()
        const processedHtml = processHtmlForClipboard(rawHtml, themeStyles)
        setHtml(processedHtml)
      } catch (err) {
        setError(`转换失败: ${err instanceof Error ? err.message : String(err)}`)
        console.error('Markdown转换错误:', err)
      } finally {
        setIsLoading(false)
      }
    }

    convertMarkdown()
  }, [markdown, themeStyles])

  // 移除Front Matter
  const removeFrontMatter = (content: string): string => {
    // 匹配开头的front matter (---或+++开始和结束的部分)
    // 支持两种常见的front matter分隔符
    const yamlFrontMatterRegex = /^---\s*\n([\s\S]*?\n)---\s*\n/
    const tomlFrontMatterRegex = /^\+\+\+\s*\n([\s\S]*?\n)\+\+\+\s*\n/

    let processedContent = content

    // 尝试移除YAML格式的front matter
    if (yamlFrontMatterRegex.test(processedContent)) {
      processedContent = processedContent.replace(yamlFrontMatterRegex, '')
    }

    // 尝试移除TOML格式的front matter
    if (tomlFrontMatterRegex.test(processedContent)) {
      processedContent = processedContent.replace(tomlFrontMatterRegex, '')
    }

    return processedContent
  }

  // 处理HTML为微信公众号可用格式
  const processHtmlForClipboard = (htmlContent: string, styleJson: ThemeStyleJson): string => {
    // 创建一个临时元素来处理HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent

    // 直接将样式应用到每个元素上
    const applyInlineStyles = (element: Element) => {
      // 获取此元素应当应用的所有样式
      const styles = getElementStyles(element, styleJson, tempDiv)

      // 将样式直接应用到元素上
      for (const [property, value] of Object.entries(styles)) {
        if (value) {
          ;(element as HTMLElement).style[property as any] = value
        }
      }

      // 特殊处理pre中的code
      if (element.tagName.toLowerCase() === 'pre') {
        const codeElements = element.querySelectorAll('code')
        codeElements.forEach((code) => {
          const codeElement = code as HTMLElement
          codeElement.style.backgroundColor = 'transparent'
          codeElement.style.padding = '0'
        })
      }

      // 递归处理子元素
      Array.from(element.children).forEach((child) => {
        applyInlineStyles(child)
      })
    }

    // 获取元素应该应用的所有样式
    const getElementStyles = (
      element: Element,
      styles: ThemeStyleJson,
      root: Element
    ): { [property: string]: string } => {
      // 如果有主题管理器，使用其方法
      if (getStylesForElement) {
        return getStylesForElement(element)
      }

      // 没有主题管理器时的回退实现
      const result: { [property: string]: string } = {}

      for (const selector in styles) {
        if (matchSelector(selector, element, root)) {
          const selectorStyles = styles[selector as keyof typeof styles]

          for (const [property, value] of Object.entries(selectorStyles)) {
            result[property] = value
          }
        }
      }

      return result
    }

    // 简单的选择器匹配实现(仅在没有主题管理器时使用)
    const matchSelector = (selector: string, element: Element, root: Element): boolean => {
      // 如果有主题管理器，使用其方法
      if (selectorMatchesElement) {
        return selectorMatchesElement(selector, element)
      }

      // 没有主题管理器时的回退实现
      const simpleMatch = (s: string): boolean => {
        s = s.trim()

        if (s === element.tagName.toLowerCase()) {
          return true
        }
        if (s.startsWith('#') && element.id === s.substring(1)) {
          return true
        }
        if (s.startsWith('.') && element.classList.contains(s.substring(1))) {
          return true
        }
        if (s === ':root' && element === document.documentElement) {
          return true
        }
        if (s === 'body' && element.parentElement === root) {
          return true
        }

        return false
      }

      const parts = selector.split(',').map((s) => s.trim())
      return parts.some((p) => {
        if (!p.includes(' ') && !p.includes('>') && !p.includes('+') && !p.includes('~')) {
          return simpleMatch(p)
        }
        return p.split(/[\s>+~]/).some((part) => simpleMatch(part))
      })
    }

    // 应用内联样式到所有元素
    Array.from(tempDiv.children).forEach((child) => {
      applyInlineStyles(child)
    })

    // 处理图片
    Array.from(tempDiv.querySelectorAll('img')).forEach((img) => {
      const width = img.getAttribute('width')
      const height = img.getAttribute('height')
      if (width) {
        img.style.width = width + 'px'
      }
      if (height) {
        img.style.height = height + 'px'
      }
      img.removeAttribute('width')
      img.removeAttribute('height')
    })

    // CSS变量处理 - 将CSS变量替换为实际颜色值
    const processCSSVariables = (element: HTMLElement) => {
      const style = element.style

      for (let i = 0; i < style.length; i++) {
        const property = style[i]
        const value = style.getPropertyValue(property)

        // 如果值包含CSS变量
        if (value.includes('var(--')) {
          // 尝试从root元素获取变量值
          const variableMatch = /var\(([^)]+)\)/.exec(value)
          if (variableMatch && variableMatch[1]) {
            const variableName = variableMatch[1].trim()
            // 从styleJson中查找变量定义
            if (styleJson[':root'] && styleJson[':root'][variableName]) {
              const actualValue = styleJson[':root'][variableName]
              // 替换变量为实际值
              const newValue = value.replace(`var(${variableName})`, actualValue)
              style.setProperty(property, newValue)
            }
          }
        }
      }

      // 递归处理子元素
      Array.from(element.children).forEach((child) => {
        processCSSVariables(child as HTMLElement)
      })
    }

    // 处理CSS变量
    Array.from(tempDiv.children).forEach((child) => {
      processCSSVariables(child as HTMLElement)
    })

    return tempDiv.innerHTML
  }

  return { html, isLoading, error }
}
