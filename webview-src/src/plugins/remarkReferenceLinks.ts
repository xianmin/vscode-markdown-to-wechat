import { Root } from 'mdast'
import { SKIP, visit } from 'unist-util-visit'

/**
 * 将链接和图片转换为引用链接形式，并在文档末尾添加单独的定义。
 * 这种格式更适合微信公众号等平台的复制粘贴，可以使文档正文更整洁。
 * 对于微信公众号自身的链接(https://mp.weixin.qq.com)不进行转换。
 *
 * @returns
 *   转换函数
 */
export function remarkReferenceLinks() {
  /**
   * 转换函数实现
   *
   * @param {Root} tree
   *   语法树
   * @returns {undefined}
   *   无返回值
   */
  return function (tree: Root) {
    // 添加调试输出
    console.log('remarkReferenceLinks 插件开始执行', tree.type)

    let id = 0
    // 存储URL到定义标识符的映射，使用嵌套Map结构处理不同标题的情况
    const definitions = new Map<string, Map<string, string>>()
    // 存储已经存在的定义标识符，避免重复
    const existing = new Set<string>()
    // 存储需要在文档末尾显示的引用定义
    const referencesToDisplay: Array<{ identifier: string; url: string; title?: string }> = []
    // 存储引用标识符到数字的映射，用于生成角标[1][2]等
    const identifierToNumber = new Map<string, number>()
    // 当前角标计数
    let superscriptCounter = 0

    // 调试: 添加节点计数
    let definitionCount = 0
    let transformCount = 0
    let skippedCount = 0

    // 查找文档中已经存在的定义
    visit(tree, 'definition', function (node) {
      definitionCount++
      const url = node.url

      existing.add(node.identifier)

      let titles = definitions.get(url)

      if (!titles) {
        titles = new Map()
        definitions.set(url, titles)
      }

      // 将标题映射到标识符，用于后续查找
      titles.set(node.title || '', node.identifier)

      // 添加到待显示引用列表
      referencesToDisplay.push({
        identifier: node.identifier,
        url: node.url,
        title: node.title || undefined,
      })

      // 为该引用分配一个数字
      superscriptCounter++
      identifierToNumber.set(node.identifier, superscriptCounter)
    })

    console.log(`找到 ${definitionCount} 个已存在的定义节点`)

    // 将普通链接和图片转换为引用形式，替换当前节点，并在需要时添加定义
    visit(tree, function (node, index, parent) {
      // 添加调试: 输出当前节点类型
      console.log('访问节点:', node.type)

      if (parent && typeof index === 'number' && (node.type === 'image' || node.type === 'link')) {
        const url = node.url
        console.log(`处理 ${node.type} 节点, URL: ${url}`)

        // 跳过微信公众号链接，不做转换
        if (url.startsWith('https://mp.weixin.qq.com')) {
          console.log('跳过微信公众号链接')
          skippedCount++
          return
        }

        const title = node.title
        let titles = definitions.get(url)

        // 如果该URL没有定义，创建一个新的映射
        if (!titles) {
          titles = new Map()
          definitions.set(url, titles)
        }

        // 尝试查找匹配当前标题的标识符
        let identifier = titles.get(title || '')

        // 如果没有找到标识符，创建一个新的并添加定义
        if (!identifier) {
          // 生成唯一标识符
          do {
            identifier = String(++id)
          } while (existing.has(identifier))

          // 保存新标识符
          titles.set(title || '', identifier)

          // 添加定义节点（标准方式）
          tree.children.push({ type: 'definition', identifier, title, url })

          // 为该引用分配一个数字
          superscriptCounter++
          identifierToNumber.set(identifier, superscriptCounter)

          // 添加到待显示引用列表
          referencesToDisplay.push({
            identifier,
            url,
            title: title || undefined,
          })

          console.log(`添加新的定义节点 [${identifier}]: ${url}`)
        }

        // 获取该标识符对应的数字
        const superscriptNumber = identifierToNumber.get(identifier) || superscriptCounter

        // 将链接文本修改为添加角标的形式：原文本<sup>[数字]</sup>
        if (node.type === 'link' && node.children && node.children.length > 0) {
          // 复制原链接的子节点
          const originalChildren = [...node.children]

          // 创建HTML节点来实现上标效果
          const superscriptNode = {
            type: 'html' as const,
            value: `<sup>[${superscriptNumber}]</sup>`,
          }

          // 将角标添加到链接文本末尾
          originalChildren.push(superscriptNode)

          // 替换当前节点为引用形式，并保留添加了角标的子节点
          parent.children[index] = {
            type: 'linkReference',
            identifier,
            referenceType: 'full', // 使用完整引用形式 [text][id]
            children: originalChildren,
          }
        } else if (node.type === 'image') {
          // 对于图片，使用标准处理方式
          parent.children[index] = {
            type: 'imageReference',
            identifier,
            referenceType: 'full', // 使用完整引用形式 [alt][id]
            alt: node.alt,
          }
        }

        console.log(
          `将 ${node.type} 节点转换为引用格式, 标识符: ${identifier}, 角标: [${superscriptNumber}]`
        )
        transformCount++
        // 通知访问器跳过当前节点的子节点
        return [SKIP, index]
      }
    })

    // 确保引用定义在HTML输出中显示
    if (referencesToDisplay.length > 0) {
      // 添加一个分隔线
      tree.children.push({
        type: 'thematicBreak',
      })

      // 添加一个标题，表示这是引用区域
      tree.children.push({
        type: 'heading',
        depth: 2,
        children: [{ type: 'text', value: '参考链接' }],
      })

      // 创建引用列表，按照角标数字排序
      const sortedReferences = [...referencesToDisplay].sort((a, b) => {
        const numA = identifierToNumber.get(a.identifier) || 0
        const numB = identifierToNumber.get(b.identifier) || 0
        return numA - numB
      })

      const listItems = sortedReferences.map((ref) => {
        const referenceNumber = identifierToNumber.get(ref.identifier) || 0

        // 创建链接文本
        const linkText = ref.title ? `${ref.title} (${ref.url})` : ref.url

        // 创建具有正确类型的列表项
        return {
          type: 'listItem',
          children: [
            {
              type: 'paragraph',
              children: [
                // {
                //   type: 'text',
                //   value: `[${referenceNumber}] `,
                // },
                {
                  type: 'link',
                  url: ref.url,
                  children: [
                    {
                      type: 'text',
                      value: linkText,
                    },
                  ],
                },
              ],
            },
          ],
        }
      })

      // 添加引用列表，使用类型断言确保列表项匹配期望类型
      tree.children.push({
        type: 'list',
        ordered: true,
        start: 1,
        spread: false,
        children: listItems as any, // 使用类型断言解决类型不匹配问题
      })
    }

    console.log(`remarkReferenceLinks 处理完成:
    - 跳过了 ${skippedCount} 个微信链接
    - 转换了 ${transformCount} 个节点
    - 总共定义了 ${id} 个新引用`)
  }
}
