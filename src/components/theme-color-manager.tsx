'use client'

import { useEffect } from 'react'
import { DEFAULT_THEME, THEME_OPTIONS, ThemeKey, resolveThemeKey } from '@/lib/theme-tokens'

const themeKeys = new Set(THEME_OPTIONS.map(theme => theme.key))

export function ThemeColorManager({ color }: { color?: string }) {
  useEffect(() => {
    const root = document.documentElement
    const selectedTheme = resolveThemeKey(color)
    const theme = themeKeys.has(selectedTheme) ? selectedTheme : DEFAULT_THEME

    root.setAttribute('data-theme', theme)
  }, [color])

  return null
}
