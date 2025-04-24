/**
 * 简单的依赖注入容器
 */
export class Container {
  /**
   * 存储服务实例的映射
   */
  private static instances = new Map<string, any>()

  /**
   * 注册服务实例
   * @param token 服务标识
   * @param instance 服务实例
   */
  static register<T>(token: string, instance: T): void {
    Container.instances.set(token, instance)
  }

  /**
   * 解析服务实例
   * @param token 服务标识
   * @returns 服务实例
   */
  static resolve<T>(token: string): T {
    const instance = Container.instances.get(token)
    if (!instance) {
      throw new Error(`未找到服务: ${token}`)
    }
    return instance
  }
}
