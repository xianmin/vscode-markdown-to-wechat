interface CopyButtonProps {
  isLoading: boolean
  hasContent: boolean
  isCopying: boolean
  onCopy: () => void
}

export function CopyButton({ isLoading, hasContent, isCopying, onCopy }: CopyButtonProps) {
  return (
    <div className="copy-selector">
      <button
        className="copy-button"
        disabled={isLoading || !hasContent || isCopying}
        onClick={onCopy}
      >
        {isCopying ? '复制中...' : '复制'}
      </button>
    </div>
  )
}
