import { useState, useEffect } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { ThemeStyleJson } from './useThemeManager'
import { AppSettings } from '../types/settings'
import { rehypeApplyStyles, remarkNumberedHeadings } from '../plugins'

export function useMarkdownProcessor(
  markdown: string,
  themeStyles: ThemeStyleJson = {},
  settings: AppSettings = { fontSize: '16px', headingNumberingStyle: 'number-dot' }
) {
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [frontmatter, setFrontmatter] = useState<string | null>(null)

  // 当Markdown内容、主题样式或设置变化时，转换为HTML
  useEffect(() => {
    const convertMarkdown = async () => {
      if (!markdown) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // 提取frontmatter供外部使用
        // 注意：remarkFrontmatter只在AST中处理frontmatter，但不会暴露出来供外部使用
        // 所以我们需要手动提取frontmatter内容
        const extractedFrontmatter = extractFrontmatter(markdown)
        if (extractedFrontmatter) {
          setFrontmatter(extractedFrontmatter)
        } else {
          setFrontmatter(null)
        }

        // Markdown处理流程
        const file = await unified()
          .use(remarkParse)
          .use(remarkFrontmatter) // 在AST中处理frontmatter，这样它不会被当作正文内容解析
          .use(remarkGfm)
          .use(remarkNumberedHeadings({ style: settings.headingNumberingStyle })) // 为二级标题添加序号前缀
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeApplyStyles(themeStyles))
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(markdown)

        // 获取body的样式
        const bodyStyles = getBodyStyles(themeStyles)
        const styleAttribute = bodyStyles ? ` style="${bodyStyles}"` : ''

        // 将HTML包裹在section标签内，并应用body样式
        const htmlWithSection = `<section${styleAttribute}>${String(file)}</section>`

        setHtml(htmlWithSection)
      } catch (err) {
        setError(`转换失败: ${err instanceof Error ? err.message : String(err)}`)
        console.error('Markdown转换错误:', err)
      } finally {
        setIsLoading(false)
      }
    }

    convertMarkdown()
  }, [markdown, themeStyles, settings]) // 添加settings作为依赖

  // 提取frontmatter内容，仅用于导出以备后用
  // 这个函数只负责提取内容，不影响Markdown的解析过程
  const extractFrontmatter = (content: string): string | null => {
    // YAML frontmatter
    const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
    if (yamlMatch && yamlMatch[1]) {
      return yamlMatch[1]
    }

    // TOML frontmatter
    const tomlMatch = content.match(/^\+\+\+\s*\n([\s\S]*?)\n\+\+\+\s*\n/)
    if (tomlMatch && tomlMatch[1]) {
      return tomlMatch[1]
    }

    return null
  }

  // 提取body的样式
  const getBodyStyles = (styles: ThemeStyleJson): string => {
    if (!styles.body) {
      return ''
    }

    // 处理CSS变量
    const processedStyles: Record<string, string> = {}
    const rootVariables: Record<string, string> = {}

    // 提取root变量
    if (styles[':root']) {
      for (const [property, value] of Object.entries(styles[':root'])) {
        if (property.startsWith('--')) {
          rootVariables[property] = value
        }
      }
    }

    // 处理body样式中的CSS变量
    for (const [property, value] of Object.entries(styles.body)) {
      if (property.startsWith('--')) {
        continue
      }

      // 替换CSS变量
      let processedValue = value
      if (typeof value === 'string' && value.includes('var(--')) {
        const variableRegex = /var\((--[^)]+)\)/g
        let match

        while ((match = variableRegex.exec(value)) !== null) {
          const variableName = match[1]
          const variableValue = rootVariables[variableName] || ''

          if (variableValue) {
            processedValue = processedValue.replace(`var(${variableName})`, variableValue)
          }
        }
      }

      processedStyles[property] = processedValue
    }

    // 转换为内联样式字符串
    return Object.entries(processedStyles)
      .map(([prop, value]) => `${kebabCase(prop)}: ${value};`)
      .join(' ')
  }

  // 将驼峰式命名转换为kebab-case (复用自rehypeApplyStyles.ts)
  const kebabCase = (str: string): string => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
  }

  return { html, isLoading, error, frontmatter }
}
