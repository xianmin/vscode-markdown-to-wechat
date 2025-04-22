import { useAppContext } from '../context/AppContext'

export function Preview() {
  const { html, isLoading, error } = useAppContext()

  return (
    <div className="preview-container">
      {isLoading && <div className="loading">正在转换...</div>}
      {error && <div className="error">{error}</div>}
      <div
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
