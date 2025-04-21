import { visit } from 'unist-util-visit'
import { Node } from 'unist'
import { Plugin } from 'unified'


/**
 * 二级标题编号样式选项
 */
export interface HeadingNumberingOptions {
  /**
   * 编号样式
   * '': 不添加编号
   * 'number-dot': 使用 "1. " 格式的编号，多级标题使用 "1.1, 1.1.1" 等格式
   * 'chinese-dot': 使用 "一、" 格式的中文编号，三级和四级标题使用 "1.1, 1.1.1" 等格式
   */
  style: string
}

/**
 * 将数字转换为中文数字
 * @param num 数字
 * @returns 中文数字
 */
function numberToChinese(num: number): string {
  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

  if (num <= 0) {
    return ''
  }
  if (num <= 10) {
    return chineseNumbers[num - 1]
  }
  if (num < 20) {
    return '十' + (num > 10 ? chineseNumbers[num - 11] : '')
  }
  if (num < 100) {
    const tenDigit = Math.floor(num / 10)
    const remainder = num % 10
    return (
      chineseNumbers[tenDigit - 1] + '十' + (remainder > 0 ? chineseNumbers[remainder - 1] : '')
    )
  }

  return num.toString() // 超过99返回数字字符串
}

/**
 * 为标题添加序号前缀
 */
export function remarkNumberedHeadings(options = { style: 'number-dot' }): Plugin {
  // attacher
  return () => {
    // transformer
    return (tree: Node) => {
      // 如果配置为不使用编号，直接返回原始树
      if (options.style === '') {
        return tree
      }

      // 计数器，用于跟踪各级标题的序号
      let h2Counter = 0
      let h3Counter = 0
      let h4Counter = 0
      let currentH2 = 0

      // 访问树中的每个节点
      visit(tree, 'heading', (node: any) => {
        // 确保有子节点数组
        if (!node.children || !Array.isArray(node.children)) {
          return
        }

        // 创建前缀
        let prefixText = ''

        if (node.depth === 2) {
          h2Counter++
          currentH2 = h2Counter
          h3Counter = 0 // 重置三级标题计数器

          if (options.style === 'number-dot') {
            prefixText = `${h2Counter}. `
          } else if (options.style === 'chinese-dot') {
            prefixText = `${numberToChinese(h2Counter)}、`
          }
        } else if (node.depth === 3) {
          h3Counter++
          h4Counter = 0 // 重置四级标题计数器
          prefixText = `${currentH2}.${h3Counter} `
        } else if (node.depth === 4) {
          h4Counter++
          prefixText = `${currentH2}.${h3Counter}.${h4Counter} `
        }

        // 如果生成了前缀，添加到标题前
        if (prefixText) {
          // 创建一个新的文本节点，包含序号前缀
          const prefixNode = {
            type: 'text',
            value: prefixText,
          }

          // 在子节点数组的开头添加序号节点
          node.children.unshift(prefixNode)
        }
      })

      return tree
    }
  }
}
