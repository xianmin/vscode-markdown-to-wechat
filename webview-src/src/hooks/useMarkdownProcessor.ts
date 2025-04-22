import { useState, useEffect } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkBreaks from 'remark-breaks'
import remarkCjkFriendly from 'remark-cjk-friendly'
import { ThemeStyleJson } from './useThemeManager'
import { AppSettings } from '../types/settings'
import {
  rehypeApplyStyles,
  remarkNumberedHeadings,
  rehypeImageTransformer,
  remarkReferenceLinks,
} from '../plugins'

export function useMarkdownProcessor(
  markdown: string,
  themeStylesJson: ThemeStyleJson = {},
  settings: AppSettings = {
    fontSize: '',
    headingNumberingStyle: '',
    primaryColor: '',
    forceLineBreaks: false,
    imageDomain: '',
    enableReferenceLinks: false,
  }
) {
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [frontmatter, setFrontmatter] = useState<string | null>(null)

  // 当Markdown内容、主题样式或设置变化时，转换为HTML
  useEffect(() => {
    // 合并设置中的样式到主题样式
    const mergedThemeStyles = {
      ...themeStylesJson,
      body: {
        ...(themeStylesJson.body || {}),
        ...(settings.fontSize ? { fontSize: settings.fontSize } : {}),
      },
      ':root': {
        ...(themeStylesJson[':root'] || {}),
        ...(settings.primaryColor ? { '--primary-color': settings.primaryColor } : {}),
      },
    }

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
        // 创建基础处理器
        const processor = unified()
          .use(remarkParse)
          .use(remarkFrontmatter) // 在AST中处理frontmatter，这样它不会被当作正文内容解析
          .use(remarkGfm)
          .use(remarkCjkFriendly) // https://github.com/tats-u/markdown-cjk-friendly/tree/main/packages/remark-cjk-friendly

        // 根据设置条件应用remarkReferenceLinks插件
        if (settings.enableReferenceLinks) {
          processor.use(remarkReferenceLinks) // 将链接和图片转换为引用格式，并在文档末尾添加统一定义
        }

        // 根据设置条件应用remarkBreaks插件
        if (settings.forceLineBreaks) {
          processor.use(remarkBreaks)
        }

        // 完成剩余处理流程
        const file = await processor
          .use(remarkNumberedHeadings({ style: settings.headingNumberingStyle })) // 为二级标题添加序号前缀
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeImageTransformer({ imageDomain: settings.imageDomain })) // 转换图片为figure结构
          .use(rehypeApplyStyles(mergedThemeStyles))
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(markdown)

        // 获取body的样式
        const bodyStyles = getBodyStyles(mergedThemeStyles)
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
  }, [markdown, themeStylesJson, settings]) // 添加settings作为依赖

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
