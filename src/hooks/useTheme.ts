import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const storageKey = 'marktab-theme'

function readStoredThemeMode(): ThemeMode | null {
  try {
    const stored = window.localStorage.getItem(storageKey)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : null
  } catch {
    return null
  }
}

function writeStoredThemeMode(themeMode: ThemeMode) {
  try {
    window.localStorage.setItem(storageKey, themeMode)
  } catch {
    // Theme switching should still work in storage-restricted browsers.
  }
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system'
  }

  return readStoredThemeMode() ?? 'system'
}

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)
  const resolvedTheme = themeMode === 'system' ? systemTheme : themeMode

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const syncSystemTheme = () => setSystemTheme(media.matches ? 'dark' : 'light')

    syncSystemTheme()
    media.addEventListener('change', syncSystemTheme)
    return () => media.removeEventListener('change', syncSystemTheme)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    writeStoredThemeMode(themeMode)
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return {
    resolvedTheme,
    themeMode,
    toggleTheme,
  }
}
