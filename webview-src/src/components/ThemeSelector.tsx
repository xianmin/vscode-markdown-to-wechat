import { useState } from 'react'
import { Theme } from '../hooks/useThemeManager'

interface ThemeSelectorProps {
  themes: Theme[]
  currentTheme: string
  onThemeChange: (themeId: string) => void
}

export function ThemeSelector({ themes, currentTheme, onThemeChange }: ThemeSelectorProps) {
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false)

  const handleThemeChange = (themeId: string) => {
    onThemeChange(themeId)
    setShowThemeSelector(false)
  }

  return (
    <div className="theme-selector">
      <button className="theme-button" onClick={() => setShowThemeSelector(!showThemeSelector)}>
        主题: {themes.find((t) => t.id === currentTheme)?.name || '默认'}
      </button>
      {showThemeSelector && (
        <div className="theme-dropdown">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`theme-item ${theme.id === currentTheme ? 'theme-item-active' : ''}`}
              onClick={() => handleThemeChange(theme.id)}
            >
              {theme.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
