// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode'
import * as path from 'path'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Markdown to WeChat extension is now active')

  // 注册预览命令
  const previewCommand = vscode.commands.registerCommand(
    'markdown-to-wechat.previewMarkdown',
    () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        vscode.window.showErrorMessage('请先打开一个Markdown文件')
        return
      }

      const document = editor.document
      if (document.languageId !== 'markdown') {
        vscode.window.showErrorMessage('当前文件不是Markdown文件')
        return
      }

      // 获取文档内容
      const markdownContent = document.getText()

      // 创建或显示预览
      showPreview(context.extensionUri, markdownContent)
    }
  )

  context.subscriptions.push(previewCommand)
}

// 创建并显示预览面板
function showPreview(extensionUri: vscode.Uri, markdownContent: string) {
  // 创建WebView面板
  const panel = vscode.window.createWebviewPanel(
    'markdownPreview',
    '微信公众号预览',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      // 限制WebView可以加载的资源范围
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
    }
  )

  // 设置WebView的HTML内容
  panel.webview.html = getWebviewContent(panel.webview, extensionUri)

  // 监听WebView发送的消息
  panel.webview.onDidReceiveMessage((message) => {
    switch (message.type) {
      case 'webviewReady':
        // WebView已准备好，发送Markdown内容
        panel.webview.postMessage({
          type: 'setMarkdown',
          content: markdownContent,
        })
        break
      case 'copyHtml':
        // 将HTML复制到剪贴板
        try {
          vscode.env.clipboard.writeText(message.html).then(() => {
            vscode.window.showInformationMessage('HTML已复制到剪贴板')
          })
        } catch (err) {
          const error = err as Error
          vscode.window.showErrorMessage(`复制失败: ${error.message}`)
        }
        break
    }
  })
}

// 生成WebView HTML内容
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  // 创建指向本地资源的URI
  const webviewUri = getUri(webview, extensionUri, ['media', 'webview'])

  // 获取资源文件URI (使用固定的文件名)
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewUri, 'assets', 'main.js'))

  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewUri, 'assets', 'main.css'))

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

// 辅助函数：获取资源URI
function getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]) {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList))
}

// This method is called when your extension is deactivated
export function deactivate() {}
