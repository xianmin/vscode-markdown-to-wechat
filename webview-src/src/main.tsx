import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import 'antd/dist/reset.css' // 重置样式

// 禁用VSCode WebView默认样式 - 综合性能优化方案
const disableVSCodeDefaultStyles = () => {
  // 方法1: 通过CSS选择器覆盖，不需要JavaScript就能生效
  const styleOverride = document.createElement('style')
  styleOverride.textContent = `
    /* 高优先级选择器覆盖VSCode默认样式 */
    #_defaultStyles, [id="_defaultStyles"] {
      display: none !important;
    }
  `
  styleOverride.id = 'vscode-style-override'
  document.head.appendChild(styleOverride)

  // 方法2: 直接查找并移除元素
  const removeDefaultStylesheet = () => {
    const defaultStyleSheet = document.getElementById('_defaultStyles')
    if (defaultStyleSheet) {
      defaultStyleSheet.remove()
      console.log('VSCode默认样式已禁用')
      return true
    }
    return false
  }

  // 先尝试直接移除
  if (!removeDefaultStylesheet()) {
    // 如果没找到，监听head变化，但设置超时限制
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement && node.id === '_defaultStyles') {
              node.remove()
              console.log('动态添加的VSCode默认样式已禁用')
              // 找到并移除后立即断开观察
              observer.disconnect()
              return
            }
          }
        }
      }
    })

    // 只监听head元素，减少回调范围
    observer.observe(document.head, { childList: true, subtree: true })

    // 10秒后自动断开，不需要无限期监听
    setTimeout(() => {
      observer.disconnect()
    }, 10000)
  }
}

// 在DOM加载完成后执行
window.addEventListener('DOMContentLoaded', disableVSCodeDefaultStyles)

// 初始化VSCode API
const vscode = window.acquireVsCodeApi()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App vscode={vscode} />
  </React.StrictMode>
)
