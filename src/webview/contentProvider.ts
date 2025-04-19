import * as vscode from 'vscode'
import { getUri } from '../utils/uriHelper'

/**
 * WebView 内容提供者
 * 负责生成预览面板的 HTML 内容
 */
export class WebviewContentProvider {
  /**
   * 生成WebView HTML内容
   * @param webview WebView实例
   * @param extensionUri 扩展URI
   * @param customCSS 可选的自定义CSS内容
   * @param isDevelopmentMode 是否为开发模式
   * @returns HTML字符串
   */
  public static getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    customCSS?: string,
    isDevelopmentMode?: boolean
  ): string {
    // 创建指向本地资源的URI
    const webviewUri = getUri(webview, extensionUri, ['media', 'webview'])

    // 确定文件前缀
    const filePrefix = isDevelopmentMode ? 'main-dev' : 'main'

    // 获取资源文件URI
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(webviewUri, 'assets', `${filePrefix}.js`)
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(webviewUri, 'assets', `${filePrefix}.css`)
    )

    // 直接内联加载WebView应用，不使用iframe
    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="
          default-src 'none';
          img-src ${webview.cspSource} https:;
          script-src ${webview.cspSource} 'unsafe-inline';
          style-src ${webview.cspSource} 'unsafe-inline';
          font-src ${webview.cspSource};
        ">
        <title>微信公众号预览</title>
        <link href="${styleUri}" rel="stylesheet">
        ${customCSS ? `<style>${customCSS}</style>` : ''}
      </head>
      <body>
        <div id="root"></div>
        <script>
          // 确保VSCode WebView API可用
          if (typeof acquireVsCodeApi === 'undefined') {
            window.acquireVsCodeApi = function() {
              console.log('使用模拟的VSCode API');
              return {
                postMessage: function(msg) {
                  console.log('发送消息:', msg);
                },
                getState: function() { return {}; },
                setState: function() {}
              };
            };
          }
        </script>
        <script type="module" src="${scriptUri}"></script>
      </body>
      </html>
    `
  }
}
