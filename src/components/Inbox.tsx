'use client'

import { useEffect, useRef, useState } from 'react'
import { PX_PER_MIN, snapToQuarterHour } from '@/lib/snap'
import { formatHM } from '@/lib/time'
import { useDay } from '@/store/useDay'
import { useInbox, unscheduledItems } from '@/store/useInbox'
import type { InboxItem } from '@/types/models'

interface DragState {
  item: InboxItem
  x: number
  y: number
  pointerId: number
  startX: number
  startY: number
  active: boolean
  hoverMin: number | null
}

const DRAG_THRESHOLD_PX = 6

function timelineYToMin(clientY: number): number | null {
  const tl = document.querySelector('[data-timeline]') as HTMLDivElement | null
  if (!tl) return null
  const rect = tl.getBoundingClientRect()
  if (clientY < rect.top || clientY > rect.bottom) return null
  const y = clientY - rect.top
  return Math.max(0, Math.min(24 * 60 - 30, snapToQuarterHour(y / PX_PER_MIN)))
}

export function Inbox() {
  const all = useInbox((s) => s.items)
  const add = useInbox((s) => s.add)
  const remove = useInbox((s) => s.remove)
  const markScheduled = useInbox((s) => s.markScheduled)
  const addBlock = useDay((s) => s.addBlock)
  const date = useDay((s) => s.date)
  const items = unscheduledItems(all)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [drag, setDrag] = useState<DragState | null>(null)

  const dragRef = useRef<DragState | null>(null)
  dragRef.current = drag
  const handleRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    if (!drag) return
    function onMove(e: PointerEvent) {
      const cur = dragRef.current
      if (!cur || e.pointerId !== cur.pointerId) return
      const dx = e.clientX - cur.startX
      const dy = e.clientY - cur.startY
      let active = cur.active
      if (!active && Math.abs(dx) + Math.abs(dy) >= DRAG_THRESHOLD_PX) active = true
      if (active && open) setOpen(false)
      const hover = active ? timelineYToMin(e.clientY) : null
      setDrag({ ...cur, x: e.clientX, y: e.clientY, active, hoverMin: hover })
    }
    function onUp(e: PointerEvent) {
      const cur = dragRef.current
      if (!cur || e.pointerId !== cur.pointerId) return
      if (cur.active) {
        const hover = timelineYToMin(e.clientY)
        if (hover !== null) {
          addBlock({
            startMin: hover,
            durationMin: 30,
            title: cur.item.title,
            fromInboxId: cur.item.id,
          }).then(() => markScheduled(cur.item.id, date))
        }
      }
      setDrag(null)
    }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [drag, addBlock, markScheduled, date, open])

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-12 z-20 transition-transform duration-200 ${
          open ? 'translate-y-0' : 'translate-y-[calc(100%-44px)]'
        }`}
      >
        <div className="mx-auto max-w-[480px] bg-surface-light dark:bg-surface border-t border-border-light dark:border-border rounded-t-xl shadow-2xl">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-xs font-mono uppercase tracking-wider text-muted-light dark:text-muted">
              Brain dump · {items.length}
            </span>
            <span className="text-muted-light dark:text-muted text-sm">{open ? '▼' : '▲'}</span>
          </button>
          <div className="max-h-[55vh] overflow-y-auto px-3 pb-3 space-y-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!draft.trim()) return
                add(draft)
                setDraft('')
              }}
              className="flex gap-2 mb-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="capture a thought…"
                className="flex-1 px-3 py-2 bg-bg-light dark:bg-bg border border-border-light dark:border-border rounded font-mono text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded bg-accent text-bg text-xs font-mono uppercase"
              >
                Add
              </button>
            </form>
            {items.length === 0 && (
              <div className="text-[12px] font-mono text-muted-light dark:text-muted px-2 py-4 text-center">
                Empty. Dump everything in your head here, then drag onto the timeline.
              </div>
            )}
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-2 px-2 py-1.5 bg-bg-light dark:bg-bg border border-border-light dark:border-border rounded"
              >
                <button
                  ref={(el) => {
                    if (el) handleRefs.current.set(it.id, el)
                    else handleRefs.current.delete(it.id)
                  }}
                  onPointerDown={(e) => {
                    if (e.button !== undefined && e.button !== 0) return
                    e.preventDefault()
                    e.currentTarget.setPointerCapture?.(e.pointerId)
                    setDrag({
                      item: it,
                      x: e.clientX,
                      y: e.clientY,
                      pointerId: e.pointerId,
                      startX: e.clientX,
                      startY: e.clientY,
                      active: false,
                      hoverMin: null,
                    })
                  }}
                  aria-label="Drag to schedule"
                  className="touch-none cursor-grab active:cursor-grabbing text-muted-light dark:text-muted px-2 py-1"
                  style={{ touchAction: 'none' }}
                >
                  ⋮⋮
                </button>
                <span className="flex-1 font-mono text-sm truncate">{it.title}</span>
                <button
                  onClick={() => remove(it.id)}
                  aria-label="Delete"
                  className="text-[11px] text-muted-light dark:text-muted hover:text-accent2 px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {drag?.active && (
        <>
          <div
            className="pointer-events-none fixed z-50 px-3 py-2 rounded bg-accent text-bg font-mono text-sm shadow-xl"
            style={{ left: drag.x + 12, top: drag.y + 8 }}
          >
            {drag.item.title}
          </div>
          {drag.hoverMin !== null && <DragHint min={drag.hoverMin} />}
        </>
      )}
    </>
  )
}

function DragHint({ min }: { min: number }) {
  const tl = typeof document !== 'undefined' ? (document.querySelector('[data-timeline]') as HTMLDivElement | null) : null
  if (!tl) return null
  const rect = tl.getBoundingClientRect()
  const top = rect.top + min * PX_PER_MIN
  return (
    <div
      className="pointer-events-none fixed z-40 left-0 right-0 mx-auto"
      style={{ top, height: 30 * PX_PER_MIN, maxWidth: 480 }}
    >
      <div className="mx-12 h-full rounded border-2 border-dashed border-accent/80 bg-accent/10 flex items-center justify-center">
        <span className="text-xs font-mono text-accent">{formatHM(min)}</span>
      </div>
    </div>
  )
}
