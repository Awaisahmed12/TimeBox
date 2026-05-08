'use client'

import { forwardRef, useEffect, useMemo, useState } from 'react'
import { PX_PER_MIN, snapToQuarterHour } from '@/lib/snap'
import { formatHM, nowMinutes } from '@/lib/time'
import { useDay } from '@/store/useDay'
import { useSettings } from '@/store/useSettings'
import { TimeBlock } from './TimeBlock'

interface TimelineProps {
  onTapEmpty?: (startMin: number) => void
}

const HOUR_PX = 60 * PX_PER_MIN
const TOTAL_HEIGHT = 24 * HOUR_PX

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(function Timeline(
  { onTapEmpty },
  ref,
) {
  const blocks = useDay((s) => s.snap.blocks)
  const { dayStartHour, dayEndHour } = useSettings((s) => s.settings)
  const [now, setNow] = useState(nowMinutes())

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const target = nowMinutes() * PX_PER_MIN - 200
    const startTop = dayStartHour * 60 * PX_PER_MIN
    const top = Math.max(target, startTop - 8)
    requestAnimationFrame(() => window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }))
  }, [dayStartHour])

  const hours = useMemo(() => Array.from({ length: 25 }, (_, i) => i), [])

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onTapEmpty) return
    const target = e.target as HTMLElement
    if (target.closest('[data-block]')) return
    if (target.closest('[data-resize-handle]')) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const min = snapToQuarterHour(y / PX_PER_MIN)
    onTapEmpty(min)
  }

  return (
    <div
      ref={ref}
      data-timeline
      onClick={handleClick}
      className="relative w-full"
      style={{ height: TOTAL_HEIGHT }}
    >
      {hours.map((h) => {
        const dim = h < dayStartHour || h > dayEndHour
        return (
          <div
            key={h}
            className={`absolute left-0 right-0 flex items-start ${dim ? 'opacity-50' : ''}`}
            style={{ top: h * HOUR_PX, height: HOUR_PX }}
          >
            <div className="w-12 shrink-0 -translate-y-2 text-[10px] font-mono text-muted-light dark:text-muted">
              {h === 24 ? '12am' : formatHM(h * 60)}
            </div>
            <div className="flex-1 border-t border-border-light dark:border-border" />
          </div>
        )
      })}
      {hours.slice(0, 24).map((h) =>
        [15, 30, 45].map((m) => (
          <div
            key={`${h}-${m}`}
            className="absolute left-12 right-0 border-t border-border-light/40 dark:border-border/40 pointer-events-none"
            style={{ top: h * HOUR_PX + (m / 60) * HOUR_PX }}
          />
        )),
      )}

      <div
        className="absolute left-12 right-0 h-px bg-accent z-10 pointer-events-none"
        style={{ top: now * PX_PER_MIN }}
      >
        <div className="absolute -left-1.5 -top-1 w-2 h-2 rounded-full bg-accent" />
      </div>

      <div className="absolute left-12 right-0 top-0 bottom-0">
        {blocks.map((b) => (
          <TimeBlock key={b.id} block={b} />
        ))}
      </div>
    </div>
  )
})
