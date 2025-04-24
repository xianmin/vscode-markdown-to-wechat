/**
 * 代码高亮内联样式定义
 * 这些样式基于highlight.js的类名，但直接以对象形式提供，用于生成内联样式
 */

export const highlightStyles: Record<string, Record<string, string>> = {
  // 基础代码块样式
  hljs: {
    display: 'block',
    overflowX: 'auto',
    padding: '0.5em',
    color: '#333',
    backgroundColor: '#f8f8f8',
  },
  // 评论和引用
  'hljs-comment': {
    color: '#998',
    fontStyle: 'italic',
  },
  'hljs-quote': {
    color: '#998',
    fontStyle: 'italic',
  },
  // 关键字
  'hljs-keyword': {
    color: '#333',
    fontWeight: 'bold',
  },
  'hljs-selector-tag': {
    color: '#333',
    fontWeight: 'bold',
  },
  'hljs-subst': {
    color: '#333',
    fontWeight: 'bold',
  },
  // 数字和字面量
  'hljs-number': {
    color: '#008080',
  },
  'hljs-literal': {
    color: '#008080',
  },
  'hljs-variable': {
    color: '#008080',
  },
  'hljs-template-variable': {
    color: '#008080',
  },
  'hljs-tag .hljs-attr': {
    color: '#008080',
  },
  // 字符串
  'hljs-string': {
    color: '#d14',
  },
  'hljs-doctag': {
    color: '#d14',
  },
  // 标题和章节
  'hljs-title': {
    color: '#900',
    fontWeight: 'bold',
  },
  'hljs-section': {
    color: '#900',
    fontWeight: 'bold',
  },
  'hljs-selector-id': {
    color: '#900',
    fontWeight: 'bold',
  },
  // 类型
  'hljs-type': {
    color: '#458',
    fontWeight: 'bold',
  },
  'hljs-class': {
    color: '#458',
    fontWeight: 'bold',
  },
  // 标签和属性
  'hljs-tag': {
    color: '#000080',
  },
  'hljs-name': {
    color: '#000080',
  },
  'hljs-attribute': {
    color: '#000080',
  },
  // 正则和链接
  'hljs-regexp': {
    color: '#009926',
  },
  'hljs-link': {
    color: '#009926',
  },
  // 符号和列表
  'hljs-symbol': {
    color: '#990073',
  },
  'hljs-bullet': {
    color: '#990073',
  },
  // 内置函数
  'hljs-built_in': {
    color: '#0086b3',
  },
  'hljs-builtin-name': {
    color: '#0086b3',
  },
  // 元信息
  'hljs-meta': {
    color: '#999',
    fontWeight: 'bold',
  },
  // 删除和添加
  'hljs-deletion': {
    backgroundColor: '#fdd',
  },
  'hljs-addition': {
    backgroundColor: '#dfd',
  },
  // 强调
  'hljs-emphasis': {
    fontStyle: 'italic',
  },
  // 加粗
  'hljs-strong': {
    fontWeight: 'bold',
  },
}

/**
 * 代码块基础样式 - 用于pre元素
 */
export const preStyles = {
  border: '1px solid #ddd',
  borderRadius: '5px',
  // padding: '1em',
  // paddingTop: '18px', // 增加顶部填充以容纳MacOS风格的按钮
  margin: '1em 0',
  overflow: 'auto',
  backgroundColor: '#f6f8fa',
  lineHeight: '1.5',
  fontSize: '0.9em',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
}

/**
 * 代码元素基础样式 - 用于code元素
 */
export const codeStyles = {
  background: 'transparent',
  padding: '0',
  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
  fontSize: '0.9em',
  // whiteSpace: 'pre-wrap',
  // wordWrap: 'break-word',
  lineHeight: '1.6',
  display: 'block',
  // marginTop: '10px', // 增加一些顶部间距
}
