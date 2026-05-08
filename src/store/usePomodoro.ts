'use client'

import { create } from 'zustand'

interface PomodoroState {
  blockId: string | null
  endsAt: number | null
  totalSec: number
  start: (blockId: string, minutes: number) => void
  stop: () => void
}

export const usePomodoro = create<PomodoroState>((set) => ({
  blockId: null,
  endsAt: null,
  totalSec: 0,
  start(blockId, minutes) {
    set({
      blockId,
      endsAt: Date.now() + minutes * 60_000,
      totalSec: minutes * 60,
    })
  },
  stop() {
    set({ blockId: null, endsAt: null, totalSec: 0 })
  },
}))
