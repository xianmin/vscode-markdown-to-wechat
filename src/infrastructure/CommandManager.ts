import * as vscode from 'vscode'

/**
 * 命令管理器
 * 负责注册和管理VS Code命令
 */
export class CommandManager {
  /**
   * 扩展上下文
   */
  private readonly context: vscode.ExtensionContext

  /**
   * 已注册的命令
   */
  private readonly registeredCommands: vscode.Disposable[] = []

  /**
   * 构造函数
   * @param context 扩展上下文
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  /**
   * 注册命令
   * @param id 命令ID
   * @param handler 命令处理函数
   */
  registerCommand(id: string, handler: (...args: any[]) => any): void {
    const command = vscode.commands.registerCommand(id, handler)
    this.registeredCommands.push(command)
    this.context.subscriptions.push(command)
  }

  /**
   * 注册多个命令
   * @param commands 命令映射 {id: handler}
   */
  registerCommands(commands: Record<string, (...args: any[]) => any>): void {
    for (const [id, handler] of Object.entries(commands)) {
      this.registerCommand(id, handler)
    }
  }

  /**
   * 销毁命令管理器
   */
  dispose(): void {
    for (const command of this.registeredCommands) {
      command.dispose()
    }
    this.registeredCommands.length = 0
  }
}
