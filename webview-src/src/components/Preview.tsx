import { RefObject } from 'react'

interface PreviewProps {
  html: string
  isLoading: boolean
  error: string | null
  containerRef: RefObject<HTMLDivElement>
}

export function Preview({ html, isLoading, error, containerRef }: PreviewProps) {
  return (
    <div className="preview-container">
      {isLoading && <div className="loading">正在转换...</div>}
      {error && <div className="error">{error}</div>}
      <div
        ref={containerRef}
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
