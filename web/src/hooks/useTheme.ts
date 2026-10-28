import { useCallback, useLayoutEffect, useState } from 'react'
import { useMediaQuery } from './useMediaQuery'

export type ThemeMode = 'system' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

// Also read by the inline script in index.html, which sets the theme before first paint.
const STORAGE_KEY = 'happyhr:theme'
const THEME_COLOR: Record<Theme, string> = { dark: '#0e0b05', light: '#fff7e0' }

function savedMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

/** The user's System / Light / Dark choice, and the theme it resolves to right now. */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(savedMode)
  // Dark unless the device explicitly asks for light.
  const systemLight = useMediaQuery('(prefers-color-scheme: light)')
  const theme: Theme = mode === 'system' ? (systemLight ? 'light' : 'dark') : mode

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage unavailable: the choice lasts until reload.
    }
  }, [])

  return { mode, theme, setMode }
}
