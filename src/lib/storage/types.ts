import type { DaySnapshot, InboxItem, Settings } from '@/types/models'

export interface StorageAdapter {
  getDay(date: string): Promise<DaySnapshot | null>
  saveDay(snap: DaySnapshot): Promise<void>
  listDayDates(): Promise<string[]>
  getInbox(): Promise<InboxItem[]>
  saveInbox(items: InboxItem[]): Promise<void>
  getSettings(): Promise<Settings>
  saveSettings(s: Settings): Promise<void>
  exportAll(): Promise<string>
  importAll(json: string): Promise<void>
  clearAll(): Promise<void>
}
