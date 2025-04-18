// 定义VSCode WebView API的类型
declare global {
  interface Window {
    // VSCode WebView API
    acquireVsCodeApi: () => {
      postMessage: (message: any) => void
      getState: () => any
      setState: (state: any) => void
    }
  }
}

export {}
