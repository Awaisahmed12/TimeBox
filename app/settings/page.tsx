'use client'

import { useRef, useState } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { storage } from '@/lib/storage'
import { useDay } from '@/store/useDay'
import { useInbox } from '@/store/useInbox'
import { useSettings } from '@/store/useSettings'

export default function SettingsPage() {
  const { settings, patch } = useSettings()
  const reloadDay = useDay((s) => s.reloadCurrent)
  const reloadInbox = useInbox((s) => s.load)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setExporting(true)
    const json = await storage.exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timebox-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  async function handleImport(file: File) {
    setImporting(true)
    try {
      const text = await file.text()
      await storage.importAll(text)
      await reloadDay()
      await reloadInbox()
      alert('Imported.')
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`)
    } finally {
      setImporting(false)
    }
  }

  async function handleClearAll() {
    if (!confirm('Wipe ALL TimeBox data? This cannot be undone.')) return
    await storage.clearAll()
    location.reload()
  }

  return (
    <main className="mx-auto max-w-[480px] pb-24">
      <header className="sticky top-0 z-20 px-4 py-3 bg-bg-light/85 dark:bg-bg/85 backdrop-blur border-b border-border-light dark:border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-light dark:text-muted">
            Settings
          </div>
          <div className="font-serif text-lg leading-tight">tune it.</div>
        </div>
        <ThemeToggle />
      </header>

      <div className="p-4 space-y-5">
        <Section label="Day range">
          <div className="grid grid-cols-2 gap-3">
            <NumField
              label="Start hour"
              value={settings.dayStartHour}
              min={0}
              max={settings.dayEndHour - 1}
              onChange={(v) => patch({ dayStartHour: v })}
            />
            <NumField
              label="End hour"
              value={settings.dayEndHour}
              min={settings.dayStartHour + 1}
              max={24}
              onChange={(v) => patch({ dayEndHour: v })}
            />
          </div>
        </Section>

        <Section label="Pomodoro">
          <NumField
            label="Length (min)"
            value={settings.pomodoroMin}
            min={5}
            max={120}
            onChange={(v) => patch({ pomodoroMin: v })}
          />
        </Section>

        <Section label="Data">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="py-2 rounded border border-border-light dark:border-border font-mono text-xs uppercase"
            >
              {exporting ? 'Exporting…' : 'Export JSON'}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="py-2 rounded border border-border-light dark:border-border font-mono text-xs uppercase"
            >
              {importing ? 'Importing…' : 'Import JSON'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleImport(f)
                e.target.value = ''
              }}
            />
          </div>
          <button
            onClick={handleClearAll}
            className="mt-2 w-full py-2 rounded border border-accent2 text-accent2 font-mono text-xs uppercase"
          >
            Clear all data
          </button>
        </Section>
      </div>

      <BottomNav />
    </main>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-light dark:text-muted mb-2">
        {label}
      </div>
      <div className="rounded-lg border border-border-light dark:border-border bg-surface-light dark:bg-surface p-3">
        {children}
      </div>
    </div>
  )
}

function NumField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase text-muted-light dark:text-muted mb-1">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!Number.isFinite(n)) return
          onChange(Math.max(min, Math.min(max, n)))
        }}
        className="w-full px-3 py-2 bg-bg-light dark:bg-bg border border-border-light dark:border-border rounded font-mono text-sm outline-none focus:border-accent"
      />
    </label>
  )
}
