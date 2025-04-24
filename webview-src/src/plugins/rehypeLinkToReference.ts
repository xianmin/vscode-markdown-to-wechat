import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Element, Text } from 'hast'

interface ReferenceLink {
  url: string
  text: string
  number: number
}

interface RehypeLinkToReferenceOptions {
  className?: string
}

/**
 * 将链接转换为参考式引用的 rehype 插件
 * 例如: <a href="https://example.com">示例</a>
 * 转换成: <a class="reference-converted" data-reference-number="1">示例</a><sup>[1]</sup>
 * 并在文档末尾添加:
 * [1] 示例: https://example.com
 *
 * 注意：
 * 1. 微信公众号平台的链接(https://mp.weixin.qq.com)不会被转换
 * 2. 链接文本与链接地址完全相同的链接（自引用）不会被转换
 */
export const rehypeLinkToReference: Plugin<[RehypeLinkToReferenceOptions?], Root> = (
  options = {}
) => {
  const { className = 'reference-link' } = options

  return (tree) => {
    const links: ReferenceLink[] = []
    let linkCounter = 1

    // 第一步：收集所有链接并添加引用标记
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName === 'a' && node.properties && node.properties.href) {
        const url = node.properties.href as string

        // 如果是微信公众号链接，不做处理
        if (url.startsWith('https://mp.weixin.qq.com')) {
          return
        }

        // 获取链接文本
        let linkText = ''
        visit(node, 'text', (textNode: Text) => {
          linkText += textNode.value
        })

        // 检查是否为自引用链接（链接文本与URL完全相同）
        const normalizedUrl = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
        const normalizedText = linkText.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

        // 如果是自引用链接，不做处理
        if (normalizedText === normalizedUrl || linkText === url) {
          return
        }

        // 添加到链接集合
        const linkNumber = linkCounter++
        links.push({
          url,
          text: linkText,
          number: linkNumber,
        })

        // 创建新的数字节点 [n]
        const referenceNode: Element = {
          type: 'element',
          tagName: 'sup',
          properties: {
            className: [className],
          },
          children: [
            {
              type: 'text',
              value: `[${linkNumber}]`,
            },
          ],
        }

        // 在链接后添加引用标记
        if (parent && typeof index === 'number') {
          parent.children.splice(index + 1, 0, referenceNode)
        }
      }
    })

    // 如果有链接，则添加参考列表
    if (links.length > 0) {
      // 创建参考列表
      const referenceList: Element = {
        type: 'element',
        tagName: 'section',
        properties: {
          className: ['reference-list'],
          style: 'font-size: 80%;',
        },
        children: [
          // 标题
          {
            type: 'element',
            tagName: 'h2',
            properties: {},
            children: [
              {
                type: 'text',
                value: '参考链接',
              },
            ],
          },
          // 列表
          {
            type: 'element',
            tagName: 'ol',
            properties: { style: 'list-style:none;' },
            children: links.map((link) => ({
              type: 'element',
              tagName: 'li',
              properties: {},
              children: [
                {
                  type: 'text',
                  value: `[${link.number}] ${link.text}: ${link.url}`,
                },
              ],
            })),
          },
        ],
      }

      // 在文档末尾添加参考列表
      tree.children.push(referenceList)
    }
  }
}
