import { visit } from 'unist-util-visit'
import type { Element, Root, ElementContent, Properties } from 'hast'
import type { Node } from 'unist'
import type { Plugin } from 'unified'

// 扩展Element类型，添加parent
interface ExtendedElement extends Element {
  parent?: Node
}

/**
 * 创建一个rehype插件，将图片转换为带有figure和figcaption的结构
 * 仅负责结构转换，样式将由rehypeApplyStyles插件统一处理
 * @returns rehype插件
 */
export function rehypeImageTransformer(): Plugin<[], Root> {
  return () => (tree: Root) => {
    visit(tree, 'element', (node: ExtendedElement, index, parent) => {
      // 只处理img标签
      if (node.tagName !== 'img' || !parent) {
        return
      }

      // 获取img的属性
      const src = node.properties?.src || ''
      const alt = node.properties?.alt || ''
      const title = node.properties?.title || ''

      // 创建figcaption元素(如果有alt或title)
      const children: Element[] = []

      // 创建新的img元素，保留原有属性
      const imgElement: Element = {
        type: 'element',
        tagName: 'img',
        properties: {
          ...node.properties,
        },
        children: [],
      }

      children.push(imgElement)

      // 如果有标题或替代文字，添加figcaption
      if (alt || title) {
        const captionText = title || alt
        const figcaptionElement: Element = {
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: captionText as string }],
        }

        children.push(figcaptionElement)
      }

      // 创建figure元素
      const figureElement: Element = {
        type: 'element',
        tagName: 'figure',
        properties: {},
        children,
      }

      // 检查父元素是否为p标签
      const parentElement = parent as Element
      if (parentElement.tagName === 'p') {
        // 直接修改p标签的属性和内容，将其转换为figure
        parentElement.tagName = 'figure'
        parentElement.properties = { ...figureElement.properties }
        parentElement.children = [...figureElement.children] as ElementContent[]
        return
      }

      // 如果不是p标签，只替换img元素
      parent.children[index as number] = figureElement
    })

    return tree
  }
}
