'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { storage } from '@/lib/storage'
import { dayOfMonth, formatHM, shortDayLabel, todayLocalDate, weekDates } from '@/lib/time'
import { useDay } from '@/store/useDay'
import type { DaySnapshot } from '@/types/models'

export function WeekView() {
  const today = todayLocalDate()
  const dates = weekDates(today)
  const [snaps, setSnaps] = useState<Record<string, DaySnapshot | null>>({})
  const setDate = useDay((s) => s.loadDate)

  useEffect(() => {
    let cancelled = false
    Promise.all(dates.map((d) => storage.getDay(d).then((s) => [d, s] as const))).then((entries) => {
      if (cancelled) return
      const map: Record<string, DaySnapshot | null> = {}
      for (const [d, s] of entries) map[d] = s
      setSnaps(map)
    })
    return () => {
      cancelled = true
    }
  }, [dates.join('|')])

  return (
    <div className="px-3 space-y-2">
      {dates.map((d) => {
        const snap = snaps[d]
        const blocks = snap?.blocks ?? []
        const totalMin = blocks.reduce((acc, b) => acc + b.durationMin, 0)
        const doneMin = blocks.filter((b) => b.done).reduce((acc, b) => acc + b.durationMin, 0)
        const isToday = d === today
        return (
          <Link
            key={d}
            href="/"
            onClick={() => setDate(d)}
            className={`block rounded-lg border ${
              isToday ? 'border-accent' : 'border-border-light dark:border-border'
            } bg-surface-light dark:bg-surface px-3 py-3`}
          >
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-muted-light dark:text-muted">
                  {shortDayLabel(d)}
                </div>
                <div className="font-serif text-2xl leading-none">{dayOfMonth(d)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-muted-light dark:text-muted">
                  {blocks.length} blocks
                </div>
                <div className="text-xs font-mono">
                  {Math.round(doneMin / 60)}h / {Math.round(totalMin / 60)}h
                </div>
              </div>
            </div>
            {blocks.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {blocks.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className={`text-[11px] font-mono truncate ${
                      b.done ? 'line-through text-muted-light dark:text-muted' : ''
                    }`}
                  >
                    {formatHM(b.startMin)} {b.title || 'Untitled'}
                  </div>
                ))}
                {blocks.length > 3 && (
                  <div className="text-[10px] font-mono text-muted-light dark:text-muted">
                    +{blocks.length - 3} more
                  </div>
                )}
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
