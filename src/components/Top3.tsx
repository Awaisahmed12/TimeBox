'use client'

import { useState } from 'react'
import { newId } from '@/lib/ids'
import { useDay } from '@/store/useDay'

const SLOTS: ReadonlyArray<0 | 1 | 2> = [0, 1, 2]

export function Top3() {
  const top3 = useDay((s) => s.snap.top3)
  const setTop3 = useDay((s) => s.setTop3)
  const toggleDone = useDay((s) => s.toggleTop3Done)

  return (
    <div className="px-4 pt-4">
      <div className="text-[10px] font-mono text-muted-light dark:text-muted uppercase tracking-wider mb-1.5">
        Top 3
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {SLOTS.map((idx) => (
          <Slot
            key={idx}
            slot={top3[idx]}
            onCommit={(title) => {
              if (!title.trim()) return
              setTop3(idx, { id: newId(), title: title.trim(), done: false })
            }}
            onClear={() => setTop3(idx, null)}
            onToggle={() => toggleDone(idx)}
          />
        ))}
      </div>
    </div>
  )
}

function Slot({
  slot,
  onCommit,
  onClear,
  onToggle,
}: {
  slot: ReturnType<typeof useDay.getState>['snap']['top3'][number]
  onCommit: (title: string) => void
  onClear: () => void
  onToggle: () => void
}) {
  const [editing, setEditing] = useState(false)

  if (!slot) {
    if (editing) {
      return (
        <input
          autoFocus
          onBlur={(e) => {
            onCommit(e.currentTarget.value)
            setEditing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder="What's a priority today?"
          className="w-full px-3 py-2 bg-surface-light dark:bg-surface border border-dashed border-border-light dark:border-border rounded font-mono text-sm outline-none focus:border-accent"
        />
      )
    }
    return (
      <button
        onClick={() => setEditing(true)}
        className="px-3 py-2 text-left text-muted-light dark:text-muted bg-surface-light dark:bg-surface border border-dashed border-border-light dark:border-border rounded font-mono text-sm hover:border-accent"
      >
        + add priority
      </button>
    )
  }

  return (
    <div className="px-3 py-2 flex items-center gap-2 bg-surface-light dark:bg-surface border border-border-light dark:border-border rounded">
      <button
        onClick={onToggle}
        aria-label={slot.done ? 'Mark not done' : 'Mark done'}
        className={`w-4 h-4 shrink-0 rounded border ${
          slot.done ? 'bg-accent border-accent' : 'border-muted-light dark:border-muted'
        }`}
      >
        {slot.done && (
          <svg viewBox="0 0 16 16" className="w-full h-full text-bg">
            <path
              d="M3 8l3 3 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <span className={`flex-1 font-mono text-sm truncate ${slot.done ? 'line-through opacity-60' : ''}`}>
        {slot.title}
      </span>
      <button
        onClick={onClear}
        aria-label="Remove"
        className="text-[11px] text-muted-light dark:text-muted hover:text-accent2"
      >
        ✕
      </button>
    </div>
  )
}
