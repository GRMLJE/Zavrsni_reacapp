import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

const FONT_SIZES = { small: '14px', medium: '16px', large: '19px' }

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('kvart_theme') || 'light')
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('kvart_fontsize') || 'medium')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kvart_theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--font-base', FONT_SIZES[fontSize] || '16px')
    localStorage.setItem('kvart_fontsize', fontSize)
  }, [fontSize])

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  function increaseFontSize() {
    setFontSize(f => f === 'large' ? 'large' : f === 'medium' ? 'large' : 'medium')
  }

  function decreaseFontSize() {
    setFontSize(f => f === 'small' ? 'small' : f === 'medium' ? 'small' : 'medium')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, fontSize, increaseFontSize, decreaseFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
