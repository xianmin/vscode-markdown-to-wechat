/**
 * 应用设置接口
 */
export interface AppSettings {
  /**
   * 字体大小，例如 '16px'
   */
  fontSize: string

  /**
   * 二级标题计数形式
   * 'none': 不添加计数
   * 'number-dot': 1. 2. 3. 形式
   * 后续可添加更多形式
   */
  headingNumberingStyle: string

  // 未来可以扩展更多设置项
}
