import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

const FONT_SCALES = { small: '0.88', medium: '1', large: '1.18' }

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('kvart_theme') || 'light')
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('kvart_fontsize') || 'medium')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kvart_theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', FONT_SCALES[fontSize] || '1')
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
