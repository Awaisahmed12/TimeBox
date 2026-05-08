'use client'

import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { storage } from '@/lib/storage'
import { addDays, todayLocalDate } from '@/lib/time'

interface Stats {
  streak: number
  weekCompletionPct: number
  weekFocusMin: number
  totalBlocks: number
  doneBlocks: number
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function compute() {
      const today = todayLocalDate()
      const dates = Array.from({ length: 7 }, (_, i) => addDays(today, -i))
      const snaps = await Promise.all(dates.map((d) => storage.getDay(d)))

      let streak = 0
      for (let i = 0; i < snaps.length; i++) {
        const s = snaps[i]
        const allTopDone = s ? s.top3.every((t) => t && t.done) : false
        if (allTopDone) streak++
        else break
      }

      const weekBlocks = snaps.flatMap((s) => s?.blocks ?? [])
      const totalBlocks = weekBlocks.length
      const doneBlocks = weekBlocks.filter((b) => b.done).length
      const weekCompletionPct = totalBlocks === 0 ? 0 : Math.round((doneBlocks / totalBlocks) * 100)
      const weekFocusMin = weekBlocks.reduce((acc, b) => acc + (b.pomodoroFocusedMin ?? 0), 0)

      setStats({ streak, weekCompletionPct, weekFocusMin, totalBlocks, doneBlocks })
    }
    compute()
  }, [])

  return (
    <main className="mx-auto max-w-[480px] pb-24">
      <header className="sticky top-0 z-20 px-4 py-3 bg-bg-light/85 dark:bg-bg/85 backdrop-blur border-b border-border-light dark:border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-light dark:text-muted">
            Stats
          </div>
          <div className="font-serif text-lg leading-tight">last 7 days</div>
        </div>
        <ThemeToggle />
      </header>

      <div className="p-4 grid grid-cols-2 gap-3">
        <Stat label="Top-3 streak" value={stats ? `${stats.streak}` : '—'} unit="days" />
        <Stat label="7-day done" value={stats ? `${stats.weekCompletionPct}%` : '—'} unit={stats ? `${stats.doneBlocks}/${stats.totalBlocks}` : ''} />
        <Stat label="Focus time" value={stats ? `${Math.floor(stats.weekFocusMin / 60)}h ${stats.weekFocusMin % 60}m` : '—'} unit="this week" />
        <Stat label="Blocks" value={stats ? `${stats.totalBlocks}` : '—'} unit="this week" />
      </div>
      <BottomNav />
    </main>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg border border-border-light dark:border-border bg-surface-light dark:bg-surface p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-light dark:text-muted">
        {label}
      </div>
      <div className="font-serif text-3xl mt-1 leading-none">{value}</div>
      {unit && (
        <div className="text-[10px] font-mono text-muted-light dark:text-muted mt-1">{unit}</div>
      )}
    </div>
  )
}
