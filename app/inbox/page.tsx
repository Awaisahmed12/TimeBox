'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useDay } from '@/store/useDay'
import { useInbox, unscheduledItems } from '@/store/useInbox'

const PROMPTS = {
  morning: "What's on your mind? Dump everything…",
  evening: "What do you need to remember for tomorrow?",
}

export default function BrainDumpPage() {
  const items = useInbox((s) => unscheduledItems(s.items))
  const add = useInbox((s) => s.add)
  const remove = useInbox((s) => s.remove)
  const brainDump = useDay((s) => s.snap.brainDump ?? '')
  const setBrainDump = useDay((s) => s.setBrainDump)
  const [mode, setMode] = useState<'morning' | 'evening'>('morning')
  const [draft, setDraft] = useState('')

  return (
    <main className="mx-auto max-w-[480px] pb-24">
      <header className="sticky top-0 z-20 px-4 py-3 bg-bg-light/85 dark:bg-bg/85 backdrop-blur border-b border-border-light dark:border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-light dark:text-muted">
            Brain dump
          </div>
          <div className="font-serif text-lg leading-tight">no rules. just spill.</div>
        </div>
        <ThemeToggle />
      </header>

      <div className="px-4 pt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode('morning')}
          className={`py-2 rounded font-mono text-xs uppercase tracking-wider ${
            mode === 'morning' ? 'bg-accent text-bg' : 'border border-border-light dark:border-border text-muted-light dark:text-muted'
          }`}
        >
          Morning dump
        </button>
        <button
          onClick={() => setMode('evening')}
          className={`py-2 rounded font-mono text-xs uppercase tracking-wider ${
            mode === 'evening' ? 'bg-accent text-bg' : 'border border-border-light dark:border-border text-muted-light dark:text-muted'
          }`}
        >
          Tomorrow prep
        </button>
      </div>

      <div className="px-4 mt-3">
        <textarea
          value={brainDump}
          onChange={(e) => setBrainDump(e.target.value)}
          placeholder={PROMPTS[mode]}
          className="w-full h-48 px-3 py-2 bg-surface-light dark:bg-surface border border-border-light dark:border-border rounded font-mono text-sm outline-none focus:border-accent resize-none"
        />
      </div>

      <div className="px-4 mt-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-light dark:text-muted mb-2">
          Captures · {items.length}
        </div>
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
            placeholder="quick capture…"
            className="flex-1 px-3 py-2 bg-surface-light dark:bg-surface border border-border-light dark:border-border rounded font-mono text-sm outline-none focus:border-accent"
          />
          <button type="submit" className="px-3 py-2 rounded bg-accent text-bg text-xs font-mono uppercase">
            Add
          </button>
        </form>
        <div className="space-y-1.5">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-2 px-3 py-2 bg-surface-light dark:bg-surface border border-border-light dark:border-border rounded"
            >
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
          {items.length === 0 && (
            <div className="text-xs font-mono text-muted-light dark:text-muted px-2 py-4 text-center">
              Nothing in your inbox yet.
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
