'use client'

import { create } from 'zustand'
import { storage } from '@/lib/storage'
import { newId } from '@/lib/ids'
import type { InboxItem } from '@/types/models'

interface InboxState {
  items: InboxItem[]
  loaded: boolean
  load: () => Promise<void>
  add: (title: string) => Promise<InboxItem>
  remove: (id: string) => Promise<void>
  toggleDone: (id: string) => Promise<void>
  markScheduled: (id: string, date: string) => Promise<void>
  markUnscheduled: (id: string) => Promise<void>
}

async function persist(items: InboxItem[]) {
  await storage.saveInbox(items)
}

export const useInbox = create<InboxState>((set, get) => ({
  items: [],
  loaded: false,
  async load() {
    const items = await storage.getInbox()
    set({ items, loaded: true })
  },
  async add(title) {
    const item: InboxItem = {
      id: newId(),
      title: title.trim(),
      createdAt: Date.now(),
      done: false,
    }
    const items = [item, ...get().items]
    set({ items })
    await persist(items)
    return item
  },
  async remove(id) {
    const items = get().items.filter((i) => i.id !== id)
    set({ items })
    await persist(items)
  },
  async toggleDone(id) {
    const items = get().items.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    set({ items })
    await persist(items)
  },
  async markScheduled(id, date) {
    const items = get().items.map((i) => (i.id === id ? { ...i, scheduledOnDate: date } : i))
    set({ items })
    await persist(items)
  },
  async markUnscheduled(id) {
    const items = get().items.map((i) => (i.id === id ? { ...i, scheduledOnDate: undefined } : i))
    set({ items })
    await persist(items)
  },
}))

export function unscheduledItems(items: InboxItem[]): InboxItem[] {
  return items.filter((i) => !i.scheduledOnDate && !i.done)
}
