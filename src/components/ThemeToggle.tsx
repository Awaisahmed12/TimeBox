'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const ORDER = ['system', 'light', 'dark'] as const
type Mode = (typeof ORDER)[number]

const LABELS: Record<Mode, string> = {
  system: 'AUTO',
  light: 'LIGHT',
  dark: 'DARK',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-14 h-7" />

  const current = (theme ?? 'system') as Mode
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
  return (
    <button
      onClick={() => setTheme(next)}
      className="text-[10px] font-mono px-2 py-1 rounded border border-border-light dark:border-border text-muted-light dark:text-muted hover:text-text-primary-light dark:hover:text-text-primary"
      aria-label={`Theme: ${current}, click to switch to ${next}`}
    >
      {LABELS[current]}
    </button>
  )
}
