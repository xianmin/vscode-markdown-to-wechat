import { useState, useEffect } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { ThemeStyleJson } from './useThemeManager'
import { VSCodeAPI } from './useVSCodeMessaging'
import { rehypeApplyStyles } from '../plugins'

export function useMarkdownProcessor(
  markdown: string,
  themeStyles: ThemeStyleJson = {},
  vscode?: VSCodeAPI
) {
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [frontmatter, setFrontmatter] = useState<string | null>(null)

  // 当Markdown内容或主题样式变化时，转换为HTML
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
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeApplyStyles(themeStyles))
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(markdown)

        setHtml(String(file))
      } catch (err) {
        setError(`转换失败: ${err instanceof Error ? err.message : String(err)}`)
        console.error('Markdown转换错误:', err)
      } finally {
        setIsLoading(false)
      }
    }

    convertMarkdown()
  }, [markdown, themeStyles])

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

  return { html, isLoading, error, frontmatter }
}
