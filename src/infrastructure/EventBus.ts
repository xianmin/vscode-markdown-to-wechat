import { IEventBus } from '../core/interfaces/IEventBus'

/**
 * 事件总线实现
 * 提供事件发布-订阅机制
 */
export class EventBus implements IEventBus {
  /**
   * 存储事件处理器的映射
   */
  private handlers = new Map<string, Set<Function>>()

  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  subscribe<T>(event: string, handler: (data: T) => void): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set<Function>())
    }
    this.handlers.get(event)?.add(handler)
  }

  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   */
  publish<T>(event: string, data: T): void {
    const eventHandlers = this.handlers.get(event)
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          handler(data)
        } catch (error) {
          console.error(`事件处理异常: ${event}`, error)
        }
      }
    }
  }

  /**
   * 取消订阅
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  unsubscribe(event: string, handler: Function): void {
    const eventHandlers = this.handlers.get(event)
    if (eventHandlers) {
      eventHandlers.delete(handler)
    }
  }
}
