import { visit } from 'unist-util-visit'
import type { Element, Root, Text } from 'hast'
import type { Node } from 'unist'
import type { Plugin } from 'unified'
import { ThemeStyleJson } from '../hooks/useThemeManager'
import { highlightStyles, preStyles, codeStyles } from '../styles/highlightStyles'

// 扩展Element类型，添加parent
interface ExtendedElement extends Element {
  parent?: Node
  __processed?: boolean // 添加标记字段
}

/**
 * 创建一个rehype插件，将主题样式应用到HTML元素上
 * @param themeStyles 主题样式JSON
 * @returns rehype插件
 */
export function rehypeApplyStyles(themeStyles: ThemeStyleJson): Plugin<[], Root> {
  return () => (tree: Root) => {
    // 提取:root中定义的CSS变量，用于后续的变量替换
    const rootVariables: Record<string, string> = {}
    if (themeStyles[':root']) {
      for (const [property, value] of Object.entries(themeStyles[':root'])) {
        if (property.startsWith('--')) {
          rootVariables[property] = value
        }
      }
    }

    // 第一遍：特殊处理pre和code元素
    visit(tree, 'element', (node: ExtendedElement) => {
      if (!node.properties) {
        node.properties = {}
      }

      // 处理代码块，特殊处理 pre 中的 code
      if (node.tagName === 'pre') {
        // 应用pre元素样式
        node.properties.style = node.properties.style
          ? `${node.properties.style} ${convertStylesToString(preStyles)}`
          : convertStylesToString(preStyles)

        // 处理pre内的code元素
        visit(node, 'element', (child: ExtendedElement) => {
          if (child.tagName === 'code') {
            if (!child.properties) {
              child.properties = {}
            }

            // 应用代码块基础样式
            let inlineStyles = convertStylesToString(codeStyles)

            // 应用语言特定样式
            if (child.properties.className) {
              const classNames = Array.isArray(child.properties.className)
                ? child.properties.className
                : [child.properties.className]

              // 应用高亮基础样式
              if (highlightStyles['hljs']) {
                inlineStyles += ' ' + convertStylesToString(highlightStyles['hljs'])
              }

              // 处理子元素的高亮样式
              visit(child, 'element', (highlightNode: Element) => {
                if (!highlightNode.properties) {
                  highlightNode.properties = {}
                }

                if (highlightNode.properties.className) {
                  const highlightClasses = Array.isArray(highlightNode.properties.className)
                    ? highlightNode.properties.className
                    : [highlightNode.properties.className]

                  // 为每个高亮类应用对应的样式
                  for (const cls of highlightClasses) {
                    if (typeof cls === 'string' && highlightStyles[cls]) {
                      const hlStyle = convertStylesToString(highlightStyles[cls])
                      highlightNode.properties.style = highlightNode.properties.style
                        ? `${highlightNode.properties.style} ${hlStyle}`
                        : hlStyle
                    }
                  }
                }

                // 处理文本节点空格和特殊字符
                processTextNodesForSpaces(highlightNode)
              })
            }

            // 处理code元素的文本节点
            processTextNodesForSpaces(child)

            // 应用所有样式
            child.properties.style = child.properties.style
              ? `${child.properties.style} ${inlineStyles}`
              : inlineStyles

            // 清除类名，因为微信不支持
            // 注意：在应用样式后再清除，这样不会影响处理逻辑
            delete child.properties.className

            // 标记code元素已被处理
            child.__processed = true
          }
        })

        // 清除pre的类名，因为微信不支持
        delete node.properties.className

        // 添加MacOS风格的装饰（如果需要）
        const macCodeSvg = `<svg width="54" height="14" viewBox="0 0 54 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle">
          <circle cx="7" cy="7" r="4.5" fill="#FF5F56" stroke="#E0443E" stroke-width="0.5"/>
          <circle cx="27" cy="7" r="4.5" fill="#FFBD2E" stroke="#DEA123" stroke-width="0.5"/>
          <circle cx="47" cy="7" r="4.5" fill="#27C93F" stroke="#1AAB29" stroke-width="0.5"/>
        </svg>`

        // 创建装饰span元素
        const decorSpan = {
          type: 'element',
          tagName: 'span',
          properties: {
            style: 'padding:5px;line-height:1;',
          },
          children: [
            {
              type: 'raw',
              value: macCodeSvg,
            },
          ],
        }

        // 将装饰元素添加到pre的开头
        if (Array.isArray(node.children)) {
          node.children.unshift(decorSpan as any)
        }

        // 标记pre元素已被处理
        node.__processed = true
      }
    })

    // 第二遍：处理其他所有元素
    visit(tree, 'element', (node: ExtendedElement) => {
      if (!node.properties) {
        node.properties = {}
      }

      // 跳过已处理的元素
      if (node.__processed) {
        return
      }

      // 特殊处理 a 标签
      if (node.tagName === 'a') {
        // 将 a 标签转换为 span
        node.tagName = 'span'

        // 删除 href 属性
        delete node.properties.href

        // 获取元素的样式 - 使用 a 标签的样式
        const aStyles = getElementStylesForNode(
          { ...node, tagName: 'a' } as ExtendedElement,
          themeStyles,
          rootVariables
        )

        // 应用链接样式到 span
        if (Object.keys(aStyles).length > 0) {
          const styleString = convertStylesToString(aStyles)
          node.properties.style = node.properties.style
            ? `${node.properties.style} ${styleString}`
            : styleString
        }
      }

      // 获取元素的样式
      const styles = getElementStylesForNode(node, themeStyles, rootVariables)

      // 应用样式到节点
      if (Object.keys(styles).length > 0) {
        node.properties.style = node.properties.style
          ? `${node.properties.style} ${convertStylesToString(styles)}`
          : convertStylesToString(styles)
      }

      // 处理图片
      if (node.tagName === 'img') {
        const width = node.properties.width
        const height = node.properties.height

        if (width) {
          node.properties.style = ((node.properties.style as string) || '') + `width: ${width}px;`
          delete node.properties.width
        }

        if (height) {
          node.properties.style = ((node.properties.style as string) || '') + `height: ${height}px;`
          delete node.properties.height
        }
      }
    })

    return tree
  }
}

/**
 * 处理节点中的文本，替换空格和特殊字符
 * 这个函数使用更可靠的方式处理空格，将文本节点转换为HTML片段
 */
function processTextNodesForSpaces(node: Element): void {
  if (!node.children) {
    return
  }

  const newChildren: any[] = []

  for (const child of node.children) {
    if (child.type === 'text' && typeof child.value === 'string') {
      const text = child.value

      // 1. 处理制表符
      let processedText = text.replace(/\t/g, '    ')

      // 2. 处理换行符
      processedText = processedText.replace(/\r\n|\n/g, '<br>')

      // 3. 处理空格 - 这是关键部分，使用non-breaking space
      processedText = processedText.replace(/ /g, '&nbsp;')

      // 如果有处理过的文本，使用raw节点替换文本节点
      if (processedText !== text) {
        newChildren.push({
          type: 'raw',
          value: processedText,
        })
      } else {
        newChildren.push(child)
      }
    } else {
      newChildren.push(child)
    }
  }

  // 替换原节点的子节点
  node.children = newChildren
}

/**
 * 获取CSS变量的实际值
 * @param variableName 变量名
 * @param rootVariables :root中定义的CSS变量
 * @returns 变量值
 */
function getCSSVariableValue(variableName: string, rootVariables: Record<string, string>): string {
  return rootVariables[variableName] || ''
}

/**
 * 处理CSS变量 - 将var(--xx)替换为实际值
 * @param value CSS值
 * @param rootVariables :root中定义的CSS变量
 * @returns 处理后的值
 */
function processCSSVariables(value: string, rootVariables: Record<string, string>): string {
  if (!value?.includes('var(--')) {
    return value
  }

  let processedValue = value
  const variableRegex = /var\((--[^)]+)\)/g
  let match

  while ((match = variableRegex.exec(value)) !== null) {
    const variableName = match[1]
    const variableValue = getCSSVariableValue(variableName, rootVariables)

    if (variableValue) {
      processedValue = processedValue.replace(`var(${variableName})`, variableValue)
    }
  }

  return processedValue
}

/**
 * 获取元素的样式
 * @param node DOM元素
 * @param styles 主题样式
 * @param rootVariables :root中定义的CSS变量
 * @returns 元素的样式对象
 */
function getElementStylesForNode(
  node: ExtendedElement,
  styles: ThemeStyleJson,
  rootVariables: Record<string, string>
): Record<string, string> {
  // 简化版本的选择器匹配逻辑
  const result: Record<string, string> = {}

  for (const selector in styles) {
    if (simpleNodeSelectorMatch(selector, node)) {
      const selectorStyles = styles[selector as keyof typeof styles]

      for (const [property, value] of Object.entries(selectorStyles)) {
        // 跳过所有CSS变量定义（即使在:root元素上）
        if (property.startsWith('--')) {
          continue
        }

        // 处理CSS变量
        const processedValue = processCSSVariables(value, rootVariables)
        result[property] = processedValue
      }
    }
  }

  return result
}

/**
 * 简化版的选择器匹配
 * @param selector CSS选择器
 * @param node DOM元素
 * @returns 是否匹配
 */
function simpleNodeSelectorMatch(selector: string, node: ExtendedElement): boolean {
  const simpleMatch = (s: string): boolean => {
    s = s.trim()

    // 标签选择器
    if (s === node.tagName.toLowerCase()) {
      return true
    }

    // ID选择器
    if (s.startsWith('#') && node.properties?.id === s.substring(1)) {
      return true
    }

    // 类选择器
    if (s.startsWith('.') && node.properties?.className) {
      const classList = Array.isArray(node.properties.className)
        ? node.properties.className
        : [node.properties.className]
      return classList.includes(s.substring(1))
    }

    // root 伪类，与文档的根元素匹配
    if (s === ':root' && node.tagName === 'html') {
      return true
    }

    // body 选择器特殊处理 - 简化检测逻辑
    if (
      s === 'body' &&
      (node.tagName === 'body' ||
        // 对于AST，我们简化检测为顶级元素
        (node.parent && node.parent.type === 'root'))
    ) {
      return true
    }

    return false
  }

  const parts = selector.split(',').map((s) => s.trim())
  return parts.some((p) => {
    if (!p.includes(' ') && !p.includes('>') && !p.includes('+') && !p.includes('~')) {
      return simpleMatch(p)
    }
    // 简化版本只处理简单选择器
    return false
  })
}

/**
 * 将样式对象转换为内联样式字符串
 * @param styles 样式对象
 * @returns 内联样式字符串
 */
function convertStylesToString(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([prop, value]) => `${kebabCase(prop)}: ${value};`)
    .join(' ')
}

/**
 * 将驼峰式命名转换为kebab-case
 * @param str 驼峰式字符串
 * @returns kebab-case字符串
 */
function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}
