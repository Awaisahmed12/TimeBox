'use client'

import { BottomNav } from '@/components/BottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { WeekView } from '@/components/WeekView'

export default function WeekPage() {
  return (
    <main className="mx-auto max-w-[480px] pb-24">
      <header className="sticky top-0 z-20 px-4 py-3 bg-bg-light/85 dark:bg-bg/85 backdrop-blur border-b border-border-light dark:border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-light dark:text-muted">
            This week
          </div>
          <div className="font-serif text-lg leading-tight">7-day view</div>
        </div>
        <ThemeToggle />
      </header>
      <div className="pt-3">
        <WeekView />
      </div>
      <BottomNav />
    </main>
  )
}
