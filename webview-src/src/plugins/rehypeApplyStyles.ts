import { visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'
import type { Node } from 'unist'
import type { Plugin } from 'unified'
import { ThemeStyleJson } from '../hooks/useThemeManager'

// 扩展Element类型，添加parent
interface ExtendedElement extends Element {
  parent?: Node
}

/**
 * 创建一个rehype插件，将主题样式应用到HTML元素上
 * @param themeStyles 主题样式JSON
 * @returns rehype插件
 */
export function rehypeApplyStyles(themeStyles: ThemeStyleJson): Plugin<[], Root> {
  return () => (tree: Root) => {
    // 访问树中的每个元素
    visit(tree, 'element', (node: ExtendedElement) => {
      if (!node.properties) {
        node.properties = {}
      }

      // 获取元素的样式
      const styles = getElementStylesForNode(node, themeStyles)

      // 应用样式到节点
      if (Object.keys(styles).length > 0) {
        node.properties.style = convertStylesToString(styles)
      }

      // 特殊处理 pre 中的 code
      if (node.tagName === 'pre') {
        visit(node, 'element', (child: Element) => {
          if (child.tagName === 'code') {
            if (!child.properties) {
              child.properties = {}
            }
            // 设置 code 元素的样式
            const codeStyles = {
              backgroundColor: 'transparent',
              padding: '0',
            }
            child.properties.style = convertStylesToString(codeStyles)
          }
        })
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
 * 获取CSS变量的实际值
 * @param variableName 变量名
 * @param styles 主题样式
 * @returns 变量值
 */
function getCSSVariableValue(variableName: string, styles: ThemeStyleJson): string {
  // 从:root选择器中查找变量定义
  if (styles[':root']) {
    return styles[':root'][variableName] || ''
  }
  return ''
}

/**
 * 处理CSS变量 - 将var(--xx)替换为实际值
 * @param value CSS值
 * @param styles 主题样式
 * @returns 处理后的值
 */
function processCSSVariables(value: string, styles: ThemeStyleJson): string {
  if (!value?.includes('var(--')) {
    return value
  }

  let processedValue = value
  const variableRegex = /var\((--[^)]+)\)/g
  let match

  while ((match = variableRegex.exec(value)) !== null) {
    const variableName = match[1]
    const variableValue = getCSSVariableValue(variableName, styles)

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
 * @returns 元素的样式对象
 */
function getElementStylesForNode(
  node: ExtendedElement,
  styles: ThemeStyleJson
): Record<string, string> {
  // 简化版本的选择器匹配逻辑
  const result: Record<string, string> = {}

  for (const selector in styles) {
    if (simpleNodeSelectorMatch(selector, node)) {
      const selectorStyles = styles[selector as keyof typeof styles]

      for (const [property, value] of Object.entries(selectorStyles)) {
        // 处理CSS变量
        const processedValue = processCSSVariables(value, styles)
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
    if (s === ':root' && (node.tagName === 'html' || !node.parent)) {
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
