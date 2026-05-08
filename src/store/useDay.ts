'use client'

import { create } from 'zustand'
import { storage } from '@/lib/storage'
import { newId } from '@/lib/ids'
import { todayLocalDate } from '@/lib/time'
import {
  emptyDay,
  type Block,
  type BlockColor,
  type DaySnapshot,
  type Top3Slot,
  type Top3Tuple,
} from '@/types/models'

interface DayState {
  date: string
  snap: DaySnapshot
  loaded: boolean
  loadDate: (date: string) => Promise<void>
  reloadCurrent: () => Promise<void>
  addBlock: (input: { startMin: number; durationMin?: number; title?: string; fromInboxId?: string; color?: BlockColor }) => Promise<Block>
  updateBlock: (id: string, patch: Partial<Block>) => Promise<void>
  removeBlock: (id: string) => Promise<void>
  toggleBlockDone: (id: string) => Promise<void>
  setTop3: (idx: 0 | 1 | 2, slot: Top3Slot | null) => Promise<void>
  toggleTop3Done: (idx: 0 | 1 | 2) => Promise<void>
  setBrainDump: (s: string) => Promise<void>
}

async function loadOrInit(date: string): Promise<DaySnapshot> {
  return (await storage.getDay(date)) ?? emptyDay(date)
}

async function persist(snap: DaySnapshot) {
  await storage.saveDay(snap)
}

export const useDay = create<DayState>((set, get) => ({
  date: todayLocalDate(),
  snap: emptyDay(todayLocalDate()),
  loaded: false,
  async loadDate(date) {
    const snap = await loadOrInit(date)
    set({ date, snap, loaded: true })
  },
  async reloadCurrent() {
    const snap = await loadOrInit(get().date)
    set({ snap, loaded: true })
  },
  async addBlock({ startMin, durationMin = 30, title = '', fromInboxId, color }) {
    const snap = get().snap
    const block: Block = {
      id: newId(),
      title,
      startMin,
      durationMin,
      done: false,
      fromInboxId,
      color,
    }
    const next: DaySnapshot = { ...snap, blocks: [...snap.blocks, block] }
    set({ snap: next })
    await persist(next)
    return block
  },
  async updateBlock(id, patch) {
    const snap = get().snap
    const next: DaySnapshot = {
      ...snap,
      blocks: snap.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }
    set({ snap: next })
    await persist(next)
  },
  async removeBlock(id) {
    const snap = get().snap
    const next: DaySnapshot = {
      ...snap,
      blocks: snap.blocks.filter((b) => b.id !== id),
      top3: snap.top3.map((s) => (s && s.blockId === id ? { ...s, blockId: undefined } : s)) as Top3Tuple,
    }
    set({ snap: next })
    await persist(next)
  },
  async toggleBlockDone(id) {
    const snap = get().snap
    const block = snap.blocks.find((b) => b.id === id)
    if (!block) return
    const done = !block.done
    const next: DaySnapshot = {
      ...snap,
      blocks: snap.blocks.map((b) => (b.id === id ? { ...b, done } : b)),
      top3: snap.top3.map((s) => (s && s.blockId === id ? { ...s, done } : s)) as Top3Tuple,
    }
    set({ snap: next })
    await persist(next)
  },
  async setTop3(idx, slot) {
    const snap = get().snap
    const top3 = [...snap.top3] as Top3Tuple
    top3[idx] = slot
    const next: DaySnapshot = { ...snap, top3 }
    set({ snap: next })
    await persist(next)
  },
  async toggleTop3Done(idx) {
    const snap = get().snap
    const cur = snap.top3[idx]
    if (!cur) return
    const done = !cur.done
    const top3 = [...snap.top3] as Top3Tuple
    top3[idx] = { ...cur, done }
    const next: DaySnapshot = {
      ...snap,
      top3,
      blocks: cur.blockId
        ? snap.blocks.map((b) => (b.id === cur.blockId ? { ...b, done } : b))
        : snap.blocks,
    }
    set({ snap: next })
    await persist(next)
  },
  async setBrainDump(s) {
    const snap = get().snap
    const next: DaySnapshot = { ...snap, brainDump: s }
    set({ snap: next })
    await persist(next)
  },
}))
