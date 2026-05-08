import { DEFAULT_SETTINGS, type DaySnapshot, type InboxItem, type Settings } from '@/types/models'
import type { StorageAdapter } from './types'

const K = {
  day: (date: string) => `timebox:day:${date}`,
  index: 'timebox:days-index',
  inbox: 'timebox:inbox',
  settings: 'timebox:settings',
}

function safeGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export class LocalStorageAdapter implements StorageAdapter {
  async getDay(date: string): Promise<DaySnapshot | null> {
    return safeGet<DaySnapshot>(K.day(date))
  }

  async saveDay(snap: DaySnapshot): Promise<void> {
    safeSet(K.day(snap.date), snap)
    const idx = safeGet<string[]>(K.index) ?? []
    if (!idx.includes(snap.date)) {
      idx.push(snap.date)
      idx.sort()
      safeSet(K.index, idx)
    }
  }

  async listDayDates(): Promise<string[]> {
    return safeGet<string[]>(K.index) ?? []
  }

  async getInbox(): Promise<InboxItem[]> {
    return safeGet<InboxItem[]>(K.inbox) ?? []
  }

  async saveInbox(items: InboxItem[]): Promise<void> {
    safeSet(K.inbox, items)
  }

  async getSettings(): Promise<Settings> {
    return safeGet<Settings>(K.settings) ?? DEFAULT_SETTINGS
  }

  async saveSettings(s: Settings): Promise<void> {
    safeSet(K.settings, s)
  }

  async exportAll(): Promise<string> {
    const dates = await this.listDayDates()
    const days: Record<string, DaySnapshot> = {}
    for (const d of dates) {
      const snap = await this.getDay(d)
      if (snap) days[d] = snap
    }
    return JSON.stringify(
      {
        version: 1,
        settings: await this.getSettings(),
        inbox: await this.getInbox(),
        days,
      },
      null,
      2,
    )
  }

  async importAll(json: string): Promise<void> {
    const parsed = JSON.parse(json) as {
      settings?: Settings
      inbox?: InboxItem[]
      days?: Record<string, DaySnapshot>
    }
    if (parsed.settings) await this.saveSettings(parsed.settings)
    if (parsed.inbox) await this.saveInbox(parsed.inbox)
    if (parsed.days) {
      for (const [, snap] of Object.entries(parsed.days)) {
        await this.saveDay(snap)
      }
    }
  }

  async clearAll(): Promise<void> {
    if (typeof window === 'undefined') return
    const ls = window.localStorage
    const keys: string[] = []
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i)
      if (k && k.startsWith('timebox:')) keys.push(k)
    }
    keys.forEach((k) => ls.removeItem(k))
  }
}
