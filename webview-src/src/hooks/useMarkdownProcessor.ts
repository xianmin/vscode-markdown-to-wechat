import { useState, useEffect } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

export function useMarkdownProcessor(markdown: string) {
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // 当Markdown内容变化时，转换为HTML
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
        const processedHtml = processHtmlForClipboard(rawHtml)
        setHtml(processedHtml)
      } catch (err) {
        setError(`转换失败: ${err instanceof Error ? err.message : String(err)}`)
        console.error('Markdown转换错误:', err)
      } finally {
        setIsLoading(false)
      }
    }

    convertMarkdown()
  }, [markdown])

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
  const processHtmlForClipboard = (htmlContent: string): string => {
    // 创建一个临时元素来处理HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent

    // 获取当前主题的样式
    const applyThemeStyles = () => {
      // 将CSS变量替换为具体的颜色值
      const themeStyles = {
        '--foreground-color': '#333',
        '--background-color': '#fff',
        '--border-color': '#ddd',
        '--heading-color': 'red',
        '--link-color': '#0366d6',
        '--blockquote-color': '#666',
        '--code-background': 'rgba(0, 0, 0, 0.06)',
      }

      // 为所有元素应用对应的主题样式
      const applyStyles = (element: Element) => {
        const tagStyleMap: Record<string, Partial<CSSStyleDeclaration>> = {
          'h1, h2, h3, h4, h5, h6': { color: themeStyles['--heading-color'] },
          'p, blockquote, ul, ol, dl, table': { margin: '0 0 16px 0' },
          blockquote: {
            borderLeft: `4px solid ${themeStyles['--border-color']}`,
            padding: '0 15px',
            color: themeStyles['--blockquote-color'],
          },
          a: {
            color: themeStyles['--link-color'],
            textDecoration: 'none',
          },
          code: {
            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
            backgroundColor: themeStyles['--code-background'],
            padding: '0.2em 0.4em',
            borderRadius: '3px',
            fontSize: '85%',
          },
          pre: {
            backgroundColor: themeStyles['--code-background'],
            borderRadius: '3px',
            padding: '16px',
            overflow: 'auto',
          },
        }

        // 根据元素类型应用特定样式
        const tagName = element.tagName.toLowerCase()
        const applyTagStyles = (tag: string, styles: Partial<CSSStyleDeclaration>) => {
          // 检查当前元素是否匹配选择器
          const selectors = tag.split(',').map((s) => s.trim())
          if (selectors.includes(tagName)) {
            Object.entries(styles).forEach(([prop, value]) => {
              if (value) {
                ;(element as HTMLElement).style[prop as any] = value as string
              }
            })
          }
        }

        // 应用所有标签样式规则
        for (const [selector, styles] of Object.entries(tagStyleMap)) {
          applyTagStyles(selector, styles)
        }

        // 基础样式应用给所有元素
        ;(element as HTMLElement).style.color = themeStyles['--foreground-color']

        // 特殊处理pre中的code
        if (tagName === 'pre') {
          const codeElements = element.querySelectorAll('code')
          codeElements.forEach((code) => {
            const codeElement = code as HTMLElement
            codeElement.style.backgroundColor = 'transparent'
            codeElement.style.padding = '0'
          })
        }

        // 递归处理子元素
        Array.from(element.children).forEach((child) => {
          applyStyles(child)
        })
      }

      // 应用样式到所有元素
      Array.from(tempDiv.children).forEach((child) => {
        applyStyles(child)
      })
    }

    // 应用主题样式
    applyThemeStyles()

    // 将计算样式转为内联样式
    const applyInlineStyles = (element: Element) => {
      // 获取计算样式并应用为内联样式
      const styles = getComputedStyle(element)
      const inlineStyles = Array.from(styles).reduce((acc, prop) => {
        // 排除一些可能导致问题的样式属性
        const excludedProps = [
          'width',
          'height',
          'inlineSize',
          'blockSize',
          'webkitLogicalWidth',
          'webkitLogicalHeight',
        ]
        if (excludedProps.includes(prop)) {
          return acc
        }

        const value = styles.getPropertyValue(prop)
        if (value) {
          acc += `${prop}:${value};`
        }
        return acc
      }, '')

      if (inlineStyles) {
        const currentStyle = element.getAttribute('style') || ''
        element.setAttribute('style', `${currentStyle}${inlineStyles}`)
      }

      // 递归处理子元素
      Array.from(element.children).forEach((child) => {
        applyInlineStyles(child)
      })
    }

    // 应用内联样式
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

    return tempDiv.innerHTML
  }

  return { html, isLoading, error }
}
