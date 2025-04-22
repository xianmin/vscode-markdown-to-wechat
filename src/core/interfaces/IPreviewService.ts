/**
 * 预览服务接口
 * 负责显示和更新Markdown预览
 */
export interface IPreviewService {
  /**
   * 显示预览面板
   * @param markdownContent Markdown内容
   */
  showPreview(markdownContent: string): void

  /**
   * 更新预览内容
   * @param markdownContent 新的Markdown内容
   */
  updatePreview(markdownContent: string): void

  /**
   * 销毁预览服务
   */
  dispose(): void
}
