'use client'

import { useEffect, useRef, useState } from 'react'
import { useDay } from '@/store/useDay'
import { usePomodoro } from '@/store/usePomodoro'

function playChime() {
  if (typeof window === 'undefined') return
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.7)
  } catch {
    // ignore
  }
}

export function PomodoroBar() {
  const { blockId, endsAt, totalSec, stop } = usePomodoro()
  const block = useDay((s) => s.snap.blocks.find((b) => b.id === blockId))
  const toggleDone = useDay((s) => s.toggleBlockDone)
  const update = useDay((s) => s.updateBlock)
  const [remaining, setRemaining] = useState(0)
  const firedRef = useRef(false)

  useEffect(() => {
    if (!endsAt) return
    firedRef.current = false
    const tick = () => {
      const rem = Math.max(0, Math.floor((endsAt - Date.now()) / 1000))
      setRemaining(rem)
      if (rem === 0 && !firedRef.current) {
        firedRef.current = true
        playChime()
        if ('vibrate' in navigator) navigator.vibrate([60, 40, 60])
        if (block) {
          if (!block.done) toggleDone(block.id)
          const focused = (block.pomodoroFocusedMin ?? 0) + Math.round(totalSec / 60)
          update(block.id, { pomodoroFocusedMin: focused })
        }
        stop()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt, totalSec, block, toggleDone, update, stop])

  if (!blockId || !block) return null
  const pct = totalSec > 0 ? ((totalSec - remaining) / totalSec) * 100 : 0
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60

  return (
    <div className="fixed bottom-12 inset-x-0 z-40 pointer-events-none">
      <div className="mx-auto max-w-[480px] px-3 pb-2 pointer-events-auto">
        <div className="rounded-lg border border-accent bg-surface-light dark:bg-surface shadow-xl">
          <div className="h-1 rounded-t-lg bg-border-light dark:bg-border overflow-hidden">
            <div className="h-full bg-accent transition-[width] duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="text-2xl font-mono tabular-nums">
              {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase text-muted-light dark:text-muted">Focusing</div>
              <div className="font-mono text-sm truncate">{block.title || 'Untitled'}</div>
            </div>
            <button
              onClick={stop}
              className="text-[11px] font-mono uppercase px-2 py-1 rounded border border-border-light dark:border-border"
            >
              Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
