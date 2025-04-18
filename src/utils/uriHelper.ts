import * as vscode from 'vscode'

/**
 * 获取WebView可用的资源URI
 * @param webview WebView实例
 * @param extensionUri 扩展URI
 * @param pathList 资源路径列表
 * @returns WebView可用的URI
 */
export function getUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  pathList: string[]
): vscode.Uri {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList))
}
