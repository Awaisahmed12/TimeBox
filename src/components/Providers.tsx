'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { useSettings } from '@/store/useSettings'
import { useInbox } from '@/store/useInbox'
import { useDay } from '@/store/useDay'
import { todayLocalDate } from '@/lib/time'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Bootstrapper />
      {children}
    </ThemeProvider>
  )
}

function Bootstrapper() {
  const loadSettings = useSettings((s) => s.load)
  const loadInbox = useInbox((s) => s.load)
  const loadDay = useDay((s) => s.loadDate)

  useEffect(() => {
    loadSettings()
    loadInbox()
    loadDay(todayLocalDate())
  }, [loadSettings, loadInbox, loadDay])

  return null
}
