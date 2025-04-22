/**
 * 事件总线接口
 * 负责组件间的消息传递
 */
export interface IEventBus {
  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  subscribe<T>(event: string, handler: (data: T) => void): void

  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   */
  publish<T>(event: string, data: T): void

  /**
   * 取消订阅
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  unsubscribe(event: string, handler: Function): void
}
