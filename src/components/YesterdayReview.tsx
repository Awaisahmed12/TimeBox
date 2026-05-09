'use client'

import { useEffect, useState } from 'react'
import { storage } from '@/lib/storage'
import { snapToQuarterHour } from '@/lib/snap'
import { addDays, formatHM, prettyDate, todayLocalDate } from '@/lib/time'
import { useDay } from '@/store/useDay'
import { useInbox } from '@/store/useInbox'
import { useSettings } from '@/store/useSettings'
import { type Block, type DaySnapshot, type InboxItem } from '@/types/models'

interface ReviewData {
  date: string
  blocks: Block[]
  inboxLeft: InboxItem[]
}

function nextFreeSlot(blocks: Block[], dayStartHour: number, durationMin: number): number {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin)
  let cursor = snapToQuarterHour(Math.max(dayStartHour * 60, 9 * 60))
  for (const b of sorted) {
    if (cursor + durationMin <= b.startMin) return cursor
    cursor = Math.max(cursor, b.startMin + b.durationMin)
  }
  return Math.min(cursor, 24 * 60 - durationMin)
}

export function YesterdayReview() {
  const { settings, loaded: settingsLoaded, patch } = useSettings()
  const reloadDay = useDay((s) => s.reloadCurrent)
  const inboxItems = useInbox((s) => s.items)
  const inboxLoaded = useInbox((s) => s.loaded)
  const removeInbox = useInbox((s) => s.remove)
  const markUnscheduled = useInbox((s) => s.markUnscheduled)
  const toggleInboxDone = useInbox((s) => s.toggleDone)
  const [data, setData] = useState<ReviewData | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!settingsLoaded || !inboxLoaded) return
    const today = todayLocalDate()
    if (settings.lastOpenedDate === today) return

    const yesterday = addDays(today, -1)
    storage.getDay(yesterday).then((snap) => {
      const incompleteBlocks = (snap?.blocks ?? []).filter((b) => !b.done)
      const inboxLeft = inboxItems.filter(
        (i) => !i.done && (!i.scheduledOnDate || i.scheduledOnDate === yesterday),
      )
      if (incompleteBlocks.length === 0 && inboxLeft.length === 0) {
        patch({ lastOpenedDate: today })
        return
      }
      setData({ date: yesterday, blocks: incompleteBlocks, inboxLeft })
      setOpen(true)
    })
  }, [settingsLoaded, inboxLoaded, settings.lastOpenedDate, inboxItems, patch])

  async function moveBlockToToday(b: Block) {
    if (!data) return
    const today = todayLocalDate()
    const todaySnap = (await storage.getDay(today)) ?? {
      date: today,
      top3: [null, null, null],
      blocks: [],
    } as DaySnapshot
    const start = nextFreeSlot(todaySnap.blocks, settings.dayStartHour, b.durationMin)
    const newBlock: Block = { ...b, startMin: start, done: false }
    todaySnap.blocks.push(newBlock)
    await storage.saveDay(todaySnap)

    const ySnap = await storage.getDay(data.date)
    if (ySnap) {
      ySnap.blocks = ySnap.blocks.filter((x) => x.id !== b.id)
      await storage.saveDay(ySnap)
    }
    setData((d) => (d ? { ...d, blocks: d.blocks.filter((x) => x.id !== b.id) } : d))
  }

  async function dismissBlock(b: Block) {
    if (!data) return
    const ySnap = await storage.getDay(data.date)
    if (ySnap) {
      ySnap.blocks = ySnap.blocks.map((x) => (x.id === b.id ? { ...x, done: true } : x))
      await storage.saveDay(ySnap)
    }
    setData((d) => (d ? { ...d, blocks: d.blocks.filter((x) => x.id !== b.id) } : d))
  }

  async function close() {
    await patch({ lastOpenedDate: todayLocalDate() })
    await reloadDay()
    setOpen(false)
  }

  if (!open || !data) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto bg-surface-light dark:bg-surface border border-border-light dark:border-border rounded-2xl">
        <div className="p-4 border-b border-border-light dark:border-border">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-light dark:text-muted">
            Yesterday review
          </div>
          <div className="font-serif text-xl mt-1">{prettyDate(data.date)}</div>
          <div className="text-xs font-mono text-muted-light dark:text-muted mt-1">
            {data.blocks.length + data.inboxLeft.length} unfinished. Tidy up before today.
          </div>
        </div>

        {data.blocks.length > 0 && (
          <div className="p-3 space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-muted-light dark:text-muted px-1">
              Time blocks
            </div>
            {data.blocks.map((b) => (
              <div
                key={b.id}
                className="px-3 py-2 bg-bg-light dark:bg-bg border border-border-light dark:border-border rounded"
              >
                <div className="text-[10px] font-mono text-muted-light dark:text-muted">
                  {formatHM(b.startMin)} – {formatHM(b.startMin + b.durationMin)}
                </div>
                <div className="font-mono text-sm mt-0.5 truncate">{b.title || 'Untitled'}</div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => moveBlockToToday(b)}
                    className="text-[11px] font-mono uppercase px-2 py-1 rounded bg-accent text-bg"
                  >
                    Move to today
                  </button>
                  <button
                    onClick={() => dismissBlock(b)}
                    className="text-[11px] font-mono uppercase px-2 py-1 rounded border border-border-light dark:border-border"
                  >
                    Done / dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.inboxLeft.length > 0 && (
          <div className="p-3 space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-muted-light dark:text-muted px-1">
              Inbox
            </div>
            {data.inboxLeft.map((i) => (
              <div
                key={i.id}
                className="px-3 py-2 flex items-center gap-2 bg-bg-light dark:bg-bg border border-border-light dark:border-border rounded"
              >
                <span className="flex-1 font-mono text-sm truncate">{i.title}</span>
                <button
                  onClick={async () => {
                    await toggleInboxDone(i.id)
                    setData((d) => (d ? { ...d, inboxLeft: d.inboxLeft.filter((x) => x.id !== i.id) } : d))
                  }}
                  aria-label="Mark done"
                  className="text-[11px] font-mono uppercase px-2 py-1 rounded bg-accent text-bg"
                >
                  Done
                </button>
                <button
                  onClick={async () => {
                    await markUnscheduled(i.id)
                    setData((d) => (d ? { ...d, inboxLeft: d.inboxLeft.filter((x) => x.id !== i.id) } : d))
                  }}
                  className="text-[11px] font-mono uppercase px-2 py-1 rounded border border-border-light dark:border-border"
                >
                  Keep
                </button>
                <button
                  onClick={async () => {
                    await removeInbox(i.id)
                    setData((d) => (d ? { ...d, inboxLeft: d.inboxLeft.filter((x) => x.id !== i.id) } : d))
                  }}
                  className="text-[11px] font-mono uppercase px-2 py-1 rounded border border-border-light dark:border-border"
                >
                  Toss
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-border-light dark:border-border">
          <button
            onClick={close}
            className="w-full py-3 rounded bg-accent text-bg font-mono uppercase tracking-wider text-sm"
          >
            Plan today
          </button>
        </div>
      </div>
    </div>
  )
}
